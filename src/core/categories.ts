export interface Category {
  id: string;
  name: string;
  slug: string;
  description?: string;
  icon?: string; // Emoji hoặc tên icon
  featuredProductIds?: string[]; // Danh sách sản phẩm nổi bật (tùy chọn)
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}
