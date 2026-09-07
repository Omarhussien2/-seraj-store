import mongoose, { type Document, type Model } from "mongoose";

export interface IAnalyticsConsentRevocation extends Document {
  tokenHash: string;
  revokedAt: Date;
}

const AnalyticsConsentRevocationSchema =
  new mongoose.Schema<IAnalyticsConsentRevocation>({
    tokenHash: {
      type: String,
      required: true,
      unique: true,
      index: true,
      match: /^[a-f0-9]{64}$/,
    },
    revokedAt: { type: Date, required: true, default: Date.now },
  });

const AnalyticsConsentRevocation: Model<IAnalyticsConsentRevocation> =
  mongoose.models.AnalyticsConsentRevocation ||
  mongoose.model<IAnalyticsConsentRevocation>(
    "AnalyticsConsentRevocation",
    AnalyticsConsentRevocationSchema
  );

export default AnalyticsConsentRevocation;
