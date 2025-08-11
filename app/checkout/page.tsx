import CheckoutForm from "@/src/components/CheckoutForm";
import CheckoutPageWrapper from "@/src/components/CheckoutPageWrapper";
import { getProductById } from "@/src/core/products";
import { notFound } from "next/navigation";

export default function CheckoutPage({
  searchParams,
}: {
  searchParams: { productId?: string; qty?: string; coupon?: string };
}) {
  const product = getProductById(searchParams.productId);
  if (!product) notFound();

  const qty = Math.max(
    1,
    Math.min(99, parseInt(searchParams.qty ?? "1", 10) || 1)
  );
  const coupon = (searchParams.coupon ?? "").toString();

  return (
    <CheckoutPageWrapper>
      <div className="min-h-[calc(100dvh-80px)] bg-gray-50 text-gray-900 dark:bg-gray-950 dark:text-gray-100 flex items-center justify-center p-6">
        <div className="w-full max-w-md rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 shadow-sm">
          <div className="p-5 border-b border-gray-200 dark:border-gray-800">
            <h1 className="text-lg font-semibold">
              Nạp tiền — {product.title}
            </h1>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Hoàn tất đơn hàng của bạn
            </p>
          </div>
          <CheckoutForm
            unitPrice={product.price}
            currency={product.currency}
            defaultQty={qty}
            defaultCoupon={coupon}
          />
        </div>
      </div>
    </CheckoutPageWrapper>
  );
}
