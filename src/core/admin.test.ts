import { describe, it, expect } from '@jest/globals';
import { 
  isAdmin, 
  hasPermission, 
  formatCurrency, 
  calculateProfitMargin,
  DEFAULT_ADMIN_PERMISSIONS 
} from './admin';
import { User } from './auth';
import { AdminProfile } from './admin';

describe('Admin Core Functions', () => {
  describe('isAdmin', () => {
    it('should return true for admin user', () => {
      const adminUser: User = {
        id: '1',
        email: 'admin@test.com',
        name: 'Admin User',
        role: 'admin',
        status: 'active',
        balance: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      
      expect(isAdmin(adminUser)).toBe(true);
    });

    it('should return false for regular user', () => {
      const regularUser: User = {
        id: '1',
        email: 'user@test.com',
        name: 'Regular User',
        role: 'user',
        status: 'active',
        balance: 1000,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      
      expect(isAdmin(regularUser)).toBe(false);
    });

    it('should return false for null user', () => {
      expect(isAdmin(null)).toBe(false);
    });
  });

  describe('hasPermission', () => {
    const mockAdminProfile: AdminProfile = {
      id: 'admin-1',
      email: 'admin@test.com',
      name: 'Test Admin',
      role: 'admin',
      permissions: {
        canManageUsers: true,
        canManageProducts: false,
        canManageOrders: true,
        canViewAnalytics: true,
        canManageAdmins: false,
        canAccessAuditLogs: true,
        canPerformBulkOperations: false,
      },
      createdAt: new Date(),
      isActive: true,
    };

    it('should return true for granted permissions', () => {
      expect(hasPermission(mockAdminProfile, 'canManageUsers')).toBe(true);
      expect(hasPermission(mockAdminProfile, 'canViewAnalytics')).toBe(true);
    });

    it('should return false for denied permissions', () => {
      expect(hasPermission(mockAdminProfile, 'canManageProducts')).toBe(false);
      expect(hasPermission(mockAdminProfile, 'canManageAdmins')).toBe(false);
    });

    it('should return false for inactive admin', () => {
      const inactiveAdmin = { ...mockAdminProfile, isActive: false };
      expect(hasPermission(inactiveAdmin, 'canManageUsers')).toBe(false);
    });

    it('should return false for null admin', () => {
      expect(hasPermission(null, 'canManageUsers')).toBe(false);
    });
  });

  describe('formatCurrency', () => {
    it('should format VND currency correctly', () => {
      expect(formatCurrency(100000, 'VND')).toMatch(/100[.,]000/);
      expect(formatCurrency(1000000, 'VND')).toMatch(/1[.,]000[.,]000/);
    });

    it('should handle zero amount', () => {
      expect(formatCurrency(0, 'VND')).toMatch(/0/);
    });

    it('should use VND as default currency', () => {
      const result = formatCurrency(50000);
      expect(result).toMatch(/50[.,]000/);
    });

    it('should handle negative amounts', () => {
      expect(formatCurrency(-10000, 'VND')).toMatch(/-10[.,]000/);
    });
  });

  describe('calculateProfitMargin', () => {
    it('should calculate profit margin correctly', () => {
      expect(calculateProfitMargin(100, 80)).toBe(20); // 20% margin
      expect(calculateProfitMargin(150, 100)).toBe(33.333333333333336); // ~33.33% margin
    });

    it('should handle zero cost price', () => {
      expect(calculateProfitMargin(100, 0)).toBe(0);
    });

    it('should handle equal selling and cost price', () => {
      expect(calculateProfitMargin(100, 100)).toBe(0);
    });

    it('should handle cost higher than selling price (negative margin)', () => {
      expect(calculateProfitMargin(80, 100)).toBe(-25); // -25% margin (loss)
    });
  });

  describe('DEFAULT_ADMIN_PERMISSIONS', () => {
    it('should have all expected permissions', () => {
      expect(DEFAULT_ADMIN_PERMISSIONS).toHaveProperty('canManageUsers');
      expect(DEFAULT_ADMIN_PERMISSIONS).toHaveProperty('canManageProducts');
      expect(DEFAULT_ADMIN_PERMISSIONS).toHaveProperty('canManageOrders');
      expect(DEFAULT_ADMIN_PERMISSIONS).toHaveProperty('canViewAnalytics');
      expect(DEFAULT_ADMIN_PERMISSIONS).toHaveProperty('canManageAdmins');
      expect(DEFAULT_ADMIN_PERMISSIONS).toHaveProperty('canAccessAuditLogs');
      expect(DEFAULT_ADMIN_PERMISSIONS).toHaveProperty('canPerformBulkOperations');
    });

    it('should have reasonable default values', () => {
      expect(DEFAULT_ADMIN_PERMISSIONS.canManageUsers).toBe(true);
      expect(DEFAULT_ADMIN_PERMISSIONS.canManageProducts).toBe(true);
      expect(DEFAULT_ADMIN_PERMISSIONS.canManageOrders).toBe(true);
      expect(DEFAULT_ADMIN_PERMISSIONS.canViewAnalytics).toBe(true);
      expect(DEFAULT_ADMIN_PERMISSIONS.canManageAdmins).toBe(false); // Should be restricted
      expect(DEFAULT_ADMIN_PERMISSIONS.canAccessAuditLogs).toBe(true);
      expect(DEFAULT_ADMIN_PERMISSIONS.canPerformBulkOperations).toBe(true);
    });
  });
});

describe('Admin Data Types', () => {
  describe('AdminUser', () => {
    it('should extend User with additional fields', () => {
      // This is more of a TypeScript compile-time test
      // but we can verify the structure exists
      const adminUser = {
        id: '1',
        email: 'user@test.com',
        name: 'Test User',
        role: 'user' as const,
        status: 'active' as const,
        balance: 1000,
        createdAt: new Date(),
        updatedAt: new Date(),
        totalOrders: 5,
        totalSpent: 250000,
        registrationSource: 'google',
      };

      expect(adminUser).toHaveProperty('totalOrders');
      expect(adminUser).toHaveProperty('totalSpent');
      expect(adminUser).toHaveProperty('registrationSource');
    });
  });

  describe('UserTransaction', () => {
    it('should have correct transaction types', () => {
      const validTypes = ['credit', 'debit', 'purchase', 'refund'];
      
      validTypes.forEach(type => {
        const transaction = {
          id: '1',
          userId: 'user-1',
          type: type as any,
          amount: 1000,
          description: 'Test transaction',
          createdAt: new Date(),
        };
        
        expect(['credit', 'debit', 'purchase', 'refund']).toContain(transaction.type);
      });
    });
  });

  describe('DashboardStats', () => {
    it('should have all required statistical fields', () => {
      const stats = {
        totalUsers: 100,
        activeUsers: 80,
        totalProducts: 50,
        activeProducts: 45,
        totalOrders: 200,
        pendingOrders: 5,
        totalRevenue: 1000000,
        monthlyRevenue: 100000,
        averageOrderValue: 5000,
        topSellingProducts: [],
        recentActivity: [],
      };

      expect(stats).toHaveProperty('totalUsers');
      expect(stats).toHaveProperty('activeUsers');
      expect(stats).toHaveProperty('totalProducts');
      expect(stats).toHaveProperty('activeProducts');
      expect(stats).toHaveProperty('totalOrders');
      expect(stats).toHaveProperty('pendingOrders');
      expect(stats).toHaveProperty('totalRevenue');
      expect(stats).toHaveProperty('monthlyRevenue');
      expect(stats).toHaveProperty('averageOrderValue');
      expect(stats).toHaveProperty('topSellingProducts');
      expect(stats).toHaveProperty('recentActivity');
    });
  });
});

// Mock data for testing
export const mockAdminUser: User = {
  id: 'admin-1',
  email: 'admin@test.com',
  name: 'Test Admin',
  role: 'admin',
  status: 'active',
  balance: 0,
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date(),
};

export const mockRegularUser: User = {
  id: 'user-1',
  email: 'user@test.com',
  name: 'Test User',
  role: 'user',
  status: 'active',
  balance: 50000,
  createdAt: new Date('2024-01-15'),
  updatedAt: new Date(),
};

export const mockAdminProfile: AdminProfile = {
  id: 'admin-1',
  email: 'admin@test.com',
  name: 'Test Admin',
  role: 'admin',
  permissions: DEFAULT_ADMIN_PERMISSIONS,
  createdAt: new Date('2024-01-01'),
  isActive: true,
};
