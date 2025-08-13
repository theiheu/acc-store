// Simple script to test API endpoints
// Run with: node scripts/test-api.js

const BASE_URL = 'http://localhost:3000';

async function testEndpoint(path, options = {}) {
  try {
    console.log(`\n🧪 Testing: ${path}`);
    const response = await fetch(`${BASE_URL}${path}`, options);
    
    console.log(`Status: ${response.status} ${response.statusText}`);
    console.log(`Content-Type: ${response.headers.get('content-type')}`);
    
    if (response.headers.get('content-type')?.includes('application/json')) {
      const data = await response.json();
      console.log('Response:', JSON.stringify(data, null, 2));
    } else {
      const text = await response.text();
      console.log('Response (first 200 chars):', text.substring(0, 200));
    }
    
    return response.ok;
  } catch (error) {
    console.error(`❌ Error testing ${path}:`, error.message);
    return false;
  }
}

async function runTests() {
  console.log('🚀 Starting API endpoint tests...');
  
  const tests = [
    // Test admin dashboard endpoint
    { path: '/api/admin/dashboard', method: 'GET' },
    
    // Test admin users endpoint
    { path: '/api/admin/users', method: 'GET' },
    
    // Test admin products endpoint
    { path: '/api/admin/products', method: 'GET' },
    
    // Test SSE endpoint
    { path: '/api/events', method: 'GET' },
  ];
  
  let passed = 0;
  let failed = 0;
  
  for (const test of tests) {
    const success = await testEndpoint(test.path, { method: test.method });
    if (success) {
      passed++;
      console.log('✅ PASSED');
    } else {
      failed++;
      console.log('❌ FAILED');
    }
  }
  
  console.log(`\n📊 Test Results: ${passed} passed, ${failed} failed`);
  
  if (failed > 0) {
    console.log('\n💡 Common issues:');
    console.log('- Make sure the development server is running (npm run dev)');
    console.log('- Check if you are logged in as an admin user');
    console.log('- Verify admin email is configured in src/core/admin-auth.ts');
    console.log('- Check browser console for detailed error messages');
  }
}

// Run tests if this script is executed directly
if (require.main === module) {
  runTests().catch(console.error);
}

module.exports = { testEndpoint, runTests };
