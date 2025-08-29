"use client";

import {
  createContext,
  useContext,
  useCallback,
  useEffect,
  useState,
  useMemo,
  ReactNode,
  useRef,
} from "react";
// removed server-only dataStore import
import {
  AdminUser,
  AdminProduct,
  UserTransaction,
  TopupRequest,
} from "@/src/core/admin";
import { Product } from "@/src/core/products";
import { User } from "@/src/core/auth";
import { useRealtimeUpdates } from "@/src/hooks/useRealtimeUpdates";
import { Category } from "@/src/core/categories";

// Lightweight debounce to coalesce rapid calls
function debounce<T extends (...args: any[]) => void>(fn: T, wait = 300) {
  let t: ReturnType<typeof setTimeout> | null = null;
  return (...args: Parameters<T>) => {
    if (t) clearTimeout(t);
    t = setTimeout(() => fn(...args), wait);
  };
}

// Simple cache for /api/products to reduce duplicate calls
const PRODUCTS_TTL_MS = 3000;
let productsCache: { at: number; data: Product[] } | null = null;
let productsInflight: Promise<Product[] | null> | null = null;
async function fetchPublicProducts(): Promise<Product[] | null> {
  const now = Date.now();
  if (productsCache && now - productsCache.at < PRODUCTS_TTL_MS) {
    return productsCache.data;
  }
  if (productsInflight) return productsInflight;

  productsInflight = fetch("/api/products")
    .then(async (r) => {
      const body = await r.json();
      if (body?.success && Array.isArray(body.data)) {
        productsCache = { at: Date.now(), data: body.data };
        return body.data as Product[];
      }
      return null;
    })
    .catch(() => null)
    .finally(() => {
      productsInflight = null;
    });

  return productsInflight;
}

interface DataSyncContextType {
  // User data
  users: AdminUser[];
  currentUser: User | null;
  getUserById: (id: string) => AdminUser | null;
  getUserByEmail: (email: string) => AdminUser | null;

  // Product data
  products: AdminProduct[];
  publicProducts: Product[];
  getProductById: (id: string) => AdminProduct | null;

  // Category data
  categories: Category[];

  // Transaction data
  transactions: UserTransaction[];
  getUserTransactions: (userId: string) => UserTransaction[];

  // Top-up request data
  topupRequests: TopupRequest[];
  getTopupRequests: () => TopupRequest[];
  getPendingTopupRequests: () => TopupRequest[];
  getUserTopupRequests: (userId: string) => TopupRequest[];

  // Statistics
  stats: {
    totalUsers: number;
    activeUsers: number;
    totalProducts: number;
    activeProducts: number;
    totalOrders: number;
    pendingOrders: number;
    totalRevenue: number;
    monthlyRevenue: number;
    averageOrderValue: number;
  };

  // Real-time updates
  lastUpdate: Date;
  refreshData: () => void;
  isInitialLoading: boolean;
}

const DataSyncContext = createContext<DataSyncContextType | null>(null);

interface DataSyncProviderProps {
  children: ReactNode;
  currentUserEmail?: string; // For identifying the current user
}

export function DataSyncProvider({
  children,
  currentUserEmail,
}: DataSyncProviderProps) {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [products, setProducts] = useState<AdminProduct[]>([]);
  const [publicProducts, setPublicProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [transactions, setTransactions] = useState<UserTransaction[]>([]);
  const [topupRequests, setTopupRequests] = useState<TopupRequest[]>([]);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [lastUpdate, setLastUpdate] = useState(new Date());
  const [isInitialLoading, setIsInitialLoading] = useState(true);

  // Mounted flag & abort refs to prevent memory leaks
  const mountedRef = useRef(true);
  const categoriesAbortRef = useRef<AbortController | null>(null);
  const refreshAbortRef = useRef<AbortController | null>(null);
  useEffect(() => {
    return () => {
      mountedRef.current = false;
      categoriesAbortRef.current?.abort();
      refreshAbortRef.current?.abort();
    };
  }, []);

  // Debounced refreshers to minimize duplicate fetches
  const refreshPublicProductsNow = useCallback(async () => {
    const fetched = await fetchPublicProducts();
    if (Array.isArray(fetched) && mountedRef.current)
      setPublicProducts(fetched);
  }, []);
  const refreshPublicProductsDebounced = useRef(
    debounce(() => void refreshPublicProductsNow(), 300)
  ).current;

  const refreshCategoriesDebounced = useRef(
    debounce(async () => {
      try {
        categoriesAbortRef.current?.abort();
        const ac = new AbortController();
        categoriesAbortRef.current = ac;
        const res = await fetch("/api/categories", { signal: ac.signal });
        const json = await res.json();
        if (
          !ac.signal.aborted &&
          mountedRef.current &&
          json?.success &&
          Array.isArray(json.data)
        ) {
          setCategories(json.data as Category[]);
        }
      } catch (e) {
        // ignore
      }
    }, 300)
  ).current;

  const onAnyProductChange = useCallback(() => {
    // When product changes are broadcast, refresh public products
    refreshPublicProductsDebounced();
    setLastUpdate(new Date());
  }, [refreshPublicProductsDebounced]);

  // Initial fetch (server APIs)
  useEffect(() => {
    (async () => {
      try {
        // Categories
        try {
          const res = await fetch("/api/categories", { cache: "no-store" });
          const json = await res.json();
          if (json?.success && Array.isArray(json.data))
            setCategories(json.data);
        } catch {}
        // Products
        const fetched = await fetchPublicProducts();
        if (Array.isArray(fetched)) setPublicProducts(fetched);
      } finally {
        setIsInitialLoading(false);
      }
    })();
  }, []);

  // Set up real-time updates
  const { isConnected } = useRealtimeUpdates({
    onUserUpdated: (data) => {
      // Merge updated user into local users state
      setUsers((prev) => {
        const next = [...prev];
        const idx = next.findIndex((u) => u.id === data.user.id);
        if (idx >= 0) next[idx] = data.user;
        else next.push(data.user);
        return next;
      });

      // Update current user if this is the same email
      if (currentUserEmail && data.user.email === currentUserEmail) {
        const u = data.user;
        const publicUser = {
          id: u.id,
          email: u.email,
          name: u.name,
          role: u.role,
          status: u.status,
          balance: u.balance,
          createdAt: u.createdAt,
          updatedAt: u.updatedAt,
          lastLoginAt: u.lastLoginAt,
        } as User;
        setCurrentUser(publicUser);
      }

      setLastUpdate(new Date());
    },
    onBalanceUpdated: (data: {
      userId: string;
      newBalance: number;
      userEmail?: string;
    }) => {
      // Update users array optimistically
      setUsers((prev) => {
        const updated = prev.map((u) =>
          u.id === data.userId ? { ...u, balance: data.newBalance } : u
        );
        return updated;
      });

      // Update current user by id or email match
      const matchesById = currentUser && currentUser.id === data.userId;
      const matchesByEmail =
        !matchesById && currentUserEmail && data.userEmail === currentUserEmail;

      if (matchesById || matchesByEmail) {
        setCurrentUser((prev) => {
          const updated = prev ? { ...prev, balance: data.newBalance } : prev;
          return updated;
        });
      }

      setLastUpdate(new Date());
    },
    onProductUpdated: () => {
      onAnyProductChange();
    },
    onProductDeleted: () => {
      onAnyProductChange();
    },
    onTransactionCreated: (data) => {
      const tx = data.transaction;
      setTransactions((prev) => [tx, ...prev]);
      if (currentUser && currentUser.id === tx.userId) {
        setCurrentUser((prev) =>
          prev
            ? {
                ...prev,
                balance: (prev.balance || 0) - Math.abs(tx.amount || 0),
              }
            : prev
        );
      }
      setLastUpdate(new Date());
    },
    onTopupRequestCreated: (data) => {
      // Merge created request into local state without reading from store
      const req = data.request;
      setTopupRequests((prev) => [req, ...prev.filter((r) => r.id !== req.id)]);
      setLastUpdate(new Date());
    },
    onTopupRequestUpdated: (data) => {
      // Merge updates into local state
      const req = data.request;
      setTopupRequests((prev) => prev.map((r) => (r.id === req.id ? req : r)));
      setLastUpdate(new Date());
    },
    onTopupRequestProcessed: (data) => {
      const req = data.request;
      setTopupRequests((prev) => prev.map((r) => (r.id === req.id ? req : r)));
      setLastUpdate(new Date());
    },
  });

  // Define refreshData function before useEffect
  const refreshData = useCallback(async () => {
    // Abort previous refresh if any
    refreshAbortRef.current?.abort();
    const ac = new AbortController();
    refreshAbortRef.current = ac;

    // Fetch public products
    try {
      const response = await fetch("/api/products", { signal: ac.signal });
      const result = await response.json();
      if (!ac.signal.aborted && result?.success && Array.isArray(result.data)) {
        setPublicProducts(result.data);
      }
    } catch {}

    // Fetch categories
    try {
      const res = await fetch("/api/categories", { signal: ac.signal });
      const json = await res.json();
      if (!ac.signal.aborted && json?.success && Array.isArray(json.data)) {
        setCategories(json.data);
      }
    } catch {}

    // Fetch current user (if email provided)
    if (currentUserEmail) {
      try {
        const userRes = await fetch(
          `/api/users/${encodeURIComponent(currentUserEmail)}`,
          { signal: ac.signal }
        );
        if (userRes.ok) {
          const body = await userRes.json();
          if (!ac.signal.aborted && body?.success) setCurrentUser(body.user);
        }
      } catch {}

      // Fetch user transactions
      try {
        const txRes = await fetch("/api/user/transactions", {
          signal: ac.signal,
        });
        if (txRes.ok) {
          const body = await txRes.json();
          if (!ac.signal.aborted && body?.success && Array.isArray(body.data)) {
            setTransactions(body.data);
          }
        }
      } catch {}

      // Fetch user topup requests
      try {
        const trRes = await fetch("/api/user/topup-request", {
          signal: ac.signal,
        });
        if (trRes.ok) {
          const body = await trRes.json();
          if (!ac.signal.aborted && body?.success && Array.isArray(body.data)) {
            setTopupRequests(body.data);
          }
        }
      } catch {}
    }

    if (!ac.signal.aborted) {
      setLastUpdate(new Date());
      setIsInitialLoading(false);
    }
  }, [currentUserEmail]);

  // Fetch all data on mount and when user changes
  useEffect(() => {
    refreshData();
  }, [refreshData]);

  // Set up current user: prefer users state (from SSE); fallback to dataStore
  useEffect(() => {
    if (!currentUserEmail) {
      setCurrentUser(null);
      return;
    }

    const fromUsers = users.find((u) => u.email === currentUserEmail);

    if (fromUsers) {
      const publicUser: User = {
        id: fromUsers.id,
        email: fromUsers.email,
        name: fromUsers.name,
        role: fromUsers.role,
        status: fromUsers.status,
        balance: fromUsers.balance,
        createdAt: fromUsers.createdAt as any,
        updatedAt: fromUsers.updatedAt as any,
        lastLoginAt: fromUsers.lastLoginAt as any,
      };
      setCurrentUser(publicUser);
    } else {
      // Fallback: keep currentUser as is; it will be populated by refreshData or SSE
    }
  }, [currentUserEmail, users]);

  // SSE subscription handled via useRealtimeUpdates above; no local datastore subscription

  // Compute lightweight stats on client as a fallback (admin uses API for full stats)
  const stats = useMemo(() => {
    const totalUsers = users.length;
    const activeUsers = users.filter(
      (u) => (u as any).status !== "inactive"
    ).length;
    const totalProducts = publicProducts.length;
    const activeProducts = publicProducts.length; // publicProducts are already active
    const totalOrders = 0;
    const pendingOrders = 0;
    const totalRevenue = 0;
    const monthlyRevenue = 0;
    const averageOrderValue = 0;
    return {
      totalUsers,
      activeUsers,
      totalProducts,
      activeProducts,
      totalOrders,
      pendingOrders,
      totalRevenue,
      monthlyRevenue,
      averageOrderValue,
    };
  }, [users, publicProducts]);

  // Topup helpers read from local state
  const getTopupRequests = useCallback((): TopupRequest[] => {
    return topupRequests;
  }, [topupRequests]);

  const getPendingTopupRequests = useCallback((): TopupRequest[] => {
    return topupRequests.filter((r) => r.status === "pending");
  }, [topupRequests]);

  const getUserTopupRequests = useCallback(
    (userId: string): TopupRequest[] => {
      return topupRequests.filter((r) => r.userId === userId);
    },
    [topupRequests]
  );

  // Admin product lookup (fallback to null if not available on client)
  const getProductById = useCallback(
    (id: string): AdminProduct | null => {
      return (products.find((p) => p.id === id) as AdminProduct) || null;
    },
    [products]
  );

  const getUserTransactions = useCallback(
    (userId: string): UserTransaction[] => {
      return transactions.filter((t) => t.userId === userId);
    },
    [transactions]
  );

  const getUserById = useCallback(
    (id: string): AdminUser | null => {
      return users.find((u) => u.id === id) || null;
    },
    [users]
  );

  const getUserByEmail = useCallback(
    (email: string): AdminUser | null => {
      const fromState = users.find((u) => u.email === email) || null;
      return fromState;
    },
    [users]
  );

  const value: DataSyncContextType = useMemo(
    () => ({
      users,
      currentUser,
      getUserById,
      getUserByEmail,
      products,
      publicProducts,
      getProductById,
      categories,
      transactions,
      getUserTransactions,
      topupRequests,
      getTopupRequests,
      getPendingTopupRequests,
      getUserTopupRequests,
      stats,
      lastUpdate,
      refreshData,
      isInitialLoading,
    }),
    [
      users,
      currentUser,
      getUserById,
      getUserByEmail,
      products,
      publicProducts,
      getProductById,
      categories,
      transactions,
      getUserTransactions,
      topupRequests,
      getTopupRequests,
      getPendingTopupRequests,
      getUserTopupRequests,
      stats,
      lastUpdate,
      refreshData,
      isInitialLoading,
    ]
  );

  return (
    <DataSyncContext.Provider value={value}>
      {children}
    </DataSyncContext.Provider>
  );
}

export function useDataSync() {
  const context = useContext(DataSyncContext);
  if (!context) {
    throw new Error("useDataSync must be used within a DataSyncProvider");
  }
  return context;
}

// Hook for current user data with real-time updates
export function useCurrentUser() {
  const { currentUser } = useDataSync();
  return currentUser;
}

// Hook to check if user is authenticated
export function useIsAuthenticated() {
  const currentUser = useCurrentUser();
  return currentUser !== null;
}

// Hook for products with real-time updates
export function useProducts() {
  const { publicProducts } = useDataSync();
  return publicProducts;
}

// Hook for products with loading state
export function useProductsWithLoading() {
  const { publicProducts, isInitialLoading } = useDataSync();

  // Use useMemo to ensure consistent return values and prevent conditional logic
  const result = useMemo(() => {
    // Ensure publicProducts is always an array
    const safeProducts = Array.isArray(publicProducts) ? publicProducts : [];

    // Force show products if available, ignore loading state
    const shouldShowLoading = safeProducts.length === 0 && isInitialLoading;

    return {
      products: safeProducts,
      isLoading: shouldShowLoading,
    };
  }, [publicProducts, isInitialLoading]);

  return result;
}

// Hook for user balance with real-time updates
export function useUserBalance(userEmail?: string) {
  const { currentUser, getUserByEmail } = useDataSync();

  // Use useMemo to avoid conditional logic affecting hook order
  const balance = useMemo(() => {
    if (userEmail && userEmail !== currentUser?.email) {
      const user = getUserByEmail(userEmail);
      return user?.balance || 0;
    }
    return currentUser?.balance || 0;
  }, [userEmail, currentUser, getUserByEmail]);

  return balance;
}

// Hook for admin dashboard stats with real-time updates (fallback)
export function useDashboardStats() {
  const { stats, publicProducts, users } = useDataSync();

  // Recent users (fallback): last 10 by createdAt
  const recentUsers = [...users]
    .sort((a, b) => {
      const ta = a.createdAt ? new Date(a.createdAt as any).getTime() : 0;
      const tb = b.createdAt ? new Date(b.createdAt as any).getTime() : 0;
      return tb - ta;
    })
    .slice(0, 10);

  // Top-selling fallback from public products by soldCount
  const topSellingProducts = [...publicProducts]
    .sort((a, b) => (b.soldCount || 0) - (a.soldCount || 0))
    .slice(0, 3)
    .map((p) => {
      const unitPrice = p.price ?? p.options?.[0]?.price ?? 0;
      const sold = p.soldCount || 0;
      return {
        productId: p.id,
        productTitle: p.title,
        salesCount: sold,
        revenue: sold * unitPrice,
      };
    });

  // No local activity log on client; provide empty fallback
  const recentActivity: any[] = [];

  return {
    ...stats,
    topSellingProducts,
    recentActivity,
    recentUsers,
  };
}
