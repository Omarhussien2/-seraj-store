import GroupBuyConfig, { IGroupBuyConfig } from "../models/GroupBuyConfig";
import { IGroupBuy, IGroupBuyTier } from "../models/GroupBuy";

/**
 * Generates a random group code, e.g. GRP-4A8K
 */
export function generateGroupCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // no confusing chars like O, 0, 1, I
  let result = "";
  for (let i = 0; i < 4; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return `GRP-${result}`;
}

/**
 * Gets the singleton GroupBuyConfig, or creates it if it doesn't exist
 */
export async function getGroupBuyConfig(): Promise<IGroupBuyConfig> {
  let config = await GroupBuyConfig.findOne();
  if (!config) {
    config = await GroupBuyConfig.create({});
  }
  return config;
}

/**
 * Checks if a group buy is expired based on current time
 */
export function isGroupExpired(group: Pick<IGroupBuy, "expiresAt" | "status">): boolean {
  if (group.status !== "open") return false;
  return new Date() > new Date(group.expiresAt);
}

export interface GroupDiscountResult {
  discountAmount: number;
  discountType: "percent" | "fixed" | "free_shipping";
}

/**
 * Calculates the discount for an order based on the target tier of the group.
 * The discount is applied immediately during order creation.
 */
export function calculateGroupBuyDiscount(
  targetTier: IGroupBuyTier,
  subtotal: number,
  shippingFee: number
): GroupDiscountResult {
  let discountAmount = 0;
  
  switch (targetTier.discountType) {
    case "percent":
      discountAmount = (subtotal * targetTier.discountValue) / 100;
      break;
    case "fixed":
      discountAmount = Math.min(subtotal, targetTier.discountValue);
      break;
    case "free_shipping":
      discountAmount = shippingFee;
      break;
  }
  
  return {
    discountAmount: Math.floor(discountAmount), // ensure integer
    discountType: targetTier.discountType
  };
}
