"use client";

import { useEffect, useState, useMemo } from "react";

interface FeaturedProductsSelectorProps {
  value: string[];
  onChange: (ids: string[]) => void;
}

interface ProductItem {
  id: string;
  title: string;
  category: string;
  isActive: boolean;
}

export default function FeaturedProductsSelector({
  value,
  onChange,
}: FeaturedProductsSelectorProps) {
  const [products, setProducts] = useState<ProductItem[]>([]);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    fetch("/api/products")
      .then((r) => r.json())
      .then((j) => {
        if (j.success) {
          const items = (j.data as any[]).map((p) => ({
            id: p.id,
            title: p.title,
            category: p.category || "uncategorized",
            isActive: p.isActive !== false,
          }));
          setProducts(items);
        }
      })
      .catch((error) => {
        console.error(
          "FeaturedProductsSelector: Error loading products:",
          error
        );
      });
  }, []);

  // Filter products based on search query
  const filteredProducts = useMemo(() => {
    if (!searchQuery.trim()) return products;
    const query = searchQuery.toLowerCase();
    return products.filter(
      (p) =>
        p.title.toLowerCase().includes(query) ||
        p.category.toLowerCase().includes(query)
    );
  }, [products, searchQuery]);

  // Separate selected and unselected products
  const { selectedProducts, unselectedProducts } = useMemo(() => {
    const selected = filteredProducts.filter((p) => value.includes(p.id));
    const unselected = filteredProducts.filter((p) => !value.includes(p.id));
    return { selectedProducts: selected, unselectedProducts: unselected };
  }, [filteredProducts, value]);

  function toggle(id: string) {
    const newValue = value.includes(id)
      ? value.filter((x) => x !== id)
      : [...value, id];

    onChange(newValue);
  }

  function selectAll() {
    const allIds = filteredProducts.map((p) => p.id);
    const newValue = [...new Set([...value, ...allIds])];
    onChange(newValue);
  }

  function clearAll() {
    const filteredIds = filteredProducts.map((p) => p.id);
    const newValue = value.filter((id) => !filteredIds.includes(id));
    onChange(newValue);
  }

  return (
    <div className="space-y-3">
      {/* Help text */}
      <div className="text-xs text-gray-500 dark:text-gray-400">
        Chọn sản phẩm nổi bật sẽ hiển thị ưu tiên trong danh mục này. Nhấn Esc
        để xóa tìm kiếm.
      </div>

      {/* Search and controls */}
      <div className="space-y-2">
        <div className="relative">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Escape") {
                setSearchQuery("");
              }
            }}
            placeholder="Tìm kiếm theo tên hoặc danh mục..."
            className="w-full pl-9 pr-3 py-2 text-sm border border-gray-300 dark:border-gray-700 rounded-md bg-white dark:bg-gray-800 focus:ring-2 focus:ring-amber-500 focus:border-transparent"
          />
          <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
            🔍
          </div>
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery("")}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              ✕
            </button>
          )}
        </div>

        {filteredProducts.length > 0 && (
          <div className="flex gap-2">
            <button
              type="button"
              onClick={selectAll}
              className="px-3 py-1 text-xs bg-amber-100 dark:bg-amber-900/20 text-amber-800 dark:text-amber-200 rounded hover:bg-amber-200 dark:hover:bg-amber-900/30"
            >
              Chọn tất cả ({filteredProducts.length})
            </button>
            <button
              type="button"
              onClick={clearAll}
              className="px-3 py-1 text-xs bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded hover:bg-gray-200 dark:hover:bg-gray-700"
            >
              Bỏ chọn tất cả
            </button>
          </div>
        )}
      </div>

      {/* Statistics */}
      <div className="flex justify-between items-center text-xs text-gray-500 dark:text-gray-400">
        <div>
          {searchQuery ? (
            <>
              Hiển thị {filteredProducts.length} / {products.length} sản phẩm
            </>
          ) : (
            <>Tổng cộng {products.length} sản phẩm</>
          )}
        </div>
        {value.length > 0 && (
          <div className="text-amber-600 dark:text-amber-400 font-medium">
            Đã chọn: {value.length}
          </div>
        )}
      </div>

      {/* Products list */}
      <div className="rounded border border-gray-200 dark:border-gray-800 max-h-64 overflow-auto">
        {/* Selected products first */}
        {selectedProducts.length > 0 && (
          <div className="bg-amber-50 dark:bg-amber-900/10 border-b border-amber-200 dark:border-amber-800">
            <div className="px-3 py-2 text-xs font-medium text-amber-800 dark:text-amber-200 bg-amber-100 dark:bg-amber-900/20">
              Đã chọn ({selectedProducts.length})
            </div>
            {selectedProducts.map((p) => (
              <label
                key={p.id}
                className="flex items-center gap-2 px-3 py-2 text-sm border-b last:border-0 border-amber-100 dark:border-amber-800 hover:bg-amber-100 dark:hover:bg-amber-900/20"
              >
                <input
                  type="checkbox"
                  checked={true}
                  onChange={() => toggle(p.id)}
                  className="text-amber-600 focus:ring-amber-500"
                />
                <div className="flex-1">
                  <div className="font-medium">{p.title}</div>
                  <div className="text-xs text-amber-600 dark:text-amber-400">
                    {p.category} • {p.isActive ? "Hoạt động" : "Tạm dừng"}
                  </div>
                </div>
              </label>
            ))}
          </div>
        )}

        {/* Unselected products */}
        {unselectedProducts.map((p) => (
          <label
            key={p.id}
            className={`flex items-center gap-2 px-3 py-2 text-sm border-b last:border-0 border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800 ${
              !p.isActive ? "opacity-60" : ""
            }`}
          >
            <input
              type="checkbox"
              checked={false}
              onChange={() => toggle(p.id)}
              className="text-amber-600 focus:ring-amber-500"
            />
            <div className="flex-1">
              <div className="font-medium">{p.title}</div>
              <div className="text-xs text-gray-500 dark:text-gray-400">
                {p.category} • {p.isActive ? "Hoạt động" : "Tạm dừng"}
              </div>
            </div>
          </label>
        ))}

        {/* Empty state */}
        {filteredProducts.length === 0 && products.length > 0 && (
          <div className="px-3 py-4 text-sm text-gray-500 text-center">
            Không tìm thấy sản phẩm nào với từ khóa "{searchQuery}"
          </div>
        )}

        {products.length === 0 && (
          <div className="px-3 py-4 text-sm text-gray-500 text-center">
            Chưa có sản phẩm nào
          </div>
        )}
      </div>
    </div>
  );
}
