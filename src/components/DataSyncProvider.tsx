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
import { dataStore, DataStoreEvent } from "@/src/core/data-store";
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
    // Immediate fallback from dataStore for responsiveness
    setPublicProducts(dataStore.getPublicProducts());
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
    setProducts(dataStore.getProducts());
    refreshPublicProductsDebounced();
    setLastUpdate(new Date());
  }, [refreshPublicProductsDebounced]);

  // Force load data immediately on mount
  useEffect(() => {
    dataStore.ensureProductsLoaded();
    const products = dataStore.getPublicProducts();
    const categories = dataStore.getCategories();

    if (products.length > 0) {
      setPublicProducts(products);
      setIsInitialLoading(false);
    }

    setCategories(categories);
    console.log(
      "DataSyncProvider: Initial categories loaded:",
      categories.length
    );
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

      setTransactions(dataStore.getTransactions());
      setLastUpdate(new Date());
    },
    onProductUpdated: () => {
      onAnyProductChange();
    },
    onProductDeleted: () => {
      onAnyProductChange();
    },
    onTransactionCreated: (data) => {
      setTransactions(dataStore.getTransactions());
      setUsers(dataStore.getUsers()); // Update users in case balance changed
      if (currentUser && currentUser.id === data.transaction.userId) {
        // Refresh current user data to get updated balance
        const updatedUser = dataStore.getPublicUser(currentUserEmail!);
        setCurrentUser(updatedUser);
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
      setUsers(dataStore.getUsers()); // Update users in case balance changed
      setTransactions(dataStore.getTransactions()); // Update transactions
      if (currentUser && currentUser.id === data.request.userId) {
        // Refresh current user data to get updated balance
        const updatedUser = dataStore.getPublicUser(currentUserEmail!);
        setCurrentUser(updatedUser);
      }
      setLastUpdate(new Date());
    },
  });

  // Define refreshData function before useEffect
  const refreshData = useCallback(async () => {
    // Abort previous refresh if any
    refreshAbortRef.current?.abort();
    const ac = new AbortController();
    refreshAbortRef.current = ac;

    // Load products first
    setProducts(dataStore.getProducts());

    // Set immediate fallback from dataStore first
    const immediateProducts = dataStore.getPublicProducts();
    setPublicProducts(immediateProducts);

    // Then fetch public products from API endpoint (with abort)
    try {
      const response = await fetch("/api/products", { signal: ac.signal });
      const result = await response.json();
      if (!ac.signal.aborted) {
        if (result.success) {
          setPublicProducts(result.data);
        } else {
          setPublicProducts(dataStore.getPublicProducts());
        }
      }
    } catch (error) {
      if (!ac.signal.aborted) {
        setPublicProducts(dataStore.getPublicProducts());
      }
    }

    // Users
    setUsers(dataStore.getUsers());

    if (currentUserEmail) {
      let user = dataStore.getPublicUser(currentUserEmail);

      if (!user) {
        try {
          const response = await fetch("/api/auth/session", {
            signal: ac.signal,
          });
          const session = await response.json();
          if (ac.signal.aborted) return;

          if (session?.user) {
            try {
              const userResponse = await fetch(
                `/api/users/${session.user.email}`,
                {
                  signal: ac.signal,
                }
              );
              if (userResponse.ok) {
                const userData = await userResponse.json();
                if (!ac.signal.aborted && userData.success && userData.user) {
                  dataStore.createUser({
                    ...userData.user,
                    registrationSource: "reload-recovery",
                  });
                  user = dataStore.getPublicUser(currentUserEmail);
                }
              }
            } catch {}

            if (!user && !ac.signal.aborted) {
              dataStore.createUser({
                email: session.user.email,
                name: session.user.name || session.user.email.split("@")[0],
                role: "user",
                status: "active",
                balance: 0,
                totalOrders: 0,
                totalSpent: 0,
                registrationSource: "reload-recovery",
              });
              user = dataStore.getPublicUser(currentUserEmail);
            }
          }
        } catch {}
      }

      if (!ac.signal.aborted) setCurrentUser(user);
    }

    if (!ac.signal.aborted) {
      setTransactions(dataStore.getTransactions());
      setLastUpdate(new Date());
      setIsInitialLoading(false);
    }
  }, [currentUserEmail]);

  // Initialize data
  useEffect(() => {
    // Ensure dataStore has products loaded
    dataStore.ensureProductsLoaded();

    // Check if dataStore has products immediately
    const immediateProducts = dataStore.getPublicProducts();

    if (immediateProducts.length > 0) {
      setPublicProducts(immediateProducts);
      setIsInitialLoading(false);
    }

    const initializeData = async () => {
      try {
        await refreshData();
      } catch (error) {
        console.error("DataSyncProvider: Failed to load initial data", error);
      } finally {
        setIsInitialLoading(false);
      }
    };
    initializeData();
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
      const dataStoreUser = dataStore.getPublicUser(currentUserEmail);
      setCurrentUser(dataStoreUser);
    }
  }, [currentUserEmail, users]);

  // Subscribe to real-time updates
  useEffect(() => {
    const unsubscribe = dataStore.subscribe((event: DataStoreEvent) => {
      setLastUpdate(new Date());

      switch (event.type) {
        case "USER_CREATED":
        case "USER_UPDATED":
          setUsers(dataStore.getUsers());
          if (
            currentUserEmail &&
            (event as any).payload.email === currentUserEmail
          ) {
            setCurrentUser(dataStore.getPublicUser(currentUserEmail));
          }
          break;

        case "USER_BALANCE_CHANGED":
          setUsers(dataStore.getUsers());
          if (currentUser && currentUser.id === (event as any).payload.userId) {
            setCurrentUser((prev) =>
              prev
                ? { ...prev, balance: (event as any).payload.newBalance }
                : null
            );
          }
          break;

        case "PRODUCT_CREATED":
        case "PRODUCT_UPDATED":
          onAnyProductChange();
          break;

        case "PRODUCT_DELETED":
          onAnyProductChange();
          break;

        case "TRANSACTION_CREATED":
          setTransactions(dataStore.getTransactions());
          if (currentUser && currentUser.id === (event as any).payload.userId) {
            const updatedUser = dataStore.getPublicUser(currentUserEmail!);
            setCurrentUser(updatedUser);
          }
          break;

        case "CATEGORY_CREATED":
        case "CATEGORY_UPDATED":
        case "CATEGORY_DELETED":
          refreshCategoriesDebounced();
          break;
      }
    });

    return unsubscribe;
  }, [
    currentUserEmail,
    currentUser,
    onAnyProductChange,
    refreshCategoriesDebounced,
  ]);

  const stats = dataStore.getStats();

  const getTopupRequests = useCallback((): TopupRequest[] => {
    return dataStore.getTopupRequests();
  }, []);

  const getPendingTopupRequests = useCallback((): TopupRequest[] => {
    return dataStore.getPendingTopupRequests();
  }, []);

  const getUserTopupRequests = useCallback((userId: string): TopupRequest[] => {
    return dataStore.getUserTopupRequests(userId);
  }, []);

  const getProductById = useCallback((id: string): AdminProduct | null => {
    return dataStore.getProduct(id);
  }, []);

  const getUserTransactions = useCallback(
    (userId: string): UserTransaction[] => {
      return dataStore.getUserTransactions(userId);
    },
    []
  );

  const getUserById = useCallback((id: string): AdminUser | null => {
    return dataStore.getUser(id);
  }, []);

  const getUserByEmail = useCallback(
    (email: string): AdminUser | null => {
      const fromState = users.find((u) => u.email === email) || null;
      return fromState || dataStore.getUserByEmail(email);
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

// Hook for admin dashboard stats with real-time updates
export function useDashboardStats() {
  const { stats } = useDataSync();

  const recentUsers = dataStore.getRecentUsers(10);
  const products = dataStore.getProducts();
  const topSellingProducts = [...products]
    .sort((a, b) => (b.sold || 0) - (a.sold || 0))
    .slice(0, 3)
    .map((product) => ({
      productId: product.id,
      productTitle: product.title,
      salesCount: product.sold || 0,
      revenue: (product.sold || 0) * ((product as any).price ?? 0),
    }));
  const recentActivity = dataStore.getRecentActivity(10);

  return {
    ...stats,
    topSellingProducts,
    recentActivity,
    recentUsers,
  };
}
