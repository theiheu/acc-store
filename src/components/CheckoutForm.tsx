"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useGlobalLoading } from "./GlobalLoadingProvider";
import type { Product } from "@/src/core/products";

export type CheckoutFormProps = {
  unitPrice: number;
  currency: string;
  defaultQty?: number;
  defaultCoupon?: string;
  product?: Product;
  selectedOptions?: Record<string, string>;
  priceModifier?: number;
  onSuccess?: (payload: {
    email: string;
    name: string;
    quantity: number;
    total: number;
  }) => void;
};

export default function CheckoutForm({
  unitPrice,
  currency,
  defaultQty = 1,
  defaultCoupon = "",
  product,
  selectedOptions = {},
  priceModifier = 0,
  onSuccess,
}: CheckoutFormProps) {
  const [quantity, setQuantity] = useState(defaultQty);
  const [coupon, setCoupon] = useState(defaultCoupon);
  const [discountPct, setDiscountPct] = useState(0);
  const [couponMsg, setCouponMsg] = useState<string | null>(null);
  const [email, setEmail] = useState("");
  const [fullName, setFullName] = useState("");
  const [cardNumber, setCardNumber] = useState("");
  const [expiry, setExpiry] = useState("");
  const [cvc, setCvc] = useState("");
  const [agree, setAgree] = useState(false);
  const { withLoading } = useGlobalLoading();

  const fmt = useMemo(
    () =>
      new Intl.NumberFormat("vi-VN", {
        style: "currency",
        currency,
        currencyDisplay: "narrowSymbol",
      }),
    [currency]
  );

  const subtotal = unitPrice * quantity;
  const discount = Math.round((subtotal * discountPct) / 100);
  const total = Math.max(0, subtotal - discount);

  function applyCoupon() {
    const code = coupon.trim().toUpperCase();
    if (!code) {
      setDiscountPct(0);
      setCouponMsg("Vui lòng nhập mã giảm giá");
      return;
    }
    if (code === "SAVE10") {
      setDiscountPct(10);
      setCouponMsg("Áp dụng mã giảm 10% thành công");
    } else if (code === "SAVE20") {
      setDiscountPct(20);
      setCouponMsg("Áp dụng mã giảm 20% thành công");
    } else {
      setDiscountPct(0);
      setCouponMsg("Mã giảm giá không hợp lệ");
    }
  }

  const router = useRouter();

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!agree) return;

    await withLoading(async () => {
      await new Promise((resolve) => setTimeout(resolve, 600));
      onSuccess?.({ email, name: fullName, quantity, total });
      router.push("/success");
    }, "Đang xử lý thanh toán...");
  }

  return (
    <form id="checkout" onSubmit={onSubmit} className="p-5 space-y-5">
      {/* Product summary */}
      <div className="rounded-lg border border-gray-200 dark:border-gray-800 p-3 space-y-3">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 flex items-center justify-center rounded-md bg-amber-100 text-amber-900 dark:bg-amber-300/20 dark:text-amber-300">
            {product?.imageEmoji || "🛒"}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">
              {product?.title || "Sản phẩm"}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {product?.description || "Mô tả sản phẩm"}
            </p>
          </div>
          <div className="text-sm font-semibold tabular-nums">
            {fmt.format(unitPrice)}
          </div>
        </div>

        {/* Selected options */}
        {product?.options && Object.keys(selectedOptions).length > 0 && (
          <div className="pt-2 border-t border-gray-100 dark:border-gray-800">
            <p className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-2">
              Tùy chọn đã chọn:
            </p>
            <div className="space-y-1">
              {product.options.map((option) => {
                const selectedValueId = selectedOptions[option.id];
                const selectedValue = option.values.find(
                  (v) => v.id === selectedValueId
                );
                if (!selectedValue) return null;

                return (
                  <div key={option.id} className="flex justify-between text-xs">
                    <span className="text-gray-600 dark:text-gray-400">
                      {option.label}:
                    </span>
                    <span className="text-gray-900 dark:text-gray-100">
                      {selectedValue.label}
                      {selectedValue.priceModifier !== 0 && (
                        <span
                          className={`ml-1 ${
                            selectedValue.priceModifier > 0
                              ? "text-green-600 dark:text-green-400"
                              : "text-red-600 dark:text-red-400"
                          }`}
                        >
                          ({selectedValue.priceModifier > 0 ? "+" : ""}
                          {fmt.format(selectedValue.priceModifier)})
                        </span>
                      )}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Buyer info */}
      <div className="grid grid-cols-1 gap-4">
        <div className="space-y-1.5">
          <label className="text-sm font-medium" htmlFor="email">
            Email
          </label>
          <input
            id="email"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-950 px-3 py-2 text-sm outline-none focus:ring-2 ring-amber-300"
            placeholder="you@example.com"
          />
        </div>
        <div className="space-y-1.5">
          <label className="text-sm font-medium" htmlFor="name">
            Họ và tên
          </label>
          <input
            id="name"
            required
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            className="w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-950 px-3 py-2 text-sm outline-none focus:ring-2 ring-amber-300"
            placeholder="Nguyễn Văn A"
          />
        </div>
      </div>

      {/* Quantity & coupon */}
      <div className="grid grid-cols-1 gap-4">
        <div className="space-y-1.5">
          <label className="text-sm font-medium">Số lượng</label>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setQuantity((q) => Math.max(1, q - 1))}
              className="h-9 w-9 rounded-md border border-gray-300 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800"
              aria-label="Giảm"
            >
              −
            </button>
            <input
              inputMode="numeric"
              value={quantity}
              onChange={(e) => {
                const v = parseInt(e.target.value || "1", 10);
                if (!Number.isNaN(v)) setQuantity(Math.min(99, Math.max(1, v)));
              }}
              className="w-16 text-center rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-950 px-2 py-2 text-sm tabular-nums"
            />
            <button
              type="button"
              onClick={() => setQuantity((q) => Math.min(99, q + 1))}
              className="h-9 w-9 rounded-md border border-gray-300 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800"
              aria-label="Tăng"
            >
              +
            </button>
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="text-sm font-medium" htmlFor="coupon">
            Mã giảm giá
          </label>
          <div className="flex gap-2">
            <input
              id="coupon"
              value={coupon}
              onChange={(e) => setCoupon(e.target.value)}
              className="flex-1 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-950 px-3 py-2 text-sm outline-none focus:ring-2 ring-amber-300"
              placeholder="SAVE10, SAVE20"
            />
            <button
              type="button"
              onClick={applyCoupon}
              className="inline-flex items-center rounded-lg bg-gray-900 text-white dark:bg-white dark:text-gray-900 px-3 py-2 text-sm font-medium hover:opacity-90"
            >
              Áp dụng
            </button>
          </div>
          {couponMsg && (
            <p className="text-xs text-gray-600 dark:text-gray-400">
              {couponMsg}
            </p>
          )}
        </div>
      </div>

      {/* Payment */}
      <div className="space-y-3">
        <p className="text-sm font-medium">Thông tin thẻ</p>
        <input
          placeholder="Số thẻ"
          value={cardNumber}
          onChange={(e) => setCardNumber(e.target.value)}
          className="w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-950 px-3 py-2 text-sm outline-none focus:ring-2 ring-amber-300"
          required
        />
        <div className="grid grid-cols-2 gap-3">
          <input
            placeholder="MM/YY"
            value={expiry}
            onChange={(e) => setExpiry(e.target.value)}
            className="w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-950 px-3 py-2 text-sm outline-none focus:ring-2 ring-amber-300"
            required
          />
          <input
            placeholder="CVC"
            value={cvc}
            onChange={(e) => setCvc(e.target.value)}
            className="w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-950 px-3 py-2 text-sm outline-none focus:ring-2 ring-amber-300"
            required
          />
        </div>
      </div>

      {/* Summary */}
      <div className="rounded-lg border border-gray-200 dark:border-gray-800 p-3 space-y-1 text-sm">
        <div className="flex justify-between">
          <span>Tạm tính</span>
          <span className="tabular-nums">{fmt.format(subtotal)}</span>
        </div>
        <div className="flex justify-between">
          <span>Giảm giá</span>
          <span className="tabular-nums">-{fmt.format(discount)}</span>
        </div>
        <div className="h-px bg-gray-200 dark:bg-gray-800 my-1"></div>
        <div className="flex justify-between font-semibold text-base">
          <span>Tổng</span>
          <span className="tabular-nums">{fmt.format(total)}</span>
        </div>
      </div>

      {/* Terms */}
      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          checked={agree}
          onChange={(e) => setAgree(e.target.checked)}
          className="size-4 rounded border-gray-300 dark:border-gray-700"
        />
        Tôi đồng ý với điều khoản dịch vụ
      </label>

      <button
        type="submit"
        disabled={
          !agree || !email || !fullName || !cardNumber || !expiry || !cvc
        }
        className="w-full inline-flex items-center justify-center rounded-lg bg-amber-300 text-gray-900 font-medium px-4 py-2.5 hover:brightness-95 disabled:opacity-60 disabled:cursor-not-allowed"
      >
        Thanh toán {fmt.format(total)}
      </button>
    </form>
  );
}
