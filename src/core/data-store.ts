// Shared data store for both admin and public pages
// This replaces mock data with a centralized, synchronized data layer

import {
  AdminUser,
  UserTransaction,
  AdminProduct,
  ActivityLog,
  TopupRequest,
} from "./admin";
import { Product, products } from "./products";
import { User } from "./auth";
import { Category } from "./categories";
import { slugify } from "@/src/utils/slug";

// Server-only persistence utilities (guarded to avoid bundling issues on client)
const __isServer = typeof window === "undefined";
let __fs: any = null as any;
let __path: any = null as any;
if (__isServer) {
  // Use eval to avoid client bundlers trying to resolve Node built-ins
  const __req = eval("require");
  __fs = __req("fs");
  __path = __req("path");
}

// Event system for real-time updates
type DataStoreEvent =
  | { type: "USER_UPDATED"; payload: AdminUser }
  | { type: "USER_CREATED"; payload: AdminUser }
  | {
      type: "USER_BALANCE_CHANGED";
      payload: { userId: string; newBalance: number };
    }
  | { type: "PRODUCT_UPDATED"; payload: AdminProduct }
  | { type: "PRODUCT_CREATED"; payload: AdminProduct }
  | { type: "PRODUCT_DELETED"; payload: { productId: string } }
  | { type: "TRANSACTION_CREATED"; payload: UserTransaction }
  | { type: "TOPUP_REQUEST_CREATED"; payload: TopupRequest }
  | { type: "TOPUP_REQUEST_UPDATED"; payload: TopupRequest }
  | { type: "TOPUP_REQUEST_PROCESSED"; payload: TopupRequest }
  | { type: "ORDER_CREATED"; payload: import("./admin").Order }
  | { type: "ORDER_UPDATED"; payload: import("./admin").Order };

type EventListener = (event: DataStoreEvent) => void;

class DataStore {
  private users: Map<string, AdminUser> = new Map();
  private products: Map<string, AdminProduct> = new Map();
  private transactions: Map<string, UserTransaction> = new Map();
  private topupRequests: Map<string, TopupRequest> = new Map();
  private activities: ActivityLog[] = [];
  private categories: Map<string, Category> = new Map();
  private listeners: EventListener[] = [];
  // Orders are persisted in a separate file; basic in-memory map for now
  private orders: Map<string, import("./admin").Order> = new Map();

  // === Persistence (server-only) ===
  private baseDir = __isServer ? __path.join(process.cwd(), ".data") : "";
  private files = {
    users: __isServer ? __path.join(this.baseDir, "users.json") : "",
    products: __isServer ? __path.join(this.baseDir, "products.json") : "",
    transactions: __isServer
      ? __path.join(this.baseDir, "transactions.json")
      : "",
    topups: __isServer ? __path.join(this.baseDir, "topups.json") : "",
    activities: __isServer ? __path.join(this.baseDir, "activities.json") : "",
    orders: __isServer ? __path.join(this.baseDir, "orders.json") : "",
    categories: __isServer ? __path.join(this.baseDir, "categories.json") : "",
  };

  private saveTimer: any = null;
  private scheduleSave() {
    if (!__isServer) return;
    if (this.saveTimer) clearTimeout(this.saveTimer);
    this.saveTimer = setTimeout(() => this.persistAllSafe(), 200);
  }

  private ensureDir() {
    if (!__isServer) return;
    if (!__fs.existsSync(this.baseDir)) {
      __fs.mkdirSync(this.baseDir, { recursive: true });
    }
  }

  private persistAllSafe() {
    try {
      this.ensureDir();
      const toJSON = (v: any) =>
        JSON.stringify(v, (key, value) => {
          if (value instanceof Date) return value.toISOString();
          return value;
        });
      __fs.writeFileSync(
        this.files.users,
        toJSON(Array.from(this.users.values())),
        "utf-8"
      );

      const productsArray = Array.from(this.products.values());
      console.log("DataStore: Persisting", productsArray.length, "products");
      console.log(
        "DataStore: Products categories:",
        productsArray.map((p) => ({
          id: p.id,
          title: p.title,
          category: p.category,
          isActive: p.isActive,
        }))
      );

      __fs.writeFileSync(this.files.products, toJSON(productsArray), "utf-8");
      __fs.writeFileSync(
        this.files.transactions,
        toJSON(Array.from(this.transactions.values())),
        "utf-8"
      );
      __fs.writeFileSync(
        this.files.topups,
        toJSON(Array.from(this.topupRequests.values())),
        "utf-8"
      );
      __fs.writeFileSync(
        this.files.activities,
        toJSON(this.activities),
        "utf-8"
      );
      __fs.writeFileSync(
        this.files.orders,
        toJSON(Array.from(this.orders.values())),
        "utf-8"
      );
      __fs.writeFileSync(
        this.files.categories,
        toJSON(Array.from(this.categories.values())),
        "utf-8"
      );
    } catch (e) {
      console.error("Persist error:", e);
    }
  }

  private loadAllSafe() {
    if (!__isServer) return;
    try {
      this.ensureDir();
      const parseJSON = (file: string) => {
        if (!__fs.existsSync(file)) return null;
        const raw = __fs.readFileSync(file, "utf-8");
        return JSON.parse(raw);
      };

      const reviveDates = (obj: any) => {
        if (!obj || typeof obj !== "object") return obj;
        for (const k of Object.keys(obj)) {
          const v = (obj as any)[k];
          if (typeof v === "string" && /\d{4}-\d{2}-\d{2}T/.test(v)) {
            const d = new Date(v);
            if (!isNaN(d.getTime())) (obj as any)[k] = d;
          } else if (v && typeof v === "object") reviveDates(v);
        }
        return obj;
      };

      const users = parseJSON(this.files.users);
      if (Array.isArray(users)) {
        users.forEach((u) => {
          reviveDates(u);
          this.users.set(u.id, u);
        });
      }

      const products = parseJSON(this.files.products);
      if (Array.isArray(products)) {
        products.forEach((p) => {
          reviveDates(p);
          this.products.set(p.id, p);
        });
      }

      const transactions = parseJSON(this.files.transactions);
      if (Array.isArray(transactions)) {
        transactions.forEach((t) => {
          reviveDates(t);
          this.transactions.set(t.id, t);
        });
      }

      const topups = parseJSON(this.files.topups);
      if (Array.isArray(topups)) {
        topups.forEach((r) => {
          reviveDates(r);
          this.topupRequests.set(r.id, r);
        });
      }

      const activities = parseJSON(this.files.activities);
      if (Array.isArray(activities)) {
        activities.forEach((a) => reviveDates(a));
        this.activities = activities;
      }

      const orders = parseJSON(this.files.orders);
      if (Array.isArray(orders)) {
        orders.forEach((o) => {
          reviveDates(o);
          this.orders.set(o.id, o);
        });
      }

      const categories = parseJSON(this.files.categories);
      if (Array.isArray(categories)) {
        categories.forEach((c) => {
          reviveDates(c);
          this.categories.set(c.id, c);
        });
      }
    } catch (e) {
      console.error("Load persisted data error:", e);
    }
  }

  constructor() {
    // Load persisted data first; if first run (no products), seed catalog
    this.loadAllSafe();
    if (this.products.size === 0) {
      this.initializeData();
      this.scheduleSave();
    }
  }

  // Event system
  subscribe(listener: EventListener): () => void {
    this.listeners.push(listener);
    return () => {
      const index = this.listeners.indexOf(listener);
      if (index > -1) {
        this.listeners.splice(index, 1);
      }
    };
  }

  private emit(event: DataStoreEvent) {
    this.listeners.forEach((listener) => {
      try {
        listener(event);
      } catch (error) {
        console.error("Error in data store listener:", error);
      }
    });
  }

  // Initialize with real homepage products only
  private initializeData() {
    // Seed default categories (including uncategorized)
    const defaultCategories: Array<
      Omit<Category, "id" | "createdAt" | "updatedAt">
    > = [
      {
        name: "Gaming",
        slug: "gaming",
        description: "Tài khoản Gaming",
        isActive: true,
      },
      {
        name: "Social",
        slug: "social",
        description: "Tài khoản Social Media",
        isActive: true,
      },
      {
        name: "Productivity",
        slug: "productivity",
        description: "Tài khoản Productivity",
        isActive: true,
      },
      {
        name: "Chưa phân loại",
        slug: "uncategorized",
        description: "Danh mục mặc định",
        isActive: true,
      },
    ];

    defaultCategories.forEach((c) => {
      const now = new Date();
      const id = `cat-${c.slug}`;
      this.categories.set(id, {
        id,
        name: c.name,
        slug: c.slug,
        description: c.description,
        isActive: c.isActive,
        createdAt: now,
        updatedAt: now,
      });
    });
    // Load existing users from file first
    this.loadUsersFromFile();

    // Initialize products from the real homepage product catalog
    products.forEach((product: Product) => {
      const adminProduct: AdminProduct = {
        ...product,
        // Set realistic initial values instead of random
        stock: 100, // Default stock level
        sold: 0, // Start with no sales
        isActive: true, // All homepage products are active by default
        createdAt: new Date(), // Current date for new initialization
        updatedAt: new Date(),
        createdBy: "system", // System initialization
        lastModifiedBy: "system",
      };
      this.products.set(product.id, adminProduct);
    });

    // No initial users - they will be created through real authentication
    // No initial transactions - they will be created through real operations
    // No initial activities - they will be logged through real admin actions
  }

  // Public method to ensure products & categories are loaded (for client-side initialization)
  ensureProductsLoaded(): void {
    if (this.products.size === 0) {
      this.initializeData();
    }
    // Ensure categories exist even if products are loaded from persistence without categories
    if (this.categories.size === 0) {
      // Seed default categories without touching products
      const defaults: Array<Omit<Category, "id" | "createdAt" | "updatedAt">> =
        [
          {
            name: "Gaming",
            slug: "gaming",
            description: "Tài khoản Gaming",
            isActive: true,
          },
          {
            name: "Social",
            slug: "social",
            description: "Tài khoản Social Media",
            isActive: true,
          },
          {
            name: "Productivity",
            slug: "productivity",
            description: "Tài khoản Productivity",
            isActive: true,
          },
          {
            name: "Chưa phân loại",
            slug: "uncategorized",
            description: "Danh mục mặc định",
            isActive: true,
          },
        ];
      defaults.forEach((c) => {
        const now = new Date();
        const id = `cat-${c.slug}`;
        this.categories.set(id, {
          id,
          name: c.name,
          slug: c.slug,
          description: c.description,
          isActive: c.isActive,
          createdAt: now,
          updatedAt: now,
        });
      });
      this.scheduleSave();
    }
  }

  // User operations
  getUsers(): AdminUser[] {
    return Array.from(this.users.values());
  }

  getUser(id: string): AdminUser | null {
    return this.users.get(id) || null;
  }

  getUserByEmail(email: string): AdminUser | null {
    return (
      Array.from(this.users.values()).find((user) => user.email === email) ||
      null
    );
  }

  createUser(
    userData: Omit<AdminUser, "id" | "createdAt" | "updatedAt">
  ): AdminUser {
    const user: AdminUser = {
      ...userData,
      id: `user-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    this.users.set(user.id, user);

    // Log activity
    this.logActivity({
      adminId: "system",
      adminName: "System",
      action: "Tạo người dùng mới",
      targetType: "user",
      targetId: user.id,
      description: `Người dùng mới đăng ký: ${user.email}`,
    });

    this.emit({ type: "USER_CREATED", payload: user });

    // Persist
    this.scheduleSave();

    return user;
  }

  updateUser(
    id: string,
    updates: Partial<AdminUser>,
    adminId?: string,
    adminName?: string
  ): AdminUser | null {
    const user = this.users.get(id);
    if (!user) return null;

    const updatedUser: AdminUser = {
      ...user,
      ...updates,
      updatedAt: new Date(),
    };

    this.users.set(id, updatedUser);

    // Log activity for significant changes
    if (updates.balance !== undefined && updates.balance !== user.balance) {
      const balanceChange = updates.balance - user.balance;
      this.logActivity({
        adminId: adminId || "system",
        adminName: adminName || "System",
        action:
          balanceChange > 0 ? "Nạp tiền cho người dùng" : "Trừ tiền người dùng",
        targetType: "user",
        targetId: id,
        description: `${balanceChange > 0 ? "Nạp" : "Trừ"} ${Math.abs(
          balanceChange
        ).toLocaleString("vi-VN")} ₫ cho ${user.email}`,
      });

      this.emit({
        type: "USER_BALANCE_CHANGED",
        payload: { userId: id, newBalance: updates.balance },
      });
    }

    if (updates.status && updates.status !== user.status) {
      this.logActivity({
        adminId: adminId || "system",
        adminName: adminName || "System",
        action: "Cập nhật trạng thái người dùng",
        targetType: "user",
        targetId: id,
        description: `Thay đổi trạng thái ${user.email} từ ${user.status} thành ${updates.status}`,
      });
    }

    this.emit({ type: "USER_UPDATED", payload: updatedUser });

    // Persist changes
    this.scheduleSave();

    return updatedUser;
  }

  deleteUser(id: string): boolean {
    return this.users.delete(id);
  }

  // Get recent user registrations (useful for admin dashboard)
  getRecentUsers(limit: number = 10): AdminUser[] {
    return Array.from(this.users.values())
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      .slice(0, limit);
  }

  // Debug method to list all users
  debugListAllUsers(): void {
    console.log("=== All Users in DataStore ===");
    Array.from(this.users.values()).forEach((user) => {
      console.log(
        `ID: ${user.id}, Email: ${user.email}, Name: ${user.name}, Balance: ${user.balance}`
      );
    });
    console.log("=== End User List ===");
  }

  // Activity logging methods
  logActivity(activity: Omit<ActivityLog, "id" | "createdAt">): ActivityLog {
    const newActivity: ActivityLog = {
      ...activity,
      id: `activity-${Date.now()}-${Math.random()
        .toString(36)
        .substring(2, 11)}`,
      createdAt: new Date(),
    };

    this.activities.unshift(newActivity); // Add to beginning

    // Keep only last 1000 activities to prevent memory issues
    if (this.activities.length > 1000) {
      this.activities = this.activities.slice(0, 1000);
    }

    // Persist
    this.scheduleSave();

    return newActivity;
  }

  getRecentActivity(limit: number = 10): ActivityLog[] {
    return this.activities.slice(0, limit);
  }

  // Analytics methods for real dashboard statistics
  getRevenueData(
    days: number = 30
  ): Array<{ date: string; revenue: number; orders: number }> {
    const data = [];
    const transactions = Array.from(this.transactions.values());

    for (let i = days - 1; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split("T")[0];

      // Filter transactions for this date
      const dayTransactions = transactions.filter((tx) => {
        const txDate = new Date(tx.createdAt).toISOString().split("T")[0];
        return (
          txDate === dateStr && (tx.type === "purchase" || tx.type === "debit")
        );
      });

      const revenue = dayTransactions.reduce((sum, tx) => sum + tx.amount, 0);
      const orders = dayTransactions.filter(
        (tx) => tx.type === "purchase"
      ).length;

      data.push({
        date: dateStr,
        revenue,
        orders,
      });
    }

    return data;
  }

  getUserGrowthData(
    days: number = 30
  ): Array<{ date: string; newUsers: number; totalUsers: number }> {
    const data = [];
    const users = Array.from(this.users.values());

    for (let i = days - 1; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split("T")[0];

      // Count new users for this date
      const newUsers = users.filter((user) => {
        const userDate = new Date(user.createdAt).toISOString().split("T")[0];
        return userDate === dateStr;
      }).length;

      // Count total users up to this date
      const totalUsers = users.filter((user) => {
        return new Date(user.createdAt) <= date;
      }).length;

      data.push({
        date: dateStr,
        newUsers,
        totalUsers,
      });
    }

    return data;
  }

  // Category operations
  getCategories(): Category[] {
    return Array.from(this.categories.values()).sort(
      (a, b) => b.createdAt.getTime() - a.createdAt.getTime()
    );
  }

  getActiveCategories(): Category[] {
    return this.getCategories().filter((c) => c.isActive);
  }

  getCategoryById(id: string): Category | null {
    return this.categories.get(id) || null;
  }

  getCategoryBySlug(slug: string): Category | null {
    const s = slugify(slug);
    return this.getCategories().find((c) => c.slug === s) || null;
  }

  createCategory(
    data: Omit<Category, "id" | "slug" | "createdAt" | "updatedAt">
  ): Category {
    const name = data.name?.trim();
    if (!name) throw new Error("Tên danh mục không được trống");

    const slug = slugify(name);
    // Unique slug validation
    if (this.getCategoryBySlug(slug)) {
      throw new Error("Slug đã tồn tại");
    }

    const now = new Date();
    const category: Category = {
      id: `cat-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
      name,
      slug,
      description: data.description || "",
      icon: data.icon || "🏷️",
      featuredProductIds: Array.isArray(data.featuredProductIds)
        ? data.featuredProductIds
        : [],
      isActive: data.isActive ?? true,
      createdAt: now,
      updatedAt: now,
    };

    this.categories.set(category.id, category);

    // Activity log
    this.logActivity({
      adminId: "system",
      adminName: "System",
      action: "Tạo danh mục",
      targetType: "system",
      targetId: category.id,
      description: `Tạo danh mục: ${category.name}`,
    });

    // Emit event for real-time updates
    console.log(
      "DataStore: Emitting CATEGORY_CREATED event for:",
      category.name
    );
    this.emit({ type: "CATEGORY_CREATED", payload: category });

    this.scheduleSave();
    return category;
  }

  updateCategory(id: string, updates: Partial<Category>): Category | null {
    const existing = this.categories.get(id);
    if (!existing) {
      console.log("DataStore: updateCategory - category not found:", id);
      return null;
    }

    console.log(
      "DataStore: updateCategory - updating category:",
      existing.name,
      "with:",
      updates
    );

    let slug = existing.slug;
    if (
      updates.name &&
      updates.name.trim() &&
      updates.name.trim() !== existing.name
    ) {
      const newSlug = slugify(updates.name.trim());
      // Ensure uniqueness if slug changes
      if (newSlug !== existing.slug && this.getCategoryBySlug(newSlug)) {
        throw new Error("Slug đã tồn tại");
      }
      slug = newSlug;
    }

    const updated: Category = {
      ...existing,
      ...updates,
      // Preserve fields when undefined is passed from API
      icon: updates.icon ?? existing.icon,
      isActive: updates.isActive ?? existing.isActive,
      description: updates.description ?? existing.description,
      featuredProductIds: Array.isArray(updates.featuredProductIds)
        ? updates.featuredProductIds
        : existing.featuredProductIds,
      slug,
      updatedAt: new Date(),
    };

    this.categories.set(id, updated);

    this.logActivity({
      adminId: "system",
      adminName: "System",
      action: "Cập nhật danh mục",
      targetType: "system",
      targetId: id,
      description: `Cập nhật danh mục: ${updated.name}`,
    });

    // Emit event for real-time updates
    console.log(
      "DataStore: Emitting CATEGORY_UPDATED event for:",
      updated.name
    );
    this.emit({ type: "CATEGORY_UPDATED", payload: updated });

    this.scheduleSave();
    return updated;
  }

  deleteCategory(id: string): boolean {
    const existing = this.categories.get(id);
    if (!existing) return false;

    // Prevent deleting default 'uncategorized'
    if (existing.slug === "uncategorized") {
      throw new Error("Không thể xóa danh mục mặc định");
    }

    // Reassign products in this category to 'uncategorized'
    const fallback = this.getCategoryBySlug("uncategorized");
    const fallbackSlug = fallback?.slug || "uncategorized";
    Array.from(this.products.values()).forEach((p) => {
      if (slugify(p.category) === existing.slug) {
        p.category = fallbackSlug as any;
      }
    });

    const ok = this.categories.delete(id);
    if (ok) {
      this.logActivity({
        adminId: "system",
        adminName: "System",
        action: "Xóa danh mục",
        targetType: "system",
        targetId: id,
        description: `Xóa danh mục: ${existing.name}`,
      });

      // Emit event for real-time updates
      console.log(
        "DataStore: Emitting CATEGORY_DELETED event for:",
        existing.name
      );
      this.emit({ type: "CATEGORY_DELETED", payload: existing });

      this.scheduleSave();
    }
    return ok;
  }

  // Product operations
  getProducts(): AdminProduct[] {
    return Array.from(this.products.values());
  }

  getActiveProducts(): AdminProduct[] {
    // Treat undefined as active for backward compatibility with older persisted data
    return Array.from(this.products.values()).filter(
      (product) => product.isActive !== false
    );
  }

  getProduct(id: string): AdminProduct | null {
    return this.products.get(id) || null;
  }

  createProduct(
    productData: Omit<AdminProduct, "id" | "createdAt" | "updatedAt">,
    adminId?: string,
    adminName?: string
  ): AdminProduct {
    const product: AdminProduct = {
      ...productData,
      id: `product-${Date.now()}-${Math.random()
        .toString(36)
        .substring(2, 11)}`,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    this.products.set(product.id, product);

    // Log activity
    this.logActivity({
      adminId: adminId || "system",
      adminName: adminName || "System",
      action: "Tạo sản phẩm mới",
      targetType: "product",
      targetId: product.id,
      description: `Đã tạo sản phẩm: ${product.title}`,
    });

    this.emit({ type: "PRODUCT_CREATED", payload: product });

    // Persist
    this.scheduleSave();

    return product;
  }

  updateProduct(
    id: string,
    updates: Partial<AdminProduct>,
    adminId?: string,
    adminName?: string
  ): AdminProduct | null {
    const product = this.products.get(id);
    if (!product) return null;

    const updatedProduct: AdminProduct = {
      ...product,
      ...updates,
      updatedAt: new Date(),
    };

    this.products.set(id, updatedProduct);

    // Log activity for significant changes
    const changes = [];
    if (updates.price !== undefined && updates.price !== product.price) {
      changes.push(
        `giá từ ${product.price.toLocaleString(
          "vi-VN"
        )} ₫ thành ${updates.price.toLocaleString("vi-VN")} ₫`
      );
    }
    if (updates.stock !== undefined && updates.stock !== product.stock) {
      changes.push(`kho từ ${product.stock} thành ${updates.stock}`);
    }
    if (
      updates.isActive !== undefined &&
      updates.isActive !== product.isActive
    ) {
      changes.push(
        `trạng thái thành ${updates.isActive ? "hoạt động" : "tạm dừng"}`
      );
    }
    if (
      updates.category !== undefined &&
      updates.category !== product.category
    ) {
      changes.push(
        `danh mục từ "${product.category}" thành "${updates.category}"`
      );
    }
    if (updates.title !== undefined && updates.title !== product.title) {
      changes.push(`tên từ "${product.title}" thành "${updates.title}"`);
    }

    if (changes.length > 0) {
      this.logActivity({
        adminId: adminId || "system",
        adminName: adminName || "System",
        action: "Cập nhật sản phẩm",
        targetType: "product",
        targetId: id,
        description: `Cập nhật ${product.title}: ${changes.join(", ")}`,
      });
    }

    console.log(
      "DataStore: Emitting PRODUCT_UPDATED event for:",
      updatedProduct.title,
      "category:",
      updatedProduct.category
    );
    this.emit({ type: "PRODUCT_UPDATED", payload: updatedProduct });

    // Persist
    this.scheduleSave();

    return updatedProduct;
  }

  deleteProduct(id: string, adminId?: string, adminName?: string): boolean {
    const product = this.products.get(id);
    const deleted = this.products.delete(id);

    if (deleted && product) {
      // Log activity
      this.logActivity({
        adminId: adminId || "system",
        adminName: adminName || "System",
        action: "Xóa sản phẩm",
        targetType: "product",
        targetId: id,
        description: `Đã xóa sản phẩm: ${product.title}`,
      });

      this.emit({ type: "PRODUCT_DELETED", payload: { productId: id } });
    }
    return deleted;
  }

  // Transaction operations
  getTransactions(): UserTransaction[] {
    return Array.from(this.transactions.values());
  }

  getUserTransactions(userId: string): UserTransaction[] {
    return Array.from(this.transactions.values())
      .filter((tx) => tx.userId === userId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  // Top-up request operations
  createTopupRequest(
    requestData: Omit<TopupRequest, "id" | "createdAt">
  ): TopupRequest {
    const request: TopupRequest = {
      ...requestData,
      id: `topup-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`,
      createdAt: new Date(),
    };

    this.topupRequests.set(request.id, request);

    // Log activity
    this.logActivity({
      adminId: "system",
      adminName: "System",
      action: "Yêu cầu nạp tiền mới",
      targetType: "topup-request",
      targetId: request.id,
      description: `${
        request.userName
      } yêu cầu nạp ${request.requestedAmount.toLocaleString("vi-VN")} ₫`,
    });

    this.emit({ type: "TOPUP_REQUEST_CREATED", payload: request });

    // Persist
    this.scheduleSave();

    return request;
  }

  getTopupRequests(): TopupRequest[] {
    return Array.from(this.topupRequests.values()).sort(
      (a, b) => b.createdAt.getTime() - a.createdAt.getTime()
    );
  }

  getPendingTopupRequests(): TopupRequest[] {
    return Array.from(this.topupRequests.values())
      .filter((req) => req.status === "pending")
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  getUserTopupRequests(userId: string): TopupRequest[] {
    return Array.from(this.topupRequests.values())
      .filter((req) => req.userId === userId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  getTopupRequest(id: string): TopupRequest | null {
    return this.topupRequests.get(id) || null;
  }

  updateTopupRequest(
    id: string,
    updates: Partial<TopupRequest>
  ): TopupRequest | null {
    const request = this.topupRequests.get(id);
    if (!request) return null;

    const updatedRequest: TopupRequest = {
      ...request,
      ...updates,
    };

    this.topupRequests.set(id, updatedRequest);
    this.emit({ type: "TOPUP_REQUEST_UPDATED", payload: updatedRequest });

    // Persist
    this.scheduleSave();
    return updatedRequest;
  }

  processTopupRequest(
    requestId: string,
    action: "approve" | "reject",
    adminId: string,
    adminName: string,
    options: {
      approvedAmount?: number;
      adminNotes?: string;
      rejectionReason?: string;
    } = {}
  ): { request: TopupRequest | null; transaction?: UserTransaction } {
    const request = this.topupRequests.get(requestId);
    if (!request || request.status !== "pending") {
      return { request: null };
    }

    const processedAt = new Date();
    let transaction: UserTransaction | undefined;

    if (action === "approve") {
      const approvedAmount = options.approvedAmount || request.requestedAmount;

      // Update user balance (with fallback if user map reset)
      let user = this.users.get(request.userId);
      if (!user) {
        // Try resolve by email
        const byEmail = this.getUserByEmail(request.userEmail);
        if (byEmail) {
          request.userId = byEmail.id; // fix stale userId in request
          user = byEmail;
        } else {
          // Create a minimal user record to ensure credit is applied
          user = this.createUser({
            email: request.userEmail,
            name: request.userName,
            role: "user",
            status: "active",
            balance: 0,
            totalOrders: 0,
            totalSpent: 0,
            registrationSource: "topup-approve-fallback",
          });
          request.userId = user.id;
        }
      }

      const newBalance = user.balance + approvedAmount;
      this.updateUser(
        request.userId,
        { balance: newBalance },
        adminId,
        adminName
      );

      // Create transaction record
      transaction = this.createTransaction({
        userId: request.userId,
        type: "credit",
        amount: approvedAmount,
        description: `Nạp tiền theo yêu cầu: ${
          request.userNotes || "Không có ghi chú"
        }`,
        adminId,
        metadata: {
          topupRequestId: requestId,
          requestedAmount: request.requestedAmount,
          approvedAmount,
          adminNotes: options.adminNotes,
        },
      });

      // Update request status
      const updatedRequest = this.updateTopupRequest(requestId, {
        status: "approved",
        processedAt,
        processedBy: adminId,
        processedByName: adminName,
        approvedAmount: options.approvedAmount || request.requestedAmount,
        adminNotes: options.adminNotes,
        transactionId: transaction?.id,
      });

      // Log activity
      this.logActivity({
        adminId,
        adminName,
        action: "Duyệt yêu cầu nạp tiền",
        targetType: "topup-request",
        targetId: requestId,
        description: `Đã duyệt yêu cầu nạp tiền ${approvedAmount.toLocaleString(
          "vi-VN"
        )} ₫ cho ${request.userName}`,
      });

      if (updatedRequest) {
        this.emit({ type: "TOPUP_REQUEST_PROCESSED", payload: updatedRequest });
        this.scheduleSave();
      }

      return { request: updatedRequest, transaction };
    } else {
      // Reject request
      const updatedRequest = this.updateTopupRequest(requestId, {
        status: "rejected",
        processedAt,
        processedBy: adminId,
        processedByName: adminName,
        rejectionReason: options.rejectionReason,
        adminNotes: options.adminNotes,
      });

      // Log activity
      this.logActivity({
        adminId,
        adminName,
        action: "Từ chối yêu cầu nạp tiền",
        targetType: "topup-request",
        targetId: requestId,
        description: `Đã từ chối yêu cầu nạp tiền ${request.requestedAmount.toLocaleString(
          "vi-VN"
        )} ₫ của ${request.userName}`,
      });

      if (updatedRequest) {
        this.emit({ type: "TOPUP_REQUEST_PROCESSED", payload: updatedRequest });
        this.scheduleSave();
      }

      return { request: updatedRequest };
    }
  }

  createTransaction(
    transactionData: Omit<UserTransaction, "id" | "createdAt">
  ): UserTransaction {
    const transaction: UserTransaction = {
      ...transactionData,
      id: `tx-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`,
      createdAt: new Date(),
    };

    this.transactions.set(transaction.id, transaction);
    this.emit({ type: "TRANSACTION_CREATED", payload: transaction });

    // Persist
    this.scheduleSave();

    return transaction;
  }

  // Utility methods for public site integration
  getPublicProducts(): Product[] {
    const products = Array.from(this.products.values())
      .filter((p) => p.isActive !== false)
      .map((p) => ({
        id: p.id,
        title: p.title,
        description: p.description,
        price: p.price,
        currency: p.currency,
        imageEmoji: p.imageEmoji,
        imageUrl: p.imageUrl,
        badge: p.badge,
        longDescription: p.longDescription,
        faqs: p.faqs,
        category: p.category,
        options: p.options,
        stock: p.stock,
        createdAt: p.createdAt,
        sold: p.sold,
      }))
      .sort((a, b) => {
        // Sort by creation date (newest first)
        const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        if (dateB !== dateA) {
          return dateB - dateA; // Newest first
        }
        // Then by sold count (highest first)
        return (b.sold || 0) - (a.sold || 0);
      });

    return products;
  }

  getPublicUser(email: string): User | null {
    const adminUser = this.getUserByEmail(email);
    if (!adminUser) return null;

    return {
      id: adminUser.id,
      email: adminUser.email,
      name: adminUser.name,
      role: adminUser.role,
      status: adminUser.status,
      balance: adminUser.balance,
      createdAt: adminUser.createdAt,
      updatedAt: adminUser.updatedAt,
      lastLoginAt: adminUser.lastLoginAt,
    };
  }

  // Statistics for dashboard
  getStats() {
    const users = this.getUsers();
    const products = this.getProducts();
    const transactions = this.getTransactions();

    const activeUsers = users.filter((u) => u.status === "active").length;
    const activeProducts = products.filter((p) => p.isActive).length;
    const totalRevenue = transactions
      .filter((tx) => tx.type === "purchase")
      .reduce((sum, tx) => sum + Math.abs(tx.amount), 0);

    const monthStart = new Date();
    monthStart.setDate(1);
    monthStart.setHours(0, 0, 0, 0);

    const monthlyRevenue = transactions
      .filter((tx) => tx.type === "purchase" && tx.createdAt >= monthStart)
      .reduce((sum, tx) => sum + Math.abs(tx.amount), 0);

    const totalOrders = users.reduce((sum, user) => sum + user.totalOrders, 0);
    const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

    // Calculate top-selling products based on sold count
    const topSellingProducts = products
      .filter((p) => p.sold > 0)
      .sort((a, b) => b.sold - a.sold)
      .slice(0, 5)
      .map((product) => ({
        productId: product.id,
        productTitle: product.title,
        salesCount: product.sold,
        revenue: product.sold * product.price,
      }));

    return {
      totalUsers: users.length,
      activeUsers,
      totalProducts: products.length,
      activeProducts,
      totalOrders,
      pendingOrders: 0, // Would be calculated from actual orders
      totalRevenue,
      monthlyRevenue,
      averageOrderValue,
      topSellingProducts,
      recentActivity: this.getRecentActivity(5),
    };
  }

  // === Orders APIs (basic) ===
  getOrdersByUser(userId: string) {
    return Array.from(this.orders.values()).filter((o) => o.userId === userId);
  }

  getOrder(id: string) {
    return this.orders.get(id) || null;
  }

  createOrder(order: import("./admin").Order) {
    this.orders.set(order.id, order);
    this.emit({ type: "ORDER_CREATED", payload: order });
    this.scheduleSave();
    return order;
  }

  updateOrder(id: string, updates: Partial<import("./admin").Order>) {
    const cur = this.orders.get(id);
    if (!cur) return null;
    const upd = { ...cur, ...updates, updatedAt: new Date() };
    this.orders.set(id, upd);
    this.emit({ type: "ORDER_UPDATED", payload: upd });
    this.scheduleSave();
    return upd;
  }

  getAllOrders() {
    return Array.from(this.orders.values());
  }

  // Load users from file
  private loadUsersFromFile(): void {
    try {
      if (typeof window !== "undefined") return; // Only on server

      const fs = require("fs");
      const path = require("path");
      const usersPath = path.join(process.cwd(), ".data", "users.json");

      if (fs.existsSync(usersPath)) {
        const data = fs.readFileSync(usersPath, "utf8");
        const users = JSON.parse(data);

        users.forEach((user: any) => {
          this.users.set(user.id, {
            ...user,
            createdAt: new Date(user.createdAt),
            updatedAt: new Date(user.updatedAt),
            lastLoginAt: user.lastLoginAt
              ? new Date(user.lastLoginAt)
              : undefined,
          });
        });
      }
    } catch (error) {
      console.error("Failed to load users from file:", error);
    }
  }
}

// Singleton instance
export const dataStore = new DataStore();

// Export types for use in components
export type { DataStoreEvent, EventListener };
