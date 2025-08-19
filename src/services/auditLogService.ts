"use client";

import { format } from 'date-fns';

export interface AuditLogData {
  action: string;
  targetType: "user" | "product" | "order" | "system" | "topup-request" | "analytics" | "report";
  targetId?: string;
  description: string;
  metadata?: Record<string, any>;
}

class AuditLogService {
  private getClientInfo() {
    return {
      ipAddress: 'client', // In a real app, you'd get this from the server
      userAgent: navigator.userAgent,
      timestamp: new Date().toISOString(),
    };
  }

  // Log analytics access
  async logAnalyticsAccess(
    dateRange: { startDate: Date; endDate: Date },
    filters?: Record<string, any>
  ): Promise<void> {
    const description = `Truy cập trang thống kê (${format(dateRange.startDate, 'dd/MM/yyyy')} - ${format(dateRange.endDate, 'dd/MM/yyyy')})`;
    
    await this.logAction({
      action: 'analytics_access',
      targetType: 'analytics',
      description,
      metadata: {
        dateRange: {
          startDate: dateRange.startDate.toISOString(),
          endDate: dateRange.endDate.toISOString(),
        },
        filters,
        ...this.getClientInfo(),
      },
    });
  }

  // Log report export
  async logReportExport(
    format: 'pdf' | 'excel' | 'csv',
    reportType: string,
    dateRange: { startDate: Date; endDate: Date },
    dataSize?: number
  ): Promise<void> {
    const description = `Xuất báo cáo ${reportType} định dạng ${format.toUpperCase()} (${format(dateRange.startDate, 'dd/MM/yyyy')} - ${format(dateRange.endDate, 'dd/MM/yyyy')})`;
    
    await this.logAction({
      action: 'report_export',
      targetType: 'report',
      targetId: `${reportType}_${format}_${Date.now()}`,
      description,
      metadata: {
        format,
        reportType,
        dateRange: {
          startDate: dateRange.startDate.toISOString(),
          endDate: dateRange.endDate.toISOString(),
        },
        dataSize,
        ...this.getClientInfo(),
      },
    });
  }

  // Log chart data access
  async logChartDataAccess(
    chartType: string,
    dateRange: { startDate: Date; endDate: Date },
    dataPoints?: number
  ): Promise<void> {
    const description = `Tải dữ liệu biểu đồ ${chartType} (${format(dateRange.startDate, 'dd/MM/yyyy')} - ${format(dateRange.endDate, 'dd/MM/yyyy')})`;
    
    await this.logAction({
      action: 'chart_data_access',
      targetType: 'analytics',
      targetId: chartType,
      description,
      metadata: {
        chartType,
        dateRange: {
          startDate: dateRange.startDate.toISOString(),
          endDate: dateRange.endDate.toISOString(),
        },
        dataPoints,
        ...this.getClientInfo(),
      },
    });
  }

  // Log filter changes
  async logFilterChange(
    filterType: string,
    oldValue: any,
    newValue: any
  ): Promise<void> {
    const description = `Thay đổi bộ lọc ${filterType} từ "${oldValue}" sang "${newValue}"`;
    
    await this.logAction({
      action: 'analytics_filter_change',
      targetType: 'analytics',
      description,
      metadata: {
        filterType,
        oldValue,
        newValue,
        ...this.getClientInfo(),
      },
    });
  }

  // Log dashboard view
  async logDashboardView(
    dashboardType: string,
    viewDuration?: number
  ): Promise<void> {
    const description = `Xem dashboard ${dashboardType}`;
    
    await this.logAction({
      action: 'dashboard_view',
      targetType: 'analytics',
      targetId: dashboardType,
      description,
      metadata: {
        dashboardType,
        viewDuration,
        ...this.getClientInfo(),
      },
    });
  }

  // Log advanced analytics access
  async logAdvancedAnalyticsAccess(
    analysisType: string,
    parameters: Record<string, any>
  ): Promise<void> {
    const description = `Truy cập phân tích nâng cao: ${analysisType}`;
    
    await this.logAction({
      action: 'advanced_analytics_access',
      targetType: 'analytics',
      targetId: analysisType,
      description,
      metadata: {
        analysisType,
        parameters,
        ...this.getClientInfo(),
      },
    });
  }

  // Generic log action method
  private async logAction(data: AuditLogData): Promise<void> {
    try {
      const response = await fetch('/api/admin/audit/log', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        console.warn('Failed to log audit action:', response.statusText);
      }
    } catch (error) {
      console.warn('Failed to log audit action:', error);
      // Don't throw error to avoid breaking the main functionality
    }
  }

  // Batch logging for multiple actions
  async logBatch(actions: AuditLogData[]): Promise<void> {
    try {
      const response = await fetch('/api/admin/audit/log-batch', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ actions }),
      });

      if (!response.ok) {
        console.warn('Failed to log batch audit actions:', response.statusText);
      }
    } catch (error) {
      console.warn('Failed to log batch audit actions:', error);
    }
  }

  // Log session analytics (for tracking how long users spend on analytics)
  private sessionStartTime: number | null = null;
  private sessionActions: AuditLogData[] = [];

  startSession(sessionType: string = 'analytics'): void {
    this.sessionStartTime = Date.now();
    this.sessionActions = [];
    
    this.logAction({
      action: 'analytics_session_start',
      targetType: 'analytics',
      description: `Bắt đầu phiên làm việc ${sessionType}`,
      metadata: {
        sessionType,
        ...this.getClientInfo(),
      },
    });
  }

  endSession(sessionType: string = 'analytics'): void {
    if (this.sessionStartTime) {
      const duration = Date.now() - this.sessionStartTime;
      
      this.logAction({
        action: 'analytics_session_end',
        targetType: 'analytics',
        description: `Kết thúc phiên làm việc ${sessionType}`,
        metadata: {
          sessionType,
          duration,
          actionsCount: this.sessionActions.length,
          ...this.getClientInfo(),
        },
      });

      // Log batch of session actions if any
      if (this.sessionActions.length > 0) {
        this.logBatch(this.sessionActions);
      }

      this.sessionStartTime = null;
      this.sessionActions = [];
    }
  }

  // Add action to current session
  addToSession(action: AuditLogData): void {
    if (this.sessionStartTime) {
      this.sessionActions.push(action);
    }
  }
}

export const auditLogService = new AuditLogService();
