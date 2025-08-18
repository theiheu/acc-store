export function slugify(input: string): string {
  if (!input) return "";
  // Normalize and remove Vietnamese diacritics and other accents
  const withoutDiacritics = input
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // remove combining marks
    // Vietnamese specific characters not covered by NFD in some envs
    .replace(/đ/g, "d")
    .replace(/Đ/g, "D");

  return withoutDiacritics
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-") // replace non-alphanumerics with hyphen
    .replace(/^-+|-+$/g, "") // trim leading/trailing hyphens
    .replace(/-{2,}/g, "-"); // collapse multiple hyphens
}

export function toProductPath(category: string, slug: string): string {
  const safeCategory = slugify(category);
  const safeSlug = slugify(slug);
  return `/products/${encodeURIComponent(safeCategory)}/${encodeURIComponent(
    safeSlug
  )}`;
}

// Legacy path using id (rewritten via middleware to id under the hood)
export function toLegacyProductIdPath(id: string): string {
  return `/products/${encodeURIComponent(id)}`;
}

/**
 * Validate slug format
 */
export function isValidSlug(slug: string): boolean {
  if (!slug || typeof slug !== "string") return false;

  // Must be 1-50 characters, lowercase, alphanumeric with hyphens
  const slugRegex = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
  return slugRegex.test(slug) && slug.length >= 1 && slug.length <= 50;
}

/**
 * Generate unique slug with counter if needed
 */
export function generateUniqueSlug(
  baseSlug: string,
  existingSlugs: string[]
): string {
  if (!existingSlugs.includes(baseSlug)) {
    return baseSlug;
  }

  let counter = 1;
  let uniqueSlug = `${baseSlug}-${counter}`;

  while (existingSlugs.includes(uniqueSlug)) {
    counter++;
    uniqueSlug = `${baseSlug}-${counter}`;
  }

  return uniqueSlug;
}

/**
 * Reserved slugs that cannot be used
 */
export const RESERVED_SLUGS = [
  "all",
  "admin",
  "api",
  "new",
  "edit",
  "delete",
  "create",
  "update",
  "search",
  "filter",
  "category",
  "categories",
  "product",
  "products",
  "user",
  "users",
  "auth",
  "login",
  "logout",
  "register",
  "profile",
  "settings",
  "dashboard",
  "home",
  "about",
  "contact",
  "help",
  "support",
  "terms",
  "privacy",
  "404",
  "500",
  "error",
];

/**
 * Check if slug is reserved
 */
export function isReservedSlug(slug: string): boolean {
  return RESERVED_SLUGS.includes(slug.toLowerCase());
}
