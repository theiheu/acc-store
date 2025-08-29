"use client";

import { useState } from "react";
import { useCart } from "@/src/components/providers/CartProvider";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import EmptyState from "@/src/components/ui/EmptyState";
import ConfirmCheckoutModal from "@/src/components/ui/ConfirmCheckoutModal";
import { useToastContext } from "@/src/components/providers/ToastProvider";
import { useGlobalLoading } from "@/src/components/providers/GlobalLoadingProvider";

export default function CartPage() {
  const { state, dispatch } = useCart();
  const router = useRouter();
  const { show } = useToastContext();
  const { withLoading } = useGlobalLoading();
  const [isConfirming, setIsConfirming] = useState(false);

  const handleRemoveItem = (productId: string, optionId?: string) => {
    dispatch({ type: "REMOVE_ITEM", productId, optionId });
  };

  const handleUpdateQuantity = (
    productId: string,
    optionId: string | undefined,
    quantity: number
  ) => {
    if (quantity > 0) {
      dispatch({ type: "UPDATE_QUANTITY", productId, optionId, quantity });
    } else {
      handleRemoveItem(productId, optionId);
    }
  };

  const subtotal = state.items.reduce((sum, item) => {
    const price = item.option?.price ?? item.product.price ?? 0;
    return sum + price * item.quantity;
  }, 0);

  const handleCheckout = async () => {
    setIsConfirming(false);
    await withLoading(async () => {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: state.items.map((item) => ({
            productId: item.product.id,
            optionId: item.option?.id,
            quantity: item.quantity,
          })),
        }),
      });
      const data = await res.json();
      if (data.success) {
        show("Thanh toán thành công! Đơn hàng của bạn đang được xử lý.");
        dispatch({ type: "CLEAR_CART" });
        router.push("/orders");
      } else {
        show(data.error || "Đã có lỗi xảy ra khi thanh toán.", "error");
      }
    }, "Đang xử lý thanh toán...");
  };

  if (state.items.length === 0) {
    return (
      <div className="bg-gray-50 dark:bg-gray-950 min-h-[calc(100dvh-80px)] py-12">
        <div className="mx-auto max-w-4xl px-4">
          <EmptyState
            icon="🛒"
            title="Giỏ hàng của bạn đang trống"
            description="Có vẻ như bạn chưa thêm sản phẩm nào. Hãy khám phá cửa hàng để tìm thứ bạn thích!"
            primaryAction={{ label: "Khám phá sản phẩm", href: "/products" }}
          />
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="bg-gray-50 dark:bg-gray-950 min-h-[calc(100dvh-80px)] py-12">
        <div className="mx-auto max-w-6xl px-4">
          <h1 className="text-3xl font-semibold mb-8">Giỏ hàng của bạn</h1>
          <div className="grid grid-cols-1 lg:grid-cols-3 lg:gap-8 items-start">
            {/* Cart Items */}
            <div className="lg:col-span-2 space-y-4">
              {state.items.map((item, index) => {
                const price = item.option?.price ?? item.product.price ?? 0;
                const lineTotal = price * item.quantity;
                return (
                  <div
                    key={`${item.product.id}-${item.option?.id || index}`}
                    className="flex items-start gap-4 p-4 border rounded-lg bg-white dark:bg-gray-900 shadow-sm"
                  >
                    <Image
                      src={item.product.imageUrl || ""}
                      alt={item.product.title}
                      width={96}
                      height={96}
                      className="w-24 h-24 rounded-md object-cover"
                    />
                    <div className="flex-grow">
                      <Link
                        href={`/products/${item.product.id}`}
                        className="font-medium hover:underline"
                      >
                        {item.product.title}
                      </Link>
                      {item.option && (
                        <p className="text-sm text-gray-500">
                          Loại: {item.option.label}
                        </p>
                      )}
                      <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                        {price.toLocaleString("vi-VN")} ₫
                      </p>
                      <div className="flex items-center gap-2 mt-2">
                        <button
                          onClick={() =>
                            handleUpdateQuantity(
                              item.product.id,
                              item.option?.id,
                              item.quantity - 1
                            )
                          }
                          className="h-8 w-8 rounded-md border hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer"
                        >
                          -
                        </button>
                        <input
                          type="number"
                          min="1"
                          value={item.quantity}
                          onChange={(e) =>
                            handleUpdateQuantity(
                              item.product.id,
                              item.option?.id,
                              parseInt(e.target.value, 10) || 1
                            )
                          }
                          className="w-14 text-center rounded-md border bg-transparent px-2 py-1.5 text-sm"
                        />
                        <button
                          onClick={() =>
                            handleUpdateQuantity(
                              item.product.id,
                              item.option?.id,
                              item.quantity + 1
                            )
                          }
                          className="h-8 w-8 rounded-md border hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer"
                        >
                          +
                        </button>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-amber-600">
                        {lineTotal.toLocaleString("vi-VN")} ₫
                      </p>
                      <button
                        onClick={() =>
                          handleRemoveItem(item.product.id, item.option?.id)
                        }
                        className="text-sm text-red-500 hover:underline mt-2 cursor-pointer"
                      >
                        Xóa
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Order Summary */}
            <div className="lg:col-span-1 lg:sticky lg:top-24">
              <div className="p-6 border rounded-lg bg-white dark:bg-gray-900 shadow-sm">
                <h2 className="text-lg font-semibold mb-4">
                  Tổng quan đơn hàng
                </h2>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>Tạm tính</span>
                    <span>{subtotal.toLocaleString("vi-VN")} ₫</span>
                  </div>
                  <div className="flex justify-between text-xl font-bold pt-4 border-t">
                    <span>Tổng cộng</span>
                    <span>{subtotal.toLocaleString("vi-VN")} ₫</span>
                  </div>
                </div>
                <button
                  onClick={() => setIsConfirming(true)}
                  className="w-full mt-6 bg-gray-900 text-white dark:bg-white dark:text-gray-900 font-semibold py-3 rounded-lg hover:opacity-90 transition-opacity cursor-pointer"
                >
                  Tiến hành Thanh toán
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
      <ConfirmCheckoutModal
        open={isConfirming}
        onClose={() => setIsConfirming(false)}
        onConfirm={handleCheckout}
        itemCount={state.items.length}
        totalAmount={subtotal}
      />
    </>
  );
}
