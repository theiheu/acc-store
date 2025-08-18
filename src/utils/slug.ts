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
