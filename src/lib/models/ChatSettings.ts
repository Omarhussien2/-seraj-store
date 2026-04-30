import mongoose from "mongoose";

export interface IChatChip {
  label: string;
  question: string;
}

export interface IChatSettings {
  _id: string;
  enabled: boolean;
  whatsappNumber: string;
  welcomeTitle: string;
  welcomeSubtitle: string;
  chips: IChatChip[];
  systemPrompt: string;
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
