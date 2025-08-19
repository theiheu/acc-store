/**
 * Centralized Category Service
 *
 * Provides unified interface for category operations
 * Handles caching, validation, and data transformation
 */

import { slugify } from "@/src/utils/slug";

// Use a flexible Category interface that works with both API responses and core types
export interface Category {
  id: string;
  name: string;
  slug: string;
  description?: string;
  icon?: string;
  featuredProductIds?: string[];
  isActive: boolean;
  createdAt: string | Date;
  updatedAt: string | Date;
}

export interface CategoryWithStats extends Category {
  productCount: number;
}

export interface CategoryItem {
  id: string;
  label: string;
  icon: string;
  slug: string;
  isActive: boolean;
}

export interface CategoryCounts {
  [slug: string]: number;
}

class CategoryService {
  private cache: {
    categories: Category[] | null;
    lastFetch: number;
    ttl: number; // 5 minutes
  } = {
    categories: null,
    lastFetch: 0,
    ttl: 5 * 60 * 1000,
  };

  /**
   * Get all active categories with caching
   */
  async getCategories(forceRefresh = false): Promise<Category[]> {
    const now = Date.now();

    if (
      !forceRefresh &&
      this.cache.categories &&
      now - this.cache.lastFetch < this.cache.ttl
    ) {
      return this.cache.categories;
    }

    try {
      const response = await fetch("/api/categories");
      const result = await response.json();

      if (result.success) {
        this.cache.categories = result.data;
        this.cache.lastFetch = now;
        return result.data;
      }

      throw new Error(result.error || "Failed to fetch categories");
    } catch (error) {
      console.error("CategoryService: Failed to fetch categories:", error);
      return this.cache.categories || [];
    }
  }

  /**
   * Get categories formatted for UI components
   */
  async getCategoryItems(): Promise<CategoryItem[]> {
    const categories = await this.getCategories();

    return [
      {
        id: "all",
        label: "Tất cả sản phẩm",
        icon: "🛍️",
        slug: "all",
        isActive: true,
      },
      ...categories.map((c) => ({
        id: c.slug,
        label: c.name,
        icon: c.icon || "🏷️",
        slug: c.slug,
        isActive: c.isActive,
      })),
    ];
  }

  /**
   * Get category by slug
   */
  async getCategoryBySlug(slug: string): Promise<Category | null> {
    const categories = await this.getCategories();
    return categories.find((c) => c.slug === slug) || null;
  }

  /**
   * Calculate product counts by category
   */
  calculateCounts(products: any[], searchQuery = ""): CategoryCounts {
    // Filter products by search query first
    const filteredProducts = products.filter((product) => {
      if (!searchQuery.trim()) return true;
      const searchText = `${product.title} ${
        product.description || ""
      }`.toLowerCase();
      return searchText.includes(searchQuery.toLowerCase());
    });

    const counts: CategoryCounts = {
      all: filteredProducts.length,
    };

    // Count products by category slug
    filteredProducts.forEach((product) => {
      const categorySlug = this.normalizeCategorySlug(product.category);
      counts[categorySlug] = (counts[categorySlug] || 0) + 1;
    });

    return counts;
  }

  /**
   * Filter products by category
   */
  filterProductsByCategory(products: any[], categorySlug: string): any[] {
    if (categorySlug === "all") {
      return products;
    }

    return products.filter((product) => {
      const productCategorySlug = this.normalizeCategorySlug(product.category);
      return productCategorySlug === categorySlug;
    });
  }

  /**
   * Normalize category name to slug
   */
  normalizeCategorySlug(category: string | undefined): string {
    if (!category) return "uncategorized";
    return slugify(category);
  }

  /**
   * Validate category data
   */
  validateCategory(data: Partial<Category>): {
    isValid: boolean;
    errors: string[];
  } {
    const errors: string[] = [];

    if (!data.name?.trim()) {
      errors.push("Tên danh mục không được trống");
    }

    if (data.name && data.name.trim().length < 2) {
      errors.push("Tên danh mục phải có ít nhất 2 ký tự");
    }

    if (data.name && data.name.trim().length > 50) {
      errors.push("Tên danh mục không được quá 50 ký tự");
    }

    if (data.description && data.description.length > 200) {
      errors.push("Mô tả không được quá 200 ký tự");
    }

    if (data.featuredProductIds && data.featuredProductIds.length > 10) {
      errors.push("Không được chọn quá 10 sản phẩm nổi bật");
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  /**
   * Clear cache (useful for real-time updates)
   */
  clearCache(): void {
    this.cache.categories = null;
    this.cache.lastFetch = 0;
  }

  /**
   * Update cache with new data (for real-time sync)
   */
  updateCache(categories: Category[]): void {
    this.cache.categories = categories;
    this.cache.lastFetch = Date.now();
  }

  /**
   * Get default category for new products
   */
  getDefaultCategorySlug(): string {
    return "uncategorized";
  }

  /**
   * Check if category slug is reserved
   */
  isReservedSlug(slug: string): boolean {
    const reserved = ["all", "admin", "api", "new", "edit", "delete"];
    return reserved.includes(slug.toLowerCase());
  }

  /**
   * Generate unique slug from name
   */
  async generateUniqueSlug(name: string, excludeId?: string): Promise<string> {
    const baseSlug = slugify(name);

    if (this.isReservedSlug(baseSlug)) {
      throw new Error(`Slug "${baseSlug}" là từ khóa dành riêng`);
    }

    const categories = await this.getCategories();
    const existingSlugs = categories
      .filter((c) => c.id !== excludeId)
      .map((c) => c.slug);

    if (!existingSlugs.includes(baseSlug)) {
      return baseSlug;
    }

    // Generate numbered variants
    let counter = 1;
    let uniqueSlug = `${baseSlug}-${counter}`;

    while (existingSlugs.includes(uniqueSlug)) {
      counter++;
      uniqueSlug = `${baseSlug}-${counter}`;
    }

    return uniqueSlug;
  }
}

// Export singleton instance
export const categoryService = new CategoryService();
