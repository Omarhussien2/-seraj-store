export const PRODUCT_CATEGORIES = [
  "قصص جاهزة",
  "قصص مخصصة",
  "فلاش كاردز",
  "مجموعات",
] as const;

export const PRODUCT_SECTIONS = [
  "tales",
  "seraj-stories",
  "custom-stories",
  "play-learn",
] as const;

const UNSECTIONED_PRODUCT_FILTERS = new Set(["bundle", "null", "none"]);

export function productSectionFilterValue(section: string | null) {
  if (!section) return undefined;
  if (UNSECTIONED_PRODUCT_FILTERS.has(section)) return null;
  return section;
}

export function optionalProductText(value: string | null | undefined) {
  return value ?? undefined;
}
