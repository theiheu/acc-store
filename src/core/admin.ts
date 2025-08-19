import { User, UserRole, UserStatus } from "./auth";
import { Product } from "./products";

// Admin-specific user management types
export interface AdminUser extends User {
  totalOrders: number;
  totalSpent: number;
  registrationSource?: string;
}

export interface UserTransaction {
  id: string;
  userId: string;
  type: "credit" | "debit" | "purchase" | "refund";
  amount: number;
  description: string;
  orderId?: string;
  adminId?: string; // ID of admin who performed the action
  createdAt: Date;
  metadata?: Record<string, any>;
}

export interface UserTopUpRequest {
  userId: string;
  amount: number;
  description: string;
  adminNote?: string;
}

// Supplier integration types
export interface SupplierInfo {
  provider: "taphoammo" | "manual";
  kioskToken?: string; // Upstream product identifier (for taphoammo)
  basePrice?: number; // Giá gốc từ nhà cung cấp
  markupPercent?: number; // % lợi nhuận áp dụng trên basePrice
  lastStock?: number; // Số lượng tồn kho mới nhất từ upstream
  lastSyncedAt?: Date;
  autoSync?: boolean;
}

// Product management types
export interface AdminProduct extends Product {
  stock: number;
  sold: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  createdBy: string; // Admin ID
  lastModifiedBy: string; // Admin ID
  supplier?: SupplierInfo; // Thông tin nhà cung cấp (tùy chọn)
}

export interface ProductInventory {
  productId: string;
  stock: number;
  reserved: number; // Items in pending orders
  lowStockThreshold: number;
  restockDate?: Date;
  supplier?: string;
  cost: number; // Cost price for profit calculation
}

export interface BulkProductOperation {
  action: "update_price" | "update_stock" | "toggle_active" | "delete";
  productIds: string[];
  data?: {
    price?: number;
    priceChangePercent?: number; // Percentage change for bulk price updates
    stock?: number;
    stockModifier?: number; // Add/subtract from current stock
    isActive?: boolean;
  };
}

// Order management types
export interface Order {
  id: string;
  userId: string;
  productId: string;
  quantity: number;
  unitPrice: number;
  totalAmount: number;
  status: import("@/src/core/constants").OrderStatus;
  paymentMethod?: string;
  paymentId?: string;
  selectedOptionId?: string; // Selected product option ID
  deliveryInfo?: string; // Account details delivered to user
  createdAt: Date;
  updatedAt: Date;
  completedAt?: Date;
  cancelledAt?: Date;
  refundedAt?: Date;
  adminNotes?: string;
}

// Extended order interface for admin management
export interface AdminOrder extends Order {
  // Customer information
  customerEmail: string;
  customerName?: string;
  customerBalance: number;
  customerTotalOrders: number;

  // Product information
  productTitle: string;
  productCategory?: string;
  selectedOptionLabel?: string;

  // Payment and processing details
  processingStartedAt?: Date;
  shippedAt?: Date;
  deliveredAt?: Date;
  refundAmount?: number;
  refundReason?: string;
  refundedBy?: string; // Admin ID who processed refund

  // Admin tracking
  lastModifiedBy?: string; // Admin ID
  lastModifiedByName?: string; // Admin name
  statusHistory: OrderStatusChange[];
}

// Order status change tracking
export interface OrderStatusChange {
  id: string;
  orderId: string;
  fromStatus: import("@/src/core/constants").OrderStatus;
  toStatus: import("@/src/core/constants").OrderStatus;
  changedBy: string; // Admin ID
  changedByName: string; // Admin name
  reason?: string;
  notes?: string;
  changedAt: Date;
  ipAddress?: string;
}

// Order statistics for dashboard
export interface OrderStats {
  totalOrders: number;
  pendingOrders: number;
  processingOrders: number;
  completedOrders: number;
  cancelledOrders: number;
  refundedOrders: number;
  totalRevenue: number;
  averageOrderValue: number;
  todayOrders: number;
  todayRevenue: number;
  conversionRate: number;
  // Profit metrics
  totalProfit: number;
  averageProfit: number;
  todayProfit: number;
  profitMargin: number; // Overall profit margin percentage
  totalCosts: number;
}

// Extended order statistics with profit trends
export interface ExtendedOrderStats extends OrderStats {
  weekly: {
    orders: number;
    revenue: number;
    profit: number;
    costs: number;
  };
  monthly: {
    orders: number;
    revenue: number;
    profit: number;
    costs: number;
  };
  dailyTrends: Array<{
    date: string;
    orders: number;
    revenue: number;
    profit: number;
    costs: number;
    completed: number;
    profitMargin: number;
  }>;
  topProductsByProfit: Array<{
    productId: string;
    productTitle: string;
    orderCount: number;
    revenue: number;
    profit: number;
    profitMargin: number;
    costs: number;
  }>;
  profitDistribution: {
    highMargin: { count: number; percentage: number }; // >30%
    mediumMargin: { count: number; percentage: number }; // 10-30%
    lowMargin: { count: number; percentage: number }; // 0-10%
    negative: { count: number; percentage: number }; // <0%
  };
}

// Dashboard statistics types
export interface DashboardStats {
  totalUsers: number;
  activeUsers: number; // Users active in last 30 days
  totalProducts: number;
  activeProducts: number;
  totalOrders: number;
  pendingOrders: number;
  totalRevenue: number;
  monthlyRevenue: number;
  averageOrderValue: number;
  topSellingProducts: Array<{
    productId: string;
    productTitle: string;
    salesCount: number;
    revenue: number;
  }>;
  recentActivity: ActivityLog[];
}

export interface RevenueData {
  date: string;
  revenue: number;
  orders: number;
}

export interface UserGrowthData {
  date: string;
  newUsers: number;
  totalUsers: number;
}

// Activity logging types
export interface ActivityLog {
  id: string;
  adminId: string;
  adminName: string;
  action: string;
  targetType: "user" | "product" | "order" | "system" | "topup-request";
  targetId?: string;
  description: string;
  metadata?: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
  createdAt: Date;
}

// Top-up request management types
export interface TopupRequest {
  id: string;
  userId: string;
  userEmail: string;
  userName: string;
  requestedAmount: number;
  approvedAmount?: number;
  userNotes?: string;
  adminNotes?: string;
  status: import("@/src/core/constants").TopupStatus;
  createdAt: Date;
  processedAt?: Date;
  processedBy?: string; // Admin ID
  processedByName?: string; // Admin name
  transactionId?: string; // Created when approved
  rejectionReason?: string;
  // QR Code integration
  qrCodeData?: string; // QR code data for payment
  transferContent?: string; // Bank transfer content
  bankInfo?: {
    bankName: string;
    accountNumber: string;
    accountName: string;
    bankCode: string;
  };
}

export interface AuditLogEntry {
  id: string;
  adminId: string;
  action:
    | "user_credit_add"
    | "user_status_change"
    | "product_create"
    | "product_update"
    | "product_delete"
    | "order_update";
  targetId: string;
  oldValue?: any;
  newValue?: any;
  reason?: string;
  createdAt: Date;
}

// Admin permissions and roles
export interface AdminPermissions {
  canManageUsers: boolean;
  canManageProducts: boolean;
  canManageCategories: boolean;
  canManageOrders: boolean;
  canViewAnalytics: boolean;
  canManageAdmins: boolean;
  canAccessAuditLogs: boolean;
  canPerformBulkOperations: boolean;
}

export interface AdminProfile {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  permissions: AdminPermissions;
  createdAt: Date;
  lastLoginAt?: Date;
  isActive: boolean;
}

// API request/response types
export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface UserSearchFilters {
  search?: string; // Search by name or email
  role?: UserRole;
  status?: UserStatus;
  registrationDateFrom?: Date;
  registrationDateTo?: Date;
  minBalance?: number;
  maxBalance?: number;
  sortBy?: "name" | "email" | "createdAt" | "balance" | "lastLoginAt";
  sortOrder?: "asc" | "desc";
}

export interface ProductSearchFilters {
  search?: string; // Search by title or description
  category?: string;
  isActive?: boolean;
  minPrice?: number;
  maxPrice?: number;
  lowStock?: boolean; // Products with stock below threshold
  sortBy?: "title" | "price" | "stock" | "sold" | "createdAt";
  sortOrder?: "asc" | "desc";
}

export interface OrderSearchFilters {
  search?: string; // Search by order ID, user email, or customer name
  status?: Order["status"] | Order["status"][];
  productId?: string;
  categoryId?: string;
  paymentMethod?: string;
  dateFrom?: Date;
  dateTo?: Date;
  minAmount?: number;
  maxAmount?: number;
  customerId?: string;
  hasRefund?: boolean;
  hasAdminNotes?: boolean;
  sortBy?:
    | "createdAt"
    | "totalAmount"
    | "status"
    | "customerEmail"
    | "updatedAt";
  sortOrder?: "asc" | "desc";
  page?: number;
  limit?: number;
}

// Order bulk operations
export interface BulkOrderOperation {
  action: "update_status" | "add_notes" | "export" | "refund";
  orderIds: string[];
  data?: {
    status?: Order["status"];
    notes?: string;
    refundReason?: string;
    refundAmount?: number;
  };
}

// Order refund request
export interface OrderRefundRequest {
  orderId: string;
  amount: number;
  reason: string;
  adminNotes?: string;
  notifyCustomer?: boolean;
}

// Order export configuration
export interface OrderExportConfig {
  format: "csv" | "excel" | "pdf";
  filters: OrderSearchFilters;
  fields: string[];
  dateRange?: {
    from: Date;
    to: Date;
  };
}

// Form validation types
export interface ValidationError {
  field: string;
  message: string;
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  errors?: ValidationError[];
}

// Default admin permissions
export const DEFAULT_ADMIN_PERMISSIONS: AdminPermissions = {
  canManageUsers: true,
  canManageProducts: true,
  canManageCategories: true,
  canManageOrders: true,
  canViewAnalytics: true,
  canManageAdmins: false,
  canAccessAuditLogs: true,
  canPerformBulkOperations: true,
};

// Helper functions
export function isAdmin(user: User | null): boolean {
  return user?.role === "admin";
}

export function hasPermission(
  admin: AdminProfile,
  permission: keyof AdminPermissions
): boolean {
  return admin.permissions[permission];
}

export function formatCurrency(
  amount: number,
  currency: string = "VND"
): string {
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency,
    currencyDisplay: "narrowSymbol",
  }).format(amount);
}

export function calculateProfitMargin(
  sellingPrice: number,
  costPrice: number
): number {
  if (costPrice === 0) return 0;
  return ((sellingPrice - costPrice) / sellingPrice) * 100;
}

// Calculate profit for an order
export function calculateOrderProfit(
  order: AdminOrder,
  product?: Product
): { profit: number; cost: number; margin: number } {
  if (!product) {
    return { profit: 0, cost: 0, margin: 0 };
  }

  let costPrice = 0;
  let sellingPrice = order.unitPrice;

  // Get cost from product option if available
  if (order.selectedOptionId && product.options) {
    const selectedOption = product.options.find(
      (opt) => opt.id === order.selectedOptionId
    );
    if (selectedOption?.basePrice) {
      costPrice = selectedOption.basePrice;
    }
  }

  // Fallback to product base price or estimate
  if (costPrice === 0) {
    // If no cost data available, estimate based on selling price (conservative 70% cost ratio)
    costPrice = sellingPrice * 0.7;
  }

  const totalCost = costPrice * order.quantity;
  const profit = order.totalAmount - totalCost;
  const margin = calculateProfitMargin(order.totalAmount, totalCost);

  return {
    profit,
    cost: totalCost,
    margin,
  };
}

// Calculate profit for multiple orders
export function calculateOrdersProfit(
  orders: AdminOrder[],
  productsMap: Map<string, Product>
): { totalProfit: number; totalCosts: number; averageMargin: number } {
  let totalProfit = 0;
  let totalCosts = 0;
  let totalRevenue = 0;

  orders.forEach((order) => {
    const product = productsMap.get(order.productId);
    const { profit, cost } = calculateOrderProfit(order, product);

    totalProfit += profit;
    totalCosts += cost;
    totalRevenue += order.totalAmount;
  });

  const averageMargin =
    totalRevenue > 0 ? calculateProfitMargin(totalRevenue, totalCosts) : 0;

  return {
    totalProfit,
    totalCosts,
    averageMargin,
  };
}

// Get profit margin category
export function getProfitMarginCategory(
  margin: number
): "high" | "medium" | "low" | "negative" {
  if (margin < 0) return "negative";
  if (margin < 10) return "low";
  if (margin < 30) return "medium";
  return "high";
}

// Format profit margin with color coding
export function formatProfitMargin(margin: number): {
  text: string;
  color: string;
  bgColor: string;
} {
  const category = getProfitMarginCategory(margin);
  const text = `${margin.toFixed(1)}%`;

  switch (category) {
    case "high":
      return {
        text,
        color: "text-green-700 dark:text-green-400",
        bgColor: "bg-green-100 dark:bg-green-300/10",
      };
    case "medium":
      return {
        text,
        color: "text-blue-700 dark:text-blue-400",
        bgColor: "bg-blue-100 dark:bg-blue-300/10",
      };
    case "low":
      return {
        text,
        color: "text-yellow-700 dark:text-yellow-400",
        bgColor: "bg-yellow-100 dark:bg-yellow-300/10",
      };
    case "negative":
      return {
        text,
        color: "text-red-700 dark:text-red-400",
        bgColor: "bg-red-100 dark:bg-red-300/10",
      };
  }
}
