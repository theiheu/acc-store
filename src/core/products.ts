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

export type ProductOption = {
  id: string;
  label: string;
  values: Array<{
    id: string;
    label: string;
    priceModifier?: number; // thêm/trừ giá gốc
    description?: string;
  }>;
};

export type Product = {
  id: string;
  title: string;
  description: string;
  price: number; // in currency units
  currency: string;
  imageEmoji?: string;
  imageUrl?: string; // optional thumbnail path under /public
  badge?: "new" | "hot"; // for highlighting
  longDescription?: string;
  faqs?: Array<{ q: string; a: string }>;
  category: Exclude<CategoryId, "all">;
  options?: ProductOption[]; // các tùy chọn sản phẩm
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
        id: "duration",
        label: "Thời hạn sử dụng",
        values: [
          { id: "1month", label: "1 tháng", priceModifier: 0 },
          {
            id: "3months",
            label: "3 tháng",
            priceModifier: 20000,
            description: "Tiết kiệm 15%",
          },
          {
            id: "6months",
            label: "6 tháng",
            priceModifier: 35000,
            description: "Tiết kiệm 25%",
          },
          {
            id: "1year",
            label: "1 năm",
            priceModifier: 60000,
            description: "Tiết kiệm 35%",
          },
        ],
      },
      {
        id: "region",
        label: "Khu vực",
        values: [
          { id: "vn", label: "Việt Nam", priceModifier: 0 },
          { id: "sea", label: "Đông Nam Á", priceModifier: 5000 },
          { id: "global", label: "Toàn cầu", priceModifier: 15000 },
        ],
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
        id: "features",
        label: "Tính năng",
        values: [
          { id: "basic", label: "Cơ bản", priceModifier: 0 },
          {
            id: "extended",
            label: "Mở rộng",
            priceModifier: 10000,
            description: "Thêm 5 tính năng",
          },
        ],
      },
    ],
  },
  {
    id: "tiktok",
    title: "Tài khoản TikTok",
    description: "Tài khoản TikTok xác minh cơ bản",
    price: 29000,
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
        id: "verification",
        label: "Trạng thái xác minh",
        values: [
          { id: "unverified", label: "Chưa xác minh", priceModifier: 0 },
          {
            id: "verified",
            label: "Đã xác minh",
            priceModifier: 15000,
            description: "Tick xanh",
          },
        ],
      },
      {
        id: "followers",
        label: "Số lượng follower",
        values: [
          { id: "0-1k", label: "0-1K followers", priceModifier: 0 },
          { id: "1k-5k", label: "1K-5K followers", priceModifier: 8000 },
          { id: "5k-10k", label: "5K-10K followers", priceModifier: 20000 },
          { id: "10k+", label: "10K+ followers", priceModifier: 40000 },
        ],
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
  return products.find((p) => p.id === id) || null;
}
