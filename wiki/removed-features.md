# Removed Features Reference (June 2026)

This document archives the schemas, endpoints, and logic of the features removed in June 2026 to simplify the codebase, reduce code clutter, and optimize performance.

---

## 1. Coloring Service (كشاكيل التلوين)

### Database Schemas

#### ColoringCategory Schema (`ColoringCategory.ts`)
```typescript
export interface IColoringCategory extends Document {
  slug: string;         // unique, URL-friendly, e.g. "animals-cats"
  nameAr: string;       // Arabic display name
  nameEn?: string;      // optional English name
  parentSlug?: string | null; // null = top-level category
  icon: string;         // emoji icon, e.g. "🐱"
  description?: string;
  thumbnail?: string;   // Cloudinary URL for category cover image
  itemCount: number;    // cached count
  source?: string;      // "supercoloring" | "seraj" | "mixed"
  order: number;        // display order
  active: boolean;
  featured: boolean;    // show on Mama World homepage
  createdAt: Date;
  updatedAt: Date;
}
```

#### ColoringItem Schema (`ColoringItem.ts`)
```typescript
export type ColoringLicense = "cc0" | "cc-by" | "cc-by-sa" | "free-link" | "seraj";
export type ColoringType = "coloring" | "worksheet" | "craft";
export type ColoringDifficulty = "easy" | "medium" | "hard";
export type ColoringAgeRange = "3-6" | "7-10" | "11+";

export interface IColoringItem extends Document {
  slug: string;
  title: string;
  categorySlug: string;
  thumbnail: string;
  fullImageUrl?: string;
  sourceUrl?: string;
  sourceName?: string;
  type: ColoringType;
  difficulty: ColoringDifficulty;
  ageRange: ColoringAgeRange;
  tags: string[];
  license: ColoringLicense;
  attribution?: string;
  savedCount: number;
  printCount: number;
  shareCount: number;
  active: boolean;
  featured: boolean;
  printable: boolean;
  order: number;
}
```

### Removed API Endpoints
- `GET /api/coloring/categories` — List all active categories
- `GET /api/coloring/categories/[slug]` — Get category details
- `GET /api/coloring/items` — Query items with filters (category, difficulty, age, search)
- `GET /api/coloring/items/[slug]` — Get item details
- `GET /api/coloring/featured` — Get featured items and categories
- `GET /api/coloring/pricing` — Get configuration for custom workbook printing

---

## 2. Ask Zainab Chatbot (اسأل زينب)

### Database Schemas

#### ChatSettings Schema (`ChatSettings.ts`)
```typescript
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
  routesMode: RoutesMode;
  routesList: string[];
  pulseEnabled: boolean;
  pulseFirstDelayMs: number;
  pulseIntervalMs: number;
  themeColor: string;
  aiProvider: AiProvider;
  aiModel: string;
  aiTemperature: number;
  aiMaxTokens: number;
}
```

### Removed API Endpoints
- `POST /api/chat` — The main chat flow with الجدة زينب using AI (Gemini or DeepSeek fallback)
- `POST /api/chat-seraj` — Alternative helper chatbot
- `GET /api/chat-config` — Get chatbot widget visibility settings
- `GET /api/admin/chat-settings` — Get/set settings for chatbot administration

---

## 3. Group Buy (اشتري مع صحابك)

### Database Schemas

#### GroupBuy Schema (`GroupBuy.ts`)
```typescript
export interface IGroupBuyTier {
  minOrders: number;
  discountType: "percent" | "fixed" | "free_shipping";
  discountValue: number;
}

export interface IGroupBuy extends Document {
  code: string;
  createdByName: string;
  createdByPhone: string;
  tiers: IGroupBuyTier[];
  targetOrders: number;
  confirmedOrders: number;
  currentTier: number | null;
  status: "open" | "completed" | "expired" | "cancelled";
  durationHours: number;
  expiresAt: Date;
  orderIds: mongoose.Types.ObjectId[];
  content: {
    shareTitle: string;
    shareMessage: string;
    successMessage: string;
  };
}
```

#### GroupBuyConfig Schema (`GroupBuyConfig.ts`)
```typescript
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
}
```

### Removed API Endpoints
- `POST /api/group-buys` — Create a new group buy discount code
- `GET /api/group-buys/[code]` — Query active status, tiers, and details of a group buy
- `GET /api/group-buys/config` — Get global configuration for group buys

---

## MongoDB Clean-Up Reference

The following MongoDB collections are now obsolete and can be dropped:
1. `coloringcategories`
2. `coloringitems`
3. `chatsettings`
4. `groupbuys`
5. `groupbuyconfigs`
