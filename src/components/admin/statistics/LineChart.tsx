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

interface LineChartProps extends BaseChartProps {
  showArea?: boolean;
  smooth?: boolean;
  multiAxis?: boolean;
}

export default function LineChart({
  data,
  title,
  height = 300,
  loading = false,
  error = null,
  className = "",
  showArea = false,
  smooth = true,
  multiAxis = false,
}: LineChartProps) {
  const chartRef = useRef<any>(null);

  // Enhanced chart options for line charts
  const lineChartOptions = {
    ...commonChartOptions,
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
    },
    scales: {
      ...commonChartOptions.scales,
      ...(multiAxis && {
        y1: {
          type: 'linear' as const,
          display: true,
          position: 'right' as const,
          grid: {
            drawOnChartArea: false,
          },
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
        },
      }),
    },
  };

  // Process data for line chart
  const processedData = {
    ...data,
    datasets: data.datasets.map((dataset, index) => {
      const colorIndex = index % Object.keys(chartColors).length;
      const colorKey = Object.keys(chartColors)[colorIndex] as keyof typeof chartColors;
      const color = chartColors[colorKey];

      return {
        ...dataset,
        borderColor: color,
        backgroundColor: showArea 
          ? (ctx: any) => createGradient(ctx.chart.ctx, color, 0.1)
          : color,
        borderWidth: 2,
        fill: showArea,
        tension: smooth ? 0.4 : 0,
        pointRadius: 4,
        pointHoverRadius: 6,
        pointBackgroundColor: color,
        pointBorderColor: '#fff',
        pointBorderWidth: 2,
        pointHoverBackgroundColor: color,
        pointHoverBorderColor: '#fff',
        pointHoverBorderWidth: 2,
        ...(multiAxis && index > 0 && { yAxisID: 'y1' }),
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
        
        console.log('Chart clicked:', { label, value, datasetIndex });
        // You can add custom click handlers here
      }
    };

    chart.options.onClick = handleClick;
    chart.update();

    return () => {
      if (chart.options) {
        chart.options.onClick = undefined;
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
        <Line
          ref={chartRef}
          data={processedData}
          options={lineChartOptions}
        />
      </div>
    </div>
  );
}
