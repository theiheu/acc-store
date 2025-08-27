"use client";

import { useState, useEffect } from "react";
import AdminLayout from "@/src/components/layout/AdminLayout";
import { withAdminAuth } from "@/src/components/providers/AdminAuthProvider";
import { useToastContext } from "@/src/components/providers/ToastProvider";
import { useGlobalLoading } from "@/src/components/providers/GlobalLoadingProvider";
import dynamic from "next/dynamic";
// Dynamically import heavy chart components (no SSR) to reduce bundle/SSR cost
const LineChart = dynamic(
  () => import("@/src/components/admin/statistics/LineChart"),
  { ssr: false }
);
const BarChart = dynamic(
  () => import("@/src/components/admin/statistics/BarChart"),
  { ssr: false }
);
const PieChart = dynamic(
  () => import("@/src/components/admin/statistics/PieChart"),
  { ssr: false }
);
const WaterfallChart = dynamic(
  () => import("@/src/components/admin/statistics/WaterfallChart"),
  { ssr: false }
);
const ProfitMarginChart = dynamic(
  () => import("@/src/components/admin/statistics/ProfitMarginChart"),
  { ssr: false }
);
const ProfitDistributionChart = dynamic(
  () => import("@/src/components/admin/statistics/ProfitDistributionChart"),
  { ssr: false }
);
import {
  ProfitMetricCard,
  ProfitAlerts,
  ProfitComparison,
} from "@/src/components/admin/profit";
import DateRangePicker, {
  DateRange,
} from "@/src/components/admin/statistics/DateRangePicker";
import { format, differenceInDays } from "date-fns";
import {
  reportExportService,
  ExportData,
  ProfitExportData,
} from "@/src/services/reportExportService";
import { ProfitAnalysis } from "@/src/core/profit";
import {
  validateProfitCalculations,
  logValidationResults,
} from "@/src/utils/profitValidation";
import { auditLogService } from "@/src/services/auditLogService";
import { useAnalyticsData } from "@/src/hooks/useAnalyticsData";

// Default date range (last 30 days)
const getDefaultDateRange = (): DateRange => ({
  startDate: new Date(Date.now() - 29 * 24 * 60 * 60 * 1000),
  endDate: new Date(),
  label: "30 ngày qua",
});

interface AnalyticsData {
  overview: {
    totalRevenue: number;
    totalOrders: number;
    totalUsers: number;
    conversionRate: number;
  };
  revenueData: Array<{
    date: string;
    revenue: number;
    orders: number;
  }>;
  userGrowthData: Array<{
    date: string;
    newUsers: number;
    totalUsers: number;
  }>;
  topProducts: Array<{
    productId: string;
    productTitle: string;
    salesCount: number;
    revenue: number;
  }>;
}

function AnalyticsPage() {
  const [selectedRange, setSelectedRange] = useState<DateRange>(
    getDefaultDateRange()
  );

  const { show } = useToastContext();
  const { withLoading } = useGlobalLoading();

  // Use optimized analytics data hook
  const {
    data: analyticsData,
    loading,
    error,
    lastFetchTime,
    refresh,
    getCacheStats,
  } = useAnalyticsData(selectedRange, {
    enableCache: true,
    staleWhileRevalidate: true,
    preloadNextRange: true,
    debounceMs: 300,
  });

  // Profit analysis state
  const [profitData, setProfitData] = useState<ProfitAnalysis | null>(null);
  const [profitLoading, setProfitLoading] = useState(false);
  const [showProfitSection, setShowProfitSection] = useState(false);

  // Fetch profit analysis data
  const fetchProfitData = async () => {
    try {
      setProfitLoading(true);
      const response = await fetch(
        `/api/admin/profit/analysis?startDate=${format(
          selectedRange.startDate,
          "yyyy-MM-dd"
        )}&endDate=${format(selectedRange.endDate, "yyyy-MM-dd")}`
      );

      if (response.ok) {
        const result = await response.json();
        setProfitData(result.data.analysis);
      }
    } catch (err) {
      console.error("Error fetching profit data:", err);
    } finally {
      setProfitLoading(false);
    }
  };

  // Log analytics access when range changes
  useEffect(() => {
    auditLogService.logAnalyticsAccess(selectedRange);

    // Fetch profit data if profit section is visible
    if (showProfitSection) {
      fetchProfitData();
    }
  }, [selectedRange, showProfitSection]);

  // Validate profit calculations (for debugging)
  const validateProfitData = () => {
    const result = validateProfitCalculations(
      selectedRange.startDate,
      selectedRange.endDate
    );
    logValidationResults(result);

    if (!result.isValid) {
      alert("Profit calculation errors detected. Check console for details.");
    } else {
      alert("Profit calculations are valid! ✅");
    }
  };

  // Start audit session when component mounts
  useEffect(() => {
    auditLogService.startSession("analytics_dashboard");

    return () => {
      auditLogService.endSession("analytics_dashboard");
    };
  }, []);

  const handleRangeChange = (range: DateRange) => {
    const oldRange = selectedRange;
    setSelectedRange(range);

    // Log filter change
    auditLogService.logFilterChange(
      "date_range",
      `${format(oldRange.startDate, "dd/MM/yyyy")} - ${format(
        oldRange.endDate,
        "dd/MM/yyyy"
      )}`,
      `${format(range.startDate, "dd/MM/yyyy")} - ${format(
        range.endDate,
        "dd/MM/yyyy"
      )}`
    );
  };

  const handleExportReport = async (format: "pdf" | "excel" | "csv") => {
    if (!analyticsData) {
      show("Không có dữ liệu để xuất báo cáo", "error");
      return;
    }

    await withLoading(async () => {
      try {
        const exportData: ExportData = {
          title: "Báo cáo thống kê & phân tích",
          dateRange: {
            startDate: selectedRange.startDate,
            endDate: selectedRange.endDate,
          },
          overview: analyticsData.overview,
          revenueData: analyticsData.revenueData,
          userGrowthData: analyticsData.userGrowthData,
          topProducts: analyticsData.topProducts,
        };

        switch (format) {
          case "pdf":
            if (profitData && showProfitSection) {
              // Export profit & loss statement if profit data is available
              const profitExportData: ProfitExportData = {
                title: "Báo cáo lợi nhuận & phân tích",
                dateRange: {
                  startDate: selectedRange.startDate,
                  endDate: selectedRange.endDate,
                },
                profitAnalysis: profitData,
              };
              await reportExportService.exportProfitLossStatement(
                profitExportData
              );
            } else {
              await reportExportService.exportToPDF(exportData, true);
            }
            break;
          case "excel":
            if (profitData && showProfitSection) {
              // Export cost analysis if profit data is available
              const profitExportData: ProfitExportData = {
                title: "Phân tích chi phí & lợi nhuận",
                dateRange: {
                  startDate: selectedRange.startDate,
                  endDate: selectedRange.endDate,
                },
                profitAnalysis: profitData,
              };
              await reportExportService.exportCostAnalysis(profitExportData);
            } else {
              await reportExportService.exportToExcel(exportData);
            }
            break;
          case "csv":
            await reportExportService.exportToCSV(exportData, "overview");
            break;
        }

        // Log report export
        await auditLogService.logReportExport(
          format,
          "analytics_overview",
          selectedRange,
          analyticsData.revenueData.length +
            analyticsData.userGrowthData.length +
            analyticsData.topProducts.length
        );

        show(`Xuất báo cáo ${format.toUpperCase()} thành công`, "success");
      } catch (err) {
        console.error("Export error:", err);
        show(`Lỗi khi xuất báo cáo ${format.toUpperCase()}`, "error");
      }
    }, `Đang xuất báo cáo ${format.toUpperCase()}...`);
  };

  if (loading && !analyticsData) {
    return (
      <AdminLayout
        title="Thống kê & Báo cáo"
        description="Phân tích dữ liệu kinh doanh"
      >
        <div className="space-y-6">
          {/* Loading skeleton */}
          <div className="flex justify-between items-center">
            <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-48 animate-pulse" />
            <div className="flex gap-2">
              <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded w-32 animate-pulse" />
              <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded w-24 animate-pulse" />
            </div>
          </div>

          {/* Stats cards skeleton */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[...Array(4)].map((_, i) => (
              <div
                key={i}
                className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-6"
              >
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-24 mb-2 animate-pulse" />
                <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-16 mb-1 animate-pulse" />
                <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-20 animate-pulse" />
              </div>
            ))}
          </div>

          {/* Charts skeleton */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {[...Array(2)].map((_, i) => (
              <div
                key={i}
                className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-6"
              >
                <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-32 mb-4 animate-pulse" />
                <div className="h-64 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
              </div>
            ))}
          </div>
        </div>
      </AdminLayout>
    );
  }

  if (error && !analyticsData) {
    return (
      <AdminLayout
        title="Thống kê & Báo cáo"
        description="Phân tích dữ liệu kinh doanh"
      >
        <div className="text-center py-12">
          <div className="text-6xl mb-4">📊</div>
          <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
            Không thể tải dữ liệu thống kê
          </h3>
          <p className="text-gray-500 dark:text-gray-400 mb-4">{error}</p>
          <button
            onClick={refresh}
            className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-lg transition-colors"
          >
            Thử lại
          </button>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout
      title="Thống kê & Báo cáo"
      description="Phân tích dữ liệu kinh doanh"
    >
      <div className="space-y-6">
        {/* Header with filters and export */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
              Thống kê & Báo cáo
            </h1>
            {lastFetchTime > 0 && (
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Tải dữ liệu trong {lastFetchTime}ms
                {getCacheStats().size > 0 && (
                  <span className="ml-2">
                    • Cache: {getCacheStats().size} mục
                  </span>
                )}
              </p>
            )}
          </div>

          <div className="flex flex-col sm:flex-row gap-2">
            {/* Profit Analysis Toggle */}
            <button
              onClick={() => setShowProfitSection(!showProfitSection)}
              className={`px-3 py-2 border rounded-lg transition-colors ${
                showProfitSection
                  ? "bg-amber-500 border-amber-500 text-white hover:bg-amber-600"
                  : "border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 hover:bg-gray-50 dark:hover:bg-gray-700"
              }`}
              title="Phân tích lợi nhuận"
            >
              💰 Lợi nhuận
            </button>

            {/* Refresh button */}
            <button
              onClick={refresh}
              disabled={loading}
              className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              title="Làm mới dữ liệu"
            >
              <span className={`text-lg ${loading ? "animate-spin" : ""}`}>
                🔄
              </span>
            </button>

            {/* Date range picker */}
            <DateRangePicker
              value={selectedRange}
              onChange={handleRangeChange}
              className="w-64"
              disabled={loading}
            />

            {/* Export dropdown */}
            <div className="relative">
              <select
                onChange={async (e) => {
                  if (e.target.value) {
                    const value = e.target.value;
                    if (value.startsWith("csv-")) {
                      const csvType = value.replace("csv-", "") as
                        | "overview"
                        | "revenue"
                        | "users"
                        | "products";
                      if (analyticsData) {
                        try {
                          const exportData: ExportData = {
                            title: "Báo cáo thống kê & phân tích",
                            dateRange: {
                              startDate: selectedRange.startDate,
                              endDate: selectedRange.endDate,
                            },
                            overview: analyticsData.overview,
                            revenueData: analyticsData.revenueData,
                            userGrowthData: analyticsData.userGrowthData,
                            topProducts: analyticsData.topProducts,
                          };
                          await reportExportService.exportToCSV(
                            exportData,
                            csvType
                          );

                          // Log CSV export
                          await auditLogService.logReportExport(
                            "csv",
                            `analytics_${csvType}`,
                            selectedRange,
                            csvType === "overview"
                              ? 4
                              : csvType === "revenue"
                              ? analyticsData.revenueData.length
                              : csvType === "users"
                              ? analyticsData.userGrowthData.length
                              : analyticsData.topProducts.length
                          );

                          show(`Xuất CSV thành công`, "success");
                        } catch (err) {
                          show(`Lỗi khi xuất CSV`, "error");
                        }
                      }
                    } else {
                      handleExportReport(value as "pdf" | "excel" | "csv");
                    }
                    e.target.value = "";
                  }
                }}
                disabled={loading}
                className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-amber-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <option value="">Xuất báo cáo</option>
                <option value="pdf">📄 PDF (Đầy đủ)</option>
                <option value="excel">📊 Excel (Đầy đủ)</option>
                <optgroup label="CSV (Từng phần)">
                  <option value="csv-overview">📋 Tổng quan</option>
                  <option value="csv-revenue">💰 Doanh thu</option>
                  <option value="csv-users">👥 Người dùng</option>
                  <option value="csv-products">📦 Sản phẩm</option>
                </optgroup>
              </select>
            </div>
          </div>
        </div>

        {/* Overview Stats */}
        {analyticsData && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                    Tổng doanh thu
                  </p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                    {analyticsData.overview.totalRevenue.toLocaleString(
                      "vi-VN"
                    )}
                    ₫
                  </p>
                </div>
                <div className="w-12 h-12 bg-green-100 dark:bg-green-300/10 rounded-lg flex items-center justify-center">
                  <span className="text-2xl">💰</span>
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                    Tổng đơn hàng
                  </p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                    {analyticsData.overview.totalOrders.toLocaleString()}
                  </p>
                </div>
                <div className="w-12 h-12 bg-blue-100 dark:bg-blue-300/10 rounded-lg flex items-center justify-center">
                  <span className="text-2xl">🛒</span>
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                    Tổng người dùng
                  </p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                    {analyticsData.overview.totalUsers.toLocaleString()}
                  </p>
                </div>
                <div className="w-12 h-12 bg-purple-100 dark:bg-purple-300/10 rounded-lg flex items-center justify-center">
                  <span className="text-2xl">👥</span>
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                    Tỷ lệ chuyển đổi
                  </p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                    {analyticsData.overview.conversionRate.toFixed(1)}%
                  </p>
                </div>
                <div className="w-12 h-12 bg-amber-100 dark:bg-amber-300/10 rounded-lg flex items-center justify-center">
                  <span className="text-2xl">📈</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Charts Section */}
        {analyticsData && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <LineChart
              data={{
                labels: analyticsData.revenueData.map((item) => {
                  const date = new Date(item.date);
                  return date.toLocaleDateString("vi-VN", {
                    month: "short",
                    day: "numeric",
                  });
                }),
                datasets: [
                  {
                    label: "Doanh thu",
                    data: analyticsData.revenueData.map((item) => item.revenue),
                  },
                  {
                    label: "Số đơn hàng",
                    data: analyticsData.revenueData.map((item) => item.orders),
                  },
                ],
              }}
              title="Doanh thu theo thời gian"
              height={300}
              showArea={true}
              multiAxis={true}
              loading={loading}
            />

            <LineChart
              data={{
                labels: analyticsData.userGrowthData.map((item) => {
                  const date = new Date(item.date);
                  return date.toLocaleDateString("vi-VN", {
                    month: "short",
                    day: "numeric",
                  });
                }),
                datasets: [
                  {
                    label: "Người dùng mới",
                    data: analyticsData.userGrowthData.map(
                      (item) => item.newUsers
                    ),
                  },
                  {
                    label: "Tổng người dùng",
                    data: analyticsData.userGrowthData.map(
                      (item) => item.totalUsers
                    ),
                  },
                ],
              }}
              title="Tăng trưởng người dùng"
              height={300}
              showArea={false}
              multiAxis={true}
              loading={loading}
            />
          </div>
        )}

        {/* Additional Charts Row */}
        {analyticsData && analyticsData.topProducts.length > 0 && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <BarChart
              data={{
                labels: analyticsData.topProducts.map((product) =>
                  product.productTitle.length > 20
                    ? product.productTitle.substring(0, 20) + "..."
                    : product.productTitle
                ),
                datasets: [
                  {
                    label: "Số lượng bán",
                    data: analyticsData.topProducts.map(
                      (product) => product.salesCount
                    ),
                  },
                ],
              }}
              title="Top sản phẩm bán chạy"
              height={300}
              loading={loading}
            />

            <PieChart
              data={{
                labels: analyticsData.topProducts.map((product) =>
                  product.productTitle.length > 15
                    ? product.productTitle.substring(0, 15) + "..."
                    : product.productTitle
                ),
                datasets: [
                  {
                    label: "Doanh thu",
                    data: analyticsData.topProducts.map(
                      (product) => product.revenue
                    ),
                  },
                ],
              }}
              title="Phân bố doanh thu theo sản phẩm"
              height={300}
              variant="doughnut"
              loading={loading}
            />
          </div>
        )}

        {/* Profit Analysis Section */}
        {showProfitSection && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">
                📊 Phân tích lợi nhuận
              </h2>
              <div className="flex items-center gap-3">
                {profitData && (
                  <div className="text-sm text-gray-500 dark:text-gray-400">
                    Cập nhật: {format(new Date(), "dd/MM/yyyy HH:mm")}
                  </div>
                )}
                {process.env.NODE_ENV === "development" && (
                  <button
                    onClick={validateProfitData}
                    className="px-3 py-1 text-xs bg-blue-500 hover:bg-blue-600 text-white rounded transition-colors"
                    title="Validate profit calculations (dev only)"
                  >
                    🔍 Validate
                  </button>
                )}
              </div>
            </div>

            {/* Profit Metrics Cards */}
            {profitData && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <ProfitMetricCard
                  title="Doanh thu"
                  value={profitData.revenue?.total || 0}
                  format="currency"
                  icon="💰"
                  color="blue"
                  loading={profitLoading}
                />
                <ProfitMetricCard
                  title="Lợi nhuận gộp"
                  value={profitData.profit?.gross || 0}
                  format="currency"
                  icon="📈"
                  color="green"
                  loading={profitLoading}
                />
                <ProfitMetricCard
                  title="Lợi nhuận ròng"
                  value={profitData.profit?.net || 0}
                  format="currency"
                  icon="💎"
                  color={(profitData.profit?.net || 0) >= 0 ? "green" : "red"}
                  loading={profitLoading}
                />
                <ProfitMetricCard
                  title="Tỷ suất lợi nhuận"
                  value={profitData.profit?.netMargin || 0}
                  format="percentage"
                  icon="📊"
                  color={
                    (profitData.profit?.netMargin || 0) >= 10
                      ? "green"
                      : (profitData.profit?.netMargin || 0) >= 0
                      ? "amber"
                      : "red"
                  }
                  loading={profitLoading}
                />
              </div>
            )}

            {/* Profit Charts */}
            {profitData && profitData.revenue && profitData.costs && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Waterfall Chart for Profit Breakdown */}
                <WaterfallChart
                  data={[
                    {
                      label: "Doanh thu",
                      value: profitData.revenue?.total || 0,
                      type: "positive",
                    },
                    {
                      label: "Giá vốn",
                      value: -(profitData.costs?.cogs || 0),
                      type: "negative",
                    },
                    {
                      label: "Chi phí vận hành",
                      value: -(profitData.costs?.operational || 0),
                      type: "negative",
                    },
                    {
                      label: "Chi phí marketing",
                      value: -(profitData.costs?.marketing || 0),
                      type: "negative",
                    },
                    {
                      label: "Chi phí khác",
                      value: -(
                        (profitData.costs?.administrative || 0) +
                        (profitData.costs?.transactionFees || 0) +
                        (profitData.costs?.other || 0)
                      ),
                      type: "negative",
                    },
                    {
                      label: "Lợi nhuận ròng",
                      value: profitData.profit?.net || 0,
                      type: "total",
                    },
                  ]}
                  title="Phân tích lợi nhuận chi tiết"
                  height={350}
                  loading={profitLoading}
                />

                {/* Cost Distribution */}
                <ProfitDistributionChart
                  data={[
                    {
                      category: "Giá vốn hàng bán",
                      profit: profitData.costs?.cogs || 0,
                      margin:
                        profitData.revenue?.total > 0
                          ? ((profitData.costs?.cogs || 0) /
                              profitData.revenue.total) *
                            100
                          : 0,
                    },
                    {
                      category: "Chi phí vận hành",
                      profit: profitData.costs?.operational || 0,
                      margin:
                        profitData.revenue?.total > 0
                          ? ((profitData.costs?.operational || 0) /
                              profitData.revenue.total) *
                            100
                          : 0,
                    },
                    {
                      category: "Chi phí marketing",
                      profit: profitData.costs?.marketing || 0,
                      margin:
                        profitData.revenue?.total > 0
                          ? ((profitData.costs?.marketing || 0) /
                              profitData.revenue.total) *
                            100
                          : 0,
                    },
                    {
                      category: "Chi phí quản lý",
                      profit: profitData.costs?.administrative || 0,
                      margin:
                        profitData.revenue?.total > 0
                          ? ((profitData.costs?.administrative || 0) /
                              profitData.revenue.total) *
                            100
                          : 0,
                    },
                    {
                      category: "Phí giao dịch",
                      profit: profitData.costs?.transactionFees || 0,
                      margin:
                        profitData.revenue?.total > 0
                          ? ((profitData.costs?.transactionFees || 0) /
                              profitData.revenue.total) *
                            100
                          : 0,
                    },
                    {
                      category: "Chi phí khác",
                      profit: profitData.costs?.other || 0,
                      margin:
                        profitData.revenue?.total > 0
                          ? ((profitData.costs?.other || 0) /
                              profitData.revenue.total) *
                            100
                          : 0,
                    },
                  ]}
                  title="Phân bố chi phí"
                  height={350}
                  centerText="Tổng chi phí"
                  centerValue={profitData.costs?.total || 0}
                  loading={profitLoading}
                />
              </div>
            )}

            {/* Profit Alerts and Comparison */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <ProfitAlerts maxAlerts={5} showActions={true} />

              <ProfitComparison
                onPeriodChange={(periods) => {
                  console.log("Comparison periods changed:", periods);
                }}
              />
            </div>
          </div>
        )}

        {/* Top Products Table */}
        {analyticsData && analyticsData.topProducts.length > 0 && (
          <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
              Sản phẩm bán chạy nhất
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200 dark:border-gray-700">
                    <th className="text-left py-3 px-4 font-medium text-gray-600 dark:text-gray-400">
                      Sản phẩm
                    </th>
                    <th className="text-right py-3 px-4 font-medium text-gray-600 dark:text-gray-400">
                      Đã bán
                    </th>
                    <th className="text-right py-3 px-4 font-medium text-gray-600 dark:text-gray-400">
                      Doanh thu
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {analyticsData.topProducts.map((product) => (
                    <tr
                      key={product.productId}
                      className="border-b border-gray-100 dark:border-gray-800"
                    >
                      <td className="py-3 px-4 text-gray-900 dark:text-gray-100">
                        {product.productTitle}
                      </td>
                      <td className="py-3 px-4 text-right text-gray-900 dark:text-gray-100">
                        {product.salesCount}
                      </td>
                      <td className="py-3 px-4 text-right text-gray-900 dark:text-gray-100">
                        {product.revenue.toLocaleString("vi-VN")}₫
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}

export default withAdminAuth(AnalyticsPage);
