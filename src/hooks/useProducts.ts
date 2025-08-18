"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import type { Product } from "@/src/core/products";

interface UseProductsOptions {
  category?: string;
  limit?: number;
  sortBy?: "price" | "title" | "createdAt";
  sortOrder?: "asc" | "desc";
}

interface UseProductsReturn {
  products: Product[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  filteredProducts: Product[];
  totalCount: number;
}

export function useProducts(options: UseProductsOptions = {}): UseProductsReturn {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchProducts = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams();
      if (options.category) {
        params.append("category", options.category);
      }
      if (options.limit) {
        params.append("limit", options.limit.toString());
      }

      const response = await fetch(`/api/products?${params.toString()}`);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.error || "Failed to fetch products");
      }

      setProducts(data.data || []);
    } catch (err) {
      console.error("Error fetching products:", err);
      setError(err instanceof Error ? err.message : "Unknown error occurred");
      setProducts([]);
    } finally {
      setLoading(false);
    }
  }, [options.category, options.limit]);

  // Memoized filtered and sorted products
  const filteredProducts = useMemo(() => {
    let result = [...products];

    // Filter active products
    result = result.filter(product => product.isActive !== false);

    // Sort products
    if (options.sortBy) {
      result.sort((a, b) => {
        let aValue: any;
        let bValue: any;

        switch (options.sortBy) {
          case "price":
            aValue = a.price || 0;
            bValue = b.price || 0;
            break;
          case "title":
            aValue = a.title.toLowerCase();
            bValue = b.title.toLowerCase();
            break;
          case "createdAt":
            aValue = new Date(a.createdAt || 0).getTime();
            bValue = new Date(b.createdAt || 0).getTime();
            break;
          default:
            return 0;
        }

        if (aValue < bValue) {
          return options.sortOrder === "desc" ? 1 : -1;
        }
        if (aValue > bValue) {
          return options.sortOrder === "desc" ? -1 : 1;
        }
        return 0;
      });
    }

    return result;
  }, [products, options.sortBy, options.sortOrder]);

  const totalCount = useMemo(() => filteredProducts.length, [filteredProducts]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  return {
    products,
    loading,
    error,
    refetch: fetchProducts,
    filteredProducts,
    totalCount,
  };
}
