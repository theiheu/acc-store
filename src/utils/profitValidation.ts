/**
 * Utility functions to validate profit calculations against actual order data
 */

import { dataStore } from "@/src/core/data-store";
import { calculateOrderProfit, calculateProductCost } from "@/src/core/admin";
import { ORDER_STATUS } from "@/src/core/constants";

export interface ProfitValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  summary: {
    totalOrders: number;
    completedOrders: number;
    totalRevenue: number;
    calculatedProfit: number;
    profitMargin: number;
  };
}

/**
 * Validates that profit calculations match actual order data
 */
export function validateProfitCalculations(
  startDate: Date,
  endDate: Date
): ProfitValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Get actual orders from the data store
  const allOrders = dataStore.getAllOrders();
  const ordersInRange = allOrders.filter(
    (order) => order.createdAt >= startDate && order.createdAt <= endDate
  );

  const completedOrders = ordersInRange.filter(
    (order) => order.status === ORDER_STATUS.COMPLETED
  );

  // Calculate actual revenue from orders
  const actualRevenue = completedOrders.reduce(
    (sum, order) => sum + order.totalAmount,
    0
  );

  // Get profit analysis from the data store
  const profitAnalysis = dataStore.getProfitAnalysis(startDate, endDate);

  // Validate revenue calculation
  if (Math.abs(profitAnalysis.revenue.total - actualRevenue) > 0.01) {
    errors.push(
      `Revenue mismatch: Analysis shows ${profitAnalysis.revenue.total.toLocaleString(
        "vi-VN"
      )}₫ ` +
        `but actual orders total ${actualRevenue.toLocaleString("vi-VN")}₫`
    );
  }

  // Validate order count
  const analysisOrderCount = profitAnalysis.revenue.byProduct.reduce(
    (sum, product) => sum + product.quantity,
    0
  );
  const actualOrderQuantity = completedOrders.reduce(
    (sum, order) => sum + order.quantity,
    0
  );

  if (analysisOrderCount !== actualOrderQuantity) {
    errors.push(
      `Order quantity mismatch: Analysis shows ${analysisOrderCount} items ` +
        `but actual orders total ${actualOrderQuantity} items`
    );
  }

  // Validate product revenue breakdown
  const productRevenueMap = new Map<string, number>();
  completedOrders.forEach((order) => {
    const existing = productRevenueMap.get(order.productId) || 0;
    productRevenueMap.set(order.productId, existing + order.totalAmount);
  });

  profitAnalysis.revenue.byProduct.forEach((product) => {
    const actualProductRevenue = productRevenueMap.get(product.productId) || 0;
    if (Math.abs(product.revenue - actualProductRevenue) > 0.01) {
      errors.push(
        `Product revenue mismatch for ${product.productTitle}: ` +
          `Analysis shows ${product.revenue.toLocaleString("vi-VN")}₫ ` +
          `but actual orders total ${actualProductRevenue.toLocaleString(
            "vi-VN"
          )}₫`
      );
    }
  });

  // Check for missing products in analysis
  productRevenueMap.forEach((revenue, productId) => {
    const foundInAnalysis = profitAnalysis.revenue.byProduct.find(
      (p) => p.productId === productId
    );
    if (!foundInAnalysis) {
      warnings.push(
        `Product ${productId} has revenue but is missing from profit analysis`
      );
    }
  });

  // Validate cost calculations
  let calculatedCosts = 0;
  completedOrders.forEach((order) => {
    const product = dataStore
      .getProducts()
      .find((p) => p.id === order.productId);
    if (product) {
      let unitCost = 0;

      // Get actual cost from selected option or product
      if (order.selectedOptionId && product.options) {
        const selectedOption = product.options.find(
          (opt) => opt.id === order.selectedOptionId
        );
        if (selectedOption) {
          unitCost = selectedOption.basePrice || selectedOption.price * 0.7;
        }
      } else if (product.price) {
        unitCost = product.price * 0.7;
      }

      calculatedCosts += unitCost * order.quantity;
    }
  });

  const calculatedProfit = actualRevenue - calculatedCosts;
  const profitMargin =
    actualRevenue > 0 ? (calculatedProfit / actualRevenue) * 100 : 0;

  // Check if profit calculation is reasonable
  if (
    Math.abs(profitAnalysis.profit.net - calculatedProfit) >
    calculatedCosts * 0.1
  ) {
    warnings.push(
      `Significant profit calculation difference detected. ` +
        `Analysis: ${profitAnalysis.profit.net.toLocaleString("vi-VN")}₫, ` +
        `Calculated: ${calculatedProfit.toLocaleString("vi-VN")}₫`
    );
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
    summary: {
      totalOrders: ordersInRange.length,
      completedOrders: completedOrders.length,
      totalRevenue: actualRevenue,
      calculatedProfit,
      profitMargin,
    },
  };
}

/**
 * Logs validation results to console for debugging
 */
export function logValidationResults(result: ProfitValidationResult): void {
  console.log("=== Profit Calculation Validation ===");
  console.log(`Status: ${result.isValid ? "✅ VALID" : "❌ INVALID"}`);
  console.log(`Total Orders: ${result.summary.totalOrders}`);
  console.log(`Completed Orders: ${result.summary.completedOrders}`);
  console.log(
    `Total Revenue: ${result.summary.totalRevenue.toLocaleString("vi-VN")}₫`
  );
  console.log(
    `Calculated Profit: ${result.summary.calculatedProfit.toLocaleString(
      "vi-VN"
    )}₫`
  );
  console.log(`Profit Margin: ${result.summary.profitMargin.toFixed(2)}%`);

  if (result.errors.length > 0) {
    console.log("\n❌ Errors:");
    result.errors.forEach((error) => console.log(`  - ${error}`));
  }

  if (result.warnings.length > 0) {
    console.log("\n⚠️ Warnings:");
    result.warnings.forEach((warning) => console.log(`  - ${warning}`));
  }

  console.log("=====================================");
}

/**
 * Quick validation for development/debugging
 */
export function quickValidation(): void {
  const endDate = new Date();
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - 30); // Last 30 days

  const result = validateProfitCalculations(startDate, endDate);
  logValidationResults(result);
}
