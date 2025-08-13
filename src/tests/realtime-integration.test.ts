import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';
import { render, screen, waitFor, act } from '@testing-library/react';
import { SessionProvider } from 'next-auth/react';
import { DataSyncProvider } from '@/src/components/DataSyncProvider';
import { dataStore } from '@/src/core/data-store';

// Mock EventSource for SSE testing
class MockEventSource {
  url: string;
  onopen: ((event: Event) => void) | null = null;
  onmessage: ((event: MessageEvent) => void) | null = null;
  onerror: ((event: Event) => void) | null = null;
  readyState: number = 0;
  
  private listeners: { [key: string]: ((event: MessageEvent) => void)[] } = {};

  constructor(url: string) {
    this.url = url;
    this.readyState = 1; // OPEN
    
    // Simulate connection opening
    setTimeout(() => {
      if (this.onopen) {
        this.onopen(new Event('open'));
      }
    }, 10);
  }

  addEventListener(type: string, listener: (event: MessageEvent) => void) {
    if (!this.listeners[type]) {
      this.listeners[type] = [];
    }
    this.listeners[type].push(listener);
  }

  removeEventListener(type: string, listener: (event: MessageEvent) => void) {
    if (this.listeners[type]) {
      const index = this.listeners[type].indexOf(listener);
      if (index > -1) {
        this.listeners[type].splice(index, 1);
      }
    }
  }

  close() {
    this.readyState = 2; // CLOSED
  }

  // Helper method to simulate receiving events
  simulateEvent(type: string, data: any) {
    const event = new MessageEvent('message', {
      data: JSON.stringify(data),
    });
    
    if (this.listeners[type]) {
      this.listeners[type].forEach(listener => listener(event));
    }
  }
}

// Mock global EventSource
(global as any).EventSource = MockEventSource;

describe('Real-time Integration Tests', () => {
  let mockEventSource: MockEventSource;

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Mock EventSource constructor to capture instance
    const OriginalEventSource = (global as any).EventSource;
    (global as any).EventSource = jest.fn().mockImplementation((url: string) => {
      mockEventSource = new OriginalEventSource(url);
      return mockEventSource;
    });
  });

  afterEach(() => {
    if (mockEventSource) {
      mockEventSource.close();
    }
    jest.restoreAllMocks();
  });

  describe('User Balance Real-time Updates', () => {
    it('should update user balance in real-time when admin adds credits', async () => {
      // Create a test user
      const testUser = dataStore.createUser({
        email: 'realtime-test@example.com',
        name: 'Realtime Test User',
        role: 'user',
        status: 'active',
        balance: 10000,
        totalOrders: 0,
        totalSpent: 0,
        registrationSource: 'test',
      });

      // Mock session with test user
      const mockSession = {
        user: { email: testUser.email },
        expires: '2024-12-31',
      };

      // Component to test real-time updates
      function TestComponent() {
        const { currentUser } = require('@/src/components/DataSyncProvider').useDataSync();
        return (
          <div>
            <span data-testid="user-balance">
              {currentUser ? currentUser.balance : 0}
            </span>
          </div>
        );
      }

      // Render component with providers
      render(
        <SessionProvider session={mockSession}>
          <DataSyncProvider currentUserEmail={testUser.email}>
            <TestComponent />
          </DataSyncProvider>
        </SessionProvider>
      );

      // Wait for initial render
      await waitFor(() => {
        expect(screen.getByTestId('user-balance')).toHaveTextContent('10000');
      });

      // Simulate admin adding credits via SSE
      act(() => {
        mockEventSource.simulateEvent('balance-updated', {
          userId: testUser.id,
          newBalance: 25000,
          timestamp: new Date().toISOString(),
        });
      });

      // Verify balance updated in real-time
      await waitFor(() => {
        expect(screen.getByTestId('user-balance')).toHaveTextContent('25000');
      });
    });

    it('should show transaction notifications in real-time', async () => {
      const testUser = dataStore.createUser({
        email: 'transaction-realtime@example.com',
        name: 'Transaction Realtime User',
        role: 'user',
        status: 'active',
        balance: 5000,
        totalOrders: 0,
        totalSpent: 0,
        registrationSource: 'test',
      });

      const mockSession = {
        user: { email: testUser.email },
        expires: '2024-12-31',
      };

      // Mock toast context
      const mockShow = jest.fn();
      jest.mock('@/src/components/ToastProvider', () => ({
        useToastContext: () => ({ show: mockShow }),
      }));

      function TestComponent() {
        const { useAccountRealtimeUpdates } = require('@/src/hooks/useRealtimeUpdates');
        useAccountRealtimeUpdates(testUser.id);
        return <div>Test Component</div>;
      }

      render(
        <SessionProvider session={mockSession}>
          <DataSyncProvider currentUserEmail={testUser.email}>
            <TestComponent />
          </DataSyncProvider>
        </SessionProvider>
      );

      // Simulate transaction creation
      const transaction = {
        id: 'tx-test',
        userId: testUser.id,
        type: 'credit',
        amount: 15000,
        description: 'Admin credit top-up',
        createdAt: new Date(),
      };

      act(() => {
        mockEventSource.simulateEvent('transaction-created', {
          transaction,
          timestamp: new Date().toISOString(),
        });
      });

      // Verify notification was shown
      await waitFor(() => {
        expect(mockShow).toHaveBeenCalledWith(
          expect.stringContaining('Nạp tiền: Admin credit top-up'),
          'info'
        );
      });
    });
  });

  describe('Product Real-time Updates', () => {
    it('should update product list when admin creates new product', async () => {
      function TestComponent() {
        const { publicProducts } = require('@/src/components/DataSyncProvider').useDataSync();
        return (
          <div>
            <span data-testid="product-count">{publicProducts.length}</span>
            {publicProducts.map((product: any) => (
              <div key={product.id} data-testid={`product-${product.id}`}>
                {product.title}
              </div>
            ))}
          </div>
        );
      }

      render(
        <SessionProvider session={{ user: {}, expires: '2024-12-31' }}>
          <DataSyncProvider>
            <TestComponent />
          </DataSyncProvider>
        </SessionProvider>
      );

      const initialCount = screen.getByTestId('product-count').textContent;

      // Simulate admin creating new product
      const newProduct = {
        id: 'product-realtime-test',
        title: 'Realtime Test Product',
        description: 'Created via real-time update',
        price: 40000,
        currency: 'VND',
        category: 'gaming',
        isActive: true,
        stock: 50,
        sold: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      act(() => {
        mockEventSource.simulateEvent('product-updated', {
          type: 'PRODUCT_CREATED',
          product: newProduct,
          timestamp: new Date().toISOString(),
        });
      });

      // Verify product appears in list
      await waitFor(() => {
        expect(screen.getByTestId('product-count')).toHaveTextContent(
          String(parseInt(initialCount!) + 1)
        );
        expect(screen.getByTestId(`product-${newProduct.id}`)).toHaveTextContent(
          'Realtime Test Product'
        );
      });
    });

    it('should remove product from list when admin deletes it', async () => {
      // Create a test product first
      const testProduct = dataStore.createProduct({
        title: 'Product to Delete',
        description: 'Will be deleted in real-time',
        price: 30000,
        currency: 'VND',
        category: 'gaming',
        imageEmoji: '🎮',
        stock: 20,
        sold: 0,
        isActive: true,
        createdBy: 'admin-test',
        lastModifiedBy: 'admin-test',
        faqs: [],
        options: [],
      });

      function TestComponent() {
        const { publicProducts } = require('@/src/components/DataSyncProvider').useDataSync();
        return (
          <div>
            {publicProducts.map((product: any) => (
              <div key={product.id} data-testid={`product-${product.id}`}>
                {product.title}
              </div>
            ))}
          </div>
        );
      }

      render(
        <SessionProvider session={{ user: {}, expires: '2024-12-31' }}>
          <DataSyncProvider>
            <TestComponent />
          </DataSyncProvider>
        </SessionProvider>
      );

      // Verify product is initially present
      await waitFor(() => {
        expect(screen.getByTestId(`product-${testProduct.id}`)).toBeInTheDocument();
      });

      // Simulate admin deleting product
      act(() => {
        mockEventSource.simulateEvent('product-deleted', {
          productId: testProduct.id,
          timestamp: new Date().toISOString(),
        });
      });

      // Verify product is removed from list
      await waitFor(() => {
        expect(screen.queryByTestId(`product-${testProduct.id}`)).not.toBeInTheDocument();
      });
    });
  });

  describe('Connection Status', () => {
    it('should show connection status indicator', async () => {
      function TestComponent() {
        const { useRealtimeUpdates } = require('@/src/hooks/useRealtimeUpdates');
        const { isConnected } = useRealtimeUpdates();
        return (
          <div>
            <span data-testid="connection-status">
              {isConnected ? 'Connected' : 'Disconnected'}
            </span>
          </div>
        );
      }

      render(
        <SessionProvider session={{ user: {}, expires: '2024-12-31' }}>
          <DataSyncProvider>
            <TestComponent />
          </DataSyncProvider>
        </SessionProvider>
      );

      // Initially should be connected (mocked)
      await waitFor(() => {
        expect(screen.getByTestId('connection-status')).toHaveTextContent('Connected');
      });

      // Simulate connection error
      act(() => {
        if (mockEventSource.onerror) {
          mockEventSource.onerror(new Event('error'));
        }
      });

      // Should show disconnected status
      await waitFor(() => {
        expect(screen.getByTestId('connection-status')).toHaveTextContent('Disconnected');
      });
    });
  });

  describe('Admin Dashboard Real-time Stats', () => {
    it('should update dashboard statistics in real-time', async () => {
      function TestComponent() {
        const { useDashboardStats } = require('@/src/components/DataSyncProvider');
        const stats = useDashboardStats();
        return (
          <div>
            <span data-testid="total-users">{stats.totalUsers}</span>
            <span data-testid="total-products">{stats.totalProducts}</span>
          </div>
        );
      }

      render(
        <SessionProvider session={{ user: {}, expires: '2024-12-31' }}>
          <DataSyncProvider>
            <TestComponent />
          </DataSyncProvider>
        </SessionProvider>
      );

      const initialUsers = screen.getByTestId('total-users').textContent;
      const initialProducts = screen.getByTestId('total-products').textContent;

      // Simulate user creation
      act(() => {
        mockEventSource.simulateEvent('user-updated', {
          type: 'USER_CREATED',
          user: {
            id: 'new-user',
            email: 'new@example.com',
            name: 'New User',
            role: 'user',
            status: 'active',
          },
          timestamp: new Date().toISOString(),
        });
      });

      // Simulate product creation
      act(() => {
        mockEventSource.simulateEvent('product-updated', {
          type: 'PRODUCT_CREATED',
          product: {
            id: 'new-product',
            title: 'New Product',
            isActive: true,
          },
          timestamp: new Date().toISOString(),
        });
      });

      // Verify stats updated
      await waitFor(() => {
        expect(screen.getByTestId('total-users')).toHaveTextContent(
          String(parseInt(initialUsers!) + 1)
        );
        expect(screen.getByTestId('total-products')).toHaveTextContent(
          String(parseInt(initialProducts!) + 1)
        );
      });
    });
  });
});
