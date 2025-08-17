"use client";

import { useState, useMemo, useRef, useEffect } from "react";
import Link from "next/link";
import { CATEGORIES, type CategoryId } from "@/src/core/products";

export default function CategorySidebar({
  value,
  onChange,
  counts,
}: {
  value: CategoryId;
  onChange: (c: CategoryId) => void;
  counts?: Record<CategoryId, number>;
}) {
  const [open, setOpen] = useState(false);

  const items = useMemo(
    () => [{ id: "all", label: "Tất cả sản phẩm", icon: "🛍️" }, ...CATEGORIES],
    []
  ) as { id: CategoryId; label: string; icon: string }[];

  const activeItem = items.find((i) => i.id === value);

  const scrollerRef = useRef<HTMLDivElement | null>(null);
  const buttonRefs = useRef<Record<string, HTMLButtonElement | null>>({});
  const rafRef = useRef<number | null>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  useEffect(() => {
    const btn = buttonRefs.current[value];
    if (btn && scrollerRef.current) {
      btn.scrollIntoView({
        behavior: "smooth",
        inline: "center",
        block: "nearest",
      });
    }
  }, [value]);
  // Track scroll position to show/hide edge indicators
  useEffect(() => {
    const el = scrollerRef.current;
    if (!el) return;

    const update = () => {
      setCanScrollLeft(el.scrollLeft > 0);
      setCanScrollRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 1);
    };
    update();

    const onScroll = () => {
      if (rafRef.current != null) cancelAnimationFrame(rafRef.current);
      rafRef.current = requestAnimationFrame(update);
    };

    el.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", update);

    return () => {
      el.removeEventListener("scroll", onScroll as EventListener);
      window.removeEventListener("resize", update);
      if (rafRef.current != null) cancelAnimationFrame(rafRef.current);
    };
  }, []);

  return (
    <aside className="md:w-64">
      {/* Mobile: horizontal pills, sticky */}
      <div className="md:hidden sticky top-16 z-10 -mx-4 px-4 py-2 bg-gray-50 dark:bg-gray-950 border-b border-gray-200 dark:border-gray-800 relative overflow-hidden">
        <div
          ref={scrollerRef}
          className="flex gap-2 overflow-x-auto no-scrollbar whitespace-nowrap overscroll-x-contain snap-x snap-mandatory scroll-px-4 [-webkit-overflow-scrolling:touch]"
        >
          {items.map((c) => {
            const active = c.id === value;
            return (
              <Link
                key={c.id}
                href={c.id === "all" ? "/products" : `/products/${c.id}`}
                ref={(el: HTMLAnchorElement | null) => {
                  // eslint-disable-next-line @typescript-eslint/no-explicit-any
                  (buttonRefs.current as any)[c.id] = el as any;
                }}
                className={`inline-flex shrink-0 items-center gap-2 rounded-full px-3 py-1.5 text-sm border transition-colors snap-start ${
                  active
                    ? "bg-amber-50 text-gray-900 dark:bg-amber-300/10 dark:text-gray-100 border-amber-200 dark:border-amber-300/30"
                    : "text-gray-600 dark:text-gray-300 border-gray-300 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800"
                }`}
              >
                <span className="text-base leading-none">{c.icon}</span>
                <span className="truncate">{c.label}</span>
                {counts && (
                  <span className="ml-1 inline-flex items-center justify-center rounded-full bg-gray-100 dark:bg-gray-800 text-xs px-2 py-0.5">
                    {counts[c.id] ?? 0}
                  </span>
                )}
              </Link>
            );
          })}
        </div>
      </div>
      {/* Edge fade indicators */}
      {canScrollLeft && (
        <div className="pointer-events-none absolute left-0 top-0 h-full w-6 bg-gradient-to-r from-gray-50 dark:from-gray-950 to-transparent" />
      )}
      {canScrollRight && (
        <div className="pointer-events-none absolute right-0 top-0 h-full w-6 bg-gradient-to-l from-gray-50 dark:from-gray-950 to-transparent" />
      )}

      {/* Desktop: vertical sidebar */}
      <div className="hidden md:block">
        <nav className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 shadow-sm p-2">
          {items.map((c) => {
            const active = c.id === value;
            return (
              <Link
                key={c.id}
                href={c.id === "all" ? "/products" : `/products/${c.id}`}
                className={`w-full inline-flex items-center gap-2 rounded-md px-3 py-2 text-sm transition-colors ${
                  active
                    ? "bg-amber-50 text-gray-900 dark:bg-amber-300/10 dark:text-gray-100 border border-amber-200 dark:border-amber-300/30"
                    : "text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800"
                }`}
              >
                <span className="text-base leading-none">{c.icon}</span>
                <span className="flex-1 truncate">{c.label}</span>
                {counts && (
                  <span className="ml-auto inline-flex items-center justify-center rounded-full bg-gray-100 dark:bg-gray-800 text-xs px-2 py-0.5">
                    {counts[c.id] ?? 0}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>
      </div>
    </aside>
  );
}
