import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import { dataStore } from '@/src/core/data-store';
import { AdminUser, UserTransaction } from '@/src/core/admin';

// Mock fetch for API testing
global.fetch = jest.fn();

describe('Admin Integration Tests', () => {
  beforeEach(() => {
    // Reset data store before each test
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('User Management Integration', () => {
    it('should create user and immediately reflect in data store', () => {
      const initialUserCount = dataStore.getUsers().length;
      
      // Create a new user
      const newUser = dataStore.createUser({
        email: 'test@example.com',
        name: 'Test User',
        role: 'user',
        status: 'active',
        balance: 0,
        totalOrders: 0,
        totalSpent: 0,
        registrationSource: 'test',
      });

      // Verify user was created
      expect(newUser).toBeDefined();
      expect(newUser.email).toBe('test@example.com');
      expect(newUser.id).toBeDefined();

      // Verify user count increased
      const updatedUserCount = dataStore.getUsers().length;
      expect(updatedUserCount).toBe(initialUserCount + 1);

      // Verify user can be retrieved
      const retrievedUser = dataStore.getUser(newUser.id);
      expect(retrievedUser).toEqual(newUser);
    });

    it('should update user balance and trigger events', (done) => {
      // Create a test user
      const user = dataStore.createUser({
        email: 'balance-test@example.com',
        name: 'Balance Test User',
        role: 'user',
        status: 'active',
        balance: 1000,
        totalOrders: 0,
        totalSpent: 0,
        registrationSource: 'test',
      });

      // Subscribe to balance change events
      const unsubscribe = dataStore.subscribe((event) => {
        if (event.type === 'USER_BALANCE_CHANGED' && event.payload.userId === user.id) {
          expect(event.payload.newBalance).toBe(2000);
          unsubscribe();
          done();
        }
      });

      // Update user balance
      dataStore.updateUser(user.id, { balance: 2000 });
    });

    it('should create transaction and update user balance', () => {
      // Create a test user
      const user = dataStore.createUser({
        email: 'transaction-test@example.com',
        name: 'Transaction Test User',
        role: 'user',
        status: 'active',
        balance: 5000,
        totalOrders: 0,
        totalSpent: 0,
        registrationSource: 'test',
      });

      const initialBalance = user.balance;
      const topUpAmount = 10000;

      // Create a credit transaction
      const transaction = dataStore.createTransaction({
        userId: user.id,
        type: 'credit',
        amount: topUpAmount,
        description: 'Test top-up',
        adminId: 'admin-test',
      });

      // Update user balance
      const updatedUser = dataStore.updateUser(user.id, { 
        balance: initialBalance + topUpAmount 
      });

      // Verify transaction was created
      expect(transaction).toBeDefined();
      expect(transaction.userId).toBe(user.id);
      expect(transaction.amount).toBe(topUpAmount);

      // Verify user balance was updated
      expect(updatedUser?.balance).toBe(initialBalance + topUpAmount);

      // Verify transaction can be retrieved
      const userTransactions = dataStore.getUserTransactions(user.id);
      expect(userTransactions).toContain(transaction);
    });

    it('should handle user status changes', () => {
      // Create a test user
      const user = dataStore.createUser({
        email: 'status-test@example.com',
        name: 'Status Test User',
        role: 'user',
        status: 'active',
        balance: 0,
        totalOrders: 0,
        totalSpent: 0,
        registrationSource: 'test',
      });

      // Update user status to suspended
      const updatedUser = dataStore.updateUser(user.id, { status: 'suspended' });

      expect(updatedUser?.status).toBe('suspended');

      // Verify user can still be retrieved but with new status
      const retrievedUser = dataStore.getUser(user.id);
      expect(retrievedUser?.status).toBe('suspended');
    });
  });

  describe('Product Management Integration', () => {
    it('should create product and immediately appear in public products', () => {
      const initialProductCount = dataStore.getProducts().length;
      const initialPublicProductCount = dataStore.getPublicProducts().length;

      // Create a new product
      const newProduct = dataStore.createProduct({
        title: 'Test Product',
        description: 'A test product',
        price: 50000,
        currency: 'VND',
        category: 'gaming',
        imageEmoji: '🎮',
        stock: 100,
        sold: 0,
        isActive: true,
        createdBy: 'admin-test',
        lastModifiedBy: 'admin-test',
        faqs: [],
        options: [],
      });

      // Verify product was created
      expect(newProduct).toBeDefined();
      expect(newProduct.title).toBe('Test Product');
      expect(newProduct.isActive).toBe(true);

      // Verify product count increased
      expect(dataStore.getProducts().length).toBe(initialProductCount + 1);
      expect(dataStore.getPublicProducts().length).toBe(initialPublicProductCount + 1);

      // Verify product appears in public products
      const publicProducts = dataStore.getPublicProducts();
      const publicProduct = publicProducts.find(p => p.id === newProduct.id);
      expect(publicProduct).toBeDefined();
      expect(publicProduct?.title).toBe('Test Product');
    });

    it('should update product and reflect changes in public view', () => {
      // Create a test product
      const product = dataStore.createProduct({
        title: 'Update Test Product',
        description: 'Original description',
        price: 30000,
        currency: 'VND',
        category: 'gaming',
        imageEmoji: '🎮',
        stock: 50,
        sold: 0,
        isActive: true,
        createdBy: 'admin-test',
        lastModifiedBy: 'admin-test',
        faqs: [],
        options: [],
      });

      // Update product
      const updatedProduct = dataStore.updateProduct(product.id, {
        description: 'Updated description',
        price: 35000,
        stock: 75,
      });

      expect(updatedProduct?.description).toBe('Updated description');
      expect(updatedProduct?.price).toBe(35000);
      expect(updatedProduct?.stock).toBe(75);

      // Verify changes appear in public products
      const publicProducts = dataStore.getPublicProducts();
      const publicProduct = publicProducts.find(p => p.id === product.id);
      expect(publicProduct?.description).toBe('Updated description');
      expect(publicProduct?.price).toBe(35000);
    });

    it('should deactivate product and remove from public view', () => {
      // Create a test product
      const product = dataStore.createProduct({
        title: 'Deactivation Test Product',
        description: 'Will be deactivated',
        price: 25000,
        currency: 'VND',
        category: 'gaming',
        imageEmoji: '🎮',
        stock: 30,
        sold: 0,
        isActive: true,
        createdBy: 'admin-test',
        lastModifiedBy: 'admin-test',
        faqs: [],
        options: [],
      });

      // Verify product is initially in public view
      let publicProducts = dataStore.getPublicProducts();
      expect(publicProducts.find(p => p.id === product.id)).toBeDefined();

      // Deactivate product
      dataStore.updateProduct(product.id, { isActive: false });

      // Verify product is removed from public view
      publicProducts = dataStore.getPublicProducts();
      expect(publicProducts.find(p => p.id === product.id)).toBeUndefined();

      // But still exists in admin view
      const adminProduct = dataStore.getProduct(product.id);
      expect(adminProduct).toBeDefined();
      expect(adminProduct?.isActive).toBe(false);
    });

    it('should delete product and trigger events', (done) => {
      // Create a test product
      const product = dataStore.createProduct({
        title: 'Delete Test Product',
        description: 'Will be deleted',
        price: 20000,
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

      // Subscribe to deletion events
      const unsubscribe = dataStore.subscribe((event) => {
        if (event.type === 'PRODUCT_DELETED' && event.payload.productId === product.id) {
          // Verify product is removed from both admin and public views
          expect(dataStore.getProduct(product.id)).toBeNull();
          expect(dataStore.getPublicProducts().find(p => p.id === product.id)).toBeUndefined();
          unsubscribe();
          done();
        }
      });

      // Delete product
      dataStore.deleteProduct(product.id);
    });
  });

  describe('Real-time Data Synchronization', () => {
    it('should emit events when user is updated', (done) => {
      // Create a test user
      const user = dataStore.createUser({
        email: 'event-test@example.com',
        name: 'Event Test User',
        role: 'user',
        status: 'active',
        balance: 0,
        totalOrders: 0,
        totalSpent: 0,
        registrationSource: 'test',
      });

      // Subscribe to user update events
      const unsubscribe = dataStore.subscribe((event) => {
        if (event.type === 'USER_UPDATED' && event.payload.id === user.id) {
          expect(event.payload.name).toBe('Updated Name');
          unsubscribe();
          done();
        }
      });

      // Update user
      dataStore.updateUser(user.id, { name: 'Updated Name' });
    });

    it('should emit events when product is created', (done) => {
      // Subscribe to product creation events
      const unsubscribe = dataStore.subscribe((event) => {
        if (event.type === 'PRODUCT_CREATED') {
          expect(event.payload.title).toBe('Event Test Product');
          unsubscribe();
          done();
        }
      });

      // Create product
      dataStore.createProduct({
        title: 'Event Test Product',
        description: 'Test product for events',
        price: 15000,
        currency: 'VND',
        category: 'gaming',
        imageEmoji: '🎮',
        stock: 10,
        sold: 0,
        isActive: true,
        createdBy: 'admin-test',
        lastModifiedBy: 'admin-test',
        faqs: [],
        options: [],
      });
    });

    it('should emit events when transaction is created', (done) => {
      // Create a test user
      const user = dataStore.createUser({
        email: 'transaction-event-test@example.com',
        name: 'Transaction Event Test User',
        role: 'user',
        status: 'active',
        balance: 1000,
        totalOrders: 0,
        totalSpent: 0,
        registrationSource: 'test',
      });

      // Subscribe to transaction creation events
      const unsubscribe = dataStore.subscribe((event) => {
        if (event.type === 'TRANSACTION_CREATED' && event.payload.userId === user.id) {
          expect(event.payload.amount).toBe(5000);
          expect(event.payload.description).toBe('Event test transaction');
          unsubscribe();
          done();
        }
      });

      // Create transaction
      dataStore.createTransaction({
        userId: user.id,
        type: 'credit',
        amount: 5000,
        description: 'Event test transaction',
        adminId: 'admin-test',
      });
    });
  });

  describe('Dashboard Statistics Integration', () => {
    it('should calculate correct statistics', () => {
      // Get initial stats
      const initialStats = dataStore.getStats();

      // Create test data
      const user1 = dataStore.createUser({
        email: 'stats-user1@example.com',
        name: 'Stats User 1',
        role: 'user',
        status: 'active',
        balance: 10000,
        totalOrders: 2,
        totalSpent: 50000,
        registrationSource: 'test',
      });

      const user2 = dataStore.createUser({
        email: 'stats-user2@example.com',
        name: 'Stats User 2',
        role: 'user',
        status: 'suspended',
        balance: 5000,
        totalOrders: 1,
        totalSpent: 25000,
        registrationSource: 'test',
      });

      const product = dataStore.createProduct({
        title: 'Stats Test Product',
        description: 'Product for stats testing',
        price: 30000,
        currency: 'VND',
        category: 'gaming',
        imageEmoji: '🎮',
        stock: 100,
        sold: 10,
        isActive: true,
        createdBy: 'admin-test',
        lastModifiedBy: 'admin-test',
        faqs: [],
        options: [],
      });

      // Get updated stats
      const updatedStats = dataStore.getStats();

      // Verify stats were updated correctly
      expect(updatedStats.totalUsers).toBe(initialStats.totalUsers + 2);
      expect(updatedStats.activeUsers).toBe(initialStats.activeUsers + 1); // Only user1 is active
      expect(updatedStats.totalProducts).toBe(initialStats.totalProducts + 1);
      expect(updatedStats.activeProducts).toBe(initialStats.activeProducts + 1);
    });
  });
});

// Helper function to wait for async operations
function waitFor(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}
