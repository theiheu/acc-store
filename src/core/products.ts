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

export const products: Product[] = [
  {
    id: "premium",
    title: "Gói Tài Khoản Premium",
    description: "Full quyền lợi, bảo hành 7 ngày",
    price: 49000,
    currency: "VND",
    imageEmoji: "🎮",
    badge: "hot",
    imageUrl: "/thumbs/premium.svg",
    longDescription:
      "Gói Premium mở khóa toàn bộ tính năng và nhận hỗ trợ ưu tiên. Phù hợp cho người dùng yêu cầu ổn định và bảo hành.",
    faqs: [
      { q: "Bảo hành bao lâu?", a: "Trong 7 ngày kể từ khi kích hoạt." },
      { q: "Có đổi được loại khác?", a: "Liên hệ hỗ trợ để được tư vấn." },
    ],
    category: "gaming",
    options: [
      {
        id: "1month",
        label: "1 tháng",
        price: 49000,
        stock: 100,
        kioskToken: "demo_token_1month",
      },
      {
        id: "3months",
        label: "3 tháng - Tiết kiệm 15%",
        price: 69000,
        stock: 50,
        kioskToken: "demo_token_3months",
      },
      {
        id: "6months",
        label: "6 tháng - Tiết kiệm 25%",
        price: 84000,
        stock: 30,
        kioskToken: "demo_token_6months",
      },
      {
        id: "1year",
        label: "1 năm - Tiết kiệm 35%",
        price: 109000,
        stock: 20,
        kioskToken: "demo_token_1year",
      },
    ],
  },
  {
    id: "starter",
    title: "Gói Starter",
    description: "Cơ bản, đủ dùng",
    price: 19000,
    currency: "VND",
    imageEmoji: "✨",
    badge: "new",
    imageUrl: "/thumbs/starter.svg",
    longDescription:
      "Gói Starter phù hợp để bắt đầu trải nghiệm dịch vụ với chi phí thấp.",
    faqs: [
      { q: "Có nâng cấp lên Premium?", a: "Có, bạn có thể nâng cấp sau." },
    ],
    category: "productivity",
    options: [
      {
        id: "basic",
        label: "Cơ bản",
        price: 19000,
        stock: 200,
        kioskToken: "demo_token_basic",
      },
      {
        id: "extended",
        label: "Mở rộng - Thêm 5 tính năng",
        price: 29000,
        stock: 150,
        kioskToken: "demo_token_extended",
      },
    ],
  },
  {
    id: "simple-product",
    title: "Sản phẩm đơn giản",
    description: "Sản phẩm không có tùy chọn - dùng giá và kho chính",
    price: 15000,
    stock: 50,
    currency: "VND",
    imageEmoji: "📱",
    category: "tools",
    longDescription:
      "Đây là ví dụ về sản phẩm đơn giản không có options, sử dụng giá và kho của sản phẩm chính.",
    faqs: [
      {
        q: "Có tùy chọn không?",
        a: "Không, đây là sản phẩm đơn giản với giá cố định.",
      },
    ],
    // No options - uses main product price and stock
  },
  {
    id: "tiktok",
    title: "Tài khoản TikTok",
    description: "Tài khoản TikTok xác minh cơ bản",
    currency: "VND",
    imageEmoji: "🎵",
    imageUrl: "/thumbs/tiktok.svg",
    longDescription: "Tài khoản TikTok an toàn, phù hợp seeding và chạy trend.",
    faqs: [
      {
        q: "Có xác minh sẵn?",
        a: "Loại cơ bản chưa xác minh, có thể nâng cấp sau.",
      },
    ],
    category: "social",
    options: [
      {
        id: "unverified-0-1k",
        label: "Chưa xác minh, 0-1K followers",
        price: 29000,
        stock: 50,
        kioskToken: "demo_token_tiktok_basic",
      },
      {
        id: "unverified-1k-5k",
        label: "Chưa xác minh, 1K-5K followers",
        price: 37000,
        stock: 30,
        kioskToken: "demo_token_tiktok_1k",
      },
      {
        id: "verified-0-1k",
        label: "Đã xác minh (Tick xanh), 0-1K followers",
        price: 44000,
        stock: 20,
        kioskToken: "demo_token_tiktok_verified",
      },
      {
        id: "verified-5k-10k",
        label: "Đã xác minh (Tick xanh), 5K-10K followers",
        price: 64000,
        stock: 10,
        kioskToken: "demo_token_tiktok_premium",
      },
    ],
  },
  {
    id: "facebook",
    title: "Tài khoản Facebook",
    description: "Facebook cá nhân an toàn, dễ dùng",
    price: 39000,
    currency: "VND",
    imageEmoji: "📘",
    imageUrl: "/thumbs/facebook.svg",
    longDescription:
      "Tài khoản Facebook cá nhân dùng cho mục đích thông thường.",
    faqs: [
      {
        q: "Đổi email được không?",
        a: "Tùy loại, vui lòng liên hệ để tư vấn chi tiết.",
      },
    ],
    category: "social",
  },
  {
    id: "capcut-pro",
    title: "Tài khoản CapCut Pro",
    description: "Mở khóa đầy đủ tính năng Pro",
    price: 59000,
    currency: "VND",
    imageEmoji: "🎬",
    imageUrl: "/thumbs/capcut.svg",
    longDescription:
      "Tận hưởng CapCut Pro với đầy đủ preset và template cao cấp.",
    faqs: [
      {
        q: "Có tự gia hạn không?",
        a: "Không, đây là bản dùng theo thời hạn gói.",
      },
    ],
    category: "productivity",
  },
];

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
