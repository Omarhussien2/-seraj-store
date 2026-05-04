import { connectDB } from "@/lib/db";
import PaymentSettingsModel, {
  type IPaymentSettings,
} from "@/lib/models/PaymentSettings";

export type PaymentSettingsPublic = {
  depositEnabled: boolean;
  depositPercent: number;
};

const SINGLETON_ID = "payment-settings";

export async function getOrCreatePaymentSettings(): Promise<IPaymentSettings> {
  await connectDB();
  const doc = await PaymentSettingsModel.findByIdAndUpdate(
    SINGLETON_ID,
    { $setOnInsert: { _id: SINGLETON_ID } },
    { new: true, upsert: true, setDefaultsOnInsert: true }
  ).lean<IPaymentSettings>();
  if (!doc) throw new Error("PaymentSettings upsert returned null");
  return doc;
}

export function toPublic(doc: IPaymentSettings): PaymentSettingsPublic {
  return {
    depositEnabled: doc.depositEnabled !== false,
    depositPercent:
      typeof doc.depositPercent === "number" ? doc.depositPercent : 60,
  };
}

function clampNumber(n: unknown, min: number, max: number, fallback: number): number {
  const v = typeof n === "number" ? n : Number(n);
  if (!Number.isFinite(v)) return fallback;
  return Math.max(min, Math.min(max, v));
}

export async function updatePaymentSettings(
  patch: Partial<PaymentSettingsPublic>
): Promise<IPaymentSettings> {
  await connectDB();
  const update: Record<string, unknown> = {};
  if (typeof patch.depositEnabled === "boolean") {
    update.depositEnabled = patch.depositEnabled;
  }
  if (patch.depositPercent !== undefined) {
    update.depositPercent = clampNumber(patch.depositPercent, 0, 100, 60);
  }
  const doc = await PaymentSettingsModel.findByIdAndUpdate(
    SINGLETON_ID,
    { $set: update, $setOnInsert: { _id: SINGLETON_ID } },
    { new: true, upsert: true, setDefaultsOnInsert: true }
  ).lean<IPaymentSettings>();
  if (!doc) throw new Error("PaymentSettings update returned null");
  return doc;
}
