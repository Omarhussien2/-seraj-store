import { connectDB } from "@/lib/db";
import ChatSettingsModel, {
  DEFAULT_CHIPS,
  type IChatSettings,
  type IChatChip,
} from "@/lib/models/ChatSettings";

export type ChatSettingsPublic = {
  enabled: boolean;
  whatsappNumber: string;
  welcomeTitle: string;
  welcomeSubtitle: string;
  chips: IChatChip[];
};

export type ChatSettingsAdmin = ChatSettingsPublic & {
  systemPrompt: string;
};

const SINGLETON_ID = "chat-settings";

/**
 * Returns the chat settings document, creating it with defaults if missing.
 */
export async function getOrCreateChatSettings(): Promise<IChatSettings> {
  await connectDB();
  let doc = await ChatSettingsModel.findById(SINGLETON_ID).lean<IChatSettings>();
  if (!doc) {
    const created = await ChatSettingsModel.create({
      _id: SINGLETON_ID,
      chips: DEFAULT_CHIPS,
    });
    doc = created.toObject() as IChatSettings;
  }
  return doc;
}

export function toPublic(doc: IChatSettings): ChatSettingsPublic {
  return {
    enabled: !!doc.enabled,
    whatsappNumber: doc.whatsappNumber || "",
    welcomeTitle: doc.welcomeTitle || "",
    welcomeSubtitle: doc.welcomeSubtitle || "",
    chips: Array.isArray(doc.chips) ? doc.chips : [],
  };
}

export function toAdmin(doc: IChatSettings): ChatSettingsAdmin {
  return { ...toPublic(doc), systemPrompt: doc.systemPrompt || "" };
}

export async function updateChatSettings(
  patch: Partial<ChatSettingsAdmin>
): Promise<IChatSettings> {
  await connectDB();
  const update: Record<string, unknown> = {};
  if (typeof patch.enabled === "boolean") update.enabled = patch.enabled;
  if (typeof patch.whatsappNumber === "string")
    update.whatsappNumber = patch.whatsappNumber.replace(/[^\d+]/g, "").slice(0, 20);
  if (typeof patch.welcomeTitle === "string")
    update.welcomeTitle = patch.welcomeTitle.slice(0, 120);
  if (typeof patch.welcomeSubtitle === "string")
    update.welcomeSubtitle = patch.welcomeSubtitle.slice(0, 400);
  if (typeof patch.systemPrompt === "string")
    update.systemPrompt = patch.systemPrompt.slice(0, 8000);
  if (Array.isArray(patch.chips)) {
    update.chips = patch.chips
      .filter(
        (c): c is IChatChip =>
          !!c &&
          typeof c.label === "string" &&
          typeof c.question === "string" &&
          c.label.trim().length > 0 &&
          c.question.trim().length > 0
      )
      .slice(0, 8)
      .map((c) => ({
        label: c.label.trim().slice(0, 60),
        question: c.question.trim().slice(0, 240),
      }));
  }

  const doc = await ChatSettingsModel.findByIdAndUpdate(
    SINGLETON_ID,
    { $set: update, $setOnInsert: { _id: SINGLETON_ID } },
    { new: true, upsert: true }
  ).lean<IChatSettings>();
  if (!doc) throw new Error("ChatSettings upsert failed");
  return doc;
}
