export type CategoryId = "all" | "gaming" | "social" | "productivity";

export const CATEGORIES: {
  id: Exclude<CategoryId, "all">;
  label: string;
  icon: string;
}[] = [
  { id: "gaming", label: "Tài khoản Gaming", icon: "🎮" },
  { id: "social", label: "Tài khoản Social Media", icon: "📱" },
  { id: "productivity", label: "Tài khoản Productivity", icon: "⚙️" },
];

// Optimized option structure with direct price and stock
export type ProductOption = {
  id: string;
  label: string;
  price: number; // Giá bán thực tế của option này
  stock: number; // Số lượng tồn kho của option này
  kioskToken?: string; // Token API để mua sản phẩm này
  basePrice?: number; // Giá gốc để tính lợi nhuận
  profitMargin?: number; // % lợi nhuận
};

export type Product = {
  id: string;
  title: string;
  description: string;
  price?: number; // Optional - only used when no options available
  currency: string;
  imageEmoji?: string;
  imageUrl?: string; // optional thumbnail path under /public
  badge?: "new" | "hot"; // for highlighting
  longDescription?: string;
  faqs?: Array<{ q: string; a: string }>;
  category: Exclude<CategoryId, "all">;
  options?: ProductOption[]; // các tùy chọn sản phẩm - primary pricing source
  // Admin fields (optional for backward compatibility)
  stock?: number; // Optional - only used when no options available
  sold?: number;
  isActive?: boolean;
  createdAt?: Date;
  updatedAt?: Date;
  createdBy?: string;
  lastModifiedBy?: string;
};

export const products: Product[] = [];

export function getProductById(id?: string | null) {
  if (!id) return null;

  // For client-side or when dataStore is not available, use static products
  // The product detail page will fetch from API instead
  return products.find((p) => p.id === id) || null;
}

// Admin helper functions
export function getActiveProducts(): Product[] {
  return products.filter((p) => p.isActive !== false);
}

export function getProductsByCategory(category: CategoryId): Product[] {
  if (category === "all") return products;
  return products.filter((p) => p.category === category);
}

export function searchProducts(query: string): Product[] {
  const lowercaseQuery = query.toLowerCase();
  return products.filter(
    (p) =>
      p.title.toLowerCase().includes(lowercaseQuery) ||
      p.description.toLowerCase().includes(lowercaseQuery) ||
      p.longDescription?.toLowerCase().includes(lowercaseQuery)
  );
}

export function calculateProductPrice(
  product: Product,
  selectedOptionId?: string
): number {
  // If no options, return base product price (fallback to 0 if undefined)
  if (!product.options || product.options.length === 0) {
    return product.price || 0;
  }

  // If options exist, find the selected option and return its price
  if (selectedOptionId) {
    const selectedOption = product.options.find(
      (opt) => opt.id === selectedOptionId
    );
    if (selectedOption) {
      return selectedOption.price;
    }
  }

  // Fallback to first available option price or base price
  const firstOption =
    product.options.find((opt) => opt.stock > 0) || product.options[0];
  return firstOption ? firstOption.price : product.price || 0;
}
