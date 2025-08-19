"use client";

import { useRef, useEffect } from 'react';
import { Bar } from 'react-chartjs-2';
import { 
  BaseChartProps, 
  commonChartOptions, 
  chartColors,
  ChartSkeleton,
  ChartError,
  ChartEmpty
} from './ChartConfig';

interface WaterfallDataPoint {
  label: string;
  value: number;
  type: 'positive' | 'negative' | 'total';
  cumulative?: number;
}

interface WaterfallChartProps extends Omit<BaseChartProps, 'data'> {
  data: WaterfallDataPoint[];
  showCumulative?: boolean;
  currency?: string;
}

export default function WaterfallChart({
  data,
  title,
  height = 400,
  loading = false,
  error = null,
  className = "",
  showCumulative = true,
  currency = "₫",
}: WaterfallChartProps) {
  const chartRef = useRef<any>(null);

  // Process data for waterfall visualization
  const processWaterfallData = () => {
    if (!data || data.length === 0) return { labels: [], datasets: [] };

    let cumulative = 0;
    const processedData = data.map((item, index) => {
      if (item.type === 'total') {
        cumulative = item.value;
      } else {
        cumulative += item.value;
      }
      
      return {
        ...item,
        cumulative,
        startValue: cumulative - item.value,
      };
    });

    const labels = processedData.map(item => item.label);
    
    // Create datasets for positive, negative, and total bars
    const positiveData = processedData.map(item => 
      item.type === 'positive' ? item.value : null
    );
    
    const negativeData = processedData.map(item => 
      item.type === 'negative' ? Math.abs(item.value) : null
    );
    
    const totalData = processedData.map(item => 
      item.type === 'total' ? item.value : null
    );

    // Base values for stacking (to create floating bars)
    const baseData = processedData.map(item => 
      item.type !== 'total' ? item.startValue : 0
    );

    const datasets = [
      // Base (invisible) bars for positioning
      {
        label: 'Base',
        data: baseData,
        backgroundColor: 'transparent',
        borderColor: 'transparent',
        borderWidth: 0,
      },
      // Positive values
      {
        label: 'Tăng',
        data: positiveData,
        backgroundColor: chartColors.success,
        borderColor: chartColors.success,
        borderWidth: 1,
        borderRadius: 4,
      },
      // Negative values
      {
        label: 'Giảm',
        data: negativeData,
        backgroundColor: chartColors.danger,
        borderColor: chartColors.danger,
        borderWidth: 1,
        borderRadius: 4,
      },
      // Total values
      {
        label: 'Tổng',
        data: totalData,
        backgroundColor: chartColors.primary,
        borderColor: chartColors.primary,
        borderWidth: 1,
        borderRadius: 4,
      },
    ];

    return { labels, datasets };
  };

  const chartData = processWaterfallData();

  // Enhanced chart options for waterfall
  const waterfallOptions = {
    ...commonChartOptions,
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      x: {
        stacked: true,
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
        stacked: true,
        beginAtZero: false,
        grid: {
          color: 'rgba(0, 0, 0, 0.05)',
        },
        ticks: {
          font: {
            size: 11,
          },
          callback: function(value: any) {
            if (Math.abs(value) >= 1000000) {
              return (value / 1000000).toFixed(1) + 'M' + currency;
            }
            if (Math.abs(value) >= 1000) {
              return (value / 1000).toFixed(1) + 'K' + currency;
            }
            return value.toLocaleString('vi-VN') + currency;
          },
        },
      },
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
          filter: function(legendItem: any) {
            // Hide the base dataset from legend
            return legendItem.text !== 'Base';
          },
          usePointStyle: true,
          padding: 20,
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
            return context[0].label;
          },
          label: function(context: any) {
            const dataIndex = context.dataIndex;
            const dataPoint = data[dataIndex];
            
            if (!dataPoint || context.dataset.label === 'Base') return '';
            
            const value = dataPoint.value;
            const formattedValue = Math.abs(value).toLocaleString('vi-VN') + currency;
            
            if (dataPoint.type === 'positive') {
              return `Tăng: +${formattedValue}`;
            } else if (dataPoint.type === 'negative') {
              return `Giảm: -${formattedValue}`;
            } else {
              return `Tổng: ${formattedValue}`;
            }
          },
          afterLabel: function(context: any) {
            if (showCumulative) {
              const dataIndex = context.dataIndex;
              const dataPoint = data[dataIndex];
              if (dataPoint && dataPoint.cumulative !== undefined) {
                return `Tích lũy: ${dataPoint.cumulative.toLocaleString('vi-VN')}${currency}`;
              }
            }
            return '';
          },
        },
      },
    },
    interaction: {
      mode: 'index' as const,
      intersect: false,
    },
  };

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
        <ChartEmpty message="Không có dữ liệu waterfall" />
      </div>
    );
  }

  return (
    <div className={`bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-6 ${className}`}>
      {title && (
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
          {title}
        </h3>
      )}
      <div style={{ height: `${height}px` }}>
        <Bar
          ref={chartRef}
          data={chartData}
          options={waterfallOptions}
        />
      </div>
    </div>
  );
}
