// Test script to verify real-time product updates on product detail page
// Run this in the browser console on a product detail page

async function testRealtimeUpdates() {
  console.log('🔄 Testing Real-time Product Updates');
  console.log('====================================');
  
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
    
    // Test 2: Check if SSE connection is active
    console.log('\n🔌 Test 2: Checking SSE connection...');
    
    // Look for EventSource in the global scope or check for SSE-related elements
    const hasEventSource = typeof EventSource !== 'undefined';
    console.log(`EventSource available: ${hasEventSource}`);
    
    // Test 3: Check current product data
    console.log('\n📊 Test 3: Checking current product data...');
    
    // Try to find product data in the page
    const productTitle = document.querySelector('h1')?.textContent;
    const productDescription = document.querySelector('[class*="description"]')?.textContent;
    
    console.log(`Product title: "${productTitle}"`);
    console.log(`Product description found: ${!!productDescription}`);
    
    // Test 4: Monitor for real-time updates
    console.log('\n👀 Test 4: Setting up real-time update monitoring...');
    
    let updateCount = 0;
    const originalTitle = productTitle;
    const originalDescription = productDescription;
    
    // Create a MutationObserver to watch for DOM changes
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.type === 'childList' || mutation.type === 'characterData') {
          const newTitle = document.querySelector('h1')?.textContent;
          const newDescription = document.querySelector('[class*="description"]')?.textContent;
          
          if (newTitle !== originalTitle || newDescription !== originalDescription) {
            updateCount++;
            console.log(`🔄 Update detected #${updateCount}:`);
            console.log(`  - Title changed: ${newTitle !== originalTitle}`);
            console.log(`  - Description changed: ${newDescription !== originalDescription}`);
            console.log(`  - New title: "${newTitle}"`);
            console.log(`  - Timestamp: ${new Date().toLocaleTimeString()}`);
          }
        }
      });
    });
    
    // Start observing
    observer.observe(document.body, {
      childList: true,
      subtree: true,
      characterData: true
    });
    
    console.log('✅ Mutation observer started. Watching for product updates...');
    
    // Test 5: Check for SSE event listeners
    console.log('\n🎧 Test 5: Checking for SSE event listeners...');
    
    // Try to access the SSE connection if it exists
    let sseConnected = false;
    try {
      // This is a bit hacky, but we'll try to detect if SSE is working
      const eventSourceCheck = new EventSource('/api/events');
      eventSourceCheck.onopen = () => {
        sseConnected = true;
        console.log('✅ SSE connection test successful');
        eventSourceCheck.close();
      };
      eventSourceCheck.onerror = () => {
        console.log('❌ SSE connection test failed');
        eventSourceCheck.close();
      };
      
      // Close after 2 seconds
      setTimeout(() => {
        if (eventSourceCheck.readyState !== EventSource.CLOSED) {
          eventSourceCheck.close();
        }
      }, 2000);
      
    } catch (error) {
      console.log('❌ SSE test error:', error);
    }
    
    // Test 6: Simulate checking for product updates
    console.log('\n🔍 Test 6: Testing product data refresh...');
    
    const productId = currentUrl.split('/').pop();
    if (productId) {
      try {
        const response = await fetch(`/api/products/${productId}`);
        const result = await response.json();
        
        if (result.success) {
          console.log('✅ Product API accessible');
          console.log(`📊 Current product data:`);
          console.log(`  - ID: ${result.data.id}`);
          console.log(`  - Title: "${result.data.title}"`);
          console.log(`  - Description: "${result.data.description}"`);
          console.log(`  - Long Description: "${result.data.longDescription || '(empty)'}"`);
          console.log(`  - Last updated: ${new Date().toLocaleTimeString()}`);
        } else {
          console.log('❌ Failed to fetch product data:', result.error);
        }
      } catch (error) {
        console.log('❌ Error fetching product data:', error);
      }
    }
    
    // Test 7: Instructions for manual testing
    console.log('\n📋 Test 7: Manual testing instructions...');
    console.log('To test real-time updates:');
    console.log('1. Keep this console open');
    console.log('2. Open the admin panel in another tab');
    console.log('3. Edit this product and save changes');
    console.log('4. Watch this console for update notifications');
    console.log('5. Check if the page content updates automatically');
    
    // Test 8: Set up a timer to check for updates
    console.log('\n⏰ Test 8: Setting up periodic update checks...');
    
    let checkCount = 0;
    const maxChecks = 10; // Check for 10 intervals (50 seconds)
    
    const updateChecker = setInterval(() => {
      checkCount++;
      const currentTitle = document.querySelector('h1')?.textContent;
      const currentDescription = document.querySelector('[class*="description"]')?.textContent;
      
      console.log(`🔍 Check #${checkCount}/${maxChecks} at ${new Date().toLocaleTimeString()}`);
      console.log(`  - Title: "${currentTitle}"`);
      console.log(`  - Description changed: ${currentDescription !== originalDescription}`);
      
      if (checkCount >= maxChecks) {
        clearInterval(updateChecker);
        observer.disconnect();
        console.log('\n🏁 Monitoring completed');
        console.log(`📊 Summary:`);
        console.log(`  - Updates detected: ${updateCount}`);
        console.log(`  - SSE connection: ${sseConnected ? 'Working' : 'Unknown'}`);
        console.log(`  - Real-time updates: ${updateCount > 0 ? 'Working' : 'Not detected'}`);
        
        if (updateCount > 0) {
          console.log('\n🎉 SUCCESS: Real-time updates are working!');
        } else {
          console.log('\n⚠️ No updates detected during monitoring period');
          console.log('   Try editing the product in admin panel to test');
        }
      }
    }, 5000); // Check every 5 seconds
    
    console.log('✅ Periodic update checker started (checking every 5 seconds for 50 seconds)');
    
  } catch (error) {
    console.log('❌ Test failed with error:', error);
  }
}

// Run the test
testRealtimeUpdates();
