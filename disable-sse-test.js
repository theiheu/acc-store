// Temporary script to disable SSE and test if that fixes JSON parsing errors
// Run this in browser console

function disableSSE() {
  console.log('🔧 Temporarily disabling SSE connections...');
  
  // Override EventSource to prevent SSE connections
  const originalEventSource = window.EventSource;
  
  window.EventSource = function(url, options) {
    console.log(`🚫 SSE connection blocked: ${url}`);
    
    // Return a mock EventSource that doesn't actually connect
    return {
      readyState: 0,
      url: url,
      onopen: null,
      onmessage: null,
      onerror: null,
      close: function() {
        console.log(`🔒 Mock SSE closed: ${url}`);
      },
      addEventListener: function(type, listener) {
        console.log(`📝 Mock SSE event listener added: ${type}`);
      },
      removeEventListener: function(type, listener) {
        console.log(`🗑️ Mock SSE event listener removed: ${type}`);
      }
    };
  };
  
  // Copy static properties
  window.EventSource.CONNECTING = 0;
  window.EventSource.OPEN = 1;
  window.EventSource.CLOSED = 2;
  
  console.log('✅ SSE disabled. Reload the page to test without SSE.');
  console.log('🔄 To restore SSE, run: restoreSSE()');
  
  // Store original for restoration
  window.originalEventSource = originalEventSource;
}

function restoreSSE() {
  if (window.originalEventSource) {
    window.EventSource = window.originalEventSource;
    console.log('✅ SSE restored');
  } else {
    console.log('❌ Original EventSource not found');
  }
}

// Make functions globally available
window.disableSSE = disableSSE;
window.restoreSSE = restoreSSE;

console.log('🛠️ SSE Test Functions Available:');
console.log('  - disableSSE() - Disable SSE connections');
console.log('  - restoreSSE() - Restore SSE connections');
console.log('');
console.log('💡 Usage:');
console.log('  1. Run disableSSE()');
console.log('  2. Reload the page');
console.log('  3. Test if JSON errors are gone');
console.log('  4. Run restoreSSE() when done testing');
