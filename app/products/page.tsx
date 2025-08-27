import type { Product } from "@/src/core/products";
import ProductListingClient from "./ProductListingClient";
import { dataStore } from "@/src/core/data-store";

export default async function ProductsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const qs = await searchParams;
  const category = (qs.category as string) || "all";
  const q = (qs.q as string) || "";

  // Server-side fetch initial products by applying same filter/sort logic
  let products: Product[] = dataStore.getPublicProducts();

  // Apply category filter
  if (category && category !== "all") {
    products = products.filter((p) => p.category === category);
  }

  // Apply search filter
  if (q) {
    const searchLower = q.toLowerCase();
    products = products.filter(
      (p) =>
        p.title.toLowerCase().includes(searchLower) ||
        p.description.toLowerCase().includes(searchLower) ||
        (p.longDescription &&
          p.longDescription.toLowerCase().includes(searchLower))
    );
  }

  // Sort by createdAt desc then soldCount desc
  products.sort((a, b) => {
    const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
    const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
    if (dateB !== dateA) return dateB - dateA;
    return (b.soldCount || 0) - (a.soldCount || 0);
  });

  return (
    <ProductListingClient
      initialProducts={products}
      initialCategory={category}
      initialQ={q}
    />
  );
}
