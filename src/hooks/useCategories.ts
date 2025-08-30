/**
 * Optimized Category Hooks
 *
 * Provides efficient category data management with caching and real-time updates
 */

import { useState, useEffect, useMemo, useCallback } from "react";
import { useDataSync } from "@/src/components/providers/DataSyncProvider";
import {
  categoryService,
  CategoryItem,
  CategoryCounts,
  Category,
} from "@/src/services/CategoryService";

/**
 * Hook for category items (UI components)
 */
export function useCategoryItems() {
  const { categories } = useDataSync();
  const [items, setItems] = useState<CategoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const updateItems = async () => {
      try {
        // Always fetch items from service - the service handles caching
        const items = await categoryService.getCategoryItems();
        setItems(items);
        setIsLoading(false);
      } catch (error) {
        console.error("Failed to fetch category items:", error);
        setIsLoading(false);
      }
    };

    updateItems();
  }, [categories]);

  return { items, isLoading };
}

/**
 * Hook for category counts with products
 */
export function useCategoryCounts(products: any[], searchQuery = "") {
  const counts = useMemo(() => {
    // Ensure products is always an array to prevent conditional logic
    const safeProducts = Array.isArray(products) ? products : [];
    const safeSearchQuery = typeof searchQuery === "string" ? searchQuery : "";

    return categoryService.calculateCounts(safeProducts, safeSearchQuery);
  }, [products, searchQuery]);

  return counts;
}

/**
 * Hook for filtering products by category
 */
export function useProductFilter(
  products: any[],
  categorySlug: string,
  searchQuery = ""
) {
  const filteredProducts = useMemo(() => {
    // Ensure products is always an array to prevent conditional logic
    const safeProducts = Array.isArray(products) ? products : [];
    const safeCategorySlug =
      typeof categorySlug === "string" ? categorySlug : "all";
    const safeSearchQuery = typeof searchQuery === "string" ? searchQuery : "";

    let filtered = safeProducts;

    // Apply search filter first
    if (safeSearchQuery.trim()) {
      const query = safeSearchQuery.toLowerCase();
      filtered = filtered.filter((product) => {
        const searchText = `${product.title || ""} ${
          product.description || ""
        }`.toLowerCase();
        return searchText.includes(query);
      });
    }

    // Apply category filter
    filtered = categoryService.filterProductsByCategory(
      filtered,
      safeCategorySlug
    );

    return filtered;
  }, [products, categorySlug, searchQuery]);

  return filteredProducts;
}

/**
 * Hook for category management (admin)
 */
export function useCategoryManagement() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchCategories = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      // Use admin API to include full category fields (including isActive)
      const res = await fetch("/api/admin/categories?page=1&limit=9999");
      const json = await res.json();
      if (json.success) {
        setCategories(json.data as Category[]);
      } else {
        throw new Error(json.error || "Failed to fetch categories");
      }
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to fetch categories"
      );
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  const createCategory = useCallback(
    async (data: Partial<Category>) => {
      const validation = categoryService.validateCategory(data);
      if (!validation.isValid) {
        throw new Error(validation.errors.join(", "));
      }

      const response = await fetch("/api/admin/categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      const result = await response.json();
      if (!result.success) {
        throw new Error(result.error || "Failed to create category");
      }

      // Refresh categories
      await fetchCategories();
      return result.data;
    },
    [fetchCategories]
  );

  const updateCategory = useCallback(
    async (id: string, data: Partial<Category>) => {
      const validation = categoryService.validateCategory(data);
      if (!validation.isValid) {
        throw new Error(validation.errors.join(", "));
      }

      const response = await fetch(`/api/admin/categories/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      const result = await response.json();
      if (!result.success) {
        throw new Error(result.error || "Failed to update category");
      }

      // Refresh categories
      await fetchCategories();
      return result.data;
    },
    [fetchCategories]
  );

  const deleteCategory = useCallback(
    async (id: string) => {
      const response = await fetch(`/api/admin/categories/${id}`, {
        method: "DELETE",
      });

      const result = await response.json();
      if (!result.success) {
        throw new Error(result.error || "Failed to delete category");
      }

      // Refresh categories
      await fetchCategories();
      return true;
    },
    [fetchCategories]
  );

  return {
    categories,
    isLoading,
    error,
    fetchCategories,
    createCategory,
    updateCategory,
    deleteCategory,
  };
}

/**
 * Hook for category validation
 */
export function useCategoryValidation() {
  const validateCategory = useCallback((data: Partial<Category>) => {
    return categoryService.validateCategory(data);
  }, []);

  const generateUniqueSlug = useCallback(
    async (name: string, excludeId?: string) => {
      return categoryService.generateUniqueSlug(name, excludeId);
    },
    []
  );

  const isReservedSlug = useCallback((slug: string) => {
    return categoryService.isReservedSlug(slug);
  }, []);

  return {
    validateCategory,
    generateUniqueSlug,
    isReservedSlug,
  };
}

/**
 * Hook for category search
 */
export function useCategorySearch(categories: Category[], searchQuery: string) {
  const filteredCategories = useMemo(() => {
    if (!searchQuery.trim()) return categories;

    const query = searchQuery.toLowerCase();
    return categories.filter(
      (category) =>
        category.name.toLowerCase().includes(query) ||
        category.slug.toLowerCase().includes(query) ||
        (category.description &&
          category.description.toLowerCase().includes(query))
    );
  }, [categories, searchQuery]);

  return filteredCategories;
}
