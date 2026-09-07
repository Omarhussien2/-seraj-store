import { createHash } from "node:crypto";
import type { Types } from "mongoose";
import AnalyticsConsentRevocation from "@/lib/models/AnalyticsConsentRevocation";
import Order from "@/lib/models/Order";

export type ClientAnalyticsAttribution = {
  consent: true;
  clientId: string;
  sessionId: string;
  consentToken: string;
};

export type StoredAnalyticsAttribution = Omit<
  ClientAnalyticsAttribution,
  "consentToken"
> & { consentTokenHash: string };

export function consentTokenHash(consentToken: string) {
  return createHash("sha256").update(consentToken).digest("hex");
}

export function storedAnalyticsAttribution(
  attribution: ClientAnalyticsAttribution
): StoredAnalyticsAttribution {
  return {
    consent: true,
    clientId: attribution.clientId,
    sessionId: attribution.sessionId,
    consentTokenHash: consentTokenHash(attribution.consentToken),
  };
}

export async function attributionUnlessRevoked(
  attribution: ClientAnalyticsAttribution
) {
  const storedAttribution = storedAnalyticsAttribution(attribution);
  const revoked = await AnalyticsConsentRevocation.exists({
    tokenHash: storedAttribution.consentTokenHash,
  });
  return revoked ? undefined : storedAttribution;
}

export async function consentTokenIsRevoked(tokenHash: string) {
  return Boolean(await AnalyticsConsentRevocation.exists({ tokenHash }));
}

export async function removeAttributionIfRevoked(
  orderId: Types.ObjectId,
  tokenHash: string
) {
  if (!(await consentTokenIsRevoked(tokenHash))) return;
  await Order.updateOne(
    { _id: orderId, "analyticsAttribution.consentTokenHash": tokenHash },
    { $unset: { analyticsAttribution: 1 } }
  );
}

export async function revokeConsentTokens(consentTokens: string[]) {
  const tokenHashes = [...new Set(consentTokens.map(consentTokenHash))];
  const revokedAt = new Date();
  await AnalyticsConsentRevocation.bulkWrite(
    tokenHashes.map((tokenHash) => ({
      updateOne: {
        filter: { tokenHash },
        update: { $setOnInsert: { tokenHash, revokedAt } },
        upsert: true,
      },
    })),
    { ordered: false }
  );
  await Order.updateMany(
    { "analyticsAttribution.consentTokenHash": { $in: tokenHashes } },
    { $unset: { analyticsAttribution: 1 } }
  );
}
