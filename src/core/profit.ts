// Profit analysis and cost tracking types

export type ExpenseCategory = 
  | "cogs" // Cost of Goods Sold
  | "operational" // Operational expenses
  | "marketing" // Marketing and advertising
  | "administrative" // Administrative costs
  | "transaction_fees" // Payment processing fees
  | "other"; // Other miscellaneous expenses

export interface ExpenseEntry {
  id: string;
  category: ExpenseCategory;
  description: string;
  amount: number;
  date: Date;
  isRecurring?: boolean;
  recurringPeriod?: "daily" | "weekly" | "monthly" | "yearly";
  allocatedToProducts?: string[]; // Product IDs this expense applies to
  createdBy: string; // Admin ID
  createdAt: Date;
  updatedAt: Date;
  metadata?: Record<string, any>;
}

export interface ProductCostBreakdown {
  productId: string;
  productTitle: string;
  basePrice: number; // Cost from supplier
  transactionFees: number; // Payment processing fees
  operationalCost: number; // Allocated operational expenses
  marketingCost: number; // Allocated marketing expenses
  totalCost: number; // Sum of all costs
  sellingPrice: number;
  grossProfit: number; // sellingPrice - basePrice
  netProfit: number; // sellingPrice - totalCost
  grossMargin: number; // (grossProfit / sellingPrice) * 100
  netMargin: number; // (netProfit / sellingPrice) * 100
}

export interface ProfitAnalysis {
  period: {
    startDate: Date;
    endDate: Date;
    label: string;
  };
  revenue: {
    total: number;
    byProduct: Array<{
      productId: string;
      productTitle: string;
      revenue: number;
      quantity: number;
    }>;
    byCategory: Array<{
      category: string;
      revenue: number;
      quantity: number;
    }>;
  };
  costs: {
    total: number;
    cogs: number;
    operational: number;
    marketing: number;
    administrative: number;
    transactionFees: number;
    other: number;
    byProduct: Array<{
      productId: string;
      productTitle: string;
      totalCost: number;
      breakdown: {
        cogs: number;
        operational: number;
        marketing: number;
        transactionFees: number;
        other: number;
      };
    }>;
  };
  profit: {
    gross: number; // revenue - cogs
    net: number; // revenue - total costs
    grossMargin: number; // (gross / revenue) * 100
    netMargin: number; // (net / revenue) * 100
    byProduct: Array<{
      productId: string;
      productTitle: string;
      grossProfit: number;
      netProfit: number;
      grossMargin: number;
      netMargin: number;
      quantity: number;
    }>;
  };
  trends: {
    revenueGrowth: number; // % change from previous period
    profitGrowth: number; // % change from previous period
    marginTrend: "improving" | "declining" | "stable";
  };
}

export interface ROIAnalysis {
  campaignId?: string;
  campaignName: string;
  investment: number; // Total cost/investment
  returns: number; // Revenue generated
  profit: number; // returns - investment
  roi: number; // (profit / investment) * 100
  period: {
    startDate: Date;
    endDate: Date;
  };
  metrics: {
    customerAcquisitionCost: number;
    customerLifetimeValue: number;
    paybackPeriod: number; // Days to recover investment
  };
}

export interface ProfitAlert {
  id: string;
  type: "low_margin" | "negative_profit" | "high_cost" | "declining_trend";
  severity: "low" | "medium" | "high" | "critical";
  title: string;
  description: string;
  productId?: string;
  productTitle?: string;
  currentValue: number;
  threshold: number;
  recommendation: string;
  createdAt: Date;
  isRead: boolean;
  isResolved: boolean;
}

export interface ProfitForecast {
  period: {
    startDate: Date;
    endDate: Date;
    label: string;
  };
  forecast: {
    revenue: number;
    costs: number;
    grossProfit: number;
    netProfit: number;
    confidence: number; // 0-100%
  };
  assumptions: {
    revenueGrowthRate: number;
    costInflationRate: number;
    seasonalityFactor: number;
  };
  scenarios: {
    optimistic: {
      revenue: number;
      profit: number;
      margin: number;
    };
    realistic: {
      revenue: number;
      profit: number;
      margin: number;
    };
    pessimistic: {
      revenue: number;
      profit: number;
      margin: number;
    };
  };
}

// Utility functions for profit calculations
export function calculateGrossProfit(revenue: number, cogs: number): number {
  return revenue - cogs;
}

export function calculateNetProfit(revenue: number, totalCosts: number): number {
  return revenue - totalCosts;
}

export function calculateGrossMargin(grossProfit: number, revenue: number): number {
  return revenue > 0 ? (grossProfit / revenue) * 100 : 0;
}

export function calculateNetMargin(netProfit: number, revenue: number): number {
  return revenue > 0 ? (netProfit / revenue) * 100 : 0;
}

export function calculateROI(profit: number, investment: number): number {
  return investment > 0 ? (profit / investment) * 100 : 0;
}

export function calculateProfitGrowth(currentProfit: number, previousProfit: number): number {
  return previousProfit > 0 ? ((currentProfit - previousProfit) / previousProfit) * 100 : 0;
}

// Cost allocation algorithms
export function allocateOperationalCosts(
  totalOperationalCost: number,
  products: Array<{ productId: string; revenue: number }>,
  allocationMethod: "revenue_based" | "equal" | "quantity_based" = "revenue_based"
): Array<{ productId: string; allocatedCost: number }> {
  const totalRevenue = products.reduce((sum, p) => sum + p.revenue, 0);
  
  if (allocationMethod === "equal") {
    const costPerProduct = totalOperationalCost / products.length;
    return products.map(p => ({
      productId: p.productId,
      allocatedCost: costPerProduct,
    }));
  }
  
  // Revenue-based allocation (default)
  return products.map(p => ({
    productId: p.productId,
    allocatedCost: totalRevenue > 0 ? (p.revenue / totalRevenue) * totalOperationalCost : 0,
  }));
}

// Profit alert thresholds
export const PROFIT_ALERT_THRESHOLDS = {
  LOW_MARGIN: 10, // Below 10% margin
  NEGATIVE_PROFIT: 0, // Below 0% profit
  HIGH_COST_RATIO: 80, // Costs above 80% of revenue
  DECLINING_TREND: -5, // More than 5% decline in profit
} as const;

// Vietnamese labels for expense categories
export const EXPENSE_CATEGORY_LABELS: Record<ExpenseCategory, string> = {
  cogs: "Giá vốn hàng bán",
  operational: "Chi phí vận hành",
  marketing: "Chi phí marketing",
  administrative: "Chi phí quản lý",
  transaction_fees: "Phí giao dịch",
  other: "Chi phí khác",
};

// Vietnamese labels for profit metrics
export const PROFIT_METRIC_LABELS = {
  revenue: "Doanh thu",
  grossProfit: "Lợi nhuận gộp",
  netProfit: "Lợi nhuận ròng",
  grossMargin: "Tỷ suất lợi nhuận gộp",
  netMargin: "Tỷ suất lợi nhuận ròng",
  roi: "Tỷ suất sinh lời",
  cogs: "Giá vốn hàng bán",
  totalCosts: "Tổng chi phí",
} as const;
