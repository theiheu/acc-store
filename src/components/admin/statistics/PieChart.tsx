"use client";

import { useRef, useEffect } from 'react';
import { Pie, Doughnut } from 'react-chartjs-2';
import { 
  BaseChartProps, 
  chartColors,
  ChartSkeleton,
  ChartError,
  ChartEmpty
} from './ChartConfig';

interface PieChartProps extends BaseChartProps {
  variant?: 'pie' | 'doughnut';
  showPercentages?: boolean;
  showLegend?: boolean;
}

export default function PieChart({
  data,
  title,
  height = 300,
  loading = false,
  error = null,
  className = "",
  variant = 'pie',
  showPercentages = true,
  showLegend = true,
}: PieChartProps) {
  const chartRef = useRef<any>(null);

  // Calculate total for percentage calculations
  const total = data.datasets[0]?.data.reduce((sum: number, value: any) => {
    return sum + (typeof value === 'number' ? value : 0);
  }, 0) || 0;

  // Enhanced chart options for pie/doughnut charts
  const pieChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: showLegend,
        position: 'right' as const,
        labels: {
          usePointStyle: true,
          padding: 20,
          font: {
            size: 12,
          },
          generateLabels: function(chart: any) {
            const data = chart.data;
            if (data.labels.length && data.datasets.length) {
              return data.labels.map((label: string, i: number) => {
                const value = data.datasets[0].data[i];
                const percentage = total > 0 ? ((value / total) * 100).toFixed(1) : '0';
                
                return {
                  text: showPercentages ? `${label} (${percentage}%)` : label,
                  fillStyle: data.datasets[0].backgroundColor[i],
                  strokeStyle: data.datasets[0].backgroundColor[i],
                  lineWidth: 0,
                  pointStyle: 'circle',
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
          weight: 'bold' as const,
        },
        padding: {
          bottom: 20,
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
          label: function(context: any) {
            const label = context.label || '';
            const value = context.parsed;
            const percentage = total > 0 ? ((value / total) * 100).toFixed(1) : '0';
            
            // Format based on data type
            if (typeof value === 'number' && value >= 1000) {
              const formattedValue = value >= 1000000 
                ? (value / 1000000).toFixed(1) + 'M'
                : (value / 1000).toFixed(1) + 'K';
              return `${label}: ${formattedValue} (${percentage}%)`;
            }
            
            return `${label}: ${value.toLocaleString('vi-VN')} (${percentage}%)`;
          },
        },
      },
    },
    ...(variant === 'doughnut' && {
      cutout: '60%',
    }),
  };

  // Generate colors for pie chart
  const generateColors = (count: number) => {
    const colors = Object.values(chartColors);
    const result = [];
    
    for (let i = 0; i < count; i++) {
      result.push(colors[i % colors.length]);
    }
    
    return result;
  };

  // Process data for pie chart
  const processedData = {
    ...data,
    datasets: data.datasets.map((dataset) => {
      const colors = generateColors(data.labels.length);
      
      return {
        ...dataset,
        backgroundColor: colors,
        borderColor: colors.map(color => color + 'CC'),
        borderWidth: 2,
        hoverBackgroundColor: colors.map(color => color + 'DD'),
        hoverBorderColor: colors,
        hoverBorderWidth: 3,
        hoverOffset: 4,
      };
    }),
  };

  // Handle chart interactions
  useEffect(() => {
    const chart = chartRef.current;
    if (!chart) return;

    const handleClick = (event: any, elements: any[]) => {
      if (elements.length > 0) {
        const element = elements[0];
        const index = element.index;
        const value = data.datasets[0].data[index];
        const label = data.labels[index];
        const percentage = total > 0 ? ((value as number / total) * 100).toFixed(1) : '0';
        
        console.log('Pie chart clicked:', { label, value, percentage });
        // You can add custom click handlers here
      }
    };

    const handleHover = (event: any, elements: any[]) => {
      const chart = chartRef.current;
      if (chart && chart.canvas) {
        chart.canvas.style.cursor = elements.length > 0 ? 'pointer' : 'default';
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
  }, [data, total]);

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

  if (!data.labels.length || !data.datasets.length || total === 0) {
    return (
      <div className={`bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-6 ${className}`}>
        {title && (
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
            {title}
          </h3>
        )}
        <ChartEmpty />
      </div>
    );
  }

  const ChartComponent = variant === 'doughnut' ? Doughnut : Pie;

  return (
    <div className={`bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-6 ${className}`}>
      {title && (
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
          {title}
        </h3>
      )}
      <div style={{ height: `${height}px` }}>
        <ChartComponent
          ref={chartRef}
          data={processedData}
          options={pieChartOptions}
        />
      </div>
      
      {/* Center text for doughnut chart */}
      {variant === 'doughnut' && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">
              {total.toLocaleString('vi-VN')}
            </div>
            <div className="text-sm text-gray-500 dark:text-gray-400">
              Tổng cộng
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
