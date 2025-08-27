"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import AdminLayout from "@/src/components/layout/AdminLayout";
import { withAdminAuth } from "@/src/components/providers/AdminAuthProvider";
import { useGlobalLoading } from "@/src/components/providers/GlobalLoadingProvider";
import { useToastContext } from "@/src/components/providers/ToastProvider";
import CategorySelect from "@/src/components/forms/CategorySelect";
import { type ProductOption } from "@/src/core/products";
import type { SupplierInfo } from "@/src/core/admin";
import LoadingButton from "@/src/components/ui/LoadingButton";
import OptionsEditor from "@/src/components/forms/OptionsEditor";

interface ProductFormData {
  title: string;
  description: string;
  longDescription: string;
  price?: number; // Optional - only used when no options
  currency: string;
  category: string;
  imageEmoji: string;
  imageUrl: string;
  badge: string;
  originalLink: string; // Link gốc/nguồn sản phẩm
  stock?: number; // Optional - only used when no options
  isActive: boolean;
  options?: ProductOption[];
  supplier?: SupplierInfo;
  soldCount?: number;
}

function CreateProduct() {
  const router = useRouter();
  const { withLoading, isLoading } = useGlobalLoading();
  const { show } = useToastContext();
  const [saving, setSaving] = useState(false);
  const [kioskToken, setKioskToken] = useState("");
  const [formData, setFormData] = useState<ProductFormData>({
    title: "",
    description: "",
    longDescription: "",
    price: undefined, // Start as undefined - will be set if no options
    currency: "VND",
    category: "uncategorized",
    imageEmoji: "📦",
    imageUrl: "",
    badge: "",
    originalLink: "", // Link gốc/nguồn sản phẩm
    stock: undefined, // Start as undefined - will be set if no options
    isActive: true,
    options: [],
    soldCount: 0,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [categories, setCategories] = useState<
    Array<{ id: string; name: string; slug: string }>
  >([]);

  useEffect(() => {
    fetch("/api/categories")
      .then((r) => r.json())
      .then((j) => {
        if (j.success) setCategories(j.data);
      })
      .catch(() => {});
  }, []);

  function validateForm(): boolean {
    const newErrors: Record<string, string> = {};

    if (!formData.title.trim()) {
      newErrors.title = "Tên sản phẩm là bắt buộc";
    }

    if (!formData.description.trim()) {
      newErrors.description = "Mô tả ngắn là bắt buộc";
    }

    if (!formData.category) {
      newErrors.category = "Danh mục là bắt buộc";
    }

    // Validate originalLink if provided
    if (formData.originalLink && formData.originalLink.trim()) {
      try {
        new URL(formData.originalLink);
      } catch {
        newErrors.originalLink =
          "Link không hợp lệ. Vui lòng nhập URL đúng định dạng";
      }
    }

    const hasOptions = formData.options && formData.options.length > 0;

    if (hasOptions) {
      // When options exist, validate options instead of main product price/stock
      const hasInvalidOption = formData.options!.some(
        (option) =>
          !option.label.trim() || option.price <= 0 || option.stock < 0
      );
      if (hasInvalidOption) {
        newErrors.options = "Tất cả tùy chọn phải có tên, giá > 0 và kho >= 0";
      }
    } else {
      // When no options, require main product price and stock
      if (!formData.price || formData.price <= 0) {
        newErrors.price = "Giá phải lớn hơn 0 (hoặc thêm tùy chọn sản phẩm)";
      }

      if (formData.stock === undefined || formData.stock < 0) {
        newErrors.stock =
          "Số lượng kho không thể âm (hoặc thêm tùy chọn sản phẩm)";
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!validateForm()) {
      show("Vui lòng kiểm tra lại thông tin");
      return;
    }

    try {
      setSaving(true);

      console.log("Creating product with data:", formData);
      const response = await fetch("/api/admin/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const result = await response.json();

      if (result.success) {
        show("Sản phẩm đã được tạo thành công");
        router.push("/admin/products");
      } else {
        show(result.error || "Không thể tạo sản phẩm");
      }
    } catch (error) {
      console.error("Create product error:", error);
      show("Có lỗi xảy ra khi tạo sản phẩm");
    } finally {
      setSaving(false);
    }
  }

  async function fetchFromSupplier() {
    const token = kioskToken.trim();
    if (!token) {
      show("Vui lòng nhập TAPHOAMMO_KIOSK_TOKEN");
      return;
    }
    try {
      const res = await fetch("/api/admin/products/fetch-supplier", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ kioskToken: token }),
      });
      const data = await res.json();
      if (!data?.success) {
        show(data?.error || "Không thể lấy dữ liệu từ TAPHOAMMO");
        return;
      }
      const items: Array<{ name: string; stock: number; basePrice: number }> =
        data.data.items || [];
      if (items.length === 0) {
        show("Không có dữ liệu sản phẩm hợp lệ");
        return;
      }
      // With kiosk token, we map the first item to current product base info and options list
      const first = items[0];
      // Validation
      if (!Number.isFinite(first.basePrice) || first.basePrice <= 0) {
        show("Giá gốc không hợp lệ từ TAPHOAMMO");
        return;
      }
      if (!Number.isFinite(first.stock) || first.stock < 0) {
        show("Tồn kho không hợp lệ từ TAPHOAMMO");
        return;
      }

      // Create optimized options from TAPHOAMMO items with direct price and stock
      const newOptions = items.map((it, idx) => ({
        id: `taphoammo_${idx}_${Date.now()}`,
        label: it.name,
        price: it.basePrice,
        stock: it.stock,
        kioskToken: kioskToken, // Store the API token for purchasing
        basePrice: it.basePrice,
        profitMargin: 0,
      }));

      setFormData((prev) => {
        // Add new flat options to existing ones
        const existing = prev.options || [];
        const merged = [...existing, ...newOptions];
        return {
          ...prev,
          // Không thay đổi thông tin sản phẩm chính (tên/giá/kho) theo yêu cầu
          supplier: {
            provider: "taphoammo",
            kioskToken: token,
            basePrice: first.basePrice,
            lastStock: first.stock,
            lastSyncedAt: new Date(),
          } as any,
          options: merged,
        };
      });

      show("Đã tải dữ liệu từ TAPHOAMMO và thêm vào tùy chọn sản phẩm");
    } catch (e) {
      console.error("fetchFromSupplier error", e);
      show("Có lỗi khi kết nối TAPHOAMMO. Vui lòng thử lại");
    } finally {
      // loading handled by withLoading
    }
  }

  function handleInputChange(field: keyof ProductFormData, value: any) {
    setFormData((prev) => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: "" }));
    }
  }

  return (
    <AdminLayout
      title="Thêm sản phẩm mới"
      description="Tạo sản phẩm mới trong hệ thống"
    >
      <div className="max-w-4xl mx-auto">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Information */}
          <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
              Thông tin cơ bản
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Tên sản phẩm *
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => handleInputChange("title", e.target.value)}
                  className={`w-full px-3 py-2 border rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-amber-500 focus:border-transparent ${
                    errors.title
                      ? "border-red-500"
                      : "border-gray-300 dark:border-gray-700"
                  }`}
                  placeholder="Nhập tên sản phẩm"
                />
                {errors.title && (
                  <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                    {errors.title}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Danh mục *
                </label>
                <div
                  className={`w-full ${
                    errors.category ? "ring-1 ring-red-500 rounded-lg" : ""
                  }`}
                >
                  <CategorySelect
                    value={formData.category}
                    onChange={(slug) => handleInputChange("category", slug)}
                  />
                </div>
                {errors.category && (
                  <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                    {errors.category}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Mô tả ngắn *
                </label>
                <input
                  type="text"
                  value={formData.description}
                  onChange={(e) =>
                    handleInputChange("description", e.target.value)
                  }
                  className={`w-full px-3 py-2 border rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-amber-500 focus:border-transparent ${
                    errors.description
                      ? "border-red-500"
                      : "border-gray-300 dark:border-gray-700"
                  }`}
                  placeholder="Mô tả ngắn gọn về sản phẩm"
                />
                {errors.description && (
                  <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                    {errors.description}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Icon Emoji
                </label>
                <input
                  type="text"
                  value={formData.imageEmoji}
                  onChange={(e) =>
                    handleInputChange("imageEmoji", e.target.value)
                  }
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                  placeholder="📦"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Link gốc
                </label>
                <input
                  type="url"
                  value={formData.originalLink}
                  onChange={(e) =>
                    handleInputChange("originalLink", e.target.value)
                  }
                  className={`w-full px-3 py-2 border rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-amber-500 focus:border-transparent ${
                    errors.originalLink
                      ? "border-red-500"
                      : "border-gray-300 dark:border-gray-700"
                  }`}
                  placeholder="https://example.com/product-source"
                />
                {errors.originalLink && (
                  <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                    {errors.originalLink}
                  </p>
                )}
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                  Link nguồn gốc của sản phẩm (tùy chọn)
                </p>
              </div>
            </div>

            <div className="mt-6">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Mô tả chi tiết
              </label>
              <textarea
                value={formData.longDescription}
                onChange={(e) =>
                  handleInputChange("longDescription", e.target.value)
                }
                rows={6}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-amber-500 focus:border-transparent font-mono text-sm resize-y"
                placeholder="Mô tả chi tiết về sản phẩm, tính năng, lợi ích...&#10;&#10;Hỗ trợ xuống dòng và định dạng văn bản.&#10;Có thể copy-paste nội dung từ nguồn khác."
                style={{ minHeight: "120px" }}
              />
            </div>
          </div>

          {/* Conditional Price & Stock - only when no options */}
          {(!formData.options || formData.options.length === 0) && (
            <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
                Giá và Kho hàng
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                Chỉ cần thiết khi sản phẩm không có tùy chọn (options). Nếu có
                options, giá và kho sẽ được quản lý trong từng option.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Giá sản phẩm (VND) *
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={formData.price || ""}
                    onChange={(e) => {
                      const value = e.target.value;
                      handleInputChange(
                        "price",
                        value === "" ? undefined : Number(value) || 0
                      );
                    }}
                    className={`w-full px-3 py-2 border rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-amber-500 focus:border-transparent ${
                      errors.price
                        ? "border-red-500"
                        : "border-gray-300 dark:border-gray-700"
                    }`}
                    placeholder="0"
                  />
                  {errors.price && (
                    <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                      {errors.price}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Số lượng kho *
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={formData.stock || ""}
                    onChange={(e) => {
                      const value = e.target.value;
                      handleInputChange(
                        "stock",
                        value === "" ? undefined : Number(value) || 0
                      );
                    }}
                    className={`w-full px-3 py-2 border rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-amber-500 focus:border-transparent ${
                      errors.stock
                        ? "border-red-500"
                        : "border-gray-300 dark:border-gray-700"
                    }`}
                    placeholder="0"
                  />
                  {errors.stock && (
                    <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                      {errors.stock}
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Option Editor với TAPHOAMMO tích hợp */}
          <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
              Tùy chọn sản phẩm (Options)
            </h3>
            {/* TAPHOAMMO: nhập token và fetch trong cùng card */}
            <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
              <div className="mb-4">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={kioskToken}
                    onChange={(e) => setKioskToken(e.target.value)}
                    className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                    placeholder="Nhập mã kiosk token để tự động tải dữ liệu sản phẩm"
                  />
                  <LoadingButton
                    type="button"
                    loading={isLoading}
                    loadingText="Đang lấy..."
                    onClick={() =>
                      withLoading(fetchFromSupplier, "Đang lấy dữ liệu...")
                    }
                    className="px-4 cursor-pointer"
                  >
                    Lấy dữ liệu
                  </LoadingButton>
                </div>
              </div>
            </div>

            <OptionsEditor
              value={formData.options}
              onChange={(opts) => handleInputChange("options", opts)}
            />
            {errors.options && (
              <p className="mt-2 text-sm text-red-600 dark:text-red-400">
                {errors.options}
              </p>
            )}
          </div>
          {/* Settings */}
          <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
              Cài đặt
            </h3>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Đã bán
              </label>
              <input
                type="number"
                min="0"
                value={formData.soldCount || 0}
                onChange={(e) => {
                  const value = e.target.value;
                  handleInputChange(
                    "soldCount",
                    value === "" ? 0 : Number(value) || 0
                  );
                }}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                placeholder="0"
              />
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                Số lượng đã bán ban đầu (tùy chọn).
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Badge (tùy chọn)
                </label>
                <select
                  value={formData.badge}
                  onChange={(e) => handleInputChange("badge", e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-amber-500 focus:border-transparent cursor-pointer"
                >
                  <option value="">Không có badge</option>
                  <option value="new">New</option>
                  <option value="hot">Hot</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  URL hình ảnh (tùy chọn)
                </label>
                <input
                  type="text"
                  value={formData.imageUrl}
                  onChange={(e) =>
                    handleInputChange("imageUrl", e.target.value)
                  }
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                  placeholder="/thumbs/product.svg"
                />
              </div>
            </div>

            <div className="mt-6">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={formData.isActive}
                  onChange={(e) =>
                    handleInputChange("isActive", e.target.checked)
                  }
                  className="rounded border-gray-300 dark:border-gray-700 text-amber-600 focus:ring-amber-500"
                />
                <span className="text-sm text-gray-700 dark:text-gray-300">
                  Kích hoạt sản phẩm ngay sau khi tạo
                </span>
              </label>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-4">
            <button
              type="button"
              onClick={() => router.back()}
              className="px-6 py-2 border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors cursor-pointer"
            >
              Hủy
            </button>

            <LoadingButton
              type="submit"
              loading={saving}
              loadingText="Đang tạo..."
              className="px-6 py-2 bg-amber-300 text-gray-900 hover:bg-amber-400 rounded-lg transition-colors font-medium cursor-pointer"
            >
              Tạo sản phẩm
            </LoadingButton>
          </div>
        </form>
      </div>
    </AdminLayout>
  );
}

export default withAdminAuth(CreateProduct);
