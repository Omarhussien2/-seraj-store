import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import test from "node:test";

import {
  addEgyptBusinessDays,
  buildGoogleCustomerReviewOptIn,
} from "../src/lib/googleCustomerReviews";

test("delivery estimate excludes the purchase day and Egypt weekends", () => {
  const cases = [
    { purchase: "2026-09-03T18:30:00.000Z", expected: "2026-09-14" },
    { purchase: "2026-09-04T08:00:00.000Z", expected: "2026-09-14" },
    { purchase: "2026-09-06T08:00:00.000Z", expected: "2026-09-15" },
  ];

  for (const item of cases) {
    const actual = addEgyptBusinessDays(new Date(item.purchase), 7)
      .toISOString()
      .slice(0, 10);
    assert.equal(actual, item.expected, item.purchase);
  }
});

test("builds the exact Google Customer Reviews opt-in payload", () => {
  assert.deepEqual(
    buildGoogleCustomerReviewOptIn({
      orderNumber: "SRJ-2026-0042",
      customerEmail: "buyer@example.com",
      createdAt: new Date("2026-09-03T18:30:00.000Z"),
    }),
    {
      merchant_id: 5847247567,
      order_id: "SRJ-2026-0042",
      email: "buyer@example.com",
      delivery_country: "EG",
      estimated_delivery_date: "2026-09-14",
    }
  );
});

test("storefront loads Google's opt-in module directly on order confirmation", () => {
  const source = readFileSync(join(process.cwd(), "public/app.js"), "utf8");

  assert.match(
    source,
    /https:\/\/apis\.google\.com\/js\/platform\.js\?onload=renderGoogleCustomerReviewOptIn/
  );
  assert.match(source, /gapi\.load\('surveyoptin'/);
  assert.match(source, /opt_in_style: 'CENTER_DIALOG'/);
});
