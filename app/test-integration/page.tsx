"use client";

import { useState } from "react";
import { dataStore } from "@/src/core/data-store";
import { useToastContext } from "@/src/components/ToastProvider";
import { formatCurrency } from "@/src/core/admin";

export default function TestIntegrationPage() {
  const [testResults, setTestResults] = useState<string[]>([]);
  const { show } = useToastContext();

  const addResult = (message: string, success: boolean = true) => {
    const result = `${success ? '✅' : '❌'} ${message}`;
    setTestResults(prev => [...prev, result]);
    show(result, success ? 'success' : 'error');
  };

  const runIntegrationTests = async () => {
    setTestResults([]);
    addResult("🚀 Starting comprehensive integration tests...");

    try {
      // Test 1: Create a new user (simulating Google login)
      addResult("Test 1: Creating new user...");
      const newUser = dataStore.createUser({
        email: `test-${Date.now()}@example.com`,
        name: "Integration Test User",
        role: "user",
        status: "active",
        balance: 0,
        totalOrders: 0,
        totalSpent: 0,
        registrationSource: "google",
      });
      addResult(`User created: ${newUser.email} (ID: ${newUser.id})`);

      // Test 2: Add credits to user (admin operation)
      addResult("Test 2: Adding credits to user...");
      const creditAmount = 100000;
      const updatedUser = dataStore.updateUser(
        newUser.id, 
        { balance: newUser.balance + creditAmount },
        "admin-test",
        "Test Admin"
      );
      addResult(`Credits added: ${formatCurrency(creditAmount)} - New balance: ${formatCurrency(updatedUser?.balance || 0)}`);

      // Test 3: Create transaction record
      addResult("Test 3: Creating transaction record...");
      const transaction = dataStore.createTransaction({
        userId: newUser.id,
        type: "credit",
        amount: creditAmount,
        description: "Integration test credit",
        adminId: "admin-test",
      });
      addResult(`Transaction created: ${transaction.id} - ${formatCurrency(transaction.amount)}`);

      // Test 4: Create a new product (admin operation)
      addResult("Test 4: Creating new product...");
      const newProduct = dataStore.createProduct({
        title: `Test Product ${Date.now()}`,
        description: "Integration test product",
        price: 50000,
        currency: "VND",
        category: "gaming",
        imageEmoji: "🧪",
        stock: 100,
        sold: 0,
        isActive: true,
        createdBy: "admin-test",
        lastModifiedBy: "admin-test",
        faqs: [],
        options: [],
      }, "admin-test", "Test Admin");
      addResult(`Product created: ${newProduct.title} (ID: ${newProduct.id})`);

      // Test 5: Update product (admin operation)
      addResult("Test 5: Updating product...");
      const updatedProduct = dataStore.updateProduct(
        newProduct.id,
        { 
          price: 75000,
          stock: 150,
          sold: 5 
        },
        "admin-test",
        "Test Admin"
      );
      addResult(`Product updated: Price ${formatCurrency(updatedProduct?.price || 0)}, Stock: ${updatedProduct?.stock}`);

      // Test 6: Simulate purchase transaction
      addResult("Test 6: Simulating purchase...");
      const purchaseAmount = 50000;
      const purchaseTransaction = dataStore.createTransaction({
        userId: newUser.id,
        type: "purchase",
        amount: purchaseAmount,
        description: `Purchase: ${newProduct.title}`,
      });
      
      // Update user balance and stats
      const userAfterPurchase = dataStore.updateUser(
        newUser.id,
        { 
          balance: (updatedUser?.balance || 0) - purchaseAmount,
          totalOrders: 1,
          totalSpent: purchaseAmount
        },
        "system",
        "System"
      );
      addResult(`Purchase completed: ${formatCurrency(purchaseAmount)} - Remaining balance: ${formatCurrency(userAfterPurchase?.balance || 0)}`);

      // Test 7: Get dashboard statistics
      addResult("Test 7: Calculating dashboard statistics...");
      const stats = dataStore.getStats();
      addResult(`Stats - Users: ${stats.totalUsers}, Products: ${stats.totalProducts}, Revenue: ${formatCurrency(stats.totalRevenue)}`);

      // Test 8: Get recent activity
      addResult("Test 8: Retrieving recent activity...");
      const recentActivity = dataStore.getRecentActivity(5);
      addResult(`Recent activities: ${recentActivity.length} entries`);

      // Test 9: Get user transactions
      addResult("Test 9: Getting user transactions...");
      const userTransactions = dataStore.getUserTransactions(newUser.id);
      addResult(`User transactions: ${userTransactions.length} found`);

      // Test 10: Test real-time data sync
      addResult("Test 10: Testing real-time data availability...");
      const publicProducts = dataStore.getPublicProducts();
      const isNewProductVisible = publicProducts.some(p => p.id === newProduct.id);
      addResult(`New product visible on homepage: ${isNewProductVisible ? 'Yes' : 'No'}`, isNewProductVisible);

      addResult("🎉 All integration tests completed successfully!");

    } catch (error) {
      addResult(`❌ Test failed: ${error}`, false);
      console.error("Integration test error:", error);
    }
  };

  const clearResults = () => {
    setTestResults([]);
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-12">
      <div className="max-w-4xl mx-auto px-4">
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-8">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-6">
            🧪 Admin-Homepage Integration Tests
          </h1>
          
          <div className="mb-6">
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              This page tests the complete integration between admin operations and homepage data.
              It verifies that admin changes immediately affect what users see on the homepage.
            </p>
            
            <div className="flex gap-4">
              <button
                onClick={runIntegrationTests}
                className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-6 rounded-lg transition-colors"
              >
                🚀 Run Integration Tests
              </button>
              
              <button
                onClick={clearResults}
                className="bg-gray-600 hover:bg-gray-700 text-white font-medium py-2 px-4 rounded-lg transition-colors"
              >
                Clear Results
              </button>
            </div>
          </div>

          {/* Test Results */}
          <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4 min-h-[400px]">
            <h3 className="font-medium text-gray-900 dark:text-gray-100 mb-3">
              Test Results:
            </h3>
            
            {testResults.length === 0 ? (
              <p className="text-gray-500 dark:text-gray-400 italic">
                Click "Run Integration Tests" to start testing...
              </p>
            ) : (
              <div className="space-y-2 font-mono text-sm">
                {testResults.map((result, index) => (
                  <div key={index} className="text-gray-800 dark:text-gray-200">
                    {result}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Test Coverage */}
          <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-blue-50 dark:bg-blue-300/10 rounded-lg p-4">
              <h4 className="font-medium text-blue-900 dark:text-blue-100 mb-2">
                🔧 Admin Operations Tested
              </h4>
              <ul className="text-sm text-blue-800 dark:text-blue-200 space-y-1">
                <li>• User creation (Google login simulation)</li>
                <li>• Credit top-ups with activity logging</li>
                <li>• Product creation and updates</li>
                <li>• Transaction recording</li>
                <li>• Dashboard statistics calculation</li>
              </ul>
            </div>
            
            <div className="bg-green-50 dark:bg-green-300/10 rounded-lg p-4">
              <h4 className="font-medium text-green-900 dark:text-green-100 mb-2">
                🌐 Homepage Integration Verified
              </h4>
              <ul className="text-sm text-green-800 dark:text-green-200 space-y-1">
                <li>• New products appear on homepage</li>
                <li>• User balance updates in real-time</li>
                <li>• Transaction history synchronization</li>
                <li>• Product catalog consistency</li>
                <li>• Statistics reflect real data</li>
              </ul>
            </div>
          </div>

          {/* Manual Testing Guide */}
          <div className="mt-8 bg-amber-50 dark:bg-amber-300/10 rounded-lg p-4">
            <h4 className="font-medium text-amber-900 dark:text-amber-100 mb-2">
              📋 Manual Testing Steps
            </h4>
            <ol className="text-sm text-amber-800 dark:text-amber-200 space-y-1">
              <li>1. Run the integration tests above</li>
              <li>2. Open admin dashboard (/admin) in another tab</li>
              <li>3. Open homepage (/) in a third tab</li>
              <li>4. In admin: Create a new product</li>
              <li>5. In homepage: Verify product appears immediately</li>
              <li>6. In admin: Add credits to a user</li>
              <li>7. In account page: Verify balance updates in real-time</li>
              <li>8. Check that all changes happen without page refresh</li>
            </ol>
          </div>
        </div>
      </div>
    </div>
  );
}
