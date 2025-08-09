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
