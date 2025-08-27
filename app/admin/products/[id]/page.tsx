"use client";

import { useEffect, useState } from "react"; // ensure useEffect imported
import { useRouter, useParams } from "next/navigation";
import AdminLayout from "@/src/components/layout/AdminLayout";
import { withAdminAuth } from "@/src/components/providers/AdminAuthProvider";
import { useGlobalLoading } from "@/src/components/providers/GlobalLoadingProvider";
import { useToastContext } from "@/src/components/providers/ToastProvider";
import CategorySelect from "@/src/components/forms/CategorySelect";
import { AdminProduct, type SupplierInfo } from "@/src/core/admin";
import { type ProductOption } from "@/src/core/products";
import LoadingButton from "@/src/components/ui/LoadingButton";
import OptionsEditor from "@/src/components/forms/OptionsEditor";
import LoadingSpinner from "@/src/components/ui/LoadingSpinner";

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

function EditProduct() {
  const router = useRouter();
  const params = useParams();
  const productId = params.id as string;
  const { withLoading } = useGlobalLoading();
  const { show } = useToastContext();

  const [product, setProduct] = useState<AdminProduct | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState<ProductFormData>({
    title: "",
    description: "",
    longDescription: "",
    price: undefined, // Start as undefined
    currency: "VND",
    category: "uncategorized",
    imageEmoji: "📦",
    imageUrl: "",
    badge: "",
    originalLink: "", // Link gốc/nguồn sản phẩm
    stock: undefined, // Start as undefined
    isActive: true,
    soldCount: undefined,
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

  useEffect(() => {
    if (productId) {
      fetchProduct();
    }
  }, [productId]);

  async function fetchProduct() {
    try {
      setLoading(true);
      const response = await fetch(`/api/admin/products/${productId}`);
      const result = await response.json();

      if (result.success) {
        const productData = result.data;
        setProduct(productData);
        setFormData({
          title: productData.title || "",
          description: productData.description || "",
          longDescription: productData.longDescription || "",
          price:
            productData.price !== undefined ? productData.price : undefined,
          currency: productData.currency || "VND",
          category: productData.category || "uncategorized",
          imageEmoji: productData.imageEmoji || "📦",
          imageUrl: productData.imageUrl || "",
          badge: productData.badge || "",
          originalLink: productData.originalLink || "",
          stock:
            productData.stock !== undefined ? productData.stock : undefined,
          isActive: productData.isActive !== false,
          options: productData.options || [],
          supplier: productData.supplier,
          soldCount:
            productData.soldCount !== undefined ? productData.soldCount : 0,
        });
      } else {
        show("Không thể tải thông tin sản phẩm");
        router.push("/admin/products");
      }
    } catch (error) {
      console.error("Fetch product error:", error);
      show("Có lỗi xảy ra khi tải dữ liệu");
      router.push("/admin/products");
    } finally {
      setLoading(false);
    }
  }

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
      console.log("Updating product with data:", formData);
      const response = await fetch(`/api/admin/products/${productId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const result = await response.json();

      if (result.success) {
        show("Sản phẩm đã được cập nhật thành công");
        router.push("/admin/products");
      } else {
        show(result.error || "Không thể cập nhật sản phẩm");
      }
    } catch (error) {
      console.error("Update product error:", error);
      show("Có lỗi xảy ra khi cập nhật sản phẩm");
    } finally {
      setSaving(false);
    }
  }

  function handleInputChange(field: keyof ProductFormData, value: any) {
    setFormData((prev) => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: "" }));
    }
  }

  async function handleQuickStockUpdate(newStock: number) {
    try {
      await withLoading(async () => {
        const response = await fetch(`/api/admin/products/${productId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "update_stock", value: newStock }),
        });

        const result = await response.json();
        if (result.success) {
          setFormData((prev) => ({ ...prev, stock: newStock }));
          show("Đã cập nhật số lượng kho");
        } else {
          show("Không thể cập nhật kho");
        }
      }, "Đang cập nhật...");
    } catch (error) {
      console.error("Update stock error:", error);
      show("Có lỗi xảy ra");
    }
  }

  if (loading) {
    return (
      <AdminLayout
        title="Chỉnh sửa sản phẩm"
        description="Cập nhật thông tin sản phẩm"
      >
        <div className="flex items-center justify-center h-64">
          <LoadingSpinner size="lg" />
        </div>
      </AdminLayout>
    );
  }

  if (!product) {
    return (
      <AdminLayout
        title="Chỉnh sửa sản phẩm"
        description="Cập nhật thông tin sản phẩm"
      >
        <div className="text-center py-12">
          <p className="text-gray-500 dark:text-gray-400">
            Không tìm thấy sản phẩm
          </p>
        </div>
      </AdminLayout>
    );
  }

  async function syncStock() {
    try {
      const res = await fetch(`/api/admin/products/${productId}/sync-stock`, {
        method: "POST",
      });
      const data = await res.json();
      if (data.success) {
        show("Đồng bộ kho thành công");
        setFormData((prev) => ({
          ...prev,
          stock: data.data.stock,
          price: data.data.price ?? prev.price,
        }));
      } else {
        show(data.error || "Không thể đồng bộ kho");
      }
    } catch (e) {
      show("Có lỗi xảy ra khi đồng bộ kho");
    }
  }

  return (
    <AdminLayout
      title="Chỉnh sửa sản phẩm"
      description="Cập nhật thông tin sản phẩm"
    >
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold">Thông tin sản phẩm</h2>
          <div className="flex gap-2">
            <button
              onClick={syncStock}
              className="rounded-md border px-3 py-1.5 text-sm cursor-pointer"
            >
              Đồng bộ kho
            </button>
          </div>
        </div>

        <form
          onSubmit={handleSubmit}
          className="grid grid-cols-1 md:grid-cols-2 gap-6"
        >
          {/* Left */}
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium">Tên sản phẩm</label>
              <input
                value={formData.title}
                onChange={(e) => handleInputChange("title", e.target.value)}
                className="mt-1 w-full border rounded-md px-3 py-2"
              />
              {errors.title && (
                <p className="text-sm text-red-600 mt-1">{errors.title}</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium">Mô tả ngắn *</label>
              <input
                type="text"
                value={formData.description}
                onChange={(e) =>
                  handleInputChange("description", e.target.value)
                }
                className="mt-1 w-full border rounded-md px-3 py-2"
                placeholder="Mô tả ngắn gọn về sản phẩm"
              />
              {errors.description && (
                <p className="text-sm text-red-600 mt-1">
                  {errors.description}
                </p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium">
                Mô tả chi tiết
              </label>
              <textarea
                value={formData.longDescription}
                onChange={(e) =>
                  handleInputChange("longDescription", e.target.value)
                }
                rows={6}
                className="mt-1 w-full border rounded-md px-3 py-2 font-mono text-sm resize-y"
                placeholder="Mô tả chi tiết về sản phẩm, tính năng, lợi ích...&#10;&#10;Hỗ trợ xuống dòng và định dạng văn bản.&#10;Có thể copy-paste nội dung từ nguồn khác."
                style={{ minHeight: "120px" }}
              />
              {errors.longDescription && (
                <p className="text-sm text-red-600 mt-1">
                  {errors.longDescription}
                </p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium">Link gốc</label>
              <input
                type="url"
                value={formData.originalLink}
                onChange={(e) =>
                  handleInputChange("originalLink", e.target.value)
                }
                className={`mt-1 w-full border rounded-md px-3 py-2 ${
                  errors.originalLink ? "border-red-500" : "border-gray-300"
                }`}
                placeholder="https://example.com/product-source"
              />
              {errors.originalLink && (
                <p className="text-sm text-red-600 mt-1">
                  {errors.originalLink}
                </p>
              )}
              <p className="text-xs text-gray-500 mt-1">
                Link nguồn gốc của sản phẩm (tùy chọn)
              </p>
            </div>
            {/* Conditional Price & Stock - only when no options */}
            {(!formData.options || formData.options.length === 0) && (
              <>
                <div>
                  <label className="block text-sm font-medium">
                    Giá bán (VND) *
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
                    className="mt-1 w-full border rounded-md px-3 py-2"
                    placeholder="0"
                  />
                  {errors.price && (
                    <p className="text-sm text-red-600 mt-1">{errors.price}</p>
                  )}
                  <p className="text-xs text-gray-500 mt-1">
                    Chỉ cần thiết khi sản phẩm không có tùy chọn (options)
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium">
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
                    className="mt-1 w-full border rounded-md px-3 py-2"
                    placeholder="0"
                  />
                  {errors.stock && (
                    <p className="text-sm text-red-600 mt-1">{errors.stock}</p>
                  )}
                  <p className="text-xs text-gray-500 mt-1">
                    Chỉ cần thiết khi sản phẩm không có tùy chọn (options)
                  </p>
                </div>
              </>
            )}

            {/* Options Editor */}
            <div>
              <label className="block text-sm font-medium">
                Tùy chọn (Options)
              </label>
              <div className="mt-2">
                <OptionsEditor
                  value={formData.options}
                  onChange={(opts) => handleInputChange("options", opts)}
                />
                {errors.options && (
                  <p className="text-sm text-red-600 mt-1">{errors.options}</p>
                )}
              </div>
            </div>
          </div>

          {/* Right */}
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium">Danh mục</label>
              <CategorySelect
                value={formData.category}
                onChange={(slug) => handleInputChange("category", slug)}
              />
            </div>

            {/* Supplier markup */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium">
                  Giá gốc (TAPHOAMMO)
                </label>
                <input
                  type="number"
                  value={product?.supplier?.basePrice ?? 0}
                  onChange={(e) =>
                    setProduct((prev) =>
                      prev
                        ? {
                            ...prev,
                            supplier: {
                              ...prev.supplier,
                              basePrice: Number(e.target.value) || 0,
                            } as any,
                          }
                        : prev
                    )
                  }
                  className="mt-1 w-full border rounded-md px-3 py-2"
                />
              </div>
              <div>
                <label className="block text-sm font-medium">% lợi nhuận</label>
                <input
                  type="number"
                  value={product?.supplier?.markupPercent ?? 0}
                  onChange={(e) =>
                    setProduct((prev) =>
                      prev
                        ? {
                            ...prev,
                            supplier: {
                              ...prev.supplier,
                              markupPercent: Number(e.target.value) || 0,
                            } as any,
                          }
                        : prev
                    )
                  }
                  className="mt-1 w-full border rounded-md px-3 py-2"
                />
              </div>
              <div className="col-span-2 text-xs text-gray-500">
                Gợi ý giá bán = Giá gốc × (1 + % lợi nhuận). Bạn có thể chỉnh
                <div>
                  <label className="block text-sm font-medium">Đã bán</label>
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
                    className="mt-1 w-full border rounded-md px-3 py-2"
                    placeholder="0"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Số lượng sản phẩm đã bán (cập nhật thủ công).
                  </p>
                </div>
                tay ô Giá bán ở trái.
              </div>
            </div>

            <div className="flex items-center gap-3">
              <label className="text-sm font-medium">Hoạt động</label>
              <input
                type="checkbox"
                checked={formData.isActive}
                onChange={(e) =>
                  handleInputChange("isActive", e.target.checked)
                }
              />
            </div>

            <div className="pt-2">
              <LoadingButton type="submit" loading={saving}>
                Lưu thay đổi
              </LoadingButton>
            </div>
          </div>
        </form>
      </div>
    </AdminLayout>
  );
}

export default withAdminAuth(EditProduct);
