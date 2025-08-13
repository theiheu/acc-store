# Admin Dashboard Integration Testing Guide

## Overview

This document describes the integration testing strategy for the admin dashboard and real-time data synchronization system. The tests verify that admin operations immediately affect the public-facing site and that real-time updates work correctly.

## Test Categories

### 1. User Management Integration Tests

**Purpose**: Verify that admin user operations immediately reflect across the system.

**Test Cases**:
- ✅ User creation in admin panel appears in user list
- ✅ Credit top-ups immediately update user balance
- ✅ User status changes affect access permissions
- ✅ Transaction history updates in real-time

**Manual Testing Steps**:
1. Open admin panel in one browser tab
2. Open user account page in another tab (logged in as test user)
3. In admin panel: Add credits to the test user
4. Verify: User balance updates immediately in account page without refresh
5. In admin panel: Change user status to "suspended"
6. Verify: User loses access to protected features immediately

### 2. Product Management Integration Tests

**Purpose**: Verify that admin product operations immediately affect public product listings.

**Test Cases**:
- ✅ New products created in admin appear on homepage/product pages
- ✅ Product updates (price, description, stock) reflect immediately
- ✅ Product deactivation removes from public view
- ✅ Stock level changes update across all views

**Manual Testing Steps**:
1. Open admin product management in one tab
2. Open homepage/products page in another tab
3. In admin: Create a new product
4. Verify: Product appears on homepage without refresh
5. In admin: Update product price
6. Verify: New price shows on product detail page immediately
7. In admin: Set product as inactive
8. Verify: Product disappears from public listings

### 3. Real-time Data Broadcasting Tests

**Purpose**: Verify that Server-Sent Events (SSE) work correctly for real-time updates.

**Test Cases**:
- ✅ SSE connection establishes successfully
- ✅ Events are broadcast when data changes
- ✅ Multiple clients receive updates simultaneously
- ✅ Connection recovery works after network issues

**Manual Testing Steps**:
1. Open browser developer tools → Network tab
2. Navigate to any page with real-time features
3. Verify: EventSource connection to `/api/events` is established
4. In admin panel: Make changes (add credits, create product)
5. Verify: Events appear in Network tab
6. Verify: Changes reflect immediately in other tabs

### 4. Cross-Browser and Multi-Tab Testing

**Purpose**: Ensure real-time updates work across different browsers and tabs.

**Test Scenarios**:
- Admin in Chrome, User in Firefox
- Multiple admin tabs open simultaneously
- Mobile browser + desktop browser
- Incognito/private browsing mode

## Running Automated Tests

### Prerequisites
```bash
npm install --save-dev jest @testing-library/react @testing-library/jest-dom
```

### Run All Integration Tests
```bash
npm test src/tests/admin-integration.test.ts
npm test src/tests/realtime-integration.test.ts
```

### Run Specific Test Suites
```bash
# User management tests
npm test -- --testNamePattern="User Management Integration"

# Product management tests  
npm test -- --testNamePattern="Product Management Integration"

# Real-time update tests
npm test -- --testNamePattern="Real-time Integration"
```

### Test Coverage
```bash
npm test -- --coverage
```

## Manual Testing Checklist

### Pre-Testing Setup
- [ ] Start development server (`npm run dev`)
- [ ] Ensure admin account is configured
- [ ] Clear browser cache and cookies
- [ ] Open browser developer tools

### User Management Integration
- [ ] Admin can create new users
- [ ] New users appear in user list immediately
- [ ] Credit top-ups update user balance in real-time
- [ ] User status changes affect login/access immediately
- [ ] Transaction history updates without page refresh
- [ ] Balance changes trigger notifications

### Product Management Integration
- [ ] New products appear on homepage immediately
- [ ] Product updates reflect on detail pages instantly
- [ ] Stock changes update across all views
- [ ] Product deactivation removes from public listings
- [ ] Product deletion removes from all views
- [ ] Category filtering works with new products

### Real-time Features
- [ ] Connection status indicator shows "Connected"
- [ ] Real-time updates work without page refresh
- [ ] Multiple tabs receive updates simultaneously
- [ ] Connection recovers after network interruption
- [ ] Heartbeat keeps connection alive
- [ ] Events are properly formatted and handled

### Performance Testing
- [ ] Page load times remain acceptable with real-time features
- [ ] Memory usage doesn't increase over time
- [ ] SSE connection doesn't cause excessive network traffic
- [ ] Large datasets don't slow down real-time updates

## Common Issues and Solutions

### Issue: Real-time updates not working
**Symptoms**: Changes in admin don't reflect in other tabs
**Solutions**:
1. Check browser console for EventSource errors
2. Verify `/api/events` endpoint is accessible
3. Check if ad blockers are interfering
4. Ensure CORS headers are properly set

### Issue: Connection drops frequently
**Symptoms**: "Disconnected" status appears often
**Solutions**:
1. Check server-side SSE implementation
2. Verify heartbeat mechanism is working
3. Check for proxy/firewall interference
4. Increase connection timeout values

### Issue: Data inconsistency
**Symptoms**: Different data shown in admin vs public views
**Solutions**:
1. Verify data store synchronization
2. Check event emission logic
3. Ensure proper error handling
4. Clear browser cache and test again

### Issue: Performance degradation
**Symptoms**: Slow page loads or high memory usage
**Solutions**:
1. Optimize event listener cleanup
2. Implement data pagination
3. Add debouncing to frequent updates
4. Monitor memory leaks in event handlers

## Test Data Management

### Creating Test Users
```javascript
// In browser console or test setup
const testUser = dataStore.createUser({
  email: 'test@example.com',
  name: 'Test User',
  role: 'user',
  status: 'active',
  balance: 10000,
  totalOrders: 0,
  totalSpent: 0,
  registrationSource: 'test',
});
```

### Creating Test Products
```javascript
const testProduct = dataStore.createProduct({
  title: 'Test Product',
  description: 'Product for testing',
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
```

### Simulating Admin Actions
```javascript
// Add credits to user
dataStore.updateUser(userId, { balance: newBalance });

// Create transaction
dataStore.createTransaction({
  userId: userId,
  type: 'credit',
  amount: 10000,
  description: 'Test credit',
  adminId: 'admin-test',
});

// Update product
dataStore.updateProduct(productId, { 
  price: newPrice,
  stock: newStock 
});
```

## Continuous Integration

### GitHub Actions Workflow
```yaml
name: Integration Tests
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-node@v2
        with:
          node-version: '18'
      - run: npm ci
      - run: npm run test:integration
      - run: npm run test:e2e
```

### Test Environment Setup
- Use separate test database/data store
- Mock external services (payment, email)
- Set up test user accounts
- Configure test admin permissions

## Reporting Issues

When reporting integration test failures, include:
1. Browser and version
2. Steps to reproduce
3. Expected vs actual behavior
4. Console errors/warnings
5. Network tab screenshots
6. Test environment details

## Future Enhancements

- [ ] Add WebSocket support for even faster updates
- [ ] Implement offline support with sync on reconnect
- [ ] Add real-time collaboration features
- [ ] Create automated visual regression tests
- [ ] Add performance monitoring and alerts
