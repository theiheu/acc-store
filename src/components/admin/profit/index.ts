// Profit dashboard components
export { default as ProfitMetricCard } from './ProfitMetricCard';
export { default as ProfitAlerts } from './ProfitAlerts';
export { default as ProfitComparison } from './ProfitComparison';

// Re-export profit types for convenience
export type {
  ExpenseEntry,
  ProfitAnalysis,
  ProductCostBreakdown,
  ROIAnalysis,
  ProfitAlert,
  ProfitForecast,
  ExpenseCategory,
} from '@/src/core/profit';
