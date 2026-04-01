export type ProductScope = "snap" | "gymnastics";

export type PrimarySignupSource = "snap" | "gymnastics" | "legacy";

export const DEFAULT_PRODUCT_SCOPES: ProductScope[] = ["snap"];

export function isProductScope(value: unknown): value is ProductScope {
  return value === "snap" || value === "gymnastics";
}

export function normalizePrimarySignupSource(
  value: unknown,
): PrimarySignupSource | null {
  return value === "snap" || value === "gymnastics" || value === "legacy"
    ? value
    : null;
}

export function productScopesForSignupSource(
  source: PrimarySignupSource | "snap" | "gymnastics",
): ProductScope[] {
  if (source === "gymnastics") {
    return ["snap", "gymnastics"];
  }
  return ["snap"];
}

export function normalizeProductScopes(value: unknown): ProductScope[] {
  const list = Array.isArray(value) ? value : [];
  const normalized = list.filter(isProductScope);
  const deduped = Array.from(new Set(normalized));
  if (!deduped.includes("snap")) {
    deduped.unshift("snap");
  }
  return deduped.length > 0 ? deduped : [...DEFAULT_PRODUCT_SCOPES];
}

export function hasProductScope(
  scopes: unknown,
  requiredScope: ProductScope,
): boolean {
  return normalizeProductScopes(scopes).includes(requiredScope);
}
