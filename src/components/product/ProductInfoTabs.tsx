"use client";

import { useMemo, useState, useRef } from "react";
import type { Product } from "@/src/core/products";

type TabId = "overview" | "specs" | "faq" | "reviews";

interface ProductInfoTabsProps {
  product: Product;
  defaultActive?: TabId;
}

export default function ProductInfoTabs({
  product,
  defaultActive = "overview",
}: ProductInfoTabsProps) {
  const [active, setActive] = useState<TabId>(defaultActive);
  const tabsRef = useRef<Array<HTMLButtonElement | null>>([]);

  const tabs: Array<{ id: TabId; label: string }> = [
    { id: "overview", label: "Mô tả" },
    { id: "specs", label: "Thông số" },
    { id: "faq", label: "Hỏi đáp" },
    { id: "reviews", label: "Đánh giá" },
  ];

  const fmt = useMemo(
    () =>
      new Intl.NumberFormat("vi-VN", {
        style: "currency",
        currency: product.currency,
        currencyDisplay: "narrowSymbol",
      }),
    [product.currency]
  );

  const onKeyDown = (e: React.KeyboardEvent) => {
    const idx = tabs.findIndex((t) => t.id === active);
    if (e.key === "ArrowRight") {
      const next = (idx + 1) % tabs.length;
      setActive(tabs[next].id);
      tabsRef.current[next]?.focus();
      e.preventDefault();
    } else if (e.key === "ArrowLeft") {
      const prev = (idx - 1 + tabs.length) % tabs.length;
      setActive(tabs[prev].id);
      tabsRef.current[prev]?.focus();
      e.preventDefault();
    } else if (e.key === "Home") {
      setActive(tabs[0].id);
      tabsRef.current[0]?.focus();
      e.preventDefault();
    } else if (e.key === "End") {
      const last = tabs.length - 1;
      setActive(tabs[last].id);
      tabsRef.current[last]?.focus();
      e.preventDefault();
    }
  };

  return (
    <div className="mt-6 md:mt-8">
      {/* Tab list */}
      <div
        className="flex items-center gap-2 border-b border-gray-200 dark:border-gray-800"
        role="tablist"
        aria-label="Thông tin sản phẩm"
        onKeyDown={onKeyDown}
      >
        {tabs.map((t, i) => {
          const selected = active === t.id;
          return (
            <button
              key={t.id}
              ref={(el) => {
                tabsRef.current[i] = el;
              }}
              role="tab"
              id={`tab-${t.id}`}
              aria-controls={`panel-${t.id}`}
              aria-selected={selected}
              tabIndex={selected ? 0 : -1}
              onClick={() => setActive(t.id)}
              className={`relative px-3 md:px-4 lg:px-5 py-2 md:py-2.5 lg:py-3 text-sm md:text-base lg:text-lg font-medium transition-colors outline-none focus-visible:ring-2 focus-visible:ring-amber-400/30 rounded-t-md cursor-pointer ${
                selected
                  ? "text-amber-600 dark:text-amber-400"
                  : "text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white"
              }`}
            >
              {t.label}
              <span
                aria-hidden
                className={`absolute left-0 right-0 -bottom-[1px] h-[2px] md:h-[3px] lg:h-[4px] rounded-full transition-all ${
                  selected
                    ? "bg-amber-400"
                    : "bg-transparent group-hover:bg-gray-300 dark:group-hover:bg-gray-700"
                }`}
              />
            </button>
          );
        })}
      </div>

      {/* Panels */}
      <div className="pt-4 md:pt-5 lg:pt-6">
        {/* Mô tả */}
        <div
          role="tabpanel"
          id="panel-overview"
          aria-labelledby="tab-overview"
          hidden={active !== "overview"}
          className="space-y-2"
        >
          <p className="text-sm text-gray-700 dark:text-gray-300">
            {product.description}
          </p>
          {product.longDescription && (
            <div className="prose prose-sm dark:prose-invert max-w-none">
              <p className="leading-relaxed md:text-[15px] lg:text-base">
                {product.longDescription}
              </p>
            </div>
          )}
        </div>

        {/* Specifications */}
        <div
          role="tabpanel"
          id="panel-specs"
          aria-labelledby="tab-specs"
          hidden={active !== "specs"}
        >
          <div className="rounded-lg border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-3">
            <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3 text-sm">
              <div className="flex items-start justify-between gap-4">
                <dt className="text-gray-600 dark:text-gray-400">Danh mục</dt>
                <dd className="text-gray-900 dark:text-gray-100 font-medium">
                  {product.category}
                </dd>
              </div>
              {product.price && (
                <div className="flex items-start justify-between gap-4">
                  <dt className="text-gray-600 dark:text-gray-400">
                    Giá cơ bản
                  </dt>
                  <dd className="text-gray-900 dark:text-gray-100 font-medium">
                    {fmt.format(product.price)}
                  </dd>
                </div>
              )}
              <div className="flex items-start justify-between gap-4">
                <dt className="text-gray-600 dark:text-gray-400">Tiền tệ</dt>
                <dd className="text-gray-900 dark:text-gray-100 font-medium">
                  {product.currency}
                </dd>
              </div>
              {product.badge && (
                <div className="flex items-start justify-between gap-4">
                  <dt className="text-gray-600 dark:text-gray-400">Nổi bật</dt>
                  <dd className="text-gray-900 dark:text-gray-100 font-medium">
                    {product.badge === "hot" ? "Hot" : "Mới"}
                  </dd>
                </div>
              )}
              {product.stock !== undefined &&
                (!product.options || product.options.length === 0) && (
                  <div className="flex items-start justify-between gap-4">
                    <dt className="text-gray-600 dark:text-gray-400">
                      Tồn kho
                    </dt>
                    <dd className="text-gray-900 dark:text-gray-100 font-medium">
                      {product.stock}
                    </dd>
                  </div>
                )}
              {product.options && product.options.length > 0 && (
                <div className="sm:col-span-2">
                  <dt className="text-gray-600 dark:text-gray-400">Tùy chọn</dt>
                  <dd className="mt-1">
                    <ul className="list-disc pl-5 space-y-1 text-gray-900 dark:text-gray-100">
                      {product.options.map((opt) => (
                        <li key={opt.id}>
                          <span className="font-medium">{opt.label}</span>:{" "}
                          {fmt.format(opt.price)}
                          {opt.stock !== undefined && (
                            <span className="text-gray-500 dark:text-gray-400 ml-2">
                              (Còn {opt.stock})
                            </span>
                          )}
                        </li>
                      ))}
                    </ul>
                  </dd>
                </div>
              )}
            </dl>
          </div>
        </div>

        {/* FAQ */}
        <div
          role="tabpanel"
          id="panel-faq"
          aria-labelledby="tab-faq"
          hidden={active !== "faq"}
        >
          {product.faqs && product.faqs.length ? (
            <div className="space-y-3">
              {product.faqs.map((f, idx) => (
                <details
                  key={idx}
                  className="group rounded-lg border border-gray-200 dark:border-gray-800 p-3 open:bg-amber-50/50 dark:open:bg-amber-300/5"
                >
                  <summary className="cursor-pointer list-none flex items-center justify-between gap-2">
                    <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                      {f.q}
                    </span>
                    <span
                      className="text-gray-500 group-open:rotate-180 transition-transform"
                      aria-hidden
                    >
                      ⌄
                    </span>
                  </summary>
                  <div className="mt-2 text-sm text-gray-700 dark:text-gray-300">
                    {f.a}
                  </div>
                </details>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Chưa có câu hỏi thường gặp cho sản phẩm này.
            </p>
          )}
        </div>

        {/* Reviews */}
        <div
          role="tabpanel"
          id="panel-reviews"
          aria-labelledby="tab-reviews"
          hidden={active !== "reviews"}
        >
          <div className="rounded-lg border border-gray-200 dark:border-gray-800 p-4 text-sm text-gray-600 dark:text-gray-300">
            Tính năng đánh giá sẽ sớm có mặt. Hãy quay lại sau!
          </div>
        </div>
      </div>
    </div>
  );
}
