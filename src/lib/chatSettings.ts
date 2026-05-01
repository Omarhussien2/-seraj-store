import { connectDB } from "@/lib/db";
import ChatSettingsModel, {
  DEFAULT_CHIPS,
  type IChatSettings,
  type IChatChip,
  type RoutesMode,
  type AiProvider,
} from "@/lib/models/ChatSettings";

export type ChatSettingsPublic = {
  enabled: boolean;
  whatsappNumber: string;
  welcomeTitle: string;
  welcomeSubtitle: string;
  chips: IChatChip[];
  routesMode: RoutesMode;
  routesList: string[];
  pulseEnabled: boolean;
  pulseFirstDelayMs: number;
  pulseIntervalMs: number;
  themeColor: string;
};

export type ChatSettingsAdmin = ChatSettingsPublic & {
  systemPrompt: string;
  aiProvider: AiProvider;
  aiModel: string;
  aiTemperature: number;
  aiMaxTokens: number;
};

const SINGLETON_ID = "chat-settings";
const HEX_RE = /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/;

/**
 * Returns the chat settings document, creating it with defaults if missing.
 * Uses an atomic upsert so concurrent first-time callers don't race into
 * an E11000 duplicate-key error.
 */
export async function getOrCreateChatSettings(): Promise<IChatSettings> {
  await connectDB();
  const doc = await ChatSettingsModel.findByIdAndUpdate(
    SINGLETON_ID,
    { $setOnInsert: { _id: SINGLETON_ID, chips: DEFAULT_CHIPS } },
    { new: true, upsert: true, setDefaultsOnInsert: true }
  ).lean<IChatSettings>();
  if (!doc) throw new Error("ChatSettings upsert returned null");
  return doc;
}

export function toPublic(doc: IChatSettings): ChatSettingsPublic {
  return {
    enabled: !!doc.enabled,
    whatsappNumber: doc.whatsappNumber || "",
    welcomeTitle: doc.welcomeTitle || "",
    welcomeSubtitle: doc.welcomeSubtitle || "",
    chips: Array.isArray(doc.chips) ? doc.chips : [],
    routesMode: (doc.routesMode || "all") as RoutesMode,
    routesList: Array.isArray(doc.routesList) ? doc.routesList : [],
    pulseEnabled: doc.pulseEnabled !== false,
    pulseFirstDelayMs:
      typeof doc.pulseFirstDelayMs === "number" ? doc.pulseFirstDelayMs : 5000,
    pulseIntervalMs:
      typeof doc.pulseIntervalMs === "number" ? doc.pulseIntervalMs : 30000,
    themeColor: doc.themeColor || "#6bbf3f",
  };
}

export function toAdmin(doc: IChatSettings): ChatSettingsAdmin {
  return {
    ...toPublic(doc),
    systemPrompt: doc.systemPrompt || "",
    aiProvider: (doc.aiProvider || "auto") as AiProvider,
    aiModel: doc.aiModel || "",
    aiTemperature:
      typeof doc.aiTemperature === "number" ? doc.aiTemperature : 0.7,
    aiMaxTokens: typeof doc.aiMaxTokens === "number" ? doc.aiMaxTokens : 400,
  };
}

function clampNumber(n: unknown, min: number, max: number, fallback: number): number {
  const v = typeof n === "number" ? n : Number(n);
  if (!Number.isFinite(v)) return fallback;
  return Math.max(min, Math.min(max, v));
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

  // Routes
  if (
    patch.routesMode === "all" ||
    patch.routesMode === "whitelist" ||
    patch.routesMode === "blacklist"
  ) {
    update.routesMode = patch.routesMode;
  }
  if (Array.isArray(patch.routesList)) {
    update.routesList = patch.routesList
      .filter((p): p is string => typeof p === "string")
      .map((p) => p.trim())
      .filter((p) => p.length > 0)
      .slice(0, 50)
      .map((p) => p.slice(0, 200));
  }

  // Pulse
  if (typeof patch.pulseEnabled === "boolean") update.pulseEnabled = patch.pulseEnabled;
  if (patch.pulseFirstDelayMs !== undefined)
    update.pulseFirstDelayMs = clampNumber(patch.pulseFirstDelayMs, 0, 600000, 5000);
  if (patch.pulseIntervalMs !== undefined)
    update.pulseIntervalMs = clampNumber(patch.pulseIntervalMs, 0, 600000, 30000);

  // Theme
  if (typeof patch.themeColor === "string" && HEX_RE.test(patch.themeColor)) {
    update.themeColor = patch.themeColor;
  }

  // AI
  if (
    patch.aiProvider === "auto" ||
    patch.aiProvider === "gemini" ||
    patch.aiProvider === "deepseek"
  ) {
    update.aiProvider = patch.aiProvider;
  }
  if (typeof patch.aiModel === "string") update.aiModel = patch.aiModel.trim().slice(0, 80);
  if (patch.aiTemperature !== undefined)
    update.aiTemperature = clampNumber(patch.aiTemperature, 0, 2, 0.7);
  if (patch.aiMaxTokens !== undefined)
    update.aiMaxTokens = clampNumber(patch.aiMaxTokens, 64, 4096, 400);

  const doc = await ChatSettingsModel.findByIdAndUpdate(
    SINGLETON_ID,
    { $set: update, $setOnInsert: { _id: SINGLETON_ID } },
    { new: true, upsert: true }
  ).lean<IChatSettings>();
  if (!doc) throw new Error("ChatSettings upsert failed");
  return doc;
}
