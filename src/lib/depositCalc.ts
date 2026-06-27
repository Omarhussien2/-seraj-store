/**
 * Compute the deposit amount for a list of cart items (server side).
 *
 * Per-product `depositAmount` overrides the global `depositPercent` setting.
 * Shipping is NOT included in deposit calculations — shipping fees are
 * always paid in full as part of the COD remainder when applicable.
 *
 * Returns the total deposit in EGP rounded to the nearest integer.
 */

export type DepositLineInput = {
  productSlug: string;
  qty: number;
  unitPrice: number;
  depositAmount?: number | null; // per-unit deposit override (from product.depositAmount)
  isCustom?: boolean; // True if this is a custom story product
};

export type DepositSettings = {
  depositEnabled: boolean;
  depositPercent: number; // 0–100
};

export function computeDeposit(
  items: DepositLineInput[],
  settings: DepositSettings
): number {
  if (!settings.depositEnabled) return 0;
  if (!Array.isArray(items) || items.length === 0) return 0;

  const pct = Math.max(0, Math.min(100, Number(settings.depositPercent) || 0));
  let total = 0;

  for (const item of items) {
    // Only calculate deposit for custom stories (either by isCustom flag or slug)
    const isCustom = item.isCustom || item.productSlug === "custom-story";
    if (!isCustom) continue;

    const qty = Math.max(1, Number(item.qty) || 1);
    const unitPrice = Math.max(0, Number(item.unitPrice) || 0);
    const override =
      typeof item.depositAmount === "number" && item.depositAmount > 0
        ? item.depositAmount
        : null;

    const perUnit =
      override !== null
        ? Math.min(override, unitPrice) // never exceed product price
        : (unitPrice * pct) / 100;

    total += perUnit * qty;
  }

  // Cap at 0 minimum, round to integer EGP for clean InstaPay amounts.
  return Math.max(0, Math.round(total));
}

/**
 * True if at least one item in the cart has a deposit available
 * (either an override or the global percent is > 0) and is a custom story.
 */
export function hasDepositOption(
  items: DepositLineInput[],
  settings: DepositSettings
): boolean {
  if (!settings.depositEnabled) return false;
  if (!Array.isArray(items) || items.length === 0) return false;

  for (const item of items) {
    // Only allow deposit for custom stories
    const isCustom = item.isCustom || item.productSlug === "custom-story";
    if (!isCustom) continue;

    const unitPrice = Math.max(0, Number(item.unitPrice) || 0);
    if (unitPrice <= 0) continue;
    const override =
      typeof item.depositAmount === "number" && item.depositAmount > 0
        ? item.depositAmount
        : null;
    if (override !== null) return true;
    if (settings.depositPercent > 0 && settings.depositPercent < 100) return true;
  }
  return false;
}
