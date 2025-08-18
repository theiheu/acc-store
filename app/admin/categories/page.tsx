"use client";

import { useMemo, useState, useEffect } from "react";
import AdminLayout from "@/src/components/AdminLayout";
import {
  withAdminAuth,
  AdminPermissionGate,
} from "@/src/components/AdminAuthProvider";
import { useToastContext } from "@/src/components/ToastProvider";
import {
  useCategoryManagement,
  useCategorySearch,
} from "@/src/hooks/useCategories";
import { Category } from "@/src/services/CategoryService";
import FeaturedProductsSelector from "@/src/components/FeaturedProductsSelector";

function AdminCategoriesPage() {
  const { show } = useToastContext();
  const {
    categories: allCategories,
    isLoading: baseLoading,
    createCategory,
    updateCategory,
    deleteCategory,
  } = useCategoryManagement();

  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [isActive, setIsActive] = useState<string>("");
  const [loading, setLoading] = useState(true);

  // Use search hook for filtering
  const searchedCategories = useCategorySearch(allCategories, search);

  // Apply additional filters and pagination
  const categories = useMemo(() => {
    let filtered = searchedCategories;

    if (isActive) {
      const activeFilter = isActive === "true";
      filtered = filtered.filter((c) => c.isActive === activeFilter);
    }

    // Simple pagination (could be moved to server-side)
    const limit = 10;
    const start = (page - 1) * limit;
    const end = start + limit;

    setTotalPages(Math.ceil(filtered.length / limit));
    return filtered.slice(start, end);
  }, [searchedCategories, isActive, page]);

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Category | null>(null);
  const [form, setForm] = useState({
    name: "",
    description: "",
    icon: "🏷️",
    featuredProductIds: [] as string[],
    isActive: true,
  });
  const [saving, setSaving] = useState(false);

  // Update loading state based on hook
  useEffect(() => {
    setLoading(baseLoading);
  }, [baseLoading]);

  function openCreate() {
    setEditing(null);
    setForm({
      name: "",
      description: "",
      icon: "🏷️",
      featuredProductIds: [],
      isActive: true,
    });
    setModalOpen(true);
  }

  function openEdit(cat: Category) {
    setEditing(cat);
    setForm({
      name: cat.name,
      description: cat.description || "",
      icon: cat.icon || "🏷️",
      featuredProductIds: cat.featuredProductIds || [],
      isActive: cat.isActive,
    });
    setModalOpen(true);
  }

  async function submitForm(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name.trim()) {
      show("Tên danh mục không được trống");
      return;
    }
    try {
      setSaving(true);

      if (editing) {
        await updateCategory(editing.id, form);
        show("Đã cập nhật danh mục");
      } else {
        await createCategory(form);
        show("Đã tạo danh mục");
      }

      setModalOpen(false);
      setEditing(null);
      setForm({
        name: "",
        description: "",
        icon: "🏷️",
        featuredProductIds: [],
        isActive: true,
      });
    } catch (error) {
      show(error instanceof Error ? error.message : "Có lỗi khi lưu danh mục");
    } finally {
      setSaving(false);
    }
  }

  async function handleDeleteCategory(cat: Category) {
    if (
      !confirm(
        `Xóa danh mục '${cat.name}'? Sản phẩm thuộc danh mục này sẽ được chuyển sang 'Chưa phân loại'.`
      )
    )
      return;
    try {
      await deleteCategory(cat.id);
      show("Đã xóa danh mục");
    } catch (error) {
      show(error instanceof Error ? error.message : "Không thể xóa danh mục");
    }
  }

  return (
    <AdminLayout title="Danh mục" description="Quản lý danh mục sản phẩm">
      <div className="flex items-center justify-between mb-4">
        <div className="flex gap-2">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && setPage(1)}
            placeholder="Tìm theo tên hoặc slug"
            className="px-3 py-2 border rounded-md"
          />
          <select
            value={isActive}
            onChange={(e) => setIsActive(e.target.value)}
            className="px-3 py-2 border rounded-md"
          >
            <option value="">Tất cả</option>
            <option value="true">Hoạt động</option>
            <option value="false">Tạm dừng</option>
          </select>
          <button
            onClick={() => setPage(1)}
            className="px-3 py-2 border rounded-md cursor-pointer"
          >
            Lọc
          </button>
        </div>
        <AdminPermissionGate permission="canManageCategories">
          <button
            onClick={openCreate}
            className="px-4 py-2 bg-amber-300 text-gray-900 rounded-lg cursor-pointer"
          >
            Thêm danh mục mới
          </button>
        </AdminPermissionGate>
      </div>

      <div className="rounded-xl border bg-white dark:bg-gray-900">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left border-b">
              <th className="p-3">Tên</th>
              <th className="p-3">Slug</th>
              <th className="p-3">Mô tả</th>
              <th className="p-3">Trạng thái</th>
              <th className="p-3">Sản phẩm</th>
              <th className="p-3">Hành động</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td className="p-3" colSpan={6}>
                  Đang tải...
                </td>
              </tr>
            ) : categories.length === 0 ? (
              <tr>
                <td className="p-3" colSpan={6}>
                  Không có danh mục
                </td>
              </tr>
            ) : (
              categories.map((c) => (
                <tr
                  key={c.id}
                  className="border-b hover:bg-gray-50 dark:hover:bg-gray-800"
                >
                  <td className="p-3 font-medium">{c.name}</td>
                  <td className="p-3">{c.slug}</td>
                  <td className="p-3 text-gray-600 dark:text-gray-400">
                    {c.description}
                  </td>
                  <td className="p-3">
                    <span
                      className={`px-2 py-1 rounded-full text-xs ${
                        c.isActive
                          ? "bg-green-100 text-green-800"
                          : "bg-red-100 text-red-800"
                      }`}
                    >
                      {c.isActive ? "Hoạt động" : "Tạm dừng"}
                    </span>
                  </td>
                  <td className="p-3">0</td>
                  <td className="p-3">
                    <div className="flex gap-3">
                      <AdminPermissionGate permission="canManageCategories">
                        <a
                          href={`/categories/${encodeURIComponent(c.slug)}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600"
                        >
                          Xem trang
                        </a>
                        <button
                          onClick={() => openEdit(c)}
                          className="text-amber-700"
                        >
                          Sửa
                        </button>
                        {c.slug !== "uncategorized" && (
                          <button
                            onClick={() => handleDeleteCategory(c)}
                            className="text-red-600"
                          >
                            Xóa
                          </button>
                        )}
                      </AdminPermissionGate>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-center gap-2 mt-4">
        <button
          disabled={page <= 1}
          onClick={() => setPage((p) => Math.max(1, p - 1))}
          className="px-3 py-1 border rounded disabled:opacity-50 cursor-pointer"
        >
          Trước
        </button>
        <span>
          Trang {page}/{totalPages}
        </span>
        <button
          disabled={page >= totalPages}
          onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
          className="px-3 py-1 border rounded disabled:opacity-50 cursor-pointer"
        >
          Sau
        </button>
      </div>

      {/* Modal */}
      {modalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <form
            onSubmit={submitForm}
            className="bg-white dark:bg-gray-900 rounded-lg p-6 w-full max-w-md space-y-4"
          >
            <h3 className="text-lg font-semibold">
              {editing ? "Sửa danh mục" : "Thêm danh mục"}
            </h3>
            <div>
              <label className="block text-sm mb-1">Tên danh mục *</label>
              <input
                value={form.name ?? ""}
                onChange={(e) =>
                  setForm((f) => ({ ...f, name: e.target.value }))
                }
                className="w-full px-3 py-2 border rounded"
              />
            </div>
            <div>
              <label className="block text-sm mb-1">Mô tả</label>
              <textarea
                value={form.description ?? ""}
                onChange={(e) =>
                  setForm((f) => ({ ...f, description: e.target.value }))
                }
                className="w-full px-3 py-2 border rounded"
                rows={3}
              />
            </div>
            <div>
              <label className="block text-sm mb-1">Icon (Emoji)</label>
              <input
                value={form.icon ?? ""}
                onChange={(e) =>
                  setForm((f) => ({ ...f, icon: e.target.value }))
                }
                className="w-full px-3 py-2 border rounded"
                placeholder="🏷️"
              />
            </div>
            <div>
              <label className="block text-sm mb-1">
                Sản phẩm nổi bật (tùy chọn)
              </label>

              <FeaturedProductsSelector
                value={form.featuredProductIds}
                onChange={(ids) => {
                  setForm((f) => ({ ...f, featuredProductIds: ids }));
                }}
              />
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={form.isActive}
                onChange={(e) =>
                  setForm((f) => ({ ...f, isActive: e.target.checked }))
                }
              />
              <span>Kích hoạt</span>
            </div>
            <div className="flex items-center gap-3 justify-end pt-2">
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="px-4 py-2 border rounded cursor-pointer"
              >
                Hủy
              </button>
              <button
                disabled={saving}
                className="px-4 py-2 bg-amber-300 text-gray-900 rounded cursor-pointer"
              >
                {saving ? "Đang lưu..." : "Lưu"}
              </button>
            </div>
          </form>
        </div>
      )}
    </AdminLayout>
  );
}

export default withAdminAuth(AdminCategoriesPage);
