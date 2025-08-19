"use client";

import { useRef, useEffect } from 'react';
import { Line } from 'react-chartjs-2';
import { 
  BaseChartProps, 
  commonChartOptions, 
  chartColors, 
  createGradient,
  ChartSkeleton,
  ChartError,
  ChartEmpty
} from './ChartConfig';

interface ProfitMarginDataPoint {
  date: string;
  grossMargin: number;
  netMargin: number;
  revenue: number;
  costs: number;
}

interface ProfitMarginChartProps extends Omit<BaseChartProps, 'data'> {
  data: ProfitMarginDataPoint[];
  showTargetLine?: boolean;
  targetMargin?: number;
  showArea?: boolean;
}

export default function ProfitMarginChart({
  data,
  title,
  height = 350,
  loading = false,
  error = null,
  className = "",
  showTargetLine = true,
  targetMargin = 20, // 20% target margin
  showArea = true,
}: ProfitMarginChartProps) {
  const chartRef = useRef<any>(null);

  // Process data for profit margin visualization
  const processMarginData = () => {
    if (!data || data.length === 0) return { labels: [], datasets: [] };

    const labels = data.map(item => {
      const date = new Date(item.date);
      return date.toLocaleDateString('vi-VN', { 
        month: 'short', 
        day: 'numeric' 
      });
    });

    const datasets = [
      {
        label: 'Tỷ suất lợi nhuận gộp (%)',
        data: data.map(item => item.grossMargin),
        borderColor: chartColors.success,
        backgroundColor: showArea 
          ? (ctx: any) => createGradient(ctx.chart.ctx, chartColors.success, 0.1)
          : chartColors.success,
        borderWidth: 3,
        fill: showArea,
        tension: 0.4,
        pointRadius: 5,
        pointHoverRadius: 7,
        pointBackgroundColor: chartColors.success,
        pointBorderColor: '#fff',
        pointBorderWidth: 2,
        pointHoverBackgroundColor: chartColors.success,
        pointHoverBorderColor: '#fff',
        pointHoverBorderWidth: 3,
        yAxisID: 'y',
      },
      {
        label: 'Tỷ suất lợi nhuận ròng (%)',
        data: data.map(item => item.netMargin),
        borderColor: chartColors.primary,
        backgroundColor: showArea 
          ? (ctx: any) => createGradient(ctx.chart.ctx, chartColors.primary, 0.1)
          : chartColors.primary,
        borderWidth: 3,
        fill: showArea,
        tension: 0.4,
        pointRadius: 5,
        pointHoverRadius: 7,
        pointBackgroundColor: chartColors.primary,
        pointBorderColor: '#fff',
        pointBorderWidth: 2,
        pointHoverBackgroundColor: chartColors.primary,
        pointHoverBorderColor: '#fff',
        pointHoverBorderWidth: 3,
        yAxisID: 'y',
      },
    ];

    // Add target line if enabled
    if (showTargetLine) {
      datasets.push({
        label: `Mục tiêu (${targetMargin}%)`,
        data: data.map(() => targetMargin),
        borderColor: chartColors.danger,
        backgroundColor: 'transparent',
        borderWidth: 2,
        borderDash: [5, 5],
        fill: false,
        tension: 0,
        pointRadius: 0,
        pointHoverRadius: 0,
        yAxisID: 'y',
      } as any);
    }

    return { labels, datasets };
  };

  const chartData = processMarginData();

  // Enhanced chart options for profit margin trends
  const marginChartOptions = {
    ...commonChartOptions,
    responsive: true,
    maintainAspectRatio: false,
    interaction: {
      mode: 'index' as const,
      intersect: false,
    },
    plugins: {
      ...commonChartOptions.plugins,
      title: {
        display: !!title,
        text: title,
        font: {
          size: 16,
          weight: 'bold' as const,
        },
        padding: {
          bottom: 20,
        },
      },
      legend: {
        display: true,
        position: 'top' as const,
        labels: {
          usePointStyle: true,
          padding: 20,
          font: {
            size: 12,
          },
        },
      },
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        titleColor: '#fff',
        bodyColor: '#fff',
        borderColor: 'rgba(255, 255, 255, 0.1)',
        borderWidth: 1,
        cornerRadius: 8,
        displayColors: true,
        callbacks: {
          title: function(context: any) {
            const dataIndex = context[0].dataIndex;
            const dataPoint = data[dataIndex];
            const date = new Date(dataPoint.date);
            return date.toLocaleDateString('vi-VN', { 
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric'
            });
          },
          label: function(context: any) {
            const dataIndex = context.dataIndex;
            const dataPoint = data[dataIndex];
            const label = context.dataset.label;
            
            if (label.includes('Mục tiêu')) {
              return `${label}`;
            }
            
            const value = context.parsed.y;
            const color = value >= 0 ? '🟢' : '🔴';
            
            return `${color} ${label}: ${value.toFixed(1)}%`;
          },
          afterBody: function(context: any) {
            const dataIndex = context[0].dataIndex;
            const dataPoint = data[dataIndex];
            
            return [
              '',
              `📊 Doanh thu: ${dataPoint.revenue.toLocaleString('vi-VN')}₫`,
              `💰 Chi phí: ${dataPoint.costs.toLocaleString('vi-VN')}₫`,
              `📈 Lợi nhuận: ${(dataPoint.revenue - dataPoint.costs).toLocaleString('vi-VN')}₫`,
            ];
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
          maxRotation: 45,
        },
      },
      y: {
        type: 'linear' as const,
        display: true,
        position: 'left' as const,
        beginAtZero: false,
        grid: {
          color: 'rgba(0, 0, 0, 0.05)',
        },
        ticks: {
          font: {
            size: 11,
          },
          callback: function(value: any) {
            return value.toFixed(1) + '%';
          },
        },
        title: {
          display: true,
          text: 'Tỷ suất lợi nhuận (%)',
          font: {
            size: 12,
            weight: 'bold' as const,
          },
        },
      },
    },
  };

  // Add margin trend indicators
  const getMarginTrend = () => {
    if (!data || data.length < 2) return null;
    
    const latest = data[data.length - 1];
    const previous = data[data.length - 2];
    
    const grossTrend = latest.grossMargin - previous.grossMargin;
    const netTrend = latest.netMargin - previous.netMargin;
    
    return { grossTrend, netTrend };
  };

  const trend = getMarginTrend();

  if (loading) {
    return (
      <div className={`bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-6 ${className}`}>
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
      <div className={`bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-6 ${className}`}>
        {title && (
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
            {title}
          </h3>
        )}
        <ChartError error={error} />
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className={`bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-6 ${className}`}>
        {title && (
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
            {title}
          </h3>
        )}
        <ChartEmpty message="Không có dữ liệu tỷ suất lợi nhuận" />
      </div>
    );
  }

  return (
    <div className={`bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-6 ${className}`}>
      <div className="flex justify-between items-start mb-4">
        {title && (
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            {title}
          </h3>
        )}
        
        {trend && (
          <div className="flex gap-4 text-sm">
            <div className="text-center">
              <div className="text-gray-500 dark:text-gray-400">Lợi nhuận gộp</div>
              <div className={`font-semibold ${trend.grossTrend >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {trend.grossTrend >= 0 ? '↗' : '↘'} {Math.abs(trend.grossTrend).toFixed(1)}%
              </div>
            </div>
            <div className="text-center">
              <div className="text-gray-500 dark:text-gray-400">Lợi nhuận ròng</div>
              <div className={`font-semibold ${trend.netTrend >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {trend.netTrend >= 0 ? '↗' : '↘'} {Math.abs(trend.netTrend).toFixed(1)}%
              </div>
            </div>
          </div>
        )}
      </div>
      
      <div style={{ height: `${height}px` }}>
        <Line
          ref={chartRef}
          data={chartData}
          options={marginChartOptions}
        />
      </div>
    </div>
  );
}
