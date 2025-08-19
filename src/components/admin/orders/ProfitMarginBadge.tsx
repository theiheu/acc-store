"use client";

import { formatProfitMargin, getProfitMarginCategory } from "@/src/core/admin";
import { formatCurrency } from "@/src/core/admin";

interface ProfitMarginBadgeProps {
  margin: number;
  size?: "sm" | "md" | "lg";
  showIcon?: boolean;
}

export default function ProfitMarginBadge({
  margin,
  size = "md",
  showIcon = true,
}: ProfitMarginBadgeProps) {
  const { text, color, bgColor } = formatProfitMargin(margin);
  const category = getProfitMarginCategory(margin);

  const getSizeStyles = (size: string) => {
    switch (size) {
      case "sm":
        return "px-2 py-1 text-xs";
      case "lg":
        return "px-4 py-2 text-base";
      default:
        return "px-3 py-1.5 text-sm";
    }
  };

  const getIcon = (category: string) => {
    switch (category) {
      case "high":
        return "📈";
      case "medium":
        return "📊";
      case "low":
        return "📉";
      case "negative":
        return "⚠️";
      default:
        return "❓";
    }
  };

  const getTooltip = (category: string) => {
    switch (category) {
      case "high":
        return "Lợi nhuận cao (>30%)";
      case "medium":
        return "Lợi nhuận trung bình (10-30%)";
      case "low":
        return "Lợi nhuận thấp (0-10%)";
      case "negative":
        return "Lỗ (<0%)";
      default:
        return "Không xác định";
    }
  };

  const sizeStyles = getSizeStyles(size);
  const icon = getIcon(category);
  const tooltip = getTooltip(category);

  return (
    <span
      className={`
        inline-flex items-center gap-1.5 rounded-full border font-medium
        ${bgColor} ${color} border-current ${sizeStyles}
      `}
      title={tooltip}
    >
      {showIcon && <span className="text-xs">{icon}</span>}
      <span>{text}</span>
    </span>
  );
}

// Profit information display component
export function ProfitInfo({
  profit,
  cost,
  margin,
  revenue,
  size = "md",
}: {
  profit: number;
  cost: number;
  margin: number;
  revenue: number;
  size?: "sm" | "md" | "lg";
}) {
  const isCompact = size === "sm";

  if (isCompact) {
    return (
      <div className="flex items-center gap-2">
        <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
          {formatCurrency(profit)}
        </span>
        <ProfitMarginBadge margin={margin} size="sm" />
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
          Doanh thu:
        </span>
        <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
          {formatCurrency(revenue)}
        </span>
      </div>

      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
          Chi phí:
        </span>
        <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
          {formatCurrency(cost)}
        </span>
      </div>

      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
          Lợi nhuận:
        </span>
        <span
          className={`text-sm font-medium ${
            profit >= 0
              ? "text-green-600 dark:text-green-400"
              : "text-red-600 dark:text-red-400"
          }`}
        >
          {formatCurrency(profit)}
        </span>
      </div>

      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
          Tỷ suất:
        </span>
        <ProfitMarginBadge margin={margin} size={size} />
      </div>
    </div>
  );
}

// Profit comparison component
export function ProfitComparison({
  currentProfit,
  previousProfit,
  period = "tháng trước",
}: {
  currentProfit: number;
  previousProfit: number;
  period?: string;
}) {
  const change = currentProfit - previousProfit;
  const changePercent =
    previousProfit !== 0 ? (change / Math.abs(previousProfit)) * 100 : 0;
  const isPositive = change >= 0;

  return (
    <div className="flex items-center gap-2">
      <span className="text-lg font-bold text-gray-900 dark:text-gray-100">
        {formatCurrency(currentProfit)}
      </span>

      {change !== 0 && (
        <div
          className={`flex items-center gap-1 text-sm ${
            isPositive
              ? "text-green-600 dark:text-green-400"
              : "text-red-600 dark:text-red-400"
          }`}
        >
          <span>{isPositive ? "↗️" : "↘️"}</span>
          <span>
            {isPositive ? "+" : ""}
            {formatCurrency(change)}
          </span>
          <span className="text-xs text-gray-500 dark:text-gray-400">
            ({isPositive ? "+" : ""}
            {changePercent.toFixed(1)}% so với {period})
          </span>
        </div>
      )}
    </div>
  );
}

// Profit distribution chart component
export function ProfitDistributionChart({
  distribution,
}: {
  distribution: {
    highMargin: { count: number; percentage: number };
    mediumMargin: { count: number; percentage: number };
    lowMargin: { count: number; percentage: number };
    negative: { count: number; percentage: number };
  };
}) {
  const total =
    distribution.highMargin.count +
    distribution.mediumMargin.count +
    distribution.lowMargin.count +
    distribution.negative.count;

  if (total === 0) {
    return (
      <div className="text-center text-gray-500 dark:text-gray-400 py-4">
        Chưa có dữ liệu
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">
        Phân bố tỷ suất lợi nhuận
      </h4>

      {/* Progress bar */}
      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3 overflow-hidden">
        <div className="h-full flex">
          {distribution.highMargin.percentage > 0 && (
            <div
              className="bg-green-500 h-full"
              style={{ width: `${distribution.highMargin.percentage}%` }}
              title={`Cao: ${
                distribution.highMargin.count
              } đơn (${distribution.highMargin.percentage.toFixed(1)}%)`}
            />
          )}
          {distribution.mediumMargin.percentage > 0 && (
            <div
              className="bg-blue-500 h-full"
              style={{ width: `${distribution.mediumMargin.percentage}%` }}
              title={`Trung bình: ${
                distribution.mediumMargin.count
              } đơn (${distribution.mediumMargin.percentage.toFixed(1)}%)`}
            />
          )}
          {distribution.lowMargin.percentage > 0 && (
            <div
              className="bg-yellow-500 h-full"
              style={{ width: `${distribution.lowMargin.percentage}%` }}
              title={`Thấp: ${
                distribution.lowMargin.count
              } đơn (${distribution.lowMargin.percentage.toFixed(1)}%)`}
            />
          )}
          {distribution.negative.percentage > 0 && (
            <div
              className="bg-red-500 h-full"
              style={{ width: `${distribution.negative.percentage}%` }}
              title={`Lỗ: ${
                distribution.negative.count
              } đơn (${distribution.negative.percentage.toFixed(1)}%)`}
            />
          )}
        </div>
      </div>

      {/* Legend */}
      <div className="grid grid-cols-2 gap-2 text-xs">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-green-500 rounded"></div>
          <span>Cao (&gt;30%): {distribution.highMargin.count}</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-blue-500 rounded"></div>
          <span>TB (10-30%): {distribution.mediumMargin.count}</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-yellow-500 rounded"></div>
          <span>Thấp (0-10%): {distribution.lowMargin.count}</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-red-500 rounded"></div>
          <span>Lỗ (&lt;0%): {distribution.negative.count}</span>
        </div>
      </div>
    </div>
  );
}
