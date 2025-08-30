"use client";

import { useMemo, useState, useEffect, useRef } from "react";
import Image from "next/image";
import AdminLayout from "@/src/components/layout/AdminLayout";
import {
  withAdminAuth,
  AdminPermissionGate,
} from "@/src/components/providers/AdminAuthProvider";
import { useToastContext } from "@/src/components/providers/ToastProvider";
import {
  useCategoryManagement,
  useCategorySearch,
} from "@/src/hooks/useCategories";
import { Category } from "@/src/services/CategoryService";
import FeaturedProductsSelector from "@/src/components/forms/FeaturedProductsSelector";

function AdminCategoriesPage() {
  const { show } = useToastContext();
  const {
    categories: allCategories,
    isLoading: baseLoading,
    createCategory,
    updateCategory,
    deleteCategory,
    fetchCategories,
  } = useCategoryManagement();

  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [isActive, setIsActive] = useState<string>("");
  const [loading, setLoading] = useState(true);

  // Reorder state
  const [reorderMode, setReorderMode] = useState(false);
  const [ordered, setOrdered] = useState<Category[]>([]);
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [savingOrder, setSavingOrder] = useState(false);
  const prevOrderRef = useRef<string[]>([]);

  // Keep an ordered copy for reorder mode (sorted by sortOrder then name)
  useEffect(() => {
    const sorted = [...allCategories].sort((a, b) => {
      const ao = (a as any).sortOrder ?? Number.MAX_SAFE_INTEGER;
      const bo = (b as any).sortOrder ?? Number.MAX_SAFE_INTEGER;
      if (ao !== bo) return ao - bo;
      return a.name.localeCompare(b.name);
    });
    setOrdered(sorted);
  }, [allCategories]);

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
  const [uploadingIcon, setUploadingIcon] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Update loading state based on hook
  useEffect(() => {
    setLoading(baseLoading);
  }, [baseLoading]);

  function openCreate() {
    setEditing(null);
    setForm({
      name: "",
      description: "",
      icon: "",
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
      icon: cat.icon || "",
      featuredProductIds: cat.featuredProductIds || [],
      isActive: cat.isActive,
    });
    setModalOpen(true);
  }

  async function handleIconFileSelected(file: File) {
    setUploadError(null);
    const allowed = [
      "image/png",
      "image/jpeg",
      "image/jpg",
      "image/svg+xml",
      "image/webp",
    ];
    if (!allowed.includes(file.type)) {
      setUploadError("Định dạng không được hỗ trợ (PNG, JPG, SVG, WebP)");
      return;
    }
    if (file.size > 1_000_000) {
      setUploadError("Kích thước tệp vượt quá 1MB");
      return;
    }
    try {
      setUploadingIcon(true);
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/admin/categories/upload-icon", {
        method: "POST",
        body: fd,
      });
      const json = await res.json();
      if (!json.success) {
        throw new Error(json.error || "Tải lên thất bại");
      }
      setForm((f) => ({ ...f, icon: json.url as string }));
      show("Đã tải lên icon danh mục");
    } catch (e: any) {
      setUploadError(e?.message || "Tải lên thất bại");
    } finally {
      setUploadingIcon(false);
    }
  }

  function onIconInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) {
      void handleIconFileSelected(file);
      // reset value to allow re-select same file
      e.currentTarget.value = "";
    }
  }

  function onIconDrop(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file) void handleIconFileSelected(file);
  }

  function onIconDragOver(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault();
  }

  function removeIcon() {
    setForm((f) => ({ ...f, icon: "" }));
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
        icon: "",
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
            disabled={reorderMode}
          />
          <select
            value={isActive}
            onChange={(e) => setIsActive(e.target.value)}
            className="px-3 py-2 border rounded-md"
            disabled={reorderMode}
          >
            <option value="">Tất cả</option>
            <option value="true">Hoạt động</option>
            <option value="false">Tạm dừng</option>
          </select>
          <button
            onClick={() => setPage(1)}
            className="px-3 py-2 border rounded-md cursor-pointer"
            disabled={reorderMode}
          >
            Lọc
          </button>
        </div>
        <AdminPermissionGate permission="canManageCategories">
          <div className="flex gap-2">
            <button
              onClick={() => setReorderMode((v) => !v)}
              className={`px-4 py-2 rounded-lg cursor-pointer ${
                reorderMode
                  ? "bg-amber-500 text-white"
                  : "bg-amber-300 text-gray-900"
              }`}
            >
              {reorderMode ? "Thoát sắp xếp" : "Sắp xếp danh mục"}
            </button>
            <button
              onClick={openCreate}
              className="px-4 py-2 bg-amber-300 text-gray-900 rounded-lg cursor-pointer disabled:opacity-50"
              disabled={reorderMode}
            >
              Thêm danh mục mới
            </button>
          </div>
        </AdminPermissionGate>
      </div>

      {reorderMode ? (
        <div className="rounded-xl border bg-white dark:bg-gray-900 p-3">
          <div className="flex items-center justify-between mb-2">
            <div className="text-sm text-gray-600 dark:text-gray-400">
              Kéo thả để thay đổi thứ tự. Thứ tự sẽ được lưu tự động.
            </div>
            {savingOrder && (
              <div className="text-sm text-amber-600 animate-pulse">
                Đang lưu...
              </div>
            )}
          </div>
          <ul className="divide-y divide-gray-200 dark:divide-gray-800">
            {ordered.map((c) => (
              <li
                key={c.id}
                draggable
                onDragStart={() => {
                  prevOrderRef.current = ordered.map((x) => x.id);
                  setDraggingId(c.id);
                }}
                onDragOver={(e) => {
                  e.preventDefault();
                  if (!draggingId || draggingId === c.id) return;
                  const src = ordered.findIndex((x) => x.id === draggingId);
                  const dst = ordered.findIndex((x) => x.id === c.id);
                  if (src === -1 || dst === -1 || src === dst) return;
                  const next = [...ordered];
                  const [moved] = next.splice(src, 1);
                  next.splice(dst, 0, moved);
                  setOrdered(next);
                }}
                onDragEnd={async () => {
                  setDraggingId(null);
                  // Auto-save
                  try {
                    setSavingOrder(true);
                    const orderedIds = ordered.map((x) => x.id);
                    const res = await fetch("/api/admin/categories/reorder", {
                      method: "PUT",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({ orderedIds }),
                    });
                    const json = await res.json();
                    if (!json.success) {
                      throw new Error(json.error || "Không thể lưu thứ tự");
                    }
                    show("Đã lưu thứ tự danh mục");
                    // Refresh the categories list to be in sync with the backend
                    fetchCategories();
                  } catch (err) {
                    show(
                      err instanceof Error
                        ? err.message
                        : "Không thể lưu thứ tự"
                    );
                    // Revert UI
                    const prevIds = prevOrderRef.current;
                    if (prevIds?.length) {
                      const map = new Map(ordered.map((x) => [x.id, x]));
                      setOrdered(
                        prevIds.map((id) => map.get(id)!).filter(Boolean)
                      );
                    }
                  } finally {
                    setSavingOrder(false);
                  }
                }}
                className={`flex items-center gap-3 p-3 bg-white dark:bg-gray-900 transition-all ${
                  draggingId === c.id
                    ? "opacity-60 ring-2 ring-amber-300"
                    : "hover:bg-gray-50 dark:hover:bg-gray-800"
                }`}
              >
                <span className="cursor-grab select-none">≡</span>
                {typeof c.icon === "string" &&
                (c.icon.startsWith("/") || c.icon.startsWith("http")) ? (
                  <Image
                    src={c.icon}
                    alt={c.name}
                    width={24}
                    height={24}
                    className="h-6 w-6 rounded object-contain bg-white dark:bg-gray-900 border"
                  />
                ) : (
                  <span className="text-xl leading-none">{c.icon || "🏷️"}</span>
                )}
                <div className="flex-1">
                  <div className="font-medium">{c.name}</div>
                  <div className="text-xs text-gray-500">{c.slug}</div>
                </div>
                <span
                  className={`px-2 py-1 rounded-full text-xs ${
                    c.isActive
                      ? "bg-green-100 text-green-800"
                      : "bg-red-100 text-red-800"
                  }`}
                >
                  {c.isActive ? "Hoạt động" : "Tạm dừng"}
                </span>
              </li>
            ))}
          </ul>
        </div>
      ) : (
        <>
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
                      <td className="p-3 font-medium">
                        <div className="flex items-center gap-2">
                          {typeof c.icon === "string" &&
                          (c.icon.startsWith("/") ||
                            c.icon.startsWith("http")) ? (
                            <Image
                              src={c.icon}
                              alt={c.name}
                              width={24}
                              height={24}
                              className="h-6 w-6 rounded object-contain bg-white dark:bg-gray-900 border"
                            />
                          ) : (
                            <span className="text-lg leading-none">
                              {c.icon || "🏷️"}
                            </span>
                          )}
                          <span>{c.name}</span>
                        </div>
                      </td>
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
        </>
      )}

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
              <label className="block text-sm mb-1">Icon danh mục</label>
              <div
                onDrop={onIconDrop}
                onDragOver={onIconDragOver}
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed rounded-md p-3 cursor-pointer bg-gray-50 dark:bg-gray-900/50 hover:bg-gray-100 dark:hover:bg-gray-800/70 text-sm flex items-center gap-3"
                title="Kéo & thả hoặc nhấn để chọn ảnh"
              >
                {form.icon &&
                (form.icon.startsWith("/") || form.icon.startsWith("http")) ? (
                  <Image
                    src={form.icon}
                    alt="Preview"
                    width={40}
                    height={40}
                    className="h-10 w-10 rounded object-contain bg-white dark:bg-gray-900 border"
                  />
                ) : (
                  <div className="h-10 w-10 rounded flex items-center justify-center bg-white dark:bg-gray-900 border">
                    <span className="text-xl">🏷️</span>
                  </div>
                )}
                <div className="flex-1">
                  <div className="text-gray-700 dark:text-gray-300">
                    Kéo & thả ảnh vào đây hoặc nhấn để chọn
                  </div>
                  <div className="text-xs text-gray-500">
                    Hỗ trợ PNG, JPG, SVG, WebP. Tối đa 1MB.
                  </div>
                </div>
                {uploadingIcon && (
                  <div className="text-amber-600 animate-pulse">
                    Đang tải...
                  </div>
                )}
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/png,image/jpeg,image/jpg,image/svg+xml,image/webp"
                className="hidden"
                onChange={onIconInputChange}
              />
              {uploadError && (
                <div className="text-red-600 text-sm mt-1">{uploadError}</div>
              )}
              <div className="flex items-center gap-2 mt-2">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="px-3 py-1.5 border rounded cursor-pointer"
                >
                  Chọn hình ảnh
                </button>
                {form.icon && (
                  <button
                    type="button"
                    onClick={removeIcon}
                    className="px-3 py-1.5 border rounded text-red-600 cursor-pointer"
                  >
                    Xóa icon
                  </button>
                )}
              </div>
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
