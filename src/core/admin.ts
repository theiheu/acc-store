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
  status: "Đang chờ xử lý" | "Hoàn thành" | "Đã huỷ" | "refunded";
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
  status: "Đang chờ xử lý" | "approved" | "rejected" | "Đã huỷ";
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
  search?: string; // Search by order ID or user email
  status?: Order["status"];
  productId?: string;
  dateFrom?: Date;
  dateTo?: Date;
  minAmount?: number;
  maxAmount?: number;
  sortBy?: "createdAt" | "totalAmount" | "status";
  sortOrder?: "asc" | "desc";
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
