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

interface BarChartProps extends BaseChartProps {
  horizontal?: boolean;
  stacked?: boolean;
  showValues?: boolean;
}

export default function BarChart({
  data,
  title,
  height = 300,
  loading = false,
  error = null,
  className = "",
  horizontal = false,
  stacked = false,
  showValues = false,
}: BarChartProps) {
  const chartRef = useRef<any>(null);

  // Enhanced chart options for bar charts
  const barChartOptions = {
    ...commonChartOptions,
    indexAxis: horizontal ? ('y' as const) : ('x' as const),
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
      ...(showValues && {
        datalabels: {
          display: true,
          color: '#374151',
          font: {
            size: 10,
            weight: 'bold' as const,
          },
          formatter: (value: number) => {
            if (value >= 1000000) {
              return (value / 1000000).toFixed(1) + 'M';
            }
            if (value >= 1000) {
              return (value / 1000).toFixed(1) + 'K';
            }
            return value.toLocaleString('vi-VN');
          },
        },
      }),
    },
    scales: {
      x: {
        ...commonChartOptions.scales?.x,
        stacked,
        ...(horizontal && {
          beginAtZero: true,
          ticks: {
            font: {
              size: 11,
            },
            callback: function(value: any) {
              if (value >= 1000000) {
                return (value / 1000000).toFixed(1) + 'M';
              }
              if (value >= 1000) {
                return (value / 1000).toFixed(1) + 'K';
              }
              return value.toLocaleString('vi-VN');
            },
          },
        }),
      },
      y: {
        ...commonChartOptions.scales?.y,
        stacked,
        ...(!horizontal && {
          beginAtZero: true,
          ticks: {
            font: {
              size: 11,
            },
            callback: function(value: any) {
              if (value >= 1000000) {
                return (value / 1000000).toFixed(1) + 'M';
              }
              if (value >= 1000) {
                return (value / 1000).toFixed(1) + 'K';
              }
              return value.toLocaleString('vi-VN');
            },
          },
        }),
      },
    },
  };

  // Process data for bar chart
  const processedData = {
    ...data,
    datasets: data.datasets.map((dataset, index) => {
      const colorIndex = index % Object.keys(chartColors).length;
      const colorKey = Object.keys(chartColors)[colorIndex] as keyof typeof chartColors;
      const color = chartColors[colorKey];

      return {
        ...dataset,
        backgroundColor: color,
        borderColor: color,
        borderWidth: 1,
        borderRadius: 4,
        borderSkipped: false,
        hoverBackgroundColor: color + 'CC', // Add transparency on hover
        hoverBorderColor: color,
        hoverBorderWidth: 2,
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
        const datasetIndex = element.datasetIndex;
        const index = element.index;
        const value = data.datasets[datasetIndex].data[index];
        const label = data.labels[index];
        
        console.log('Bar chart clicked:', { label, value, datasetIndex });
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
  }, [data]);

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

  if (!data.labels.length || !data.datasets.length) {
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
          data={processedData}
          options={barChartOptions}
        />
      </div>
    </div>
  );
}
