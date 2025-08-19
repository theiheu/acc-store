"use client";

import { useState, useEffect } from 'react';

interface ProfitMetricCardProps {
  title: string;
  value: number;
  previousValue?: number;
  format: 'currency' | 'percentage' | 'number';
  trend?: 'up' | 'down' | 'stable';
  icon?: string;
  color?: 'green' | 'red' | 'blue' | 'amber' | 'purple' | 'gray';
  subtitle?: string;
  loading?: boolean;
  onClick?: () => void;
  className?: string;
}

export default function ProfitMetricCard({
  title,
  value,
  previousValue,
  format,
  trend,
  icon = '📊',
  color = 'blue',
  subtitle,
  loading = false,
  onClick,
  className = '',
}: ProfitMetricCardProps) {
  const [animatedValue, setAnimatedValue] = useState(0);

  // Animate value changes
  useEffect(() => {
    if (loading) return;
    
    const duration = 1000; // 1 second
    const steps = 60;
    const stepValue = value / steps;
    let currentStep = 0;

    const timer = setInterval(() => {
      currentStep++;
      setAnimatedValue(stepValue * currentStep);
      
      if (currentStep >= steps) {
        setAnimatedValue(value);
        clearInterval(timer);
      }
    }, duration / steps);

    return () => clearInterval(timer);
  }, [value, loading]);

  // Format value based on type
  const formatValue = (val: number) => {
    if (format === 'currency') {
      return val.toLocaleString('vi-VN') + '₫';
    } else if (format === 'percentage') {
      return val.toFixed(1) + '%';
    } else {
      return val.toLocaleString('vi-VN');
    }
  };

  // Calculate change percentage
  const getChangePercentage = () => {
    if (previousValue === undefined || previousValue === 0) return null;
    return ((value - previousValue) / previousValue) * 100;
  };

  const changePercentage = getChangePercentage();

  // Determine trend if not provided
  const determinedTrend = trend || (changePercentage !== null 
    ? changePercentage > 0 ? 'up' : changePercentage < 0 ? 'down' : 'stable'
    : 'stable');

  // Color classes
  const colorClasses = {
    green: {
      bg: 'bg-green-50 dark:bg-green-900/20',
      border: 'border-green-200 dark:border-green-800',
      icon: 'bg-green-100 dark:bg-green-800/30',
      text: 'text-green-600 dark:text-green-400',
    },
    red: {
      bg: 'bg-red-50 dark:bg-red-900/20',
      border: 'border-red-200 dark:border-red-800',
      icon: 'bg-red-100 dark:bg-red-800/30',
      text: 'text-red-600 dark:text-red-400',
    },
    blue: {
      bg: 'bg-blue-50 dark:bg-blue-900/20',
      border: 'border-blue-200 dark:border-blue-800',
      icon: 'bg-blue-100 dark:bg-blue-800/30',
      text: 'text-blue-600 dark:text-blue-400',
    },
    amber: {
      bg: 'bg-amber-50 dark:bg-amber-900/20',
      border: 'border-amber-200 dark:border-amber-800',
      icon: 'bg-amber-100 dark:bg-amber-800/30',
      text: 'text-amber-600 dark:text-amber-400',
    },
    purple: {
      bg: 'bg-purple-50 dark:bg-purple-900/20',
      border: 'border-purple-200 dark:border-purple-800',
      icon: 'bg-purple-100 dark:bg-purple-800/30',
      text: 'text-purple-600 dark:text-purple-400',
    },
    gray: {
      bg: 'bg-gray-50 dark:bg-gray-900/20',
      border: 'border-gray-200 dark:border-gray-800',
      icon: 'bg-gray-100 dark:bg-gray-800/30',
      text: 'text-gray-600 dark:text-gray-400',
    },
  };

  const colors = colorClasses[color];

  // Trend icons and colors
  const trendConfig = {
    up: { icon: '↗', color: 'text-green-600 dark:text-green-400' },
    down: { icon: '↘', color: 'text-red-600 dark:text-red-400' },
    stable: { icon: '→', color: 'text-gray-600 dark:text-gray-400' },
  };

  if (loading) {
    return (
      <div className={`${colors.bg} ${colors.border} border rounded-xl p-6 ${onClick ? 'cursor-pointer hover:shadow-md' : ''} transition-all duration-200 ${className}`}>
        <div className="animate-pulse">
          <div className="flex items-center justify-between mb-4">
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-24"></div>
            <div className={`w-12 h-12 ${colors.icon} rounded-lg`}></div>
          </div>
          <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-20 mb-2"></div>
          <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-16"></div>
        </div>
      </div>
    );
  }

  return (
    <div 
      className={`${colors.bg} ${colors.border} border rounded-xl p-6 ${onClick ? 'cursor-pointer hover:shadow-md hover:scale-105' : ''} transition-all duration-200 ${className}`}
      onClick={onClick}
    >
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400">
          {title}
        </h3>
        <div className={`w-12 h-12 ${colors.icon} rounded-lg flex items-center justify-center`}>
          <span className="text-2xl">{icon}</span>
        </div>
      </div>

      <div className="mb-2">
        <p className={`text-2xl font-bold ${colors.text}`}>
          {formatValue(animatedValue)}
        </p>
      </div>

      <div className="flex items-center justify-between">
        <div>
          {subtitle && (
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {subtitle}
            </p>
          )}
        </div>
        
        {changePercentage !== null && (
          <div className={`flex items-center text-xs font-medium ${trendConfig[determinedTrend].color}`}>
            <span className="mr-1">{trendConfig[determinedTrend].icon}</span>
            <span>{Math.abs(changePercentage).toFixed(1)}%</span>
          </div>
        )}
      </div>

      {/* Progress bar for percentage values */}
      {format === 'percentage' && (
        <div className="mt-3">
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
            <div 
              className={`h-2 rounded-full transition-all duration-1000 ${
                value >= 0 ? 'bg-green-500' : 'bg-red-500'
              }`}
              style={{ width: `${Math.min(Math.abs(value), 100)}%` }}
            ></div>
          </div>
        </div>
      )}
    </div>
  );
}
