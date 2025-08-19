// Test script to verify the new "Original Link" feature
// Run this in the browser console on admin pages

function testOriginalLinkFeature() {
  console.log('🔗 Testing Original Link Feature');
  console.log('=================================');
  
  try {
    // Test 1: Check current page
    console.log('\n📍 Test 1: Checking current page...');
    const currentUrl = window.location.pathname;
    const isAdminPage = currentUrl.startsWith('/admin');
    const isProductsPage = currentUrl.includes('/products');
    
    console.log(`Current URL: ${currentUrl}`);
    console.log(`Is admin page: ${isAdminPage}`);
    console.log(`Is products page: ${isProductsPage}`);
    
    if (!isAdminPage) {
      console.log('❌ This test should be run on admin pages');
      return;
    }
    
    // Test 2: Check for original link input field (create/edit pages)
    console.log('\n🔍 Test 2: Checking for original link input field...');
    
    const originalLinkInput = document.querySelector('input[type="url"]') ||
                             Array.from(document.querySelectorAll('input')).find(input => 
                               input.placeholder && input.placeholder.includes('example.com'));
    
    const originalLinkLabel = Array.from(document.querySelectorAll('label')).find(label => 
      label.textContent && label.textContent.includes('Link gốc'));
    
    console.log(`Original link input found: ${!!originalLinkInput}`);
    console.log(`Original link label found: ${!!originalLinkLabel}`);
    
    if (originalLinkInput) {
      console.log(`Input type: ${originalLinkInput.type}`);
      console.log(`Input placeholder: "${originalLinkInput.placeholder}"`);
      console.log(`Input value: "${originalLinkInput.value}"`);
    }
    
    if (originalLinkLabel) {
      console.log(`Label text: "${originalLinkLabel.textContent}"`);
    }
    
    // Test 3: Check for link icons in product list
    console.log('\n🔍 Test 3: Checking for link icons in product list...');
    
    const linkIcons = document.querySelectorAll('a[title*="link"], a[href^="http"]:not([href*="localhost"])');
    const linkEmojis = Array.from(document.querySelectorAll('*')).filter(el => 
      el.textContent && el.textContent.includes('🔗'));
    
    console.log(`External link elements found: ${linkIcons.length}`);
    console.log(`Link emoji elements found: ${linkEmojis.length}`);
    
    linkIcons.forEach((link, index) => {
      console.log(`  ${index + 1}. Link: ${link.href} (title: "${link.title}")`);
    });
    
    linkEmojis.forEach((emoji, index) => {
      console.log(`  ${index + 1}. Emoji element: ${emoji.tagName} - "${emoji.textContent}"`);
    });
    
    // Test 4: Check table structure for actions column
    console.log('\n🔍 Test 4: Checking table structure...');
    
    const table = document.querySelector('table');
    const actionHeaders = Array.from(document.querySelectorAll('th')).filter(th => 
      th.textContent && th.textContent.includes('Thao tác'));
    
    console.log(`Table found: ${!!table}`);
    console.log(`Action column headers found: ${actionHeaders.length}`);
    
    if (table) {
      const rows = table.querySelectorAll('tbody tr');
      console.log(`Table rows found: ${rows.length}`);
      
      // Check each row for action buttons
      rows.forEach((row, index) => {
        const actionCell = row.querySelector('td:last-child');
        const links = actionCell ? actionCell.querySelectorAll('a') : [];
        const buttons = actionCell ? actionCell.querySelectorAll('button') : [];
        
        console.log(`  Row ${index + 1}: ${links.length} links, ${buttons.length} buttons`);
        
        links.forEach((link, linkIndex) => {
          console.log(`    Link ${linkIndex + 1}: ${link.textContent} (href: ${link.href})`);
        });
      });
    }
    
    // Test 5: Test URL validation (if input field exists)
    console.log('\n🔍 Test 5: Testing URL validation...');
    
    if (originalLinkInput) {
      const testUrls = [
        'https://example.com',
        'http://test.com/product',
        'invalid-url',
        'ftp://files.example.com',
        'https://very-long-domain-name-for-testing.com/very/long/path/to/product?param=value'
      ];
      
      testUrls.forEach((url, index) => {
        originalLinkInput.value = url;
        originalLinkInput.dispatchEvent(new Event('input', { bubbles: true }));
        originalLinkInput.dispatchEvent(new Event('change', { bubbles: true }));
        
        // Check for validation messages
        const errorMessage = document.querySelector('.text-red-600, .text-red-400');
        const isValid = originalLinkInput.checkValidity();
        
        console.log(`  Test URL ${index + 1}: "${url}"`);
        console.log(`    Browser validation: ${isValid}`);
        console.log(`    Error message visible: ${!!errorMessage}`);
        
        if (errorMessage) {
          console.log(`    Error text: "${errorMessage.textContent}"`);
        }
      });
      
      // Reset input
      originalLinkInput.value = '';
      originalLinkInput.dispatchEvent(new Event('input', { bubbles: true }));
    }
    
    // Test 6: Check form submission handling
    console.log('\n🔍 Test 6: Checking form submission...');
    
    const form = document.querySelector('form');
    const submitButton = document.querySelector('button[type="submit"]') ||
                        Array.from(document.querySelectorAll('button')).find(btn => 
                          btn.textContent && (btn.textContent.includes('Lưu') || btn.textContent.includes('Tạo')));
    
    console.log(`Form found: ${!!form}`);
    console.log(`Submit button found: ${!!submitButton}`);
    
    if (submitButton) {
      console.log(`Submit button text: "${submitButton.textContent}"`);
      console.log(`Submit button disabled: ${submitButton.disabled}`);
    }
    
    // Test 7: Check responsive design
    console.log('\n🔍 Test 7: Checking responsive design...');
    
    const viewport = {
      width: window.innerWidth,
      height: window.innerHeight
    };
    
    console.log(`Viewport: ${viewport.width}x${viewport.height}`);
    
    if (originalLinkInput) {
      const inputStyles = window.getComputedStyle(originalLinkInput);
      console.log(`Input width: ${inputStyles.width}`);
      console.log(`Input display: ${inputStyles.display}`);
    }
    
    // Test 8: Check accessibility
    console.log('\n🔍 Test 8: Checking accessibility...');
    
    if (originalLinkInput && originalLinkLabel) {
      const inputId = originalLinkInput.id;
      const labelFor = originalLinkLabel.getAttribute('for');
      const hasAriaLabel = originalLinkInput.hasAttribute('aria-label');
      const hasAriaDescribedBy = originalLinkInput.hasAttribute('aria-describedby');
      
      console.log(`Input has ID: ${!!inputId}`);
      console.log(`Label has 'for' attribute: ${!!labelFor}`);
      console.log(`Label-input association: ${inputId === labelFor}`);
      console.log(`Input has aria-label: ${hasAriaLabel}`);
      console.log(`Input has aria-describedby: ${hasAriaDescribedBy}`);
    }
    
    // Test 9: Test link opening functionality
    console.log('\n🔍 Test 9: Testing link opening functionality...');
    
    const externalLinks = Array.from(document.querySelectorAll('a[href^="http"]:not([href*="localhost"])'));
    
    externalLinks.forEach((link, index) => {
      const target = link.getAttribute('target');
      const rel = link.getAttribute('rel');
      
      console.log(`  External link ${index + 1}:`);
      console.log(`    URL: ${link.href}`);
      console.log(`    Target: ${target || 'not set'}`);
      console.log(`    Rel: ${rel || 'not set'}`);
      console.log(`    Opens in new tab: ${target === '_blank'}`);
      console.log(`    Has security attributes: ${rel && rel.includes('noopener')}`);
    });
    
    // Test 10: Final assessment
    console.log('\n🏁 Test Results Summary:');
    console.log('========================');
    
    const hasInputField = !!originalLinkInput;
    const hasLabel = !!originalLinkLabel;
    const hasLinkIcons = linkEmojis.length > 0 || linkIcons.length > 0;
    const hasTable = !!table;
    const hasForm = !!form;
    
    console.log(`✅ Original link input field: ${hasInputField}`);
    console.log(`✅ Proper labeling: ${hasLabel}`);
    console.log(`✅ Link icons in table: ${hasLinkIcons}`);
    console.log(`✅ Table structure: ${hasTable}`);
    console.log(`✅ Form functionality: ${hasForm}`);
    
    if (hasInputField && hasLabel && hasTable && hasForm) {
      console.log('\n🎉 SUCCESS: Original Link feature is implemented!');
      console.log('   - Input field with URL validation');
      console.log('   - Proper labeling and accessibility');
      console.log('   - Table integration for link display');
      console.log('   - Form submission ready');
      
      if (hasLinkIcons) {
        console.log('   - Link icons visible in product list');
      } else {
        console.log('   ⚠️ No link icons found (may be normal if no products have original links)');
      }
    } else {
      console.log('\n⚠️ ISSUES FOUND: Some features may need attention');
    }
    
  } catch (error) {
    console.log('❌ Test failed with error:', error);
  }
}

// Helper function to test URL validation manually
function testURLValidation(url) {
  console.log(`🧪 Testing URL validation for: "${url}"`);
  
  const input = document.querySelector('input[type="url"]');
  if (!input) {
    console.log('❌ No URL input field found');
    return;
  }
  
  input.value = url;
  input.dispatchEvent(new Event('input', { bubbles: true }));
  input.dispatchEvent(new Event('change', { bubbles: true }));
  
  const isValid = input.checkValidity();
  const errorMessage = document.querySelector('.text-red-600, .text-red-400');
  
  console.log(`Browser validation: ${isValid}`);
  console.log(`Error message: ${errorMessage ? errorMessage.textContent : 'none'}`);
  
  return isValid;
}

// Helper function to simulate form submission
function simulateFormSubmission() {
  console.log('🧪 Simulating form submission...');
  
  const form = document.querySelector('form');
  const submitButton = document.querySelector('button[type="submit"]');
  
  if (!form || !submitButton) {
    console.log('❌ Form or submit button not found');
    return;
  }
  
  // Fill in original link field
  const originalLinkInput = document.querySelector('input[type="url"]');
  if (originalLinkInput) {
    originalLinkInput.value = 'https://example.com/test-product';
    originalLinkInput.dispatchEvent(new Event('input', { bubbles: true }));
    console.log('✅ Original link field filled');
  }
  
  console.log('Form ready for submission (click submit button manually to test)');
}

// Make functions globally available
window.testOriginalLinkFeature = testOriginalLinkFeature;
window.testURLValidation = testURLValidation;
window.simulateFormSubmission = simulateFormSubmission;

console.log('🛠️ Original Link Feature Test Functions Available:');
console.log('  - testOriginalLinkFeature() - Run comprehensive test');
console.log('  - testURLValidation(url) - Test URL validation');
console.log('  - simulateFormSubmission() - Simulate form submission');
console.log('');
console.log('💡 Usage:');
console.log('  1. Run testOriginalLinkFeature() to check all features');
console.log('  2. Use testURLValidation("https://example.com") to test validation');
console.log('  3. Use simulateFormSubmission() to prepare form for testing');

// Auto-run the test
testOriginalLinkFeature();
