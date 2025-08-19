"use client";

import { useState, useEffect } from 'react';
import { format, subDays, startOfDay, endOfDay } from 'date-fns';
import { ProfitAnalysis } from '@/src/core/profit';

interface ComparisonPeriod {
  label: string;
  startDate: Date;
  endDate: Date;
}

interface ProfitComparisonProps {
  className?: string;
  defaultPeriods?: ComparisonPeriod[];
  onPeriodChange?: (periods: ComparisonPeriod[]) => void;
}

export default function ProfitComparison({
  className = '',
  defaultPeriods,
  onPeriodChange,
}: ProfitComparisonProps) {
  const [periods, setPeriods] = useState<ComparisonPeriod[]>(
    defaultPeriods || [
      {
        label: 'Tháng này',
        startDate: startOfDay(new Date(new Date().getFullYear(), new Date().getMonth(), 1)),
        endDate: endOfDay(new Date()),
      },
      {
        label: 'Tháng trước',
        startDate: startOfDay(new Date(new Date().getFullYear(), new Date().getMonth() - 1, 1)),
        endDate: endOfDay(new Date(new Date().getFullYear(), new Date().getMonth(), 0)),
      },
    ]
  );

  const [analysisData, setAnalysisData] = useState<ProfitAnalysis[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch comparison data
  const fetchComparisonData = async () => {
    try {
      setLoading(true);
      setError(null);

      const promises = periods.map(async (period) => {
        const response = await fetch(
          `/api/admin/profit/analysis?startDate=${format(period.startDate, 'yyyy-MM-dd')}&endDate=${format(period.endDate, 'yyyy-MM-dd')}`
        );
        
        if (!response.ok) {
          throw new Error(`Failed to fetch data for ${period.label}`);
        }

        const result = await response.json();
        return {
          ...result.data.analysis,
          periodLabel: period.label,
        };
      });

      const results = await Promise.all(promises);
      setAnalysisData(results);
    } catch (err) {
      console.error('Error fetching comparison data:', err);
      setError('Không thể tải dữ liệu so sánh');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchComparisonData();
  }, [periods]);

  useEffect(() => {
    onPeriodChange?.(periods);
  }, [periods, onPeriodChange]);

  // Calculate comparison metrics
  const getComparisonMetrics = () => {
    if (analysisData.length < 2) return null;

    const [current, previous] = analysisData;
    
    return {
      revenueChange: previous.revenue.total > 0 
        ? ((current.revenue.total - previous.revenue.total) / previous.revenue.total) * 100 
        : 0,
      profitChange: previous.profit.net > 0 
        ? ((current.profit.net - previous.profit.net) / previous.profit.net) * 100 
        : 0,
      marginChange: current.profit.netMargin - previous.profit.netMargin,
      costChange: previous.costs.total > 0 
        ? ((current.costs.total - previous.costs.total) / previous.costs.total) * 100 
        : 0,
    };
  };

  const comparisonMetrics = getComparisonMetrics();

  // Add custom period
  const addCustomPeriod = () => {
    const newPeriod: ComparisonPeriod = {
      label: `Kỳ ${periods.length + 1}`,
      startDate: startOfDay(subDays(new Date(), 30)),
      endDate: endOfDay(new Date()),
    };
    
    setPeriods([...periods, newPeriod]);
  };

  // Remove period
  const removePeriod = (index: number) => {
    if (periods.length > 1) {
      setPeriods(periods.filter((_, i) => i !== index));
    }
  };

  // Update period
  const updatePeriod = (index: number, updates: Partial<ComparisonPeriod>) => {
    const updatedPeriods = periods.map((period, i) => 
      i === index ? { ...period, ...updates } : period
    );
    setPeriods(updatedPeriods);
  };

  if (loading) {
    return (
      <div className={`bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-6 ${className}`}>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
          So sánh lợi nhuận
        </h3>
        <div className="animate-pulse space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-20 bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-6 ${className}`}>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
          So sánh lợi nhuận
        </h3>
        <div className="text-center py-8">
          <div className="text-4xl mb-2">⚠️</div>
          <p className="text-gray-500 dark:text-gray-400">{error}</p>
          <button
            onClick={fetchComparisonData}
            className="mt-3 px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-lg transition-colors"
          >
            Thử lại
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-6 ${className}`}>
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
          So sánh lợi nhuận
        </h3>
        <button
          onClick={addCustomPeriod}
          className="px-3 py-1 text-sm bg-amber-500 hover:bg-amber-600 text-white rounded-lg transition-colors"
        >
          + Thêm kỳ
        </button>
      </div>

      {/* Period Configuration */}
      <div className="space-y-3 mb-6">
        {periods.map((period, index) => (
          <div key={index} className="flex items-center space-x-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <input
              type="text"
              value={period.label}
              onChange={(e) => updatePeriod(index, { label: e.target.value })}
              className="flex-1 px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
            />
            <input
              type="date"
              value={format(period.startDate, 'yyyy-MM-dd')}
              onChange={(e) => updatePeriod(index, { startDate: new Date(e.target.value) })}
              className="px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
            />
            <span className="text-gray-500">đến</span>
            <input
              type="date"
              value={format(period.endDate, 'yyyy-MM-dd')}
              onChange={(e) => updatePeriod(index, { endDate: new Date(e.target.value) })}
              className="px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
            />
            {periods.length > 1 && (
              <button
                onClick={() => removePeriod(index)}
                className="px-2 py-1 text-sm text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
              >
                ✕
              </button>
            )}
          </div>
        ))}
      </div>

      {/* Comparison Results */}
      {analysisData.length > 0 && (
        <div className="space-y-6">
          {/* Summary Comparison */}
          {comparisonMetrics && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">Doanh thu</div>
                <div className={`text-lg font-bold ${comparisonMetrics.revenueChange >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {comparisonMetrics.revenueChange >= 0 ? '+' : ''}{comparisonMetrics.revenueChange.toFixed(1)}%
                </div>
              </div>
              
              <div className="text-center p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">Lợi nhuận</div>
                <div className={`text-lg font-bold ${comparisonMetrics.profitChange >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {comparisonMetrics.profitChange >= 0 ? '+' : ''}{comparisonMetrics.profitChange.toFixed(1)}%
                </div>
              </div>
              
              <div className="text-center p-4 bg-amber-50 dark:bg-amber-900/20 rounded-lg">
                <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">Tỷ suất</div>
                <div className={`text-lg font-bold ${comparisonMetrics.marginChange >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {comparisonMetrics.marginChange >= 0 ? '+' : ''}{comparisonMetrics.marginChange.toFixed(1)}%
                </div>
              </div>
              
              <div className="text-center p-4 bg-red-50 dark:bg-red-900/20 rounded-lg">
                <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">Chi phí</div>
                <div className={`text-lg font-bold ${comparisonMetrics.costChange <= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {comparisonMetrics.costChange >= 0 ? '+' : ''}{comparisonMetrics.costChange.toFixed(1)}%
                </div>
              </div>
            </div>
          )}

          {/* Detailed Comparison Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 dark:border-gray-700">
                  <th className="text-left py-3 px-4 font-medium text-gray-600 dark:text-gray-400">Kỳ</th>
                  <th className="text-right py-3 px-4 font-medium text-gray-600 dark:text-gray-400">Doanh thu</th>
                  <th className="text-right py-3 px-4 font-medium text-gray-600 dark:text-gray-400">Chi phí</th>
                  <th className="text-right py-3 px-4 font-medium text-gray-600 dark:text-gray-400">Lợi nhuận</th>
                  <th className="text-right py-3 px-4 font-medium text-gray-600 dark:text-gray-400">Tỷ suất</th>
                </tr>
              </thead>
              <tbody>
                {analysisData.map((analysis, index) => (
                  <tr key={index} className="border-b border-gray-100 dark:border-gray-800">
                    <td className="py-3 px-4 font-medium text-gray-900 dark:text-gray-100">
                      {analysis.periodLabel}
                    </td>
                    <td className="py-3 px-4 text-right text-gray-900 dark:text-gray-100">
                      {analysis.revenue.total.toLocaleString('vi-VN')}₫
                    </td>
                    <td className="py-3 px-4 text-right text-gray-900 dark:text-gray-100">
                      {analysis.costs.total.toLocaleString('vi-VN')}₫
                    </td>
                    <td className={`py-3 px-4 text-right font-medium ${analysis.profit.net >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {analysis.profit.net.toLocaleString('vi-VN')}₫
                    </td>
                    <td className={`py-3 px-4 text-right font-medium ${analysis.profit.netMargin >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {analysis.profit.netMargin.toFixed(1)}%
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
