// Test script to check API responses and identify JSON parsing issues
// Run this in the browser console

async function testAPIResponses() {
  console.log('🧪 Testing API Responses for JSON Issues');
  console.log('=========================================');
  
  const testResults = [];
  
  // List of API endpoints to test
  const endpoints = [
    '/api/auth/session',
    '/api/products',
    '/api/categories',
    '/api/events',
    '/api/admin/orders/stats',
    '/api/products/product-facebook-premium',
    '/api/products/product-1755616389317-9f4vv6c5l'
  ];
  
  for (const endpoint of endpoints) {
    console.log(`\n🔍 Testing ${endpoint}...`);
    
    try {
      const startTime = Date.now();
      const response = await fetch(endpoint);
      const endTime = Date.now();
      
      const result = {
        endpoint,
        status: response.status,
        statusText: response.statusText,
        contentType: response.headers.get('content-type'),
        responseTime: endTime - startTime,
        success: false,
        error: null,
        isJSON: false,
        isHTML: false,
        responsePreview: ''
      };
      
      // Get response text
      const responseText = await response.text();
      result.responsePreview = responseText.substring(0, 200);
      
      // Check if response is HTML
      if (responseText.trim().startsWith('<!DOCTYPE') || 
          responseText.trim().startsWith('<html') ||
          responseText.includes('<title>')) {
        result.isHTML = true;
        result.error = 'Response is HTML instead of JSON';
        console.log(`  ❌ HTML Response detected!`);
        console.log(`  Preview: ${result.responsePreview}`);
      }
      // Try to parse as JSON
      else {
        try {
          const jsonData = JSON.parse(responseText);
          result.isJSON = true;
          result.success = true;
          result.dataType = typeof jsonData;
          result.hasData = jsonData.hasOwnProperty('data');
          result.hasSuccess = jsonData.hasOwnProperty('success');
          
          console.log(`  ✅ Valid JSON (${result.dataType})`);
          if (result.hasSuccess) {
            console.log(`  Success: ${jsonData.success}`);
          }
          if (result.hasData) {
            console.log(`  Has data: ${Array.isArray(jsonData.data) ? 'array' : typeof jsonData.data}`);
          }
          
        } catch (jsonError) {
          result.error = jsonError.message;
          console.log(`  ❌ JSON Parse Error: ${jsonError.message}`);
          console.log(`  Response preview: "${result.responsePreview}"`);
        }
      }
      
      console.log(`  Status: ${result.status} ${result.statusText}`);
      console.log(`  Content-Type: ${result.contentType}`);
      console.log(`  Response Time: ${result.responseTime}ms`);
      
      testResults.push(result);
      
    } catch (fetchError) {
      const result = {
        endpoint,
        success: false,
        error: `Fetch Error: ${fetchError.message}`,
        responseTime: 0
      };
      
      console.log(`  ❌ Fetch Error: ${fetchError.message}`);
      testResults.push(result);
    }
    
    // Small delay between requests
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  
  // Summary
  console.log('\n📊 Test Results Summary:');
  console.log('========================');
  
  const successful = testResults.filter(r => r.success);
  const failed = testResults.filter(r => !r.success);
  const htmlResponses = testResults.filter(r => r.isHTML);
  
  console.log(`✅ Successful: ${successful.length}/${testResults.length}`);
  console.log(`❌ Failed: ${failed.length}/${testResults.length}`);
  console.log(`🚨 HTML Responses: ${htmlResponses.length}/${testResults.length}`);
  
  if (failed.length > 0) {
    console.log('\n❌ Failed Endpoints:');
    failed.forEach(result => {
      console.log(`  - ${result.endpoint}: ${result.error}`);
    });
  }
  
  if (htmlResponses.length > 0) {
    console.log('\n🚨 HTML Responses (should be JSON):');
    htmlResponses.forEach(result => {
      console.log(`  - ${result.endpoint}`);
      console.log(`    Preview: ${result.responsePreview}`);
    });
  }
  
  // Test SSE specifically
  console.log('\n📡 Testing SSE Connection...');
  
  try {
    const eventSource = new EventSource('/api/events');
    let messageCount = 0;
    let jsonErrors = 0;
    
    const timeout = setTimeout(() => {
      eventSource.close();
      console.log(`📊 SSE Test Results:`);
      console.log(`  Messages received: ${messageCount}`);
      console.log(`  JSON errors: ${jsonErrors}`);
      
      if (jsonErrors > 0) {
        console.log(`  🚨 SSE is sending invalid JSON data!`);
      } else if (messageCount > 0) {
        console.log(`  ✅ SSE is working correctly`);
      } else {
        console.log(`  ⚠️ No SSE messages received (may be normal)`);
      }
    }, 3000);
    
    eventSource.onmessage = (event) => {
      messageCount++;
      console.log(`📨 SSE Message ${messageCount}: ${event.data.substring(0, 100)}...`);
      
      try {
        JSON.parse(event.data);
      } catch (jsonError) {
        jsonErrors++;
        console.log(`❌ SSE JSON Error: ${jsonError.message}`);
        console.log(`Data: ${event.data}`);
      }
    };
    
    eventSource.onerror = (error) => {
      console.log(`❌ SSE Error:`, error);
      clearTimeout(timeout);
      eventSource.close();
    };
    
  } catch (sseError) {
    console.log(`❌ SSE Test Failed: ${sseError.message}`);
  }
  
  // Recommendations
  console.log('\n💡 Recommendations:');
  console.log('==================');
  
  if (htmlResponses.length > 0) {
    console.log('🔧 HTML responses detected:');
    console.log('  - Check if server is returning error pages instead of JSON');
    console.log('  - Verify API routes are correctly configured');
    console.log('  - Check for server-side redirects');
  }
  
  if (failed.length > 0) {
    console.log('🔧 Failed requests detected:');
    console.log('  - Check network connectivity');
    console.log('  - Verify server is running');
    console.log('  - Check for CORS issues');
  }
  
  console.log('🔧 General troubleshooting:');
  console.log('  - Clear browser cache and cookies');
  console.log('  - Disable browser extensions temporarily');
  console.log('  - Check browser console for additional errors');
  console.log('  - Verify server logs for errors');
  
  return testResults;
}

// Run the test
testAPIResponses().then(results => {
  console.log('\n✅ API Response Test Completed');
  console.log('Results stored in variable: results');
  window.apiTestResults = results;
}).catch(error => {
  console.log('❌ API Response Test Failed:', error);
});
