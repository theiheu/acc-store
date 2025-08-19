// Debug script to identify JSON parsing errors
// Run this in the browser console to debug the SyntaxError

function debugJSONError() {
  console.log('🔍 Debugging JSON Parsing Errors');
  console.log('=================================');
  
  // Test 1: Check current page and API endpoints
  console.log('\n📍 Test 1: Current page info...');
  console.log(`Current URL: ${window.location.href}`);
  console.log(`User Agent: ${navigator.userAgent}`);
  console.log(`Timestamp: ${new Date().toISOString()}`);
  
  // Test 2: Test API endpoints manually
  console.log('\n🔧 Test 2: Testing API endpoints...');
  
  const testEndpoints = [
    '/api/auth/session',
    '/api/products',
    '/api/events'
  ];
  
  testEndpoints.forEach(async (endpoint) => {
    try {
      console.log(`\n📡 Testing ${endpoint}...`);
      const response = await fetch(endpoint);
      
      console.log(`  Status: ${response.status} ${response.statusText}`);
      console.log(`  Content-Type: ${response.headers.get('content-type')}`);
      
      const text = await response.text();
      console.log(`  Response length: ${text.length} characters`);
      console.log(`  First 200 chars: "${text.substring(0, 200)}"`);
      
      // Try to parse as JSON
      try {
        const json = JSON.parse(text);
        console.log(`  ✅ Valid JSON: ${typeof json}`);
      } catch (jsonError) {
        console.log(`  ❌ JSON Parse Error: ${jsonError.message}`);
        console.log(`  Response starts with: "${text.substring(0, 50)}"`);
        
        // Check if it's HTML
        if (text.trim().startsWith('<!DOCTYPE') || text.trim().startsWith('<html')) {
          console.log(`  🚨 Response is HTML, not JSON!`);
        }
      }
      
    } catch (error) {
      console.log(`  ❌ Fetch Error: ${error.message}`);
    }
  });
  
  // Test 3: Check for SSE connection issues
  console.log('\n📡 Test 3: Checking SSE connection...');
  
  try {
    const eventSource = new EventSource('/api/events');
    
    eventSource.onopen = () => {
      console.log('✅ SSE connection opened successfully');
      eventSource.close();
    };
    
    eventSource.onerror = (error) => {
      console.log('❌ SSE connection error:', error);
      eventSource.close();
    };
    
    eventSource.onmessage = (event) => {
      console.log('📨 SSE message received:', event.data.substring(0, 100));
      
      try {
        JSON.parse(event.data);
        console.log('✅ SSE data is valid JSON');
      } catch (jsonError) {
        console.log('❌ SSE data is not valid JSON:', jsonError.message);
        console.log('SSE data:', event.data);
      }
      
      eventSource.close();
    };
    
    // Close after 5 seconds if no response
    setTimeout(() => {
      if (eventSource.readyState !== EventSource.CLOSED) {
        console.log('⏰ SSE test timeout, closing connection');
        eventSource.close();
      }
    }, 5000);
    
  } catch (error) {
    console.log('❌ SSE test failed:', error);
  }
  
  // Test 4: Check for network errors in console
  console.log('\n🔍 Test 4: Checking for existing errors...');
  
  // Override fetch to log all requests
  const originalFetch = window.fetch;
  window.fetch = async function(...args) {
    const url = args[0];
    console.log(`🌐 Fetch request: ${url}`);
    
    try {
      const response = await originalFetch.apply(this, args);
      const clonedResponse = response.clone();
      
      // Check if response is JSON
      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        try {
          const text = await clonedResponse.text();
          JSON.parse(text);
          console.log(`✅ ${url} - Valid JSON response`);
        } catch (jsonError) {
          console.log(`❌ ${url} - Invalid JSON response:`, jsonError.message);
          console.log(`Response: ${text.substring(0, 200)}`);
        }
      }
      
      return response;
    } catch (error) {
      console.log(`❌ ${url} - Fetch error:`, error.message);
      throw error;
    }
  };
  
  console.log('✅ Fetch interceptor installed. All future requests will be logged.');
  
  // Test 5: Check localStorage and sessionStorage
  console.log('\n💾 Test 5: Checking browser storage...');
  
  try {
    console.log('LocalStorage items:');
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      const value = localStorage.getItem(key);
      console.log(`  ${key}: ${value?.substring(0, 100)}...`);
    }
    
    console.log('SessionStorage items:');
    for (let i = 0; i < sessionStorage.length; i++) {
      const key = sessionStorage.key(i);
      const value = sessionStorage.getItem(key);
      console.log(`  ${key}: ${value?.substring(0, 100)}...`);
    }
  } catch (error) {
    console.log('❌ Storage check failed:', error);
  }
  
  // Test 6: Check for service workers
  console.log('\n⚙️ Test 6: Checking service workers...');
  
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.getRegistrations().then(registrations => {
      console.log(`Service workers found: ${registrations.length}`);
      registrations.forEach((registration, index) => {
        console.log(`  ${index + 1}. ${registration.scope}`);
      });
    });
  } else {
    console.log('Service workers not supported');
  }
  
  // Test 7: Instructions for user
  console.log('\n📋 Test 7: Next steps...');
  console.log('If you see JSON parsing errors:');
  console.log('1. Check the Network tab in DevTools for failed requests');
  console.log('2. Look for requests returning HTML instead of JSON');
  console.log('3. Check if any requests are being redirected');
  console.log('4. Clear browser cache and reload the page');
  console.log('5. Check if any browser extensions are interfering');
  
  console.log('\n🔄 To restore original fetch function, run:');
  console.log('window.fetch = originalFetch;');
  
  // Store original fetch for restoration
  window.originalFetch = originalFetch;
}

// Run the debug function
debugJSONError();
