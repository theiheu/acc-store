"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import AdminLayout from "@/src/components/layout/AdminLayout";
import { withAdminAuth } from "@/src/components/providers/AdminAuthProvider";
import { useGlobalLoading } from "@/src/components/providers/GlobalLoadingProvider";
import { useToastContext } from "@/src/components/providers/ToastProvider";
import { AdminOrder } from "@/src/core/admin";
import { formatCurrency } from "@/src/core/admin";
import OrderStatusBadge, { OrderStatusProgress } from "@/src/components/admin/orders/OrderStatusBadge";
import OrderActionButtons from "@/src/components/admin/orders/OrderActionButtons";
import LoadingSpinner from "@/src/components/ui/LoadingSpinner";

interface OrderDetailData {
  order: AdminOrder;
  relatedOrders: Array<{
    id: string;
    productTitle: string;
    totalAmount: number;
    status: string;
    createdAt: string;
  }>;
  customer: {
    id: string;
    email: string;
    name?: string;
    balance: number;
    totalOrders: number;
    totalSpent: number;
    registrationDate: string;
  } | null;
  product: {
    id: string;
    title: string;
    category?: string;
    price: number;
    options?: Array<{ id: string; label: string; price: number }>;
  } | null;
}

function AdminOrderDetailPage() {
  const router = useRouter();
  const params = useParams();
  const orderId = params.id as string;
  const [orderData, setOrderData] = useState<OrderDetailData | null>(null);
  const [loading, setLoading] = useState(true);
  const [adminNotes, setAdminNotes] = useState("");
  const [isUpdatingNotes, setIsUpdatingNotes] = useState(false);
  const { withLoading } = useGlobalLoading();
  const { show } = useToastContext();

  useEffect(() => {
    if (orderId) {
      fetchOrderDetail();
    }
  }, [orderId]);

  const fetchOrderDetail = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/admin/orders/${orderId}`);
      const result = await response.json();

      if (result.success) {
        setOrderData(result.data);
        setAdminNotes(result.data.order.adminNotes || "");
      } else {
        show(result.error || "Không thể tải thông tin đơn hàng");
        router.push("/admin/orders");
      }
    } catch (error) {
      console.error("Fetch order detail error:", error);
      show("Có lỗi xảy ra khi tải thông tin đơn hàng");
      router.push("/admin/orders");
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateNotes = async () => {
    if (!orderData) return;

    try {
      setIsUpdatingNotes(true);
      const response = await fetch(`/api/admin/orders/${orderId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          adminNotes,
        }),
      });

      const result = await response.json();

      if (result.success) {
        show("Đã cập nhật ghi chú thành công");
        setOrderData(prev => prev ? {
          ...prev,
          order: { ...prev.order, adminNotes }
        } : null);
      } else {
        show(result.error || "Có lỗi xảy ra khi cập nhật ghi chú");
      }
    } catch (error) {
      console.error("Update notes error:", error);
      show("Có lỗi xảy ra khi cập nhật ghi chú");
    } finally {
      setIsUpdatingNotes(false);
    }
  };

  const handleOrderUpdate = (updatedOrder: AdminOrder) => {
    setOrderData(prev => prev ? {
      ...prev,
      order: updatedOrder
    } : null);
  };

  if (loading) {
    return (
      <AdminLayout
        title="Chi tiết đơn hàng"
        description="Thông tin chi tiết và quản lý đơn hàng"
      >
        <div className="flex items-center justify-center h-64">
          <LoadingSpinner size="lg" />
        </div>
      </AdminLayout>
    );
  }

  if (!orderData) {
    return (
      <AdminLayout
        title="Chi tiết đơn hàng"
        description="Thông tin chi tiết và quản lý đơn hàng"
      >
        <div className="text-center py-12">
          <div className="text-4xl mb-4">❌</div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
            Không tìm thấy đơn hàng
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            Đơn hàng không tồn tại hoặc đã bị xóa.
          </p>
          <Link
            href="/admin/orders"
            className="inline-flex items-center px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors"
          >
            ← Quay lại danh sách
          </Link>
        </div>
      </AdminLayout>
    );
  }

  const { order, customer, product, relatedOrders } = orderData;

  return (
    <AdminLayout
      title={`Đơn hàng #${order.id.slice(-8)}`}
      description="Thông tin chi tiết và quản lý đơn hàng"
    >
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link
              href="/admin/orders"
              className="text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
            >
              ← Quay lại
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                Đơn hàng #{order.id.slice(-8)}
              </h1>
              <p className="text-gray-600 dark:text-gray-400">
                Tạo lúc {new Date(order.createdAt).toLocaleString("vi-VN")}
              </p>
            </div>
          </div>
          <OrderStatusBadge status={order.status} size="lg" />
        </div>

        {/* Status Progress */}
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
            Tiến trình đơn hàng
          </h3>
          <OrderStatusProgress status={order.status} />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Order Details */}
          <div className="lg:col-span-2 space-y-6">
            {/* Order Information */}
            <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
                Thông tin đơn hàng
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <span className="text-sm font-medium text-gray-600 dark:text-gray-400">ID đơn hàng:</span>
                  <p className="text-gray-900 dark:text-gray-100 font-mono">{order.id}</p>
                </div>
                <div>
                  <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Trạng thái:</span>
                  <div className="mt-1">
                    <OrderStatusBadge status={order.status} />
                  </div>
                </div>
                <div>
                  <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Số lượng:</span>
                  <p className="text-gray-900 dark:text-gray-100">{order.quantity}</p>
                </div>
                <div>
                  <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Đơn giá:</span>
                  <p className="text-gray-900 dark:text-gray-100">{formatCurrency(order.unitPrice)}</p>
                </div>
                <div>
                  <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Tổng tiền:</span>
                  <p className="text-lg font-semibold text-amber-600 dark:text-amber-400">
                    {formatCurrency(order.totalAmount)}
                  </p>
                </div>
                <div>
                  <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Cập nhật cuối:</span>
                  <p className="text-gray-900 dark:text-gray-100">
                    {new Date(order.updatedAt).toLocaleString("vi-VN")}
                  </p>
                </div>
              </div>
            </div>

            {/* Product Information */}
            {product && (
              <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
                  Thông tin sản phẩm
                </h3>
                <div className="space-y-3">
                  <div>
                    <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Tên sản phẩm:</span>
                    <p className="text-gray-900 dark:text-gray-100">{product.title}</p>
                  </div>
                  {product.category && (
                    <div>
                      <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Danh mục:</span>
                      <p className="text-gray-900 dark:text-gray-100">{product.category}</p>
                    </div>
                  )}
                  {order.selectedOptionLabel && (
                    <div>
                      <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Tùy chọn:</span>
                      <p className="text-gray-900 dark:text-gray-100">{order.selectedOptionLabel}</p>
                    </div>
                  )}
                  <div>
                    <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Giá niêm yết:</span>
                    <p className="text-gray-900 dark:text-gray-100">{formatCurrency(product.price)}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Admin Notes */}
            <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
                Ghi chú quản trị
              </h3>
              <div className="space-y-4">
                <textarea
                  value={adminNotes}
                  onChange={(e) => setAdminNotes(e.target.value)}
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                  placeholder="Thêm ghi chú cho đơn hàng này..."
                />
                <button
                  onClick={handleUpdateNotes}
                  disabled={isUpdatingNotes || adminNotes === (order.adminNotes || "")}
                  className="px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {isUpdatingNotes ? "Đang lưu..." : "Lưu ghi chú"}
                </button>
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Actions */}
            <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
                Thao tác
              </h3>
              <OrderActionButtons
                order={order}
                onOrderUpdate={handleOrderUpdate}
                variant="full"
              />
            </div>

            {/* Customer Information */}
            {customer && (
              <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
                  Thông tin khách hàng
                </h3>
                <div className="space-y-3">
                  <div>
                    <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Tên:</span>
                    <p className="text-gray-900 dark:text-gray-100">{customer.name || "Chưa cập nhật"}</p>
                  </div>
                  <div>
                    <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Email:</span>
                    <p className="text-gray-900 dark:text-gray-100">{customer.email}</p>
                  </div>
                  <div>
                    <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Số dư:</span>
                    <p className="text-gray-900 dark:text-gray-100">{formatCurrency(customer.balance)}</p>
                  </div>
                  <div>
                    <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Tổng đơn hàng:</span>
                    <p className="text-gray-900 dark:text-gray-100">{customer.totalOrders}</p>
                  </div>
                  <div>
                    <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Tổng chi tiêu:</span>
                    <p className="text-gray-900 dark:text-gray-100">{formatCurrency(customer.totalSpent)}</p>
                  </div>
                  <div className="pt-2">
                    <Link
                      href={`/admin/users/${customer.id}`}
                      className="text-amber-600 dark:text-amber-400 hover:text-amber-700 dark:hover:text-amber-300 text-sm font-medium"
                    >
                      Xem chi tiết khách hàng →
                    </Link>
                  </div>
                </div>
              </div>
            )}

            {/* Related Orders */}
            {relatedOrders.length > 0 && (
              <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
                  Đơn hàng liên quan
                </h3>
                <div className="space-y-3">
                  {relatedOrders.map((relatedOrder) => (
                    <div key={relatedOrder.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                      <div>
                        <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                          #{relatedOrder.id.slice(-8)}
                        </p>
                        <p className="text-xs text-gray-600 dark:text-gray-400">
                          {relatedOrder.productTitle}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                          {formatCurrency(relatedOrder.totalAmount)}
                        </p>
                        <OrderStatusBadge status={relatedOrder.status} size="sm" />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}

export default withAdminAuth(AdminOrderDetailPage);
