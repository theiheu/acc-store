"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useCurrentUser, useDataSync } from "@/src/components/DataSyncProvider";
import { useAccountRealtimeUpdates } from "@/src/hooks/useRealtimeUpdates";
import { formatCurrency } from "@/src/core/admin";
import { dataStore } from "@/src/core/data-store";

export default function DebugBalancePage() {
  const { data: session } = useSession();
  const currentUser = useCurrentUser();
  const { getUserTransactions, lastUpdate } = useDataSync();
  const { isConnected, lastEvent } = useAccountRealtimeUpdates(currentUser?.id);
  const [debugInfo, setDebugInfo] = useState<any>({});
  const [transactions, setTransactions] = useState<any[]>([]);

  useEffect(() => {
    if (currentUser) {
      const userTransactions = getUserTransactions(currentUser.id);
      setTransactions(userTransactions.slice(0, 10));
    }
  }, [currentUser, getUserTransactions, lastUpdate]);

  const refreshDebugInfo = () => {
    const info = {
      session: {
        email: session?.user?.email,
        name: session?.user?.name,
      },
      currentUser: currentUser
        ? {
            id: currentUser.id,
            email: currentUser.email,
            name: currentUser.name,
            balance: currentUser.balance,
          }
        : null,
      dataStore: {
        totalUsers: dataStore.getUsers().length,
        totalTransactions: dataStore.getTransactions().length,
        userByEmail: session?.user?.email
          ? dataStore.getUserByEmail(session.user.email)
          : null,
      },
      realtime: {
        isConnected,
        lastEvent: lastEvent
          ? {
              type: lastEvent.type,
              timestamp: lastEvent.timestamp,
            }
          : null,
        lastUpdate: lastUpdate.toISOString(),
      },
      transactions: transactions.length,
    };
    setDebugInfo(info);
  };

  useEffect(() => {
    refreshDebugInfo();
  }, [session, currentUser, isConnected, lastEvent, lastUpdate, transactions]);

  const testDirectDataStore = () => {
    if (!session?.user?.email) return;

    console.log("=== Debug DataStore ===");
    console.log("Session email:", session.user.email);

    // List all users
    dataStore.debugListAllUsers();

    const user = dataStore.getUserByEmail(session.user.email);
    console.log("Direct dataStore lookup:", user);

    if (user) {
      const userTransactions = dataStore.getUserTransactions(user.id);
      console.log("Direct transactions lookup:", userTransactions);
    } else {
      console.log("❌ User not found in dataStore!");
    }
    console.log("=== End Debug ===");
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-12">
      <div className="max-w-4xl mx-auto px-4">
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-8">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-6">
            🔍 Debug Balance & Transaction Sync
          </h1>

          <div className="mb-6">
            <button
              onClick={refreshDebugInfo}
              className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg mr-4"
            >
              Refresh Debug Info
            </button>
            <button
              onClick={testDirectDataStore}
              className="bg-green-600 hover:bg-green-700 text-white font-medium py-2 px-4 rounded-lg"
            >
              Test Direct DataStore
            </button>
          </div>

          {/* Debug Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4">
              <h3 className="font-medium text-gray-900 dark:text-gray-100 mb-3">
                Session Info
              </h3>
              <pre className="text-xs text-gray-600 dark:text-gray-400 overflow-auto">
                {JSON.stringify(debugInfo.session, null, 2)}
              </pre>
            </div>

            <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4">
              <h3 className="font-medium text-gray-900 dark:text-gray-100 mb-3">
                Current User
              </h3>
              <pre className="text-xs text-gray-600 dark:text-gray-400 overflow-auto">
                {JSON.stringify(debugInfo.currentUser, null, 2)}
              </pre>
            </div>

            <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4">
              <h3 className="font-medium text-gray-900 dark:text-gray-100 mb-3">
                DataStore Info
              </h3>
              <pre className="text-xs text-gray-600 dark:text-gray-400 overflow-auto">
                {JSON.stringify(debugInfo.dataStore, null, 2)}
              </pre>
            </div>

            <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4">
              <h3 className="font-medium text-gray-900 dark:text-gray-100 mb-3">
                Real-time Status
              </h3>
              <pre className="text-xs text-gray-600 dark:text-gray-400 overflow-auto">
                {JSON.stringify(debugInfo.realtime, null, 2)}
              </pre>
            </div>
          </div>

          {/* Current Balance Display */}
          <div className="bg-blue-50 dark:bg-blue-300/10 rounded-lg p-6 mb-6">
            <h3 className="font-medium text-blue-900 dark:text-blue-100 mb-3">
              Current Balance Display
            </h3>
            <div className="text-2xl font-bold text-blue-900 dark:text-blue-100">
              {currentUser
                ? formatCurrency(currentUser.balance)
                : "Not logged in"}
            </div>
            <div className="text-sm text-blue-700 dark:text-blue-300 mt-2">
              Connection: {isConnected ? "🟢 Connected" : "🔴 Disconnected"}
            </div>
            <div className="text-sm text-blue-700 dark:text-blue-300">
              Last Update: {lastUpdate.toLocaleString("vi-VN")}
            </div>
          </div>

          {/* Transaction History */}
          <div className="bg-green-50 dark:bg-green-300/10 rounded-lg p-6">
            <h3 className="font-medium text-green-900 dark:text-green-100 mb-3">
              Transaction History ({transactions.length} transactions)
            </h3>

            {transactions.length === 0 ? (
              <p className="text-green-700 dark:text-green-300">
                No transactions found
              </p>
            ) : (
              <div className="space-y-2">
                {transactions.map((tx) => (
                  <div
                    key={tx.id}
                    className="bg-white dark:bg-gray-800 rounded p-3 text-sm"
                  >
                    <div className="flex justify-between items-center">
                      <span className="font-medium">{tx.description}</span>
                      <span
                        className={`font-bold ${
                          tx.type === "credit"
                            ? "text-green-600"
                            : "text-red-600"
                        }`}
                      >
                        {tx.type === "credit" ? "+" : ""}
                        {formatCurrency(tx.amount)}
                      </span>
                    </div>
                    <div className="text-gray-500 text-xs mt-1">
                      {tx.type} •{" "}
                      {new Date(tx.createdAt).toLocaleString("vi-VN")}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Instructions */}
          <div className="mt-8 bg-amber-50 dark:bg-amber-300/10 rounded-lg p-4">
            <h4 className="font-medium text-amber-900 dark:text-amber-100 mb-2">
              🧪 Testing Instructions
            </h4>
            <ol className="text-sm text-amber-800 dark:text-amber-200 space-y-1">
              <li>1. Make sure you're logged in</li>
              <li>2. Open admin dashboard in another tab</li>
              <li>3. Find your user in admin and add credits</li>
              <li>4. Watch this page for real-time updates</li>
              <li>5. Check browser console for debug logs</li>
              <li>6. Refresh debug info to see latest data</li>
            </ol>
          </div>
        </div>
      </div>
    </div>
  );
}
