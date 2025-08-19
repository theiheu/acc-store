import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  Filler,
} from "chart.js";

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  Filler
);

// Common chart options with Vietnamese localization
export const commonChartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      position: "top" as const,
      labels: {
        usePointStyle: true,
        padding: 20,
        font: {
          size: 12,
        },
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
        label: function (context: any) {
          const label = context.dataset.label || "";
          const value = context.parsed.y;

          // Format numbers with Vietnamese locale
          if (label.includes("Doanh thu") || label.includes("Revenue")) {
            return `${label}: ${value.toLocaleString("vi-VN")}₫`;
          }

          return `${label}: ${value.toLocaleString("vi-VN")}`;
        },
      },
    },
  },
  scales: {
    x: {
      grid: {
        display: false,
      },
      ticks: {
        font: {
          size: 11,
        },
      },
    },
    y: {
      beginAtZero: true,
      grid: {
        color: "rgba(0, 0, 0, 0.05)",
      },
      ticks: {
        font: {
          size: 11,
        },
        callback: function (value: any) {
          // Format large numbers
          if (value >= 1000000) {
            return (value / 1000000).toFixed(1) + "M";
          }
          if (value >= 1000) {
            return (value / 1000).toFixed(1) + "K";
          }
          return value.toLocaleString("vi-VN");
        },
      },
    },
  },
};

// Color palette for charts
export const chartColors = {
  primary: "#f59e0b", // amber-500
  secondary: "#3b82f6", // blue-500
  success: "#10b981", // emerald-500
  danger: "#ef4444", // red-500
  warning: "#f97316", // orange-500
  info: "#06b6d4", // cyan-500
  purple: "#8b5cf6", // violet-500
  pink: "#ec4899", // pink-500
  gray: "#6b7280", // gray-500
};

// Generate gradient colors
export const createGradient = (
  ctx: CanvasRenderingContext2D,
  color: string,
  alpha = 0.1
) => {
  const gradient = ctx.createLinearGradient(0, 0, 0, 400);
  gradient.addColorStop(
    0,
    color +
      Math.round(alpha * 255)
        .toString(16)
        .padStart(2, "0")
  );
  gradient.addColorStop(1, color + "00");
  return gradient;
};

// Chart data types
export interface ChartDataPoint {
  x: string | number;
  y: number;
}

export interface ChartDataset {
  label: string;
  data: ChartDataPoint[] | number[];
  backgroundColor?: string | string[];
  borderColor?: string | string[];
  borderWidth?: number;
  fill?: boolean;
  tension?: number;
}

export interface ChartData {
  labels: string[];
  datasets: ChartDataset[];
}

// Chart component props
export interface BaseChartProps {
  data: ChartData;
  title?: string;
  height?: number;
  loading?: boolean;
  error?: string | null;
  className?: string;
}

// Loading skeleton component
export const ChartSkeleton = ({ height = 300 }: { height?: number }) => {
  return (
    <div
      className="animate-pulse bg-gray-200 dark:bg-gray-700 rounded-lg"
      style={{ height: `${height}px` }}
    />
  );
};

// Error component
export const ChartError = ({
  error,
  onRetry,
}: {
  error: string;
  onRetry?: () => void;
}) => {
  return (
    <div className="flex flex-col items-center justify-center h-64 text-gray-500 dark:text-gray-400">
      <div className="text-4xl mb-2">📊</div>
      <p className="text-sm mb-4">{error}</p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="px-3 py-1 text-xs bg-amber-500 hover:bg-amber-600 text-white rounded transition-colors"
        >
          Thử lại
        </button>
      )}
    </div>
  );
};

// Empty state component
export const ChartEmpty = ({
  message = "Không có dữ liệu",
}: {
  message?: string;
}) => {
  return (
    <div className="flex flex-col items-center justify-center h-64 text-gray-500 dark:text-gray-400">
      <div className="text-4xl mb-2">📈</div>
      <p className="text-sm">{message}</p>
    </div>
  );
};
