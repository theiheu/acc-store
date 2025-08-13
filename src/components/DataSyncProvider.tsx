"use client";

import {
  createContext,
  useContext,
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
      console.log("Balance updated event received:", data);

      // Update users array optimistically
      setUsers((prev) =>
        prev.map((u) =>
          u.id === data.userId ? { ...u, balance: data.newBalance } : u
        )
      );

      // Update current user by id or email match
      const matchesById = currentUser && currentUser.id === data.userId;
      const matchesByEmail =
        !matchesById && currentUserEmail && data.userEmail === currentUserEmail;

      if (matchesById || matchesByEmail) {
        setCurrentUser((prev) =>
          prev ? { ...prev, balance: data.newBalance } : prev
        );
      }

      setTransactions(dataStore.getTransactions()); // refresh transactions list
      setLastUpdate(new Date());
    },
    onProductUpdated: (data) => {
      setProducts(dataStore.getProducts());
      setPublicProducts(dataStore.getPublicProducts());
      setLastUpdate(new Date());
    },
    onProductDeleted: (data) => {
      setProducts(dataStore.getProducts());
      setPublicProducts(dataStore.getPublicProducts());
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
      setTopupRequests(dataStore.getTopupRequests());
      setLastUpdate(new Date());
    },
    onTopupRequestUpdated: (data) => {
      setTopupRequests(dataStore.getTopupRequests());
      setLastUpdate(new Date());
    },
    onTopupRequestProcessed: (data) => {
      setTopupRequests(dataStore.getTopupRequests());
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

  // Initialize data
  useEffect(() => {
    refreshData();
  }, []);

  // Set up current user: prefer users state (from SSE); fallback to dataStore
  useEffect(() => {
    if (!currentUserEmail) return;

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
      setCurrentUser(dataStore.getPublicUser(currentUserEmail));
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
          setPublicProducts(dataStore.getPublicProducts());
          break;

        case "PRODUCT_DELETED":
          setProducts(dataStore.getProducts());
          setPublicProducts(dataStore.getPublicProducts());
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

  const refreshData = () => {
    setUsers(dataStore.getUsers());
    setProducts(dataStore.getProducts());
    setPublicProducts(dataStore.getPublicProducts());
    setTransactions(dataStore.getTransactions());
    setLastUpdate(new Date());

    if (currentUserEmail) {
      setCurrentUser(dataStore.getPublicUser(currentUserEmail));
    }
  };

  const getUserById = (id: string): AdminUser | null => {
    return dataStore.getUser(id);
  };

  const getUserByEmail = (email: string): AdminUser | null => {
    return dataStore.getUserByEmail(email);
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
  console.log(`🚀 | currentUser:`, currentUser);

  return currentUser;
}

// Hook for products with real-time updates
export function useProducts() {
  const { publicProducts } = useDataSync();
  return publicProducts;
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
