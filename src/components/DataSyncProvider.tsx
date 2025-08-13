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
      setUsers(dataStore.getUsers());
      if (currentUserEmail && data.user.email === currentUserEmail) {
        setCurrentUser(dataStore.getPublicUser(currentUserEmail));
      }
      setLastUpdate(new Date());
    },
    onBalanceUpdated: (data) => {
      console.log("Balance updated event received:", data);
      setUsers(dataStore.getUsers());
      setTransactions(dataStore.getTransactions()); // Update transactions
      if (currentUser && currentUser.id === data.userId) {
        console.log(
          "Updating current user balance:",
          currentUser.email,
          "new balance:",
          data.newBalance
        );
        setCurrentUser((prev) =>
          prev ? { ...prev, balance: data.newBalance } : null
        );
      } else {
        console.log(
          "Current user ID mismatch:",
          currentUser?.id,
          "vs",
          data.userId
        );
      }
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

  // Set up current user
  useEffect(() => {
    if (currentUserEmail) {
      const user = dataStore.getPublicUser(currentUserEmail);
      setCurrentUser(user);
    }
  }, [currentUserEmail]);

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
