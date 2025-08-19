import { NextRequest, NextResponse } from "next/server";
import {
  requireAdminPermission,
  logAdminAction,
  getCurrentAdmin,
} from "@/src/core/admin-auth";
import {
  AdminOrder,
  OrderSearchFilters,
  PaginatedResponse,
  OrderStats,
} from "@/src/core/admin";
import { dataStore } from "@/src/core/data-store";
import { ORDER_STATUS, orderStatusToViText } from "@/src/core/constants";

// GET /api/admin/orders - List orders with filtering and pagination
export async function GET(request: NextRequest) {
  // Check admin permission
  const authError = await requireAdminPermission(request, "canManageOrders");
  if (authError) return authError;

  try {
    const { searchParams } = new URL(request.url);

    // Parse filters from query parameters
    const filters: OrderSearchFilters = {
      search: searchParams.get("search") || undefined,
      status: (searchParams.get("status") as any) || undefined,
      productId: searchParams.get("productId") || undefined,
      categoryId: searchParams.get("categoryId") || undefined,
      paymentMethod: searchParams.get("paymentMethod") || undefined,
      customerId: searchParams.get("customerId") || undefined,
      hasRefund: searchParams.get("hasRefund") === "true" ? true : undefined,
      hasAdminNotes:
        searchParams.get("hasAdminNotes") === "true" ? true : undefined,
      sortBy: (searchParams.get("sortBy") as any) || "createdAt",
      sortOrder: (searchParams.get("sortOrder") as "asc" | "desc") || "desc",
      page: parseInt(searchParams.get("page") || "1"),
      limit: parseInt(searchParams.get("limit") || "20"),
    };

    // Parse date filters
    if (searchParams.get("dateFrom")) {
      filters.dateFrom = new Date(searchParams.get("dateFrom")!);
    }
    if (searchParams.get("dateTo")) {
      filters.dateTo = new Date(searchParams.get("dateTo")!);
    }
    if (searchParams.get("minAmount")) {
      filters.minAmount = parseFloat(searchParams.get("minAmount")!);
    }
    if (searchParams.get("maxAmount")) {
      filters.maxAmount = parseFloat(searchParams.get("maxAmount")!);
    }

    // Get all orders and users for enrichment
    const allOrders = dataStore.getAllOrders();
    const allUsers = dataStore.getUsers();
    const allProducts = dataStore.getProducts();

    // Create user and product lookup maps
    const usersMap = new Map(allUsers.map((u) => [u.id, u]));
    const productsMap = new Map(allProducts.map((p) => [p.id, p]));

    // Enrich orders with customer and product information
    let enrichedOrders: AdminOrder[] = allOrders.map((order) => {
      const user = usersMap.get(order.userId);
      const product = productsMap.get(order.productId);
      const selectedOption = product?.options?.find(
        (opt) => opt.id === order.selectedOptionId
      );

      return {
        ...order,
        customerEmail: user?.email || "Unknown",
        customerName: user?.name,
        customerBalance: user?.balance || 0,
        customerTotalOrders: allOrders.filter((o) => o.userId === order.userId)
          .length,
        productTitle: product?.title || "Unknown Product",
        productCategory: product?.category,
        selectedOptionLabel: selectedOption?.label,
        statusHistory: [], // TODO: Implement status history tracking
      };
    });

    // Apply filters
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      enrichedOrders = enrichedOrders.filter(
        (order) =>
          order.id.toLowerCase().includes(searchLower) ||
          order.customerEmail.toLowerCase().includes(searchLower) ||
          order.customerName?.toLowerCase().includes(searchLower) ||
          order.productTitle.toLowerCase().includes(searchLower)
      );
    }

    if (filters.status) {
      if (Array.isArray(filters.status)) {
        enrichedOrders = enrichedOrders.filter((order) =>
          filters.status!.includes(order.status)
        );
      } else {
        enrichedOrders = enrichedOrders.filter(
          (order) => order.status === filters.status
        );
      }
    }

    if (filters.productId) {
      enrichedOrders = enrichedOrders.filter(
        (order) => order.productId === filters.productId
      );
    }

    if (filters.customerId) {
      enrichedOrders = enrichedOrders.filter(
        (order) => order.userId === filters.customerId
      );
    }

    if (filters.paymentMethod) {
      enrichedOrders = enrichedOrders.filter(
        (order) => order.paymentMethod === filters.paymentMethod
      );
    }

    if (filters.hasRefund !== undefined) {
      enrichedOrders = enrichedOrders.filter((order) =>
        filters.hasRefund
          ? order.status === ORDER_STATUS.REFUNDED
          : order.status !== ORDER_STATUS.REFUNDED
      );
    }

    if (filters.hasAdminNotes !== undefined) {
      enrichedOrders = enrichedOrders.filter((order) =>
        filters.hasAdminNotes ? !!order.adminNotes : !order.adminNotes
      );
    }

    if (filters.dateFrom) {
      enrichedOrders = enrichedOrders.filter(
        (order) => new Date(order.createdAt) >= filters.dateFrom!
      );
    }

    if (filters.dateTo) {
      enrichedOrders = enrichedOrders.filter(
        (order) => new Date(order.createdAt) <= filters.dateTo!
      );
    }

    if (filters.minAmount !== undefined) {
      enrichedOrders = enrichedOrders.filter(
        (order) => order.totalAmount >= filters.minAmount!
      );
    }

    if (filters.maxAmount !== undefined) {
      enrichedOrders = enrichedOrders.filter(
        (order) => order.totalAmount <= filters.maxAmount!
      );
    }

    // Apply sorting
    enrichedOrders.sort((a, b) => {
      let aValue: any, bValue: any;

      switch (filters.sortBy) {
        case "createdAt":
          aValue = new Date(a.createdAt).getTime();
          bValue = new Date(b.createdAt).getTime();
          break;
        case "updatedAt":
          aValue = new Date(a.updatedAt).getTime();
          bValue = new Date(b.updatedAt).getTime();
          break;
        case "totalAmount":
          aValue = a.totalAmount;
          bValue = b.totalAmount;
          break;
        case "customerEmail":
          aValue = a.customerEmail.toLowerCase();
          bValue = b.customerEmail.toLowerCase();
          break;
        case "status":
          aValue = a.status;
          bValue = b.status;
          break;
        default:
          aValue = new Date(a.createdAt).getTime();
          bValue = new Date(b.createdAt).getTime();
      }

      if (filters.sortOrder === "asc") {
        return aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
      } else {
        return aValue > bValue ? -1 : aValue < bValue ? 1 : 0;
      }
    });

    // Apply pagination
    const page = filters.page || 1;
    const limit = Math.min(filters.limit || 20, 100); // Max 100 items per page
    const offset = (page - 1) * limit;
    const paginatedOrders = enrichedOrders.slice(offset, offset + limit);

    // Calculate statistics
    const stats: OrderStats = {
      totalOrders: enrichedOrders.length,
      pendingOrders: enrichedOrders.filter(
        (o) => o.status === ORDER_STATUS.PENDING
      ).length,
      processingOrders: enrichedOrders.filter(
        (o) => o.status === ORDER_STATUS.PROCESSING
      ).length,
      completedOrders: enrichedOrders.filter(
        (o) => o.status === ORDER_STATUS.COMPLETED
      ).length,
      cancelledOrders: enrichedOrders.filter(
        (o) => o.status === ORDER_STATUS.CANCELLED
      ).length,
      refundedOrders: enrichedOrders.filter(
        (o) => o.status === ORDER_STATUS.REFUNDED
      ).length,
      totalRevenue: enrichedOrders
        .filter((o) => o.status === ORDER_STATUS.COMPLETED)
        .reduce((sum, o) => sum + o.totalAmount, 0),
      averageOrderValue:
        enrichedOrders.length > 0
          ? enrichedOrders.reduce((sum, o) => sum + o.totalAmount, 0) /
            enrichedOrders.length
          : 0,
      todayOrders: enrichedOrders.filter((o) => {
        const today = new Date();
        const orderDate = new Date(o.createdAt);
        return orderDate.toDateString() === today.toDateString();
      }).length,
      todayRevenue: enrichedOrders
        .filter((o) => {
          const today = new Date();
          const orderDate = new Date(o.createdAt);
          return (
            orderDate.toDateString() === today.toDateString() &&
            o.status === ORDER_STATUS.COMPLETED
          );
        })
        .reduce((sum, o) => sum + o.totalAmount, 0),
      conversionRate:
        enrichedOrders.length > 0
          ? (enrichedOrders.filter((o) => o.status === ORDER_STATUS.COMPLETED)
              .length /
              enrichedOrders.length) *
            100
          : 0,
    };

    const response: PaginatedResponse<AdminOrder> = {
      data: paginatedOrders,
      pagination: {
        page,
        limit,
        total: enrichedOrders.length,
        totalPages: Math.ceil(enrichedOrders.length / limit),
        hasNext: offset + limit < enrichedOrders.length,
        hasPrev: page > 1,
      },
      stats,
    };

    return NextResponse.json({
      success: true,
      ...response,
    });
  } catch (error) {
    console.error("Admin orders list error:", error);
    return NextResponse.json(
      { success: false, error: "Có lỗi xảy ra khi tải danh sách đơn hàng" },
      { status: 500 }
    );
  }
}
