"use client";

import {
  createContext,
  useContext,
  useCallback,
  useEffect,
  useState,
  ReactNode,
} from "react";
import { dataStore, DataStoreEvent } from "@/src/core/data-store";
import { AdminUser, AdminProduct, UserTransaction } from "@/src/core/admin";
import { Product } from "@/src/core/products";
import { User } from "@/src/core/auth";
import { useRealtimeUpdates } from "@/src/hooks/useRealtimeUpdates";

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

  // Transaction data
  transactions: UserTransaction[];
  getUserTransactions: (userId: string) => UserTransaction[];

  // Top-up request data
  topupRequests: any[];
  getTopupRequests: () => any[];
  getPendingTopupRequests: () => any[];
  getUserTopupRequests: (userId: string) => any[];

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
  const [transactions, setTransactions] = useState<UserTransaction[]>([]);
  const [topupRequests, setTopupRequests] = useState<any[]>([]);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [lastUpdate, setLastUpdate] = useState(new Date());
  const [isInitialLoading, setIsInitialLoading] = useState(true);

  // Force load products immediately on mount
  useEffect(() => {
    dataStore.ensureProductsLoaded();
    const products = dataStore.getPublicProducts();
    if (products.length > 0) {
      setPublicProducts(products);
      setIsInitialLoading(false);
    }
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
    onProductUpdated: async (data) => {
      setProducts(dataStore.getProducts());

      // Refresh public products from API
      try {
        const response = await fetch("/api/products");
        const result = await response.json();
        if (result.success) {
          setPublicProducts(result.data);
        } else {
          setPublicProducts(dataStore.getPublicProducts());
        }
      } catch (error) {
        setPublicProducts(dataStore.getPublicProducts());
      }

      setLastUpdate(new Date());
    },
    onProductDeleted: async (data) => {
      setProducts(dataStore.getProducts());

      // Refresh public products from API
      try {
        const response = await fetch("/api/products");
        const result = await response.json();
        if (result.success) {
          setPublicProducts(result.data);
        } else {
          setPublicProducts(dataStore.getPublicProducts());
        }
      } catch (error) {
        setPublicProducts(dataStore.getPublicProducts());
      }

      setLastUpdate(new Date());
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
    // Load products first
    setProducts(dataStore.getProducts());

    // Set immediate fallback from dataStore first
    const immediateProducts = dataStore.getPublicProducts();
    setPublicProducts(immediateProducts);

    // Then fetch public products from API endpoint
    try {
      const response = await fetch("/api/products");
      const result = await response.json();
      if (result.success) {
        setPublicProducts(result.data);
      } else {
        // Fallback to direct dataStore call
        const fallbackProducts = dataStore.getPublicProducts();
        setPublicProducts(fallbackProducts);
      }
    } catch (error) {
      // Fallback to direct dataStore call
      const fallbackProducts = dataStore.getPublicProducts();
      setPublicProducts(fallbackProducts);
    }

    // Handle users...
    setUsers(dataStore.getUsers());

    if (currentUserEmail) {
      let user = dataStore.getPublicUser(currentUserEmail);

      if (!user) {
        const response = await fetch("/api/auth/session");
        const session = await response.json();

        if (session?.user) {
          // Try load user from API first
          try {
            const userResponse = await fetch(
              `/api/users/${session.user.email}`
            );
            if (userResponse.ok) {
              const userData = await userResponse.json();
              if (userData.success && userData.user) {
                // Create user with API data
                const newUser = dataStore.createUser({
                  ...userData.user,
                  registrationSource: "reload-recovery",
                });
                user = dataStore.getPublicUser(currentUserEmail);
                return;
              }
            }
          } catch (error) {
            // Fallback to creating new user
          }

          // Fallback: create new user with balance = 0
          const newUser = dataStore.createUser({
            email: session.user.email,
            name: session.user.name || session.user.email.split("@")[0],
            role: "user",
            status: "active",
            balance: 0, // Will be updated from SSE
            totalOrders: 0,
            totalSpent: 0,
            registrationSource: "reload-recovery",
          });
          user = dataStore.getPublicUser(currentUserEmail);
        }
      }

      setCurrentUser(user);
    }

    setTransactions(dataStore.getTransactions());
    setLastUpdate(new Date());

    // Mark initial loading as complete
    setIsInitialLoading(false);
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
          // Update current user if it's the same user
          if (currentUserEmail && event.payload.email === currentUserEmail) {
            setCurrentUser(dataStore.getPublicUser(currentUserEmail));
          }
          break;

        case "USER_BALANCE_CHANGED":
          setUsers(dataStore.getUsers());
          // Update current user balance if it's the same user
          if (currentUser && currentUser.id === event.payload.userId) {
            setCurrentUser((prev) =>
              prev ? { ...prev, balance: event.payload.newBalance } : null
            );
          }
          break;

        case "PRODUCT_CREATED":
        case "PRODUCT_UPDATED":
          setProducts(dataStore.getProducts());
          // Refresh public products from API
          fetch("/api/products")
            .then((res) => res.json())
            .then((result) => {
              if (result.success) {
                setPublicProducts(result.data);
              } else {
                setPublicProducts(dataStore.getPublicProducts());
              }
            })
            .catch((error) => {
              console.error("DataSyncProvider: API error", error);
              setPublicProducts(dataStore.getPublicProducts());
            });
          break;

        case "PRODUCT_DELETED":
          setProducts(dataStore.getProducts());
          // Refresh public products from API
          fetch("/api/products")
            .then((res) => res.json())
            .then((result) => {
              if (result.success) {
                setPublicProducts(result.data);
              } else {
                setPublicProducts(dataStore.getPublicProducts());
              }
            })
            .catch(() => {
              setPublicProducts(dataStore.getPublicProducts());
            });
          break;

        case "TRANSACTION_CREATED":
          setTransactions(dataStore.getTransactions());
          // Update current user if this transaction affects them
          if (currentUser && currentUser.id === event.payload.userId) {
            const updatedUser = dataStore.getPublicUser(currentUserEmail!);
            setCurrentUser(updatedUser);
          }
          break;
      }
    });

    return unsubscribe;
  }, [currentUserEmail, currentUser]);

  const getUserById = (id: string): AdminUser | null => {
    return dataStore.getUser(id);
  };

  const getUserByEmail = (email: string): AdminUser | null => {
    const fromState = users.find((u) => u.email === email) || null;
    return fromState || dataStore.getUserByEmail(email);
  };

  const getProductById = (id: string): AdminProduct | null => {
    return dataStore.getProduct(id);
  };

  const getUserTransactions = (userId: string): UserTransaction[] => {
    return dataStore.getUserTransactions(userId);
  };

  const stats = dataStore.getStats();

  const getTopupRequests = (): any[] => {
    return dataStore.getTopupRequests();
  };

  const getPendingTopupRequests = (): any[] => {
    return dataStore.getPendingTopupRequests();
  };

  const getUserTopupRequests = (userId: string): any[] => {
    return dataStore.getUserTopupRequests(userId);
  };

  const value: DataSyncContextType = {
    users,
    currentUser,
    getUserById,
    getUserByEmail,
    products,
    publicProducts,
    getProductById,
    transactions,
    getUserTransactions,
    topupRequests,
    getTopupRequests,
    getPendingTopupRequests,
    getUserTopupRequests,
    stats,
    lastUpdate,
    refreshData,
    isInitialLoading: false, // Force disable loading
  };

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

  // Force show products if available, ignore loading state
  const shouldShowLoading = publicProducts.length === 0 && isInitialLoading;

  return {
    products: publicProducts,
    isLoading: shouldShowLoading,
  };
}

// Hook for user balance with real-time updates
export function useUserBalance(userEmail?: string) {
  const { currentUser, getUserByEmail } = useDataSync();

  if (userEmail && userEmail !== currentUser?.email) {
    const user = getUserByEmail(userEmail);
    return user?.balance || 0;
  }

  return currentUser?.balance || 0;
}

// Hook for admin dashboard stats with real-time updates
export function useDashboardStats() {
  const { stats } = useDataSync();

  // Add recent users to stats
  const recentUsers = dataStore.getRecentUsers(10);

  return {
    ...stats,
    recentUsers,
  };
}
