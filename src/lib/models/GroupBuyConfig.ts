import mongoose, { type Document, type Model } from "mongoose";
import { IGroupBuyTier } from "./GroupBuy";

export interface IGroupBuyConfig extends Document {
  active: boolean;
  defaultDurationHours: number;
  
  defaultTiers: IGroupBuyTier[];
  
  content: {
    ctaButton: string;
    ctaSubtext: string;
    
    modalTitle: string;
    modalDesc: string;
    modalBullets: string[];
    
    groupCreatedTitle: string;
    groupCreatedDesc: string;
    
    friendBannerTitle: string;
    friendBannerDesc: string;
    
    completedTitle: string;
    completedDesc: string;
    
    shareMessage: string;
  };
  
  createdAt: Date;
  updatedAt: Date;
}

const GroupBuyTierSchema = new mongoose.Schema<IGroupBuyTier>(
  {
    minOrders: { type: Number, required: true, min: 2 },
    discountType: {
      type: String,
      required: true,
      enum: ["percent", "fixed", "free_shipping"],
    },
    discountValue: { type: Number, required: true, min: 0 },
  },
  { _id: false }
);

const GroupBuyConfigSchema = new mongoose.Schema<IGroupBuyConfig>(
  {
    active: { type: Boolean, default: true },
    defaultDurationHours: { type: Number, default: 24, min: 1 },
    
    defaultTiers: {
      type: [GroupBuyTierSchema],
      default: [
        { minOrders: 2, discountType: "free_shipping", discountValue: 0 },
        { minOrders: 3, discountType: "percent", discountValue: 10 },
        { minOrders: 5, discountType: "percent", discountValue: 15 },
      ],
    },
    
    content: {
      ctaButton: { type: String, default: "اشتري مع صحابك ووفّروا 💚" },
      ctaSubtext: { type: String, default: "اعمل جروب خصم وشارك الرابط مع حبايبك" },
      
      modalTitle: { type: String, default: "وفّر مع صحابك" },
      modalDesc: { type: String, default: "اعمل جروب شراء، شارك الرابط مع صحابك، وكل واحد يطلب بعنوانه خلال {hours} ساعة." },
      modalBullets: { 
        type: [String], 
        default: [
          "✓ كل واحد يطلب بنفسه",
          "✓ الخصم بيتطبق ليك ولصحابك فوراً", 
          "✓ الطلبات بتتأكد أول ما الجروب يكمل"
        ] 
      },
      
      groupCreatedTitle: { type: String, default: "جروبك بدأ 🎉" },
      groupCreatedDesc: { type: String, default: "شارك الرابط مع صحابك دلوقتي" },
      
      friendBannerTitle: { type: String, default: "{name} دعاك لجروب خصم" },
      friendBannerDesc: { type: String, default: "اطلب خلال {hours} ساعة عشان الخصم يتفعل للكل" },
      
      completedTitle: { type: String, default: "مبروك 🎉 الجروب اكتمل!" },
      completedDesc: { type: String, default: "تم تأكيد طلباتكم بالخصم الجماعي" },
      
      shareMessage: { type: String, default: "🎉 تعالى اشتري معايا من سِراج بخصم جماعي 💚\nادخل من الرابط ده واطلب اللي انت عاوزه:\n{url}" },
    },
  },
  { timestamps: true }
);

// We only expect one config document, but we'll use a specific ID to find it
// Usually people use a static string ID or just findOne()

const GroupBuyConfig: Model<IGroupBuyConfig> =
  mongoose.models.GroupBuyConfig || mongoose.model<IGroupBuyConfig>("GroupBuyConfig", GroupBuyConfigSchema);

export default GroupBuyConfig;
