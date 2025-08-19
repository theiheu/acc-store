"use client";

import jsPDF from "jspdf";
import * as XLSX from "xlsx";
import html2canvas from "html2canvas";
import { format } from "date-fns";
import { ProfitAnalysis, ProfitForecast, ROIAnalysis } from "@/src/core/profit";

export interface ExportData {
  title: string;
  dateRange: {
    startDate: Date;
    endDate: Date;
  };
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

export interface ProfitExportData {
  title: string;
  dateRange: {
    startDate: Date;
    endDate: Date;
  };
  profitAnalysis: ProfitAnalysis;
  forecast?: ProfitForecast;
  roiAnalysis?: ROIAnalysis[];
  comparisonData?: {
    currentPeriod: ProfitAnalysis;
    previousPeriod: ProfitAnalysis;
  };
}

class ReportExportService {
  // Export to PDF
  async exportToPDF(
    data: ExportData,
    includeCharts: boolean = true
  ): Promise<void> {
    const pdf = new jsPDF("p", "mm", "a4");
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    let yPosition = 20;

    // Set font for Vietnamese support
    pdf.setFont("helvetica");

    // Title
    pdf.setFontSize(20);
    pdf.text(data.title, pageWidth / 2, yPosition, { align: "center" });
    yPosition += 15;

    // Date range
    pdf.setFontSize(12);
    const dateRangeText = `Thời gian: ${format(
      data.dateRange.startDate,
      "dd/MM/yyyy"
    )} - ${format(data.dateRange.endDate, "dd/MM/yyyy")}`;
    pdf.text(dateRangeText, pageWidth / 2, yPosition, { align: "center" });
    yPosition += 20;

    // Overview section
    pdf.setFontSize(16);
    pdf.text("Tổng quan", 20, yPosition);
    yPosition += 10;

    pdf.setFontSize(12);
    const overviewData = [
      `Tổng doanh thu: ${data.overview.totalRevenue.toLocaleString("vi-VN")}₫`,
      `Tổng đơn hàng: ${data.overview.totalOrders.toLocaleString("vi-VN")}`,
      `Tổng người dùng: ${data.overview.totalUsers.toLocaleString("vi-VN")}`,
      `Tỷ lệ chuyển đổi: ${data.overview.conversionRate.toFixed(1)}%`,
    ];

    overviewData.forEach((text) => {
      pdf.text(text, 20, yPosition);
      yPosition += 8;
    });

    yPosition += 10;

    // Revenue data table
    if (data.revenueData.length > 0) {
      pdf.setFontSize(16);
      pdf.text("Doanh thu theo ngày", 20, yPosition);
      yPosition += 10;

      // Table headers
      pdf.setFontSize(10);
      pdf.text("Ngày", 20, yPosition);
      pdf.text("Doanh thu (₫)", 70, yPosition);
      pdf.text("Đơn hàng", 130, yPosition);
      yPosition += 8;

      // Table data (show last 10 days to fit on page)
      const recentData = data.revenueData.slice(-10);
      recentData.forEach((item) => {
        if (yPosition > pageHeight - 30) {
          pdf.addPage();
          yPosition = 20;
        }

        const date = format(new Date(item.date), "dd/MM/yyyy");
        pdf.text(date, 20, yPosition);
        pdf.text(item.revenue.toLocaleString("vi-VN"), 70, yPosition);
        pdf.text(item.orders.toString(), 130, yPosition);
        yPosition += 6;
      });

      yPosition += 10;
    }

    // Top products table
    if (data.topProducts.length > 0) {
      if (yPosition > pageHeight - 60) {
        pdf.addPage();
        yPosition = 20;
      }

      pdf.setFontSize(16);
      pdf.text("Sản phẩm bán chạy", 20, yPosition);
      yPosition += 10;

      // Table headers
      pdf.setFontSize(10);
      pdf.text("Sản phẩm", 20, yPosition);
      pdf.text("Đã bán", 120, yPosition);
      pdf.text("Doanh thu (₫)", 150, yPosition);
      yPosition += 8;

      // Table data
      data.topProducts.forEach((product) => {
        if (yPosition > pageHeight - 30) {
          pdf.addPage();
          yPosition = 20;
        }

        const title =
          product.productTitle.length > 30
            ? product.productTitle.substring(0, 30) + "..."
            : product.productTitle;

        pdf.text(title, 20, yPosition);
        pdf.text(product.salesCount.toString(), 120, yPosition);
        pdf.text(product.revenue.toLocaleString("vi-VN"), 150, yPosition);
        yPosition += 6;
      });
    }

    // Include charts if requested
    if (includeCharts) {
      try {
        const chartElements = document.querySelectorAll("canvas");
        for (let i = 0; i < Math.min(chartElements.length, 2); i++) {
          const canvas = chartElements[i];
          if (canvas) {
            pdf.addPage();
            const imgData = canvas.toDataURL("image/png");
            pdf.addImage(imgData, "PNG", 20, 20, pageWidth - 40, 100);
          }
        }
      } catch (error) {
        console.warn("Could not include charts in PDF:", error);
      }
    }

    // Footer
    const totalPages = pdf.internal.pages.length - 1;
    for (let i = 1; i <= totalPages; i++) {
      pdf.setPage(i);
      pdf.setFontSize(8);
      pdf.text(
        `Trang ${i}/${totalPages} - Tạo lúc ${format(
          new Date(),
          "dd/MM/yyyy HH:mm"
        )}`,
        pageWidth / 2,
        pageHeight - 10,
        { align: "center" }
      );
    }

    // Save the PDF
    const fileName = `bao-cao-thong-ke-${format(
      new Date(),
      "yyyy-MM-dd-HHmm"
    )}.pdf`;
    pdf.save(fileName);
  }

  // Export to Excel
  async exportToExcel(data: ExportData): Promise<void> {
    const workbook = XLSX.utils.book_new();

    // Overview sheet
    const overviewData = [
      ["Báo cáo thống kê"],
      [
        `Thời gian: ${format(
          data.dateRange.startDate,
          "dd/MM/yyyy"
        )} - ${format(data.dateRange.endDate, "dd/MM/yyyy")}`,
      ],
      [],
      ["Tổng quan"],
      ["Tổng doanh thu", data.overview.totalRevenue],
      ["Tổng đơn hàng", data.overview.totalOrders],
      ["Tổng người dùng", data.overview.totalUsers],
      ["Tỷ lệ chuyển đổi (%)", data.overview.conversionRate],
    ];

    const overviewSheet = XLSX.utils.aoa_to_sheet(overviewData);
    XLSX.utils.book_append_sheet(workbook, overviewSheet, "Tổng quan");

    // Revenue data sheet
    if (data.revenueData.length > 0) {
      const revenueData = [
        ["Ngày", "Doanh thu", "Số đơn hàng"],
        ...data.revenueData.map((item) => [
          format(new Date(item.date), "dd/MM/yyyy"),
          item.revenue,
          item.orders,
        ]),
      ];

      const revenueSheet = XLSX.utils.aoa_to_sheet(revenueData);
      XLSX.utils.book_append_sheet(workbook, revenueSheet, "Doanh thu");
    }

    // User growth data sheet
    if (data.userGrowthData.length > 0) {
      const userGrowthData = [
        ["Ngày", "Người dùng mới", "Tổng người dùng"],
        ...data.userGrowthData.map((item) => [
          format(new Date(item.date), "dd/MM/yyyy"),
          item.newUsers,
          item.totalUsers,
        ]),
      ];

      const userGrowthSheet = XLSX.utils.aoa_to_sheet(userGrowthData);
      XLSX.utils.book_append_sheet(workbook, userGrowthSheet, "Người dùng");
    }

    // Top products sheet
    if (data.topProducts.length > 0) {
      const productsData = [
        ["Sản phẩm", "Đã bán", "Doanh thu"],
        ...data.topProducts.map((product) => [
          product.productTitle,
          product.salesCount,
          product.revenue,
        ]),
      ];

      const productsSheet = XLSX.utils.aoa_to_sheet(productsData);
      XLSX.utils.book_append_sheet(workbook, productsSheet, "Sản phẩm");
    }

    // Save the Excel file
    const fileName = `bao-cao-thong-ke-${format(
      new Date(),
      "yyyy-MM-dd-HHmm"
    )}.xlsx`;
    XLSX.writeFile(workbook, fileName);
  }

  // Export to CSV
  async exportToCSV(
    data: ExportData,
    type: "overview" | "revenue" | "users" | "products" = "overview"
  ): Promise<void> {
    let csvContent = "";
    let fileName = "";

    switch (type) {
      case "overview":
        csvContent = this.generateOverviewCSV(data);
        fileName = `tong-quan-${format(new Date(), "yyyy-MM-dd-HHmm")}.csv`;
        break;
      case "revenue":
        csvContent = this.generateRevenueCSV(data);
        fileName = `doanh-thu-${format(new Date(), "yyyy-MM-dd-HHmm")}.csv`;
        break;
      case "users":
        csvContent = this.generateUsersCSV(data);
        fileName = `nguoi-dung-${format(new Date(), "yyyy-MM-dd-HHmm")}.csv`;
        break;
      case "products":
        csvContent = this.generateProductsCSV(data);
        fileName = `san-pham-${format(new Date(), "yyyy-MM-dd-HHmm")}.csv`;
        break;
    }

    // Create and download the CSV file
    const blob = new Blob(["\uFEFF" + csvContent], {
      type: "text/csv;charset=utf-8;",
    });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", fileName);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  private generateOverviewCSV(data: ExportData): string {
    const lines = [
      "Báo cáo tổng quan",
      `Thời gian,${format(data.dateRange.startDate, "dd/MM/yyyy")} - ${format(
        data.dateRange.endDate,
        "dd/MM/yyyy"
      )}`,
      "",
      "Chỉ số,Giá trị",
      `Tổng doanh thu,${data.overview.totalRevenue}`,
      `Tổng đơn hàng,${data.overview.totalOrders}`,
      `Tổng người dùng,${data.overview.totalUsers}`,
      `Tỷ lệ chuyển đổi (%),${data.overview.conversionRate}`,
    ];
    return lines.join("\n");
  }

  private generateRevenueCSV(data: ExportData): string {
    const lines = [
      "Ngày,Doanh thu,Số đơn hàng",
      ...data.revenueData.map(
        (item) =>
          `${format(new Date(item.date), "dd/MM/yyyy")},${item.revenue},${
            item.orders
          }`
      ),
    ];
    return lines.join("\n");
  }

  private generateUsersCSV(data: ExportData): string {
    const lines = [
      "Ngày,Người dùng mới,Tổng người dùng",
      ...data.userGrowthData.map(
        (item) =>
          `${format(new Date(item.date), "dd/MM/yyyy")},${item.newUsers},${
            item.totalUsers
          }`
      ),
    ];
    return lines.join("\n");
  }

  private generateProductsCSV(data: ExportData): string {
    const lines = [
      "Sản phẩm,Đã bán,Doanh thu",
      ...data.topProducts.map(
        (product) =>
          `"${product.productTitle}",${product.salesCount},${product.revenue}`
      ),
    ];
    return lines.join("\n");
  }

  // === PROFIT-SPECIFIC EXPORT METHODS ===

  // Export Profit & Loss Statement to PDF
  async exportProfitLossStatement(data: ProfitExportData): Promise<void> {
    const pdf = new jsPDF("p", "mm", "a4");
    const pageWidth = pdf.internal.pageSize.getWidth();
    let yPosition = 20;

    // Set font for Vietnamese support
    pdf.setFont("helvetica");

    // Title
    pdf.setFontSize(20);
    pdf.text("BÁO CÁO LỢI NHUẬN & LỖ", pageWidth / 2, yPosition, {
      align: "center",
    });
    yPosition += 10;

    pdf.setFontSize(14);
    pdf.text(data.title, pageWidth / 2, yPosition, { align: "center" });
    yPosition += 15;

    // Date range
    pdf.setFontSize(12);
    const dateRangeText = `Từ ${format(
      data.dateRange.startDate,
      "dd/MM/yyyy"
    )} đến ${format(data.dateRange.endDate, "dd/MM/yyyy")}`;
    pdf.text(dateRangeText, pageWidth / 2, yPosition, { align: "center" });
    yPosition += 20;

    // Revenue Section
    pdf.setFontSize(14);
    pdf.text("DOANH THU", 20, yPosition);
    yPosition += 10;

    pdf.setFontSize(12);
    pdf.text(
      `Tổng doanh thu: ${data.profitAnalysis.revenue.total.toLocaleString(
        "vi-VN"
      )}₫`,
      25,
      yPosition
    );
    yPosition += 8;

    // Cost Section
    yPosition += 5;
    pdf.setFontSize(14);
    pdf.text("CHI PHÍ", 20, yPosition);
    yPosition += 10;

    pdf.setFontSize(12);
    const costItems = [
      { label: "Giá vốn hàng bán", value: data.profitAnalysis.costs.cogs },
      {
        label: "Chi phí vận hành",
        value: data.profitAnalysis.costs.operational,
      },
      {
        label: "Chi phí marketing",
        value: data.profitAnalysis.costs.marketing,
      },
      {
        label: "Chi phí quản lý",
        value: data.profitAnalysis.costs.administrative,
      },
      {
        label: "Phí giao dịch",
        value: data.profitAnalysis.costs.transactionFees,
      },
      { label: "Chi phí khác", value: data.profitAnalysis.costs.other },
    ];

    costItems.forEach((item) => {
      pdf.text(
        `${item.label}: ${item.value.toLocaleString("vi-VN")}₫`,
        25,
        yPosition
      );
      yPosition += 6;
    });

    pdf.text(
      `Tổng chi phí: ${data.profitAnalysis.costs.total.toLocaleString(
        "vi-VN"
      )}₫`,
      25,
      yPosition
    );
    yPosition += 10;

    // Profit Section
    yPosition += 5;
    pdf.setFontSize(14);
    pdf.text("LỢI NHUẬN", 20, yPosition);
    yPosition += 10;

    pdf.setFontSize(12);
    pdf.text(
      `Lợi nhuận gộp: ${data.profitAnalysis.profit.gross.toLocaleString(
        "vi-VN"
      )}₫`,
      25,
      yPosition
    );
    yPosition += 6;
    pdf.text(
      `Lợi nhuận ròng: ${data.profitAnalysis.profit.net.toLocaleString(
        "vi-VN"
      )}₫`,
      25,
      yPosition
    );
    yPosition += 6;
    pdf.text(
      `Tỷ suất lợi nhuận gộp: ${data.profitAnalysis.profit.grossMargin.toFixed(
        1
      )}%`,
      25,
      yPosition
    );
    yPosition += 6;
    pdf.text(
      `Tỷ suất lợi nhuận ròng: ${data.profitAnalysis.profit.netMargin.toFixed(
        1
      )}%`,
      25,
      yPosition
    );
    yPosition += 15;

    // Save the PDF
    const fileName = `bao-cao-loi-nhuan-${format(
      new Date(),
      "yyyy-MM-dd-HHmm"
    )}.pdf`;
    pdf.save(fileName);
  }

  // Export Cost Analysis to Excel
  async exportCostAnalysis(data: ProfitExportData): Promise<void> {
    const workbook = XLSX.utils.book_new();

    // Cost Summary Sheet
    const costSummaryData = [
      ["Báo cáo phân tích chi phí"],
      [
        `Thời gian: ${format(
          data.dateRange.startDate,
          "dd/MM/yyyy"
        )} - ${format(data.dateRange.endDate, "dd/MM/yyyy")}`,
      ],
      [],
      ["Loại chi phí", "Số tiền (₫)", "Tỷ lệ (%)"],
      [
        "Giá vốn hàng bán",
        data.profitAnalysis.costs.cogs,
        (
          (data.profitAnalysis.costs.cogs / data.profitAnalysis.costs.total) *
          100
        ).toFixed(1),
      ],
      [
        "Chi phí vận hành",
        data.profitAnalysis.costs.operational,
        (
          (data.profitAnalysis.costs.operational /
            data.profitAnalysis.costs.total) *
          100
        ).toFixed(1),
      ],
      [
        "Chi phí marketing",
        data.profitAnalysis.costs.marketing,
        (
          (data.profitAnalysis.costs.marketing /
            data.profitAnalysis.costs.total) *
          100
        ).toFixed(1),
      ],
      [
        "Chi phí quản lý",
        data.profitAnalysis.costs.administrative,
        (
          (data.profitAnalysis.costs.administrative /
            data.profitAnalysis.costs.total) *
          100
        ).toFixed(1),
      ],
      [
        "Phí giao dịch",
        data.profitAnalysis.costs.transactionFees,
        (
          (data.profitAnalysis.costs.transactionFees /
            data.profitAnalysis.costs.total) *
          100
        ).toFixed(1),
      ],
      [
        "Chi phí khác",
        data.profitAnalysis.costs.other,
        (
          (data.profitAnalysis.costs.other / data.profitAnalysis.costs.total) *
          100
        ).toFixed(1),
      ],
      [],
      ["Tổng chi phí", data.profitAnalysis.costs.total, "100.0"],
    ];

    const costSummarySheet = XLSX.utils.aoa_to_sheet(costSummaryData);
    XLSX.utils.book_append_sheet(
      workbook,
      costSummarySheet,
      "Tổng quan chi phí"
    );

    // Save the Excel file
    const fileName = `phan-tich-chi-phi-${format(
      new Date(),
      "yyyy-MM-dd-HHmm"
    )}.xlsx`;
    XLSX.writeFile(workbook, fileName);
  }

  // Export Profit Forecast to CSV
  async exportProfitForecastCSV(forecast: ProfitForecast): Promise<void> {
    const lines = [
      "Dự báo lợi nhuận",
      `Kỳ dự báo: ${forecast.period.label}`,
      "",
      "Kịch bản,Doanh thu (₫),Lợi nhuận (₫),Tỷ suất (%)",
      `Lạc quan,${forecast.scenarios.optimistic.revenue},${
        forecast.scenarios.optimistic.profit
      },${forecast.scenarios.optimistic.margin.toFixed(1)}`,
      `Thực tế,${forecast.scenarios.realistic.revenue},${
        forecast.scenarios.realistic.profit
      },${forecast.scenarios.realistic.margin.toFixed(1)}`,
      `Bi quan,${forecast.scenarios.pessimistic.revenue},${
        forecast.scenarios.pessimistic.profit
      },${forecast.scenarios.pessimistic.margin.toFixed(1)}`,
      "",
      "Giả định dự báo",
      `Tăng trưởng doanh thu (%),${forecast.assumptions.revenueGrowthRate}`,
      `Lạm phát chi phí (%),${forecast.assumptions.costInflationRate}`,
      `Hệ số mùa vụ,${forecast.assumptions.seasonalityFactor}`,
      `Độ tin cậy (%),${forecast.forecast.confidence}`,
    ];

    const csvContent = "\uFEFF" + lines.join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute(
      "download",
      `du-bao-loi-nhuan-${format(new Date(), "yyyy-MM-dd-HHmm")}.csv`
    );
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
}

export const reportExportService = new ReportExportService();
