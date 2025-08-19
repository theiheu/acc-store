// Test script to verify the new purchase flow with success modal
// Run this in the browser console on a product detail page

function testPurchaseFlow() {
  console.log('🛒 Testing New Purchase Flow with Success Modal');
  console.log('=================================================');
  
  try {
    // Test 1: Check if we're on a product detail page
    console.log('\n📍 Test 1: Checking current page...');
    const currentUrl = window.location.pathname;
    const isProductPage = currentUrl.startsWith('/products/');
    
    console.log(`Current URL: ${currentUrl}`);
    console.log(`Is product page: ${isProductPage}`);
    
    if (!isProductPage) {
      console.log('❌ This test should be run on a product detail page (/products/[id])');
      return;
    }
    
    // Test 2: Check for purchase form elements
    console.log('\n🔍 Test 2: Checking purchase form elements...');
    
    const purchaseButton = document.querySelector('button:contains("Mua ngay")') || 
                          Array.from(document.querySelectorAll('button')).find(btn => 
                            btn.textContent.includes('Mua ngay'));
    
    const quantityInput = document.querySelector('input[type="number"]');
    const optionSelects = document.querySelectorAll('select');
    
    console.log(`Purchase button found: ${!!purchaseButton}`);
    console.log(`Quantity input found: ${!!quantityInput}`);
    console.log(`Option selects found: ${optionSelects.length}`);
    
    if (purchaseButton) {
      console.log(`Purchase button text: "${purchaseButton.textContent}"`);
      console.log(`Purchase button disabled: ${purchaseButton.disabled}`);
    }
    
    // Test 3: Check for modal containers
    console.log('\n🔍 Test 3: Checking modal containers...');
    
    // Look for confirm purchase modal
    const confirmModal = document.querySelector('[role="dialog"]') || 
                        document.querySelector('.fixed.inset-0');
    
    console.log(`Modal container found: ${!!confirmModal}`);
    
    // Test 4: Check for success modal component (should not be visible initially)
    console.log('\n🔍 Test 4: Checking success modal component...');
    
    // Look for success modal elements (should be hidden)
    const successModalElements = document.querySelectorAll('[class*="success"], [class*="Success"]');
    const modalBackdrops = document.querySelectorAll('.fixed.inset-0');
    
    console.log(`Success modal elements found: ${successModalElements.length}`);
    console.log(`Modal backdrops found: ${modalBackdrops.length}`);
    
    // Test 5: Simulate purchase flow (if user is logged in)
    console.log('\n🔍 Test 5: Checking user authentication...');
    
    // Check if user is logged in by looking for user info
    const userInfo = document.querySelector('[data-testid="user-info"]') || 
                    document.querySelector('.user-balance') ||
                    document.querySelector('[class*="balance"]');
    
    console.log(`User info found: ${!!userInfo}`);
    
    // Test 6: Check for required imports and components
    console.log('\n🔍 Test 6: Checking component structure...');
    
    // Look for React components in the page
    const reactRoot = document.querySelector('#__next') || document.querySelector('[data-reactroot]');
    console.log(`React root found: ${!!reactRoot}`);
    
    // Test 7: Test modal functionality (if available)
    console.log('\n🔍 Test 7: Testing modal functionality...');
    
    // Override fetch to intercept purchase requests
    const originalFetch = window.fetch;
    let purchaseRequestIntercepted = false;
    
    window.fetch = async function(...args) {
      const url = args[0];
      const options = args[1];
      
      if (url === '/api/orders' && options?.method === 'POST') {
        purchaseRequestIntercepted = true;
        console.log('🎯 Purchase API request intercepted!');
        console.log('Request body:', options.body);
        
        // Return a mock success response
        return {
          ok: true,
          status: 200,
          json: async () => ({
            success: true,
            data: {
              orderId: 'test-order-123',
              status: 'pending',
              message: 'Test order created successfully'
            }
          })
        };
      }
      
      return originalFetch.apply(this, args);
    };
    
    console.log('✅ Purchase request interceptor installed');
    
    // Test 8: Instructions for manual testing
    console.log('\n📋 Test 8: Manual testing instructions...');
    console.log('To test the new purchase flow:');
    console.log('1. Make sure you are logged in');
    console.log('2. Select product options (if any)');
    console.log('3. Set quantity');
    console.log('4. Click "Mua ngay" button');
    console.log('5. Confirm purchase in the confirmation modal');
    console.log('6. Check if success modal appears instead of redirect');
    console.log('7. Test both "Quay về trang chủ" and "Xem đơn hàng" buttons');
    
    // Test 9: Check for success modal structure
    console.log('\n🔍 Test 9: Checking success modal structure...');
    
    // Look for success modal in DOM (might be hidden)
    const successModalTitle = Array.from(document.querySelectorAll('*')).find(el => 
      el.textContent && el.textContent.includes('Đặt hàng thành công'));
    
    const homeButton = Array.from(document.querySelectorAll('button')).find(btn => 
      btn.textContent && btn.textContent.includes('Quay về trang chủ'));
    
    const ordersButton = Array.from(document.querySelectorAll('button')).find(btn => 
      btn.textContent && btn.textContent.includes('Xem đơn hàng'));
    
    console.log(`Success modal title found: ${!!successModalTitle}`);
    console.log(`Home button found: ${!!homeButton}`);
    console.log(`Orders button found: ${!!ordersButton}`);
    
    // Test 10: Check for proper z-index and modal layering
    console.log('\n🔍 Test 10: Checking modal layering...');
    
    const highZIndexElements = Array.from(document.querySelectorAll('*')).filter(el => {
      const style = window.getComputedStyle(el);
      const zIndex = parseInt(style.zIndex);
      return zIndex > 9000;
    });
    
    console.log(`High z-index elements found: ${highZIndexElements.length}`);
    highZIndexElements.forEach((el, index) => {
      const zIndex = window.getComputedStyle(el).zIndex;
      console.log(`  ${index + 1}. z-index: ${zIndex}, classes: ${el.className}`);
    });
    
    // Test 11: Final assessment
    console.log('\n🏁 Test Results Summary:');
    console.log('========================');
    
    const hasRequiredElements = !!purchaseButton && !!reactRoot;
    const hasModalSupport = modalBackdrops.length > 0;
    const hasUserAuth = !!userInfo;
    
    console.log(`✅ Required elements present: ${hasRequiredElements}`);
    console.log(`✅ Modal support available: ${hasModalSupport}`);
    console.log(`✅ User authentication: ${hasUserAuth}`);
    console.log(`✅ Purchase interceptor ready: ${purchaseRequestIntercepted === false}`); // Should be false initially
    
    if (hasRequiredElements && hasModalSupport) {
      console.log('\n🎉 SUCCESS: Purchase flow components are ready!');
      console.log('   - Purchase button is available');
      console.log('   - Modal system is in place');
      console.log('   - Ready for testing the new success modal flow');
      
      if (!hasUserAuth) {
        console.log('\n⚠️ NOTE: Please log in to test the complete purchase flow');
      }
    } else {
      console.log('\n⚠️ ISSUES FOUND: Some components may need attention');
    }
    
    // Restore original fetch
    window.fetch = originalFetch;
    console.log('\n🔄 Original fetch function restored');
    
  } catch (error) {
    console.log('❌ Test failed with error:', error);
  }
}

// Helper function to simulate a purchase (for testing)
function simulatePurchase() {
  console.log('🧪 Simulating purchase flow...');
  
  const purchaseButton = Array.from(document.querySelectorAll('button')).find(btn => 
    btn.textContent.includes('Mua ngay'));
  
  if (purchaseButton && !purchaseButton.disabled) {
    console.log('Clicking purchase button...');
    purchaseButton.click();
    
    setTimeout(() => {
      const confirmButton = Array.from(document.querySelectorAll('button')).find(btn => 
        btn.textContent.includes('Xác nhận mua'));
      
      if (confirmButton) {
        console.log('Confirm button found, clicking...');
        confirmButton.click();
      } else {
        console.log('Confirm button not found');
      }
    }, 1000);
  } else {
    console.log('Purchase button not available or disabled');
  }
}

// Make functions globally available
window.testPurchaseFlow = testPurchaseFlow;
window.simulatePurchase = simulatePurchase;

console.log('🛠️ Purchase Flow Test Functions Available:');
console.log('  - testPurchaseFlow() - Run comprehensive test');
console.log('  - simulatePurchase() - Simulate purchase flow');
console.log('');
console.log('💡 Usage:');
console.log('  1. Run testPurchaseFlow() to check components');
console.log('  2. Run simulatePurchase() to test the flow (if logged in)');

// Auto-run the test
testPurchaseFlow();
