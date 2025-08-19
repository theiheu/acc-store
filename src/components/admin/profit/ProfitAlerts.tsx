"use client";

import { useState, useEffect } from 'react';
import { ProfitAlert } from '@/src/core/profit';

interface ProfitAlertsProps {
  className?: string;
  maxAlerts?: number;
  showActions?: boolean;
  onAlertClick?: (alert: ProfitAlert) => void;
  onMarkAsRead?: (alertId: string) => void;
  onResolve?: (alertId: string) => void;
}

export default function ProfitAlerts({
  className = '',
  maxAlerts = 5,
  showActions = true,
  onAlertClick,
  onMarkAsRead,
  onResolve,
}: ProfitAlertsProps) {
  const [alerts, setAlerts] = useState<ProfitAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch alerts
  const fetchAlerts = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/admin/profit/alerts?unreadOnly=true&limit=${maxAlerts}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch alerts');
      }

      const result = await response.json();
      setAlerts(result.data.alerts);
    } catch (err) {
      console.error('Error fetching profit alerts:', err);
      setError('Không thể tải cảnh báo lợi nhuận');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAlerts();
  }, [maxAlerts]);

  // Handle mark as read
  const handleMarkAsRead = async (alertId: string) => {
    try {
      const response = await fetch('/api/admin/profit/alerts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'mark_read', alertId }),
      });

      if (response.ok) {
        setAlerts(prev => prev.filter(alert => alert.id !== alertId));
        onMarkAsRead?.(alertId);
      }
    } catch (err) {
      console.error('Error marking alert as read:', err);
    }
  };

  // Handle resolve
  const handleResolve = async (alertId: string) => {
    try {
      const response = await fetch('/api/admin/profit/alerts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'resolve', alertId }),
      });

      if (response.ok) {
        setAlerts(prev => prev.filter(alert => alert.id !== alertId));
        onResolve?.(alertId);
      }
    } catch (err) {
      console.error('Error resolving alert:', err);
    }
  };

  // Severity configurations
  const severityConfig = {
    critical: {
      icon: '🚨',
      color: 'border-red-500 bg-red-50 dark:bg-red-900/20',
      textColor: 'text-red-700 dark:text-red-300',
      badgeColor: 'bg-red-500 text-white',
    },
    high: {
      icon: '⚠️',
      color: 'border-orange-500 bg-orange-50 dark:bg-orange-900/20',
      textColor: 'text-orange-700 dark:text-orange-300',
      badgeColor: 'bg-orange-500 text-white',
    },
    medium: {
      icon: '⚡',
      color: 'border-yellow-500 bg-yellow-50 dark:bg-yellow-900/20',
      textColor: 'text-yellow-700 dark:text-yellow-300',
      badgeColor: 'bg-yellow-500 text-white',
    },
    low: {
      icon: 'ℹ️',
      color: 'border-blue-500 bg-blue-50 dark:bg-blue-900/20',
      textColor: 'text-blue-700 dark:text-blue-300',
      badgeColor: 'bg-blue-500 text-white',
    },
  };

  if (loading) {
    return (
      <div className={`bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-6 ${className}`}>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
          Cảnh báo lợi nhuận
        </h3>
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="animate-pulse">
              <div className="flex items-start space-x-3 p-3 border border-gray-200 dark:border-gray-700 rounded-lg">
                <div className="w-6 h-6 bg-gray-200 dark:bg-gray-700 rounded"></div>
                <div className="flex-1">
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-2"></div>
                  <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-6 ${className}`}>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
          Cảnh báo lợi nhuận
        </h3>
        <div className="text-center py-8">
          <div className="text-4xl mb-2">⚠️</div>
          <p className="text-gray-500 dark:text-gray-400">{error}</p>
          <button
            onClick={fetchAlerts}
            className="mt-3 px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-lg transition-colors"
          >
            Thử lại
          </button>
        </div>
      </div>
    );
  }

  if (alerts.length === 0) {
    return (
      <div className={`bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-6 ${className}`}>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
          Cảnh báo lợi nhuận
        </h3>
        <div className="text-center py-8">
          <div className="text-4xl mb-2">✅</div>
          <p className="text-gray-500 dark:text-gray-400">
            Không có cảnh báo lợi nhuận nào
          </p>
          <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">
            Tất cả chỉ số lợi nhuận đều ở mức bình thường
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-6 ${className}`}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
          Cảnh báo lợi nhuận
        </h3>
        <span className="bg-red-500 text-white text-xs px-2 py-1 rounded-full">
          {alerts.length}
        </span>
      </div>

      <div className="space-y-3">
        {alerts.map((alert) => {
          const config = severityConfig[alert.severity];
          
          return (
            <div
              key={alert.id}
              className={`border-l-4 ${config.color} p-4 rounded-lg cursor-pointer hover:shadow-md transition-all duration-200`}
              onClick={() => onAlertClick?.(alert)}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start space-x-3 flex-1">
                  <span className="text-lg">{config.icon}</span>
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-1">
                      <h4 className={`font-medium ${config.textColor}`}>
                        {alert.title}
                      </h4>
                      <span className={`text-xs px-2 py-1 rounded ${config.badgeColor}`}>
                        {alert.severity.toUpperCase()}
                      </span>
                    </div>
                    
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                      {alert.description}
                    </p>
                    
                    {alert.productTitle && (
                      <p className="text-xs text-gray-500 dark:text-gray-500 mb-2">
                        Sản phẩm: {alert.productTitle}
                      </p>
                    )}
                    
                    <p className="text-xs text-blue-600 dark:text-blue-400 font-medium">
                      💡 {alert.recommendation}
                    </p>
                    
                    <div className="flex items-center justify-between mt-3">
                      <span className="text-xs text-gray-400 dark:text-gray-500">
                        {new Date(alert.createdAt).toLocaleDateString('vi-VN', {
                          day: '2-digit',
                          month: '2-digit',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                      
                      {showActions && (
                        <div className="flex space-x-2">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleMarkAsRead(alert.id);
                            }}
                            className="text-xs px-2 py-1 bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 rounded transition-colors"
                          >
                            Đánh dấu đã đọc
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleResolve(alert.id);
                            }}
                            className="text-xs px-2 py-1 bg-green-500 hover:bg-green-600 text-white rounded transition-colors"
                          >
                            Giải quyết
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {alerts.length >= maxAlerts && (
        <div className="mt-4 text-center">
          <button
            onClick={() => window.location.href = '/admin/profit/alerts'}
            className="text-sm text-amber-600 hover:text-amber-700 dark:text-amber-400 dark:hover:text-amber-300 font-medium"
          >
            Xem tất cả cảnh báo →
          </button>
        </div>
      )}
    </div>
  );
}
