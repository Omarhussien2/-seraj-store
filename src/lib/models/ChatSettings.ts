import mongoose from "mongoose";

export interface IChatChip {
  label: string;
  question: string;
}

export type RoutesMode = "all" | "whitelist" | "blacklist";
export type AiProvider = "auto" | "gemini" | "deepseek";

export interface IChatSettings {
  _id: string;
  enabled: boolean;
  whatsappNumber: string;
  welcomeTitle: string;
  welcomeSubtitle: string;
  chips: IChatChip[];
  systemPrompt: string;

  // Visibility
  routesMode: RoutesMode;
  routesList: string[];

  // Pulse animation (FAB attention loop)
  pulseEnabled: boolean;
  pulseFirstDelayMs: number;
  pulseIntervalMs: number;

  // Theme
  themeColor: string;

  // AI
  aiProvider: AiProvider;
  aiModel: string;
  aiTemperature: number;
  aiMaxTokens: number;

  createdAt?: string;
  updatedAt?: string;
}

const ChipSchema = new mongoose.Schema<IChatChip>(
  {
    label: { type: String, required: true, trim: true, maxlength: 60 },
    question: { type: String, required: true, trim: true, maxlength: 240 },
  },
  { _id: false }
);

const ChatSettingsSchema = new mongoose.Schema(
  {
    _id: { type: String, default: "chat-settings" },
    enabled: { type: Boolean, default: true },
    whatsappNumber: { type: String, default: "201152806034", trim: true },
    welcomeTitle: { type: String, default: "أهلاً بيك في سِراج! 👋", maxlength: 120 },
    welcomeSubtitle: {
      type: String,
      default:
        "أنا مساعدك الذكي. اسألني عن المنتجات والأسعار أو اطلب مباشرة. إيه اللي محتاجه؟",
      maxlength: 400,
    },
    chips: { type: [ChipSchema], default: [] },
    systemPrompt: { type: String, default: "" },

    routesMode: { type: String, enum: ["all", "whitelist", "blacklist"], default: "all" },
    routesList: { type: [String], default: [] },

    pulseEnabled: { type: Boolean, default: true },
    pulseFirstDelayMs: { type: Number, default: 5000, min: 0, max: 600000 },
    pulseIntervalMs: { type: Number, default: 30000, min: 0, max: 600000 },

    themeColor: { type: String, default: "#6bbf3f", trim: true },

    aiProvider: { type: String, enum: ["auto", "gemini", "deepseek"], default: "auto" },
    aiModel: { type: String, default: "", trim: true },
    aiTemperature: { type: Number, default: 0.7, min: 0, max: 2 },
    aiMaxTokens: { type: Number, default: 400, min: 64, max: 4096 },
  },
  { timestamps: true }
);

export const DEFAULT_CHIPS: IChatChip[] = [
  { label: "المنتجات والأسعار", question: "إيه المنتجات والأسعار؟" },
  { label: "القصة المخصصة", question: "عايز أطلب القصة المخصصة" },
  { label: "قصة خالد", question: "عايز أطلب قصة خالد بن الوليد" },
  { label: "الشحن والتوصيل", question: "الشحن بكام وبيوصل إمتى؟" },
];

export default (mongoose.models.ChatSettings as mongoose.Model<IChatSettings>) ||
  mongoose.model<IChatSettings>("ChatSettings", ChatSettingsSchema);
