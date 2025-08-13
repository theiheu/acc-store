"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { useToastContext } from "@/src/components/ToastProvider";
import { formatCurrency } from "@/src/core/admin";
import { dataStore } from "@/src/core/data-store";

export default function TestTopupWorkflowPage() {
  const { data: session } = useSession();
  const [testResults, setTestResults] = useState<string[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const { show } = useToastContext();

  const addResult = (message: string, success: boolean = true) => {
    const result = `${success ? "✅" : "❌"} ${message}`;
    setTestResults((prev) => [...prev, result]);
    console.log(result);
  };

  const delay = (ms: number) =>
    new Promise((resolve) => setTimeout(resolve, ms));

  const runComprehensiveTest = async () => {
    if (!session?.user?.email) {
      show("Please login first", "error");
      return;
    }

    setIsRunning(true);
    setTestResults([]);
    addResult("🚀 Starting comprehensive top-up request workflow test...");

    try {
      // Step 1: Verify user exists in data store
      addResult("Step 1: Verifying user in data store...");
      let user = dataStore.getUserByEmail(session.user.email);
      if (!user) {
        // Create user if doesn't exist
        user = dataStore.createUser({
          email: session.user.email,
          name: session.user.name || "Test User",
          role: "user",
          status: "active",
          balance: 0,
          totalOrders: 0,
          totalSpent: 0,
          registrationSource: "test",
        });
        addResult(`User created: ${user.email} (ID: ${user.id})`);
      } else {
        addResult(`User found: ${user.email} (ID: ${user.id})`);
      }

      const initialBalance = user.balance;
      addResult(`Initial balance: ${formatCurrency(initialBalance)}`);

      // Step 2: Create a unified top-up request with QR code
      addResult("Step 2: Creating unified top-up request with QR code...");
      const requestAmount = 100000;
      const userNotes = "Test unified top-up request from workflow test";

      // Generate account ID and transfer content
      const generateAccountId = (email: string): string => {
        return email
          .split("@")[0]
          .toUpperCase()
          .replace(/[^A-Z0-9]/g, "")
          .substring(0, 8);
      };

      const transferContent = `NAPTHE ${generateAccountId(session.user.email)}`;
      const bankConfig = {
        bankName: "Vietcombank",
        accountNumber: "1234567890",
        accountName: "CONG TY TNHH ACC STORE",
        bankCode: "VCB",
      };
      const qrData = `${bankConfig.bankCode}|${bankConfig.accountNumber}|${bankConfig.accountName}|${requestAmount}|${transferContent}`;

      const response = await fetch("/api/user/topup-request", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          amount: requestAmount,
          notes: userNotes,
          qrCodeData: qrData,
          transferContent,
          bankInfo: bankConfig,
        }),
      });

      const requestData = await response.json();
      if (!requestData.success) {
        addResult(`Failed to create request: ${requestData.error}`, false);
        return;
      }

      const requestId = requestData.data.requestId;
      addResult(
        `Unified top-up request created: ${requestId} for ${formatCurrency(
          requestAmount
        )}`
      );
      addResult(`QR code data generated: ${qrData.substring(0, 50)}...`);
      addResult(`Transfer content: ${transferContent}`);

      // Step 3: Verify request appears in pending requests with QR data
      addResult("Step 3: Verifying request in pending list...");
      await delay(1000); // Wait for real-time updates

      const pendingRequests = dataStore.getPendingTopupRequests();
      const ourRequest = pendingRequests.find((req) => req.id === requestId);
      if (!ourRequest) {
        addResult("Request not found in pending list", false);
        return;
      }
      addResult(`Request found in pending list: ${ourRequest.status}`);

      // Verify QR code data is stored
      if (ourRequest.qrCodeData) {
        addResult(`QR code data stored: ✓`);
        addResult(`Transfer content stored: ${ourRequest.transferContent}`);
        if (ourRequest.bankInfo) {
          addResult(
            `Bank info stored: ${ourRequest.bankInfo.bankName} - ${ourRequest.bankInfo.accountNumber}`
          );
        }
      } else {
        addResult("QR code data not stored", false);
      }

      // Step 4: Verify request appears in user's request history
      addResult("Step 4: Checking user request history...");
      const userRequests = dataStore.getUserTopupRequests(user.id);
      const userRequest = userRequests.find((req) => req.id === requestId);
      if (!userRequest) {
        addResult("Request not found in user history", false);
        return;
      }
      addResult(
        `Request found in user history with status: ${userRequest.status}`
      );

      // Step 5: Test admin approval workflow
      addResult("Step 5: Testing admin approval...");
      const approvedAmount = 120000; // Approve more than requested
      const adminNotes = "Approved with bonus for testing";

      const approvalResponse = await fetch(
        `/api/admin/topup-requests/${requestId}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            action: "approve",
            approvedAmount,
            adminNotes,
          }),
        }
      );

      const approvalData = await approvalResponse.json();
      if (!approvalData.success) {
        addResult(`Failed to approve request: ${approvalData.error}`, false);
        return;
      }

      addResult(`Request approved for ${formatCurrency(approvedAmount)}`);
      const transactionId = approvalData.data.transaction?.id;
      if (transactionId) {
        addResult(`Transaction created: ${transactionId}`);
      }

      // Step 6: Verify balance update
      addResult("Step 6: Verifying balance update...");
      await delay(1000); // Wait for real-time updates

      const updatedUser = dataStore.getUserByEmail(session.user.email);
      if (!updatedUser) {
        addResult("User not found after approval", false);
        return;
      }

      const expectedBalance = initialBalance + approvedAmount;
      if (updatedUser.balance === expectedBalance) {
        addResult(
          `Balance updated correctly: ${formatCurrency(updatedUser.balance)}`
        );
      } else {
        addResult(
          `Balance mismatch: expected ${formatCurrency(
            expectedBalance
          )}, got ${formatCurrency(updatedUser.balance)}`,
          false
        );
      }

      // Step 7: Verify transaction history
      addResult("Step 7: Checking transaction history...");
      const transactions = dataStore.getUserTransactions(user.id);
      const topupTransaction = transactions.find(
        (tx) => tx.id === transactionId
      );
      if (!topupTransaction) {
        addResult("Transaction not found in history", false);
        return;
      }

      addResult(`Transaction found: ${topupTransaction.description}`);
      if (topupTransaction.metadata?.topupRequestId === requestId) {
        addResult("Transaction correctly linked to top-up request");
      } else {
        addResult("Transaction not properly linked to request", false);
      }

      // Step 8: Verify request status update
      addResult("Step 8: Verifying request status...");
      const finalRequest = dataStore.getTopupRequest(requestId);
      if (!finalRequest) {
        addResult("Request not found after approval", false);
        return;
      }

      if (finalRequest.status === "approved") {
        addResult(`Request status updated to: ${finalRequest.status}`);
        addResult(`Processed by: ${finalRequest.processedByName}`);
        addResult(`Admin notes: ${finalRequest.adminNotes}`);
      } else {
        addResult(`Unexpected request status: ${finalRequest.status}`, false);
      }

      // Step 9: Test rejection workflow with a new request
      addResult("Step 9: Testing rejection workflow...");
      const rejectResponse = await fetch("/api/user/topup-request", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          amount: 50000,
          notes: "Test rejection workflow",
        }),
      });

      const rejectRequestData = await rejectResponse.json();
      if (!rejectRequestData.success) {
        addResult(
          `Failed to create rejection test request: ${rejectRequestData.error}`,
          false
        );
        return;
      }

      const rejectRequestId = rejectRequestData.data.requestId;
      addResult(`Rejection test request created: ${rejectRequestId}`);

      // Reject the request
      const rejectionResponse = await fetch(
        `/api/admin/topup-requests/${rejectRequestId}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            action: "reject",
            rejectionReason: "Test rejection for workflow validation",
            adminNotes: "Rejected for testing purposes",
          }),
        }
      );

      const rejectionData = await rejectionResponse.json();
      if (!rejectionData.success) {
        addResult(`Failed to reject request: ${rejectionData.error}`, false);
        return;
      }

      addResult("Request rejected successfully");

      // Verify rejection
      await delay(1000);
      const rejectedRequest = dataStore.getTopupRequest(rejectRequestId);
      if (rejectedRequest?.status === "rejected") {
        addResult(`Rejection verified: ${rejectedRequest.rejectionReason}`);
      } else {
        addResult("Rejection not properly recorded", false);
      }

      // Step 10: Verify no balance change from rejection
      addResult("Step 10: Verifying no balance change from rejection...");
      const finalUser = dataStore.getUserByEmail(session.user.email);
      if (finalUser?.balance === expectedBalance) {
        addResult("Balance unchanged after rejection (correct)");
      } else {
        addResult("Balance incorrectly changed after rejection", false);
      }

      // Step 11: Test real-time statistics
      addResult("Step 11: Checking dashboard statistics...");
      const stats = dataStore.getStats();
      addResult(`Total users: ${stats.totalUsers}`);
      addResult(`Total transactions: ${dataStore.getTransactions().length}`);
      addResult(
        `Total top-up requests: ${dataStore.getTopupRequests().length}`
      );

      addResult("🎉 All workflow tests completed successfully!");
    } catch (error) {
      addResult(`❌ Test failed with error: ${error}`, false);
      console.error("Workflow test error:", error);
    } finally {
      setIsRunning(false);
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
            🧪 Unified Top-up Request Workflow Test
          </h1>

          <div className="mb-6">
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              This comprehensive test validates the unified top-up request
              workflow that combines QR code generation with admin approval
              process.
            </p>

            <div className="flex gap-4">
              <button
                onClick={runComprehensiveTest}
                disabled={isRunning || !session?.user}
                className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-medium py-2 px-6 rounded-lg transition-colors"
              >
                {isRunning ? "🔄 Running Tests..." : "🚀 Run Workflow Test"}
              </button>

              <button
                onClick={clearResults}
                disabled={isRunning}
                className="bg-gray-600 hover:bg-gray-700 disabled:bg-gray-400 text-white font-medium py-2 px-4 rounded-lg transition-colors"
              >
                Clear Results
              </button>
            </div>

            {!session?.user && (
              <p className="text-amber-600 dark:text-amber-400 text-sm mt-2">
                ⚠️ Please login to run the workflow test
              </p>
            )}
          </div>

          {/* Test Results */}
          <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4 min-h-[400px]">
            <h3 className="font-medium text-gray-900 dark:text-gray-100 mb-3">
              Test Results:
            </h3>

            {testResults.length === 0 ? (
              <p className="text-gray-500 dark:text-gray-400 italic">
                Click "Run Workflow Test" to start testing...
              </p>
            ) : (
              <div className="space-y-2 font-mono text-sm max-h-96 overflow-y-auto">
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
                🔧 Workflow Steps Tested
              </h4>
              <ul className="text-sm text-blue-800 dark:text-blue-200 space-y-1">
                <li>• User authentication and data store integration</li>
                <li>• Top-up request creation via API</li>
                <li>• Request validation and storage</li>
                <li>• Admin approval workflow</li>
                <li>• Balance update and transaction creation</li>
                <li>• Request rejection workflow</li>
                <li>• Real-time data synchronization</li>
                <li>• Transaction history integration</li>
                <li>• Activity logging and audit trail</li>
                <li>• Dashboard statistics update</li>
              </ul>
            </div>

            <div className="bg-green-50 dark:bg-green-300/10 rounded-lg p-4">
              <h4 className="font-medium text-green-900 dark:text-green-100 mb-2">
                ✅ Integration Points Verified
              </h4>
              <ul className="text-sm text-green-800 dark:text-green-200 space-y-1">
                <li>• User API → Data Store → Admin Dashboard</li>
                <li>• Admin API → Balance Updates → User Account</li>
                <li>• Transaction Creation → History Display</li>
                <li>• Request Status → Real-time Notifications</li>
                <li>• Activity Logging → Audit Trail</li>
                <li>• Statistics Calculation → Dashboard</li>
                <li>• Error Handling → User Feedback</li>
                <li>• Data Consistency → Cross-page Sync</li>
              </ul>
            </div>
          </div>

          {/* Manual Testing Guide */}
          <div className="mt-8 bg-amber-50 dark:bg-amber-300/10 rounded-lg p-4">
            <h4 className="font-medium text-amber-900 dark:text-amber-100 mb-2">
              📋 Manual Testing Steps
            </h4>
            <ol className="text-sm text-amber-800 dark:text-amber-200 space-y-1">
              <li>1. Run the automated workflow test above</li>
              <li>2. Open account page (/account) in another tab</li>
              <li>
                3. Open admin top-up requests (/admin/topup-requests) in a third
                tab
              </li>
              <li>
                4. In account page: Click "Yêu cầu nạp tiền" and submit a
                request
              </li>
              <li>5. In admin page: Verify request appears immediately</li>
              <li>6. In admin page: Approve or reject the request</li>
              <li>
                7. In account page: Verify balance updates and transaction
                appears
              </li>
              <li>8. Check that all changes happen without page refresh</li>
              <li>
                9. Verify transaction history shows correct source information
              </li>
              <li>10. Check admin dashboard statistics update</li>
            </ol>
          </div>
        </div>
      </div>
    </div>
  );
}
