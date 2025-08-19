"use client";

import { useRef, useEffect } from "react";
import { Doughnut } from "react-chartjs-2";
import {
  BaseChartProps,
  chartColors,
  ChartSkeleton,
  ChartError,
  ChartEmpty,
} from "./ChartConfig";

interface ProfitDistributionDataPoint {
  category: string;
  profit: number;
  margin: number;
  color?: string;
}

interface ProfitDistributionChartProps extends Omit<BaseChartProps, "data"> {
  data: ProfitDistributionDataPoint[];
  showPercentages?: boolean;
  showMargins?: boolean;
  centerText?: string;
  centerValue?: number;
}

export default function ProfitDistributionChart({
  data,
  title,
  height = 350,
  loading = false,
  error = null,
  className = "",
  showPercentages = true,
  showMargins = true,
  centerText = "Tổng lợi nhuận",
  centerValue,
}: ProfitDistributionChartProps) {
  const chartRef = useRef<any>(null);

  // Calculate total profit for percentage calculations
  const totalProfit = Array.isArray(data)
    ? data.reduce((sum, item) => sum + Math.max(0, item?.profit || 0), 0)
    : 0;
  const calculatedCenterValue =
    centerValue !== undefined ? centerValue : totalProfit;

  // Generate colors for distribution chart
  const generateColors = (count: number) => {
    const colors = Object.values(chartColors);
    const result = [];

    for (let i = 0; i < count; i++) {
      result.push(colors[i % colors.length]);
    }

    return result;
  };

  // Process data for profit distribution
  const processDistributionData = () => {
    if (!data || !Array.isArray(data) || data.length === 0) {
      return { labels: [], datasets: [] };
    }

    // Filter out negative profits for the chart
    const positiveData = data.filter(
      (item) => item && typeof item.profit === "number" && item.profit > 0
    );

    if (positiveData.length === 0) {
      return {
        labels: ["Không có lợi nhuận"],
        datasets: [{ data: [1], backgroundColor: [chartColors.gray] }],
      };
    }

    const labels = positiveData.map((item) => item.category);
    const values = positiveData.map((item) => item.profit);
    const colors = positiveData.map(
      (item, index) => item.color || generateColors(positiveData.length)[index]
    );

    const datasets = [
      {
        data: values,
        backgroundColor: colors,
        borderColor: colors.map((color) => color + "CC"),
        borderWidth: 2,
        hoverBackgroundColor: colors.map((color) => color + "DD"),
        hoverBorderColor: colors,
        hoverBorderWidth: 3,
        hoverOffset: 8,
      },
    ];

    return { labels, datasets };
  };

  const chartData = processDistributionData();

  // Enhanced chart options for profit distribution
  const distributionOptions = {
    responsive: true,
    maintainAspectRatio: false,
    cutout: "60%", // Creates doughnut effect
    plugins: {
      legend: {
        display: true,
        position: "right" as const,
        labels: {
          usePointStyle: true,
          padding: 15,
          font: {
            size: 12,
          },
          generateLabels: function (chart: any) {
            const chartData = chart.data;
            if (chartData.labels.length && chartData.datasets.length) {
              return chartData.labels.map((label: string, i: number) => {
                const value = chartData.datasets[0].data[i];
                const percentage =
                  totalProfit > 0
                    ? ((value / totalProfit) * 100).toFixed(1)
                    : "0";
                const dataPoint = data.find(
                  (item: ProfitDistributionDataPoint) => item.category === label
                );

                let displayText = label;
                if (showPercentages) {
                  displayText += ` (${percentage}%)`;
                }
                if (showMargins && dataPoint) {
                  displayText += ` - ${dataPoint.margin.toFixed(1)}% margin`;
                }

                return {
                  text: displayText,
                  fillStyle: chartData.datasets[0].backgroundColor[i],
                  strokeStyle: chartData.datasets[0].backgroundColor[i],
                  lineWidth: 0,
                  pointStyle: "circle",
                  hidden: false,
                  index: i,
                };
              });
            }
            return [];
          },
        },
      },
      title: {
        display: !!title,
        text: title,
        font: {
          size: 16,
          weight: "bold" as const,
        },
        padding: {
          bottom: 20,
        },
      },
      tooltip: {
        backgroundColor: "rgba(0, 0, 0, 0.8)",
        titleColor: "#fff",
        bodyColor: "#fff",
        borderColor: "rgba(255, 255, 255, 0.1)",
        borderWidth: 1,
        cornerRadius: 8,
        displayColors: true,
        callbacks: {
          title: function (context: any) {
            return context[0].label;
          },
          label: function (context: any) {
            const label = context.label || "";
            const value = context.parsed;
            const percentage =
              totalProfit > 0 ? ((value / totalProfit) * 100).toFixed(1) : "0";

            const dataPoint = data.find((item) => item.category === label);
            const margin = dataPoint ? dataPoint.margin.toFixed(1) : "0";

            return [
              `💰 Lợi nhuận: ${value.toLocaleString("vi-VN")}₫`,
              `📊 Tỷ lệ: ${percentage}%`,
              `📈 Tỷ suất: ${margin}%`,
            ];
          },
        },
      },
    },
    elements: {
      arc: {
        borderWidth: 2,
      },
    },
  };

  // Handle chart interactions
  useEffect(() => {
    const chart = chartRef.current;
    if (!chart) return;

    const handleClick = (event: any, elements: any[]) => {
      if (elements.length > 0) {
        const element = elements[0];
        const index = element.index;
        const dataPoint = data[index];

        console.log("Profit distribution clicked:", dataPoint);
        // You can add custom click handlers here
      }
    };

    const handleHover = (event: any, elements: any[]) => {
      const chart = chartRef.current;
      if (chart && chart.canvas) {
        chart.canvas.style.cursor = elements.length > 0 ? "pointer" : "default";
      }
    };

    chart.options.onClick = handleClick;
    chart.options.onHover = handleHover;
    chart.update();

    return () => {
      if (chart.options) {
        chart.options.onClick = undefined;
        chart.options.onHover = undefined;
      }
    };
  }, [data]);

  if (loading) {
    return (
      <div
        className={`bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-6 ${className}`}
      >
        {title && (
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
            {title}
          </h3>
        )}
        <ChartSkeleton height={height} />
      </div>
    );
  }

  if (error) {
    return (
      <div
        className={`bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-6 ${className}`}
      >
        {title && (
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
            {title}
          </h3>
        )}
        <ChartError error={error} />
      </div>
    );
  }

  if (!data || data.length === 0 || totalProfit === 0) {
    return (
      <div
        className={`bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-6 ${className}`}
      >
        {title && (
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
            {title}
          </h3>
        )}
        <ChartEmpty message="Không có dữ liệu phân bố lợi nhuận" />
      </div>
    );
  }

  return (
    <div
      className={`bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-6 ${className}`}
    >
      {title && (
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
          {title}
        </h3>
      )}

      <div className="relative" style={{ height: `${height}px` }}>
        <Doughnut
          ref={chartRef}
          data={chartData}
          options={distributionOptions}
        />

        {/* Center text overlay */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="text-center">
            <div className="text-sm text-gray-500 dark:text-gray-400 mb-1">
              {centerText}
            </div>
            <div className="text-xl font-bold text-gray-900 dark:text-gray-100">
              {calculatedCenterValue.toLocaleString("vi-VN")}₫
            </div>
            {totalProfit > 0 && (
              <div className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                {data.length} danh mục
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Summary statistics */}
      <div className="mt-4 grid grid-cols-2 gap-4 text-sm">
        <div className="text-center p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
          <div className="text-gray-500 dark:text-gray-400">
            Danh mục có lãi
          </div>
          <div className="font-semibold text-green-600">
            {data.filter((item) => item.profit > 0).length}
          </div>
        </div>
        <div className="text-center p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
          <div className="text-gray-500 dark:text-gray-400">Tỷ suất TB</div>
          <div className="font-semibold text-blue-600">
            {data.length > 0
              ? (
                  data.reduce((sum, item) => sum + item.margin, 0) / data.length
                ).toFixed(1)
              : 0}
            %
          </div>
        </div>
      </div>
    </div>
  );
}
