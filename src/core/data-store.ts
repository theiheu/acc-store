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
import {
  ExpenseEntry,
  ProfitAnalysis,
  ProductCostBreakdown,
  ROIAnalysis,
  ProfitAlert,
  ProfitForecast,
  ExpenseCategory,
  calculateGrossProfit,
  calculateNetProfit,
  calculateGrossMargin,
  calculateNetMargin,
  calculateROI,
  allocateOperationalCosts,
  PROFIT_ALERT_THRESHOLDS,
} from "./profit";

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
  | { type: "ORDER_UPDATED"; payload: import("./admin").Order }
  | { type: "CATEGORY_CREATED"; payload: import("./categories").Category }
  | { type: "CATEGORY_UPDATED"; payload: import("./categories").Category }
  | { type: "CATEGORY_DELETED"; payload: import("./categories").Category };

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
  // Profit analysis data
  private expenses: Map<string, ExpenseEntry> = new Map();
  private profitAlerts: Map<string, ProfitAlert> = new Map();

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
    expenses: __isServer ? __path.join(this.baseDir, "expenses.json") : "",
    profitAlerts: __isServer
      ? __path.join(this.baseDir, "profit-alerts.json")
      : "",
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
        productsArray.map(
          (p): Product => ({
            id: p.id,
            title: p.title,
            category: p.category,
            isActive: p.isActive,
          })
        )
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
      __fs.writeFileSync(
        this.files.expenses,
        toJSON(Array.from(this.expenses.values())),
        "utf-8"
      );
      __fs.writeFileSync(
        this.files.profitAlerts,
        toJSON(Array.from(this.profitAlerts.values())),
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
          // Migration for soldCount
          if (p.sold !== undefined && p.soldCount === undefined) {
            p.soldCount = p.sold;
            delete p.sold;
          }
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

      const expenses = parseJSON(this.files.expenses);
      if (Array.isArray(expenses)) {
        expenses.forEach((e) => {
          reviveDates(e);
          this.expenses.set(e.id, e);
        });
      }

      const profitAlerts = parseJSON(this.files.profitAlerts);
      if (Array.isArray(profitAlerts)) {
        profitAlerts.forEach((a) => {
          reviveDates(a);
          this.profitAlerts.set(a.id, a);
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
        name: "Chưa phân loại",
        slug: "uncategorized",
        description: "Danh mục mặc định",
        icon: "🏷️",
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
        soldCount: 0, // Start with no sales
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

  // Alias for getUser for consistency with API usage
  getUserById(id: string): AdminUser | null {
    return this.getUser(id);
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
  ): Array<{ date: string; revenue: number; orders: number }>;
  getRevenueData(
    startDate: Date,
    endDate: Date
  ): Array<{ date: string; revenue: number; orders: number }>;
  getRevenueData(
    daysOrStartDate: number | Date = 30,
    endDate?: Date
  ): Array<{ date: string; revenue: number; orders: number }> {
    const { ORDER_STATUS } = require("./constants");
    const data = [];
    const orders = Array.from(this.orders.values());

    let startDate: Date;
    let actualEndDate: Date;

    if (typeof daysOrStartDate === "number") {
      // Legacy behavior: use days from today
      const days = daysOrStartDate;
      actualEndDate = new Date();
      startDate = new Date();
      startDate.setDate(startDate.getDate() - (days - 1));
    } else {
      // New behavior: use specific date range
      startDate = daysOrStartDate;
      actualEndDate = endDate || new Date();
    }

    // Generate data for each day in the range
    const currentDate = new Date(startDate);
    while (currentDate <= actualEndDate) {
      const dateStr = currentDate.toISOString().split("T")[0];

      // Filter completed orders for this date
      const dayOrders = orders.filter((order) => {
        const orderDate = new Date(order.createdAt).toISOString().split("T")[0];
        return orderDate === dateStr && order.status === ORDER_STATUS.COMPLETED;
      });

      const revenue = dayOrders.reduce(
        (sum, order) => sum + order.totalAmount,
        0
      );
      const orderCount = dayOrders.length;

      data.push({
        date: dateStr,
        revenue,
        orders: orderCount,
      });

      currentDate.setDate(currentDate.getDate() + 1);
    }

    return data;
  }

  getUserGrowthData(
    days: number = 30
  ): Array<{ date: string; newUsers: number; totalUsers: number }>;
  getUserGrowthData(
    startDate: Date,
    endDate: Date
  ): Array<{ date: string; newUsers: number; totalUsers: number }>;
  getUserGrowthData(
    daysOrStartDate: number | Date = 30,
    endDate?: Date
  ): Array<{ date: string; newUsers: number; totalUsers: number }> {
    const data = [];
    const users = Array.from(this.users.values());

    let startDate: Date;
    let actualEndDate: Date;

    if (typeof daysOrStartDate === "number") {
      // Legacy behavior: use days from today
      const days = daysOrStartDate;
      actualEndDate = new Date();
      startDate = new Date();
      startDate.setDate(startDate.getDate() - (days - 1));
    } else {
      // New behavior: use specific date range
      startDate = daysOrStartDate;
      actualEndDate = endDate || new Date();
    }

    // Generate data for each day in the range
    const currentDate = new Date(startDate);
    while (currentDate <= actualEndDate) {
      const dateStr = currentDate.toISOString().split("T")[0];

      // Count new users for this date
      const newUsers = users.filter((user) => {
        const userDate = new Date(user.createdAt).toISOString().split("T")[0];
        return userDate === dateStr;
      }).length;

      // Count total users up to this date
      const totalUsers = users.filter((user) => {
        return new Date(user.createdAt) <= currentDate;
      }).length;

      data.push({
        date: dateStr,
        newUsers,
        totalUsers,
      });

      currentDate.setDate(currentDate.getDate() + 1);
    }

    return data;
  }

  // Advanced analytics methods
  getConversionRateData(
    daysOrStartDate: number | Date = 30,
    endDate?: Date
  ): Array<{
    date: string;
    visitors: number;
    conversions: number;
    rate: number;
  }> {
    const data = [];
    const users = Array.from(this.users.values());
    const transactions = Array.from(this.transactions.values());

    let startDate: Date;
    let actualEndDate: Date;

    if (typeof daysOrStartDate === "number") {
      const days = daysOrStartDate;
      actualEndDate = new Date();
      startDate = new Date();
      startDate.setDate(startDate.getDate() - (days - 1));
    } else {
      startDate = daysOrStartDate;
      actualEndDate = endDate || new Date();
    }

    const currentDate = new Date(startDate);
    while (currentDate <= actualEndDate) {
      const dateStr = currentDate.toISOString().split("T")[0];

      // Count new users (visitors) for this date
      const visitors = users.filter((user) => {
        const userDate = new Date(user.createdAt).toISOString().split("T")[0];
        return userDate === dateStr;
      }).length;

      // Count conversions (purchases) for this date
      const conversions = transactions.filter((tx) => {
        const txDate = new Date(tx.createdAt).toISOString().split("T")[0];
        return txDate === dateStr && tx.type === "purchase";
      }).length;

      const rate = visitors > 0 ? (conversions / visitors) * 100 : 0;

      data.push({
        date: dateStr,
        visitors,
        conversions,
        rate,
      });

      currentDate.setDate(currentDate.getDate() + 1);
    }

    return data;
  }

  getProductPerformanceData(
    daysOrStartDate: number | Date = 30,
    endDate?: Date
  ): Array<{
    productId: string;
    productTitle: string;
    views: number;
    sales: number;
    revenue: number;
    conversionRate: number;
  }> {
    const products = Array.from(this.products.values());
    const transactions = Array.from(this.transactions.values());

    let startDate: Date;
    let actualEndDate: Date;

    if (typeof daysOrStartDate === "number") {
      const days = daysOrStartDate;
      actualEndDate = new Date();
      startDate = new Date();
      startDate.setDate(startDate.getDate() - (days - 1));
    } else {
      startDate = daysOrStartDate;
      actualEndDate = endDate || new Date();
    }

    return products
      .map((product) => {
        // Filter transactions for this product in the date range
        const productTransactions = transactions.filter((tx) => {
          const txDate = new Date(tx.createdAt);
          return (
            txDate >= startDate &&
            txDate <= actualEndDate &&
            tx.type === "purchase" &&
            tx.description?.includes(product.title)
          );
        });

        const sales = productTransactions.length;
        const revenue = productTransactions.reduce(
          (sum, tx) => sum + Math.abs(tx.amount),
          0
        );

        // Mock views data (in a real app, you'd track this)
        const views = Math.max(sales * (Math.random() * 10 + 5), sales);
        const conversionRate = views > 0 ? (sales / views) * 100 : 0;

        return {
          productId: product.id,
          productTitle: product.title,
          views: Math.floor(views),
          sales,
          revenue,
          conversionRate,
        };
      })
      .filter((item) => item.sales > 0 || item.views > 0)
      .sort((a, b) => b.revenue - a.revenue);
  }

  getTopCustomersData(
    limit: number = 10,
    daysOrStartDate: number | Date = 30,
    endDate?: Date
  ): Array<{
    userId: string;
    userName: string;
    totalSpent: number;
    orderCount: number;
    averageOrderValue: number;
    lastOrderDate: Date;
  }> {
    const users = Array.from(this.users.values());
    const transactions = Array.from(this.transactions.values());

    let startDate: Date;
    let actualEndDate: Date;

    if (typeof daysOrStartDate === "number") {
      const days = daysOrStartDate;
      actualEndDate = new Date();
      startDate = new Date();
      startDate.setDate(startDate.getDate() - (days - 1));
    } else {
      startDate = daysOrStartDate;
      actualEndDate = endDate || new Date();
    }

    return users
      .map((user) => {
        const userTransactions = transactions.filter((tx) => {
          const txDate = new Date(tx.createdAt);
          return (
            tx.userId === user.id &&
            txDate >= startDate &&
            txDate <= actualEndDate &&
            tx.type === "purchase"
          );
        });

        if (userTransactions.length === 0) return null;

        const totalSpent = userTransactions.reduce(
          (sum, tx) => sum + Math.abs(tx.amount),
          0
        );
        const orderCount = userTransactions.length;
        const averageOrderValue = totalSpent / orderCount;
        const lastOrderDate = new Date(
          Math.max(...userTransactions.map((tx) => tx.createdAt.getTime()))
        );

        return {
          userId: user.id,
          userName: user.name,
          totalSpent,
          orderCount,
          averageOrderValue,
          lastOrderDate,
        };
      })
      .filter(Boolean)
      .sort((a, b) => b!.totalSpent - a!.totalSpent)
      .slice(0, limit) as Array<{
      userId: string;
      userName: string;
      totalSpent: number;
      orderCount: number;
      averageOrderValue: number;
      lastOrderDate: Date;
    }>;
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
    // Filter out soft-deleted products by default
    return Array.from(this.products.values()).filter(
      (product) => !product.deletedAt
    );
  }

  getAllProducts(): AdminProduct[] {
    // Get all products including soft-deleted ones
    return Array.from(this.products.values());
  }

  getDeletedProducts(): AdminProduct[] {
    // Get only soft-deleted products
    return Array.from(this.products.values()).filter(
      (product) => product.deletedAt
    );
  }

  getActiveProducts(): AdminProduct[] {
    // Treat undefined as active for backward compatibility with older persisted data
    return Array.from(this.products.values()).filter(
      (product) => product.isActive !== false && !product.deletedAt
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
        `giá từ ${(product.price ?? 0).toLocaleString("vi-VN")} ₫ thành ${(
          updates.price ?? 0
        ).toLocaleString("vi-VN")} ₫`
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

    if (!product) {
      return false;
    }

    // Check if product has pending orders
    const pendingOrders = this.getAllOrders().filter(
      (order) => order.productId === id && order.status === "pending"
    );

    if (pendingOrders.length > 0) {
      throw new Error(
        `Không thể xóa sản phẩm vì có ${pendingOrders.length} đơn hàng đang chờ xử lý`
      );
    }

    // Soft delete: set deletedAt timestamp
    const updatedProduct: AdminProduct = {
      ...product,
      deletedAt: new Date(),
      updatedAt: new Date(),
      lastModifiedBy: adminId || "system",
    };

    this.products.set(id, updatedProduct);

    // Log activity
    this.logActivity({
      adminId: adminId || "system",
      adminName: adminName || "System",
      action: "Xóa sản phẩm",
      targetType: "product",
      targetId: id,
      description: `Đã xóa sản phẩm: ${product.title}`,
      metadata: {
        softDelete: true,
        deletedAt: updatedProduct.deletedAt.toISOString(),
      },
    });

    this.emit({
      type: "PRODUCT_DELETED",
      payload: { productId: id, softDelete: true },
    });

    // Persist changes
    this.scheduleSave();

    return true;
  }

  // Method to permanently delete a product (admin only)
  permanentlyDeleteProduct(
    id: string,
    adminId?: string,
    adminName?: string
  ): boolean {
    const product = this.products.get(id);

    if (!product) {
      return false;
    }

    // Check if product has any orders (completed or otherwise)
    const relatedOrders = this.getAllOrders().filter(
      (order) => order.productId === id
    );

    if (relatedOrders.length > 0) {
      throw new Error(
        `Không thể xóa vĩnh viễn sản phẩm vì có ${relatedOrders.length} đơn hàng liên quan`
      );
    }

    const deleted = this.products.delete(id);

    if (deleted) {
      // Log activity
      this.logActivity({
        adminId: adminId || "system",
        adminName: adminName || "System",
        action: "Xóa vĩnh viễn sản phẩm",
        targetType: "product",
        targetId: id,
        description: `Đã xóa vĩnh viễn sản phẩm: ${product.title}`,
        metadata: {
          permanentDelete: true,
        },
      });

      this.emit({
        type: "PRODUCT_PERMANENTLY_DELETED",
        payload: { productId: id },
      });

      // Persist changes
      this.scheduleSave();
    }

    return deleted;
  }

  // Method to restore a soft-deleted product
  restoreProduct(
    id: string,
    adminId?: string,
    adminName?: string
  ): AdminProduct | null {
    const product = this.products.get(id);

    if (!product || !product.deletedAt) {
      return null;
    }

    const restoredProduct: AdminProduct = {
      ...product,
      deletedAt: undefined,
      updatedAt: new Date(),
      lastModifiedBy: adminId || "system",
    };

    this.products.set(id, restoredProduct);

    // Log activity
    this.logActivity({
      adminId: adminId || "system",
      adminName: adminName || "System",
      action: "Khôi phục sản phẩm",
      targetType: "product",
      targetId: id,
      description: `Đã khôi phục sản phẩm: ${product.title}`,
    });

    this.emit({ type: "PRODUCT_RESTORED", payload: restoredProduct });

    // Persist changes
    this.scheduleSave();

    return restoredProduct;
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
      .map(
        (p): Product => ({
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
          soldCount: p.soldCount,
        })
      )
      .sort((a, b) => {
        // Sort by creation date (newest first)
        const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        if (dateB !== dateA) {
          return dateB - dateA; // Newest first
        }
        // Then by sold count (highest first)
        return (b.soldCount || 0) - (a.soldCount || 0);
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

    const activeUsers = users.filter((u) => u.status === "active").length;
    const activeProducts = products.filter((p) => p.isActive).length;

    // Get accurate order statistics
    const orderStats = this.getOrderStatistics();

    const monthStart = new Date();
    monthStart.setDate(1);
    monthStart.setHours(0, 0, 0, 0);

    // Get monthly statistics
    const monthlyStats = this.getOrderStatistics(monthStart, new Date());

    // Calculate top-selling products based on actual order data
    const { ORDER_STATUS } = require("./constants");
    const completedOrders = Array.from(this.orders.values()).filter(
      (order) => order.status === ORDER_STATUS.COMPLETED
    );

    const productSales = new Map<
      string,
      { count: number; revenue: number; title: string }
    >();

    completedOrders.forEach((order) => {
      const product = this.products.get(order.productId);
      if (product) {
        const existing = productSales.get(order.productId) || {
          count: 0,
          revenue: 0,
          title: product.title,
        };
        productSales.set(order.productId, {
          count: existing.count + order.quantity,
          revenue: existing.revenue + order.totalAmount,
          title: existing.title,
        });
      }
    });

    const topSellingProducts = Array.from(productSales.entries())
      .sort((a, b) => b[1].count - a[1].count)
      .slice(0, 5)
      .map(([productId, data]) => ({
        productId,
        productTitle: data.title,
        salesCount: data.count,
        revenue: data.revenue,
      }));

    return {
      totalUsers: users.length,
      activeUsers,
      totalProducts: products.length,
      activeProducts,
      totalOrders: orderStats.totalOrders,
      pendingOrders: orderStats.pendingOrders,
      totalRevenue: orderStats.totalRevenue,
      monthlyRevenue: monthlyStats.totalRevenue,
      averageOrderValue: orderStats.averageOrderValue,
      topSellingProducts,
      recentActivity: this.getRecentActivity(5),
      // Add profit metrics
      totalProfit: orderStats.totalProfit,
      profitMargin: orderStats.profitMargin,
      totalCosts: orderStats.totalCosts,
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

  // === PROFIT ANALYSIS METHODS ===

  // Get order statistics with accurate profit calculations
  getOrderStatistics(
    startDate?: Date,
    endDate?: Date
  ): import("./admin").OrderStats {
    const { ORDER_STATUS } = require("./constants");

    let orders = Array.from(this.orders.values());

    if (startDate && endDate) {
      orders = orders.filter(
        (order) => order.createdAt >= startDate && order.createdAt <= endDate
      );
    }

    const completedOrders = orders.filter(
      (order) => order.status === ORDER_STATUS.COMPLETED
    );
    const totalRevenue = completedOrders.reduce(
      (sum, order) => sum + order.totalAmount,
      0
    );

    // Calculate actual costs and profit
    let totalCosts = 0;
    let totalProfit = 0;

    completedOrders.forEach((order) => {
      const product = this.products.get(order.productId);
      if (product) {
        let unitCost = 0;

        // Get actual cost from selected option or product
        if (order.selectedOptionId && product.options) {
          const selectedOption = product.options.find(
            (opt) => opt.id === order.selectedOptionId
          );
          if (selectedOption) {
            unitCost = selectedOption.basePrice || selectedOption.price * 0.7;
          }
        } else if (product.price) {
          unitCost = product.price * 0.7;
        }

        const orderCost = unitCost * order.quantity;
        totalCosts += orderCost;
        totalProfit += order.totalAmount - orderCost;
      }
    });

    const today = new Date();
    const todayStart = new Date(
      today.getFullYear(),
      today.getMonth(),
      today.getDate()
    );
    const todayOrders = orders.filter((order) => order.createdAt >= todayStart);
    const todayCompletedOrders = todayOrders.filter(
      (order) => order.status === ORDER_STATUS.COMPLETED
    );
    const todayRevenue = todayCompletedOrders.reduce(
      (sum, order) => sum + order.totalAmount,
      0
    );

    let todayProfit = 0;
    todayCompletedOrders.forEach((order) => {
      const product = this.products.get(order.productId);
      if (product) {
        let unitCost = 0;
        if (order.selectedOptionId && product.options) {
          const selectedOption = product.options.find(
            (opt) => opt.id === order.selectedOptionId
          );
          if (selectedOption) {
            unitCost = selectedOption.basePrice || selectedOption.price * 0.7;
          }
        } else if (product.price) {
          unitCost = product.price * 0.7;
        }
        todayProfit += order.totalAmount - unitCost * order.quantity;
      }
    });

    return {
      totalOrders: orders.length,
      pendingOrders: orders.filter(
        (order) => order.status === ORDER_STATUS.PENDING
      ).length,
      processingOrders: orders.filter(
        (order) => order.status === ORDER_STATUS.PROCESSING
      ).length,
      completedOrders: completedOrders.length,
      cancelledOrders: orders.filter(
        (order) => order.status === ORDER_STATUS.CANCELLED
      ).length,
      refundedOrders: orders.filter(
        (order) => order.status === ORDER_STATUS.REFUNDED
      ).length,
      totalRevenue,
      averageOrderValue:
        completedOrders.length > 0 ? totalRevenue / completedOrders.length : 0,
      todayOrders: todayOrders.length,
      todayRevenue,
      conversionRate:
        orders.length > 0 ? (completedOrders.length / orders.length) * 100 : 0,
      totalProfit,
      averageProfit:
        completedOrders.length > 0 ? totalProfit / completedOrders.length : 0,
      todayProfit,
      profitMargin: totalRevenue > 0 ? (totalProfit / totalRevenue) * 100 : 0,
      totalCosts,
    };
  }

  // Expense management
  createExpense(
    expenseData: Omit<ExpenseEntry, "id" | "createdAt" | "updatedAt">
  ): ExpenseEntry {
    const expense: ExpenseEntry = {
      ...expenseData,
      id: `expense-${Date.now()}-${Math.random()
        .toString(36)
        .substring(2, 11)}`,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    this.expenses.set(expense.id, expense);
    this.scheduleSave();
    return expense;
  }

  getExpenses(
    category?: ExpenseCategory,
    startDate?: Date,
    endDate?: Date
  ): ExpenseEntry[] {
    let expenses = Array.from(this.expenses.values());

    if (category) {
      expenses = expenses.filter((e) => e.category === category);
    }

    if (startDate && endDate) {
      expenses = expenses.filter(
        (e) => e.date >= startDate && e.date <= endDate
      );
    }

    return expenses.sort((a, b) => b.date.getTime() - a.date.getTime());
  }

  updateExpense(
    id: string,
    updates: Partial<ExpenseEntry>
  ): ExpenseEntry | null {
    const expense = this.expenses.get(id);
    if (!expense) return null;

    const updatedExpense = {
      ...expense,
      ...updates,
      updatedAt: new Date(),
    };

    this.expenses.set(id, updatedExpense);
    this.scheduleSave();
    return updatedExpense;
  }

  deleteExpense(id: string): boolean {
    const deleted = this.expenses.delete(id);
    if (deleted) {
      this.scheduleSave();
    }
    return deleted;
  }

  // Product cost breakdown calculation
  calculateProductCostBreakdown(
    productId: string,
    startDate: Date,
    endDate: Date
  ): ProductCostBreakdown | null {
    const { ORDER_STATUS } = require("./constants");
    const product = this.products.get(productId);
    if (!product) return null;

    // Get orders for this product in the date range
    const productOrders = Array.from(this.orders.values()).filter(
      (order) =>
        order.productId === productId &&
        order.createdAt >= startDate &&
        order.createdAt <= endDate &&
        order.status === ORDER_STATUS.COMPLETED
    );

    if (productOrders.length === 0) {
      return {
        productId,
        productTitle: product.title,
        basePrice: 0,
        transactionFees: 0,
        operationalCost: 0,
        marketingCost: 0,
        totalCost: 0,
        sellingPrice: 0,
        grossProfit: 0,
        netProfit: 0,
        grossMargin: 0,
        netMargin: 0,
      };
    }

    // Calculate average selling price
    const totalRevenue = productOrders.reduce(
      (sum, order) => sum + order.totalAmount,
      0
    );
    const totalQuantity = productOrders.reduce(
      (sum, order) => sum + order.quantity,
      0
    );
    const avgSellingPrice = totalRevenue / totalQuantity;

    // Calculate actual base price from orders
    let totalBaseCost = 0;
    productOrders.forEach((order) => {
      let unitCost = 0;

      // Get actual cost from selected option or product
      if (order.selectedOptionId && product.options) {
        const selectedOption = product.options.find(
          (opt) => opt.id === order.selectedOptionId
        );
        if (selectedOption) {
          // Use basePrice if available, otherwise estimate from selling price
          unitCost = selectedOption.basePrice || selectedOption.price * 0.7;
        }
      } else if (product.price) {
        // Fallback to product base price or estimate
        unitCost = product.price * 0.7; // Conservative 70% cost estimate
      }

      totalBaseCost += unitCost * order.quantity;
    });

    const basePrice = totalQuantity > 0 ? totalBaseCost / totalQuantity : 0;

    // Calculate allocated costs
    const expenses = this.getExpenses(undefined, startDate, endDate);
    const transactionFees =
      expenses
        .filter((e) => e.category === "transaction_fees")
        .reduce((sum, e) => sum + e.amount, 0) / totalQuantity;

    const operationalCost =
      expenses
        .filter((e) => e.category === "operational")
        .reduce((sum, e) => sum + e.amount, 0) / totalQuantity;

    const marketingCost =
      expenses
        .filter((e) => e.category === "marketing")
        .reduce((sum, e) => sum + e.amount, 0) / totalQuantity;

    const totalCost =
      basePrice + transactionFees + operationalCost + marketingCost;
    const grossProfit = avgSellingPrice - basePrice;
    const netProfit = avgSellingPrice - totalCost;

    return {
      productId,
      productTitle: product.title,
      basePrice,
      transactionFees,
      operationalCost,
      marketingCost,
      totalCost,
      sellingPrice: avgSellingPrice,
      grossProfit,
      netProfit,
      grossMargin: calculateGrossMargin(grossProfit, avgSellingPrice),
      netMargin: calculateNetMargin(netProfit, avgSellingPrice),
    };
  }

  // Comprehensive profit analysis
  getProfitAnalysis(startDate: Date, endDate: Date): ProfitAnalysis {
    // Import ORDER_STATUS for proper status filtering
    const { ORDER_STATUS } = require("./constants");

    const orders = Array.from(this.orders.values()).filter(
      (order) =>
        order.createdAt >= startDate &&
        order.createdAt <= endDate &&
        order.status === ORDER_STATUS.COMPLETED
    );

    const expenses = this.getExpenses(undefined, startDate, endDate);

    // Calculate revenue
    const totalRevenue = orders.reduce(
      (sum, order) => sum + order.totalAmount,
      0
    );

    const revenueByProduct = new Map<
      string,
      { revenue: number; quantity: number; title: string }
    >();
    orders.forEach((order) => {
      const product = this.products.get(order.productId);
      const existing = revenueByProduct.get(order.productId) || {
        revenue: 0,
        quantity: 0,
        title: product?.title || "Unknown",
      };
      revenueByProduct.set(order.productId, {
        revenue: existing.revenue + order.totalAmount,
        quantity: existing.quantity + order.quantity,
        title: existing.title,
      });
    });

    // Calculate actual COGS from orders
    let actualCOGS = 0;
    orders.forEach((order) => {
      const product = this.products.get(order.productId);
      if (product) {
        let unitCost = 0;

        // Get actual cost from selected option or product
        if (order.selectedOptionId && product.options) {
          const selectedOption = product.options.find(
            (opt) => opt.id === order.selectedOptionId
          );
          if (selectedOption) {
            // Use basePrice if available, otherwise estimate from selling price
            unitCost = selectedOption.basePrice || selectedOption.price * 0.7;
          }
        } else if (product.price) {
          // Fallback to product base price or estimate
          unitCost = product.price * 0.7; // Conservative 70% cost estimate
        }

        actualCOGS += unitCost * order.quantity;
      }
    });

    // Calculate costs by category (including actual COGS)
    const expensesByCategory = {
      operational: expenses
        .filter((e) => e.category === "operational")
        .reduce((sum, e) => sum + e.amount, 0),
      marketing: expenses
        .filter((e) => e.category === "marketing")
        .reduce((sum, e) => sum + e.amount, 0),
      administrative: expenses
        .filter((e) => e.category === "administrative")
        .reduce((sum, e) => sum + e.amount, 0),
      transactionFees: expenses
        .filter((e) => e.category === "transaction_fees")
        .reduce((sum, e) => sum + e.amount, 0),
      other: expenses
        .filter((e) => e.category === "other")
        .reduce((sum, e) => sum + e.amount, 0),
    };

    const costsByCategory = {
      cogs:
        actualCOGS +
        expenses
          .filter((e) => e.category === "cogs")
          .reduce((sum, e) => sum + e.amount, 0), // Add any manual COGS entries
      ...expensesByCategory,
    };

    const totalCosts = Object.values(costsByCategory).reduce(
      (sum, cost) => sum + cost,
      0
    );
    const grossProfit = totalRevenue - costsByCategory.cogs;
    const netProfit = totalRevenue - totalCosts;

    return {
      period: {
        startDate,
        endDate,
        label: `${startDate.toLocaleDateString(
          "vi-VN"
        )} - ${endDate.toLocaleDateString("vi-VN")}`,
      },
      revenue: {
        total: totalRevenue,
        byProduct: Array.from(revenueByProduct.entries()).map(
          ([productId, data]) => ({
            productId,
            productTitle: data.title,
            revenue: data.revenue,
            quantity: data.quantity,
          })
        ),
        byCategory: [], // TODO: Implement category-based revenue
      },
      costs: {
        total: totalCosts,
        ...costsByCategory,
        byProduct: [], // TODO: Implement product-specific cost allocation
      },
      profit: {
        gross: grossProfit,
        net: netProfit,
        grossMargin: calculateGrossMargin(grossProfit, totalRevenue),
        netMargin: calculateNetMargin(netProfit, totalRevenue),
        byProduct: Array.from(revenueByProduct.entries()).map(
          ([productId, data]) => {
            const costBreakdown = this.calculateProductCostBreakdown(
              productId,
              startDate,
              endDate
            );

            // Calculate actual profit metrics for this product
            const productRevenue = data.revenue;
            const productCost = costBreakdown?.totalCost || 0;
            const grossProfit =
              productRevenue - (costBreakdown?.basePrice || 0) * data.quantity;
            const netProfit = productRevenue - productCost * data.quantity;

            return {
              productId,
              productTitle: data.title,
              grossProfit,
              netProfit,
              grossMargin:
                productRevenue > 0 ? (grossProfit / productRevenue) * 100 : 0,
              netMargin:
                productRevenue > 0 ? (netProfit / productRevenue) * 100 : 0,
              quantity: data.quantity,
            };
          }
        ),
      },
      trends: {
        revenueGrowth: 0, // TODO: Calculate based on previous period
        profitGrowth: 0, // TODO: Calculate based on previous period
        marginTrend: "stable", // TODO: Determine trend
      },
    };
  }

  // ROI Analysis
  calculateROI(
    campaignName: string,
    investment: number,
    startDate: Date,
    endDate: Date,
    productIds?: string[]
  ): ROIAnalysis {
    const { ORDER_STATUS } = require("./constants");
    let orders = Array.from(this.orders.values()).filter(
      (order) =>
        order.createdAt >= startDate &&
        order.createdAt <= endDate &&
        order.status === ORDER_STATUS.COMPLETED
    );

    if (productIds && productIds.length > 0) {
      orders = orders.filter((order) => productIds.includes(order.productId));
    }

    const returns = orders.reduce((sum, order) => sum + order.totalAmount, 0);
    const profit = returns - investment;
    const roi = calculateROI(profit, investment);

    return {
      campaignName,
      investment,
      returns,
      profit,
      roi,
      period: { startDate, endDate },
      metrics: {
        customerAcquisitionCost: investment / orders.length || 0,
        customerLifetimeValue: returns / orders.length || 0,
        paybackPeriod:
          investment > 0
            ? investment /
              (returns /
                ((endDate.getTime() - startDate.getTime()) /
                  (1000 * 60 * 60 * 24)))
            : 0,
      },
    };
  }

  // Profit alerts management
  createProfitAlert(
    alertData: Omit<ProfitAlert, "id" | "createdAt">
  ): ProfitAlert {
    const alert: ProfitAlert = {
      ...alertData,
      id: `alert-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`,
      createdAt: new Date(),
    };

    this.profitAlerts.set(alert.id, alert);
    this.scheduleSave();
    return alert;
  }

  getProfitAlerts(unreadOnly: boolean = false): ProfitAlert[] {
    let alerts = Array.from(this.profitAlerts.values());

    if (unreadOnly) {
      alerts = alerts.filter((alert) => !alert.isRead);
    }

    return alerts.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  markAlertAsRead(alertId: string): boolean {
    const alert = this.profitAlerts.get(alertId);
    if (!alert) return false;

    alert.isRead = true;
    this.profitAlerts.set(alertId, alert);
    this.scheduleSave();
    return true;
  }

  resolveAlert(alertId: string): boolean {
    const alert = this.profitAlerts.get(alertId);
    if (!alert) return false;

    alert.isResolved = true;
    alert.isRead = true;
    this.profitAlerts.set(alertId, alert);
    this.scheduleSave();
    return true;
  }

  // Check for profit issues and generate alerts
  checkProfitAlerts(startDate: Date, endDate: Date): ProfitAlert[] {
    const newAlerts: ProfitAlert[] = [];
    const profitAnalysis = this.getProfitAnalysis(startDate, endDate);

    // Check overall profit margin
    if (profitAnalysis.profit.netMargin < PROFIT_ALERT_THRESHOLDS.LOW_MARGIN) {
      newAlerts.push(
        this.createProfitAlert({
          type: "low_margin",
          severity: profitAnalysis.profit.netMargin < 0 ? "critical" : "high",
          title: "Tỷ suất lợi nhuận thấp",
          description: `Tỷ suất lợi nhuận ròng hiện tại là ${profitAnalysis.profit.netMargin.toFixed(
            1
          )}%, thấp hơn ngưỡng cảnh báo ${PROFIT_ALERT_THRESHOLDS.LOW_MARGIN}%`,
          currentValue: profitAnalysis.profit.netMargin,
          threshold: PROFIT_ALERT_THRESHOLDS.LOW_MARGIN,
          recommendation: "Xem xét tối ưu hóa chi phí hoặc điều chỉnh giá bán",
          isRead: false,
          isResolved: false,
        })
      );
    }

    // Check for negative profit
    if (profitAnalysis.profit.net < 0) {
      newAlerts.push(
        this.createProfitAlert({
          type: "negative_profit",
          severity: "critical",
          title: "Lợi nhuận âm",
          description: `Doanh nghiệp đang lỗ ${Math.abs(
            profitAnalysis.profit.net
          ).toLocaleString("vi-VN")}₫`,
          currentValue: profitAnalysis.profit.net,
          threshold: 0,
          recommendation:
            "Cần xem xét lại chiến lược kinh doanh và cắt giảm chi phí ngay lập tức",
          isRead: false,
          isResolved: false,
        })
      );
    }

    // Check individual products for low margins
    profitAnalysis.profit.byProduct.forEach((product) => {
      if (product.netMargin < PROFIT_ALERT_THRESHOLDS.LOW_MARGIN) {
        newAlerts.push(
          this.createProfitAlert({
            type: "low_margin",
            severity: product.netMargin < 0 ? "critical" : "medium",
            title: `Sản phẩm có tỷ suất lợi nhuận thấp`,
            description: `${
              product.productTitle
            } có tỷ suất lợi nhuận ròng ${product.netMargin.toFixed(1)}%`,
            productId: product.productId,
            productTitle: product.productTitle,
            currentValue: product.netMargin,
            threshold: PROFIT_ALERT_THRESHOLDS.LOW_MARGIN,
            recommendation:
              "Xem xét điều chỉnh giá bán hoặc tối ưu hóa chi phí cho sản phẩm này",
            isRead: false,
            isResolved: false,
          })
        );
      }
    });

    return newAlerts;
  }

  // Profit forecasting
  generateProfitForecast(
    forecastPeriodDays: number,
    assumptions: {
      revenueGrowthRate: number;
      costInflationRate: number;
      seasonalityFactor: number;
    }
  ): ProfitForecast {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - forecastPeriodDays);

    const historicalAnalysis = this.getProfitAnalysis(startDate, endDate);
    const dailyRevenue = historicalAnalysis.revenue.total / forecastPeriodDays;
    const dailyCosts = historicalAnalysis.costs.total / forecastPeriodDays;

    const forecastStartDate = new Date();
    const forecastEndDate = new Date();
    forecastEndDate.setDate(forecastEndDate.getDate() + forecastPeriodDays);

    // Base forecast
    const baseRevenue =
      dailyRevenue *
      forecastPeriodDays *
      (1 + assumptions.revenueGrowthRate / 100) *
      assumptions.seasonalityFactor;
    const baseCosts =
      dailyCosts *
      forecastPeriodDays *
      (1 + assumptions.costInflationRate / 100);

    return {
      period: {
        startDate: forecastStartDate,
        endDate: forecastEndDate,
        label: `Dự báo ${forecastPeriodDays} ngày tới`,
      },
      forecast: {
        revenue: baseRevenue,
        costs: baseCosts,
        grossProfit: baseRevenue - baseCosts * 0.7, // Assume 70% of costs are COGS
        netProfit: baseRevenue - baseCosts,
        confidence: 75, // Base confidence level
      },
      assumptions,
      scenarios: {
        optimistic: {
          revenue: baseRevenue * 1.2,
          profit: baseRevenue * 1.2 - baseCosts,
          margin: ((baseRevenue * 1.2 - baseCosts) / (baseRevenue * 1.2)) * 100,
        },
        realistic: {
          revenue: baseRevenue,
          profit: baseRevenue - baseCosts,
          margin: ((baseRevenue - baseCosts) / baseRevenue) * 100,
        },
        pessimistic: {
          revenue: baseRevenue * 0.8,
          profit: baseRevenue * 0.8 - baseCosts,
          margin: ((baseRevenue * 0.8 - baseCosts) / (baseRevenue * 0.8)) * 100,
        },
      },
    };
  }
}

// Singleton instance
export const dataStore = new DataStore();

// Export types for use in components
export type { DataStoreEvent, EventListener };
