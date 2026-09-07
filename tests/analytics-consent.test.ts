import assert from "node:assert/strict";
import test, { before } from "node:test";
import {
  consentTokenHash,
  storedAnalyticsAttribution,
} from "../src/lib/analyticsConsent";

let withdrawConsent: typeof import("../src/app/api/analytics/consent/route").POST;

before(async () => {
  const originalSetInterval = globalThis.setInterval;
  globalThis.setInterval = ((callback: TimerHandler, milliseconds?: number) => {
    const timer = originalSetInterval(callback, milliseconds);
    (timer as unknown as NodeJS.Timeout).unref();
    return timer;
  }) as typeof setInterval;
  try {
    ({ POST: withdrawConsent } = await import(
      "../src/app/api/analytics/consent/route"
    ));
  } finally {
    globalThis.setInterval = originalSetInterval;
  }
});

const capabilityToken = "A".repeat(43);

test("stored attribution contains a stable hash and never the raw capability token", () => {
  const stored = storedAnalyticsAttribution({
    consent: true,
    clientId: "123.456",
    sessionId: "789",
    consentToken: capabilityToken,
  });

  assert.deepEqual(stored, {
    consent: true,
    clientId: "123.456",
    sessionId: "789",
    consentTokenHash:
      "0f007385b6f9d4b7eeb2748605afe1a984a0a3bfa3f014d09e2a784ce9e5cd1a",
  });
  assert.equal(JSON.stringify(stored).includes(capabilityToken), false);
  assert.equal(consentTokenHash(capabilityToken), stored.consentTokenHash);
});

test("withdrawal rejects a foreign browser origin before persistence", async () => {
  const response = await withdrawConsent(
    new Request("https://seraj.example/api/analytics/consent", {
      method: "POST",
      headers: { origin: "https://attacker.example", "content-type": "application/json" },
      body: JSON.stringify({ tokens: [capabilityToken] }),
    })
  );

  assert.equal(response.status, 403);
  assert.deepEqual(await response.json(), { success: false, error: "Forbidden" });
});

test("withdrawal rejects an unbounded token batch before persistence", async () => {
  const response = await withdrawConsent(
    new Request("https://seraj.example/api/analytics/consent", {
      method: "POST",
      headers: { origin: "https://seraj.example", "content-type": "application/json" },
      body: JSON.stringify({ tokens: Array.from({ length: 21 }, () => capabilityToken) }),
    })
  );

  assert.equal(response.status, 400);
});
