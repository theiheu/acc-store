"use client";

import { useEffect, useState } from "react";

export default function DebugPanel() {
  const [products, setProducts] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [isVisible, setIsVisible] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());

  useEffect(() => {
    if (!isVisible) return;

    const fetchData = async () => {
      try {
        const [productsRes, categoriesRes] = await Promise.all([
          fetch("/api/products"),
          fetch("/api/categories"),
        ]);

        const productsData = await productsRes.json();
        const categoriesData = await categoriesRes.json();

        if (productsData.success) setProducts(productsData.data);
        if (categoriesData.success) setCategories(categoriesData.data);
        setLastUpdate(new Date());
      } catch (error) {
        console.error("Debug fetch error:", error);
      }
    };

    fetchData();
    const interval = setInterval(fetchData, 2000); // Refresh every 2 seconds

    return () => clearInterval(interval);
  }, [isVisible]);

  if (!isVisible) {
    return (
      <button
        onClick={() => setIsVisible(true)}
        className="fixed bottom-4 right-4 bg-red-500 text-white px-3 py-1 rounded text-xs z-50"
      >
        Debug
      </button>
    );
  }

  return (
    <div className="fixed bottom-4 right-4 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg p-4 max-w-md max-h-96 overflow-auto shadow-lg z-50">
      <div className="flex justify-between items-center mb-2">
        <h3 className="font-bold text-sm">Debug Panel</h3>
        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              const fetchData = async () => {
                try {
                  const [productsRes, categoriesRes] = await Promise.all([
                    fetch("/api/products"),
                    fetch("/api/categories"),
                  ]);

                  const productsData = await productsRes.json();
                  const categoriesData = await categoriesRes.json();

                  if (productsData.success) setProducts(productsData.data);
                  if (categoriesData.success)
                    setCategories(categoriesData.data);
                  setLastUpdate(new Date());
                } catch (error) {
                  console.error("Debug refresh error:", error);
                }
              };
              fetchData();
            }}
            className="text-xs bg-blue-500 text-white px-2 py-1 rounded hover:bg-blue-600"
          >
            🔄
          </button>
          <button
            onClick={() => setIsVisible(false)}
            className="text-gray-500 hover:text-gray-700"
          >
            ×
          </button>
        </div>
      </div>

      <div className="text-xs text-gray-500 mb-2">
        Cập nhật: {lastUpdate.toLocaleTimeString("vi-VN")}
      </div>

      <div className="space-y-3 text-xs">
        <div>
          <h4 className="font-semibold">Products ({products.length})</h4>
          <div className="space-y-1">
            {products.map((p) => (
              <div
                key={p.id}
                className="bg-gray-50 dark:bg-gray-800 p-2 rounded"
              >
                <div>
                  <strong>{p.title}</strong>
                </div>
                <div>Category: {p.category}</div>
                <div>Active: {p.isActive ? "✓" : "✗"}</div>
              </div>
            ))}
          </div>
        </div>

        <div>
          <h4 className="font-semibold">Categories ({categories.length})</h4>
          <div className="space-y-1">
            {categories.map((c) => (
              <div
                key={c.id}
                className="bg-gray-50 dark:bg-gray-800 p-2 rounded"
              >
                <div>
                  <strong>{c.name}</strong> ({c.slug})
                </div>
                <div>Icon: {c.icon}</div>
                <div>Active: {c.isActive ? "✓" : "✗"}</div>
                <div>
                  Featured: {c.featuredProductIds?.length || 0} products
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
