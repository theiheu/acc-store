// Test script to verify text formatting in product description
// Run this in the browser console on a product detail page

function testTextFormatting() {
  console.log('📝 Testing Text Formatting in Product Description');
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
    
    // Test 2: Find description elements
    console.log('\n🔍 Test 2: Finding description elements...');
    
    // Look for the short description
    const shortDescElement = document.querySelector('p.text-sm.text-gray-700');
    console.log(`Short description element found: ${!!shortDescElement}`);
    if (shortDescElement) {
      console.log(`Short description content: "${shortDescElement.textContent.substring(0, 100)}..."`);
    }
    
    // Look for the long description (should be in a <pre> element now)
    const longDescElement = document.querySelector('pre.whitespace-pre-wrap');
    console.log(`Long description element found: ${!!longDescElement}`);
    if (longDescElement) {
      console.log(`Long description element tag: ${longDescElement.tagName}`);
      console.log(`Long description classes: ${longDescElement.className}`);
      console.log(`Long description content preview: "${longDescElement.textContent.substring(0, 100)}..."`);
    }
    
    // Test 3: Check for line breaks preservation
    console.log('\n📋 Test 3: Checking line breaks preservation...');
    
    if (longDescElement) {
      const content = longDescElement.textContent;
      const hasLineBreaks = content.includes('\n');
      const lineCount = content.split('\n').length;
      
      console.log(`Content has line breaks: ${hasLineBreaks}`);
      console.log(`Number of lines: ${lineCount}`);
      
      // Check for specific formatting patterns
      const hasBulletPoints = content.includes('- ');
      const hasSpecialChars = content.includes('|');
      const hasParentheses = content.includes('(') && content.includes(')');
      
      console.log(`Has bullet points (-): ${hasBulletPoints}`);
      console.log(`Has special characters (|): ${hasSpecialChars}`);
      console.log(`Has parentheses: ${hasParentheses}`);
      
      // Show first few lines to verify formatting
      const firstLines = content.split('\n').slice(0, 5);
      console.log('First 5 lines:');
      firstLines.forEach((line, index) => {
        console.log(`  ${index + 1}. "${line}"`);
      });
    }
    
    // Test 4: Check CSS styling
    console.log('\n🎨 Test 4: Checking CSS styling...');
    
    if (longDescElement) {
      const computedStyle = window.getComputedStyle(longDescElement);
      
      console.log('CSS Properties:');
      console.log(`  - white-space: ${computedStyle.whiteSpace}`);
      console.log(`  - font-family: ${computedStyle.fontFamily}`);
      console.log(`  - font-size: ${computedStyle.fontSize}`);
      console.log(`  - line-height: ${computedStyle.lineHeight}`);
      console.log(`  - background: ${computedStyle.background}`);
      console.log(`  - padding: ${computedStyle.padding}`);
      console.log(`  - margin: ${computedStyle.margin}`);
      console.log(`  - border: ${computedStyle.border}`);
    }
    
    // Test 5: Compare with original formatting
    console.log('\n🔄 Test 5: Testing copy-paste formatting...');
    
    const testText = `CHÀO MỪNG BẠN ĐẾN VỚI GIAN HÀNG CHÚNG TÔI
ĐỊNH DẠNG: Username | Pass Tiktok | Mail | Pass Mail

CHÍNH SÁCH BẢO HÀNH:
- Bảo hành Login cho lần đăng nhập đầu tiên
- Khi đăng nhập thành công, chính sách bảo hành sẽ kết thúc
- Không bảo hành lỗi truy cập quá thường xuyên (maximum)

Cách chơi hiệu quả nhất:
- Login acc và làm trên điện thoại
- Nếu reup thì nên edit trước khi up video
- Nên làm bằng proxy để đạt hiệu quả nhất`;
    
    console.log('Expected formatting test:');
    console.log('Lines in test text:', testText.split('\n').length);
    console.log('Has bullet points:', testText.includes('- '));
    console.log('Has special chars:', testText.includes('|'));
    console.log('Has empty lines:', testText.includes('\n\n'));
    
    if (longDescElement) {
      const actualContent = longDescElement.textContent;
      const preservesLineBreaks = actualContent.includes('\n');
      const preservesBullets = actualContent.includes('- ');
      const preservesSpecialChars = actualContent.includes('|');
      
      console.log('\nActual content formatting:');
      console.log(`✅ Preserves line breaks: ${preservesLineBreaks}`);
      console.log(`✅ Preserves bullet points: ${preservesBullets}`);
      console.log(`✅ Preserves special characters: ${preservesSpecialChars}`);
    }
    
    // Test 6: Check tabs functionality
    console.log('\n📑 Test 6: Checking tabs functionality...');
    
    const tabButtons = document.querySelectorAll('[role="tab"]');
    const overviewTab = Array.from(tabButtons).find(tab => tab.textContent.includes('Mô tả'));
    
    console.log(`Tab buttons found: ${tabButtons.length}`);
    console.log(`Overview tab found: ${!!overviewTab}`);
    
    if (overviewTab) {
      const isActive = overviewTab.getAttribute('aria-selected') === 'true';
      console.log(`Overview tab is active: ${isActive}`);
      
      if (!isActive) {
        console.log('Clicking overview tab to activate...');
        overviewTab.click();
        
        // Wait a moment and check again
        setTimeout(() => {
          const newlyActive = overviewTab.getAttribute('aria-selected') === 'true';
          console.log(`Overview tab activated: ${newlyActive}`);
        }, 100);
      }
    }
    
    // Test 7: Final assessment
    console.log('\n🏁 Test Results Summary:');
    console.log('========================');
    
    const hasShortDesc = !!shortDescElement;
    const hasLongDesc = !!longDescElement;
    const correctElement = longDescElement?.tagName === 'PRE';
    const hasWhitespacePreWrap = longDescElement?.classList.contains('whitespace-pre-wrap');
    const preservesFormatting = longDescElement?.textContent.includes('\n') && 
                               longDescElement?.textContent.includes('- ');
    
    console.log(`✅ Short description present: ${hasShortDesc}`);
    console.log(`✅ Long description present: ${hasLongDesc}`);
    console.log(`✅ Uses correct HTML element (PRE): ${correctElement}`);
    console.log(`✅ Has whitespace-pre-wrap class: ${hasWhitespacePreWrap}`);
    console.log(`✅ Preserves text formatting: ${preservesFormatting}`);
    
    if (hasShortDesc && hasLongDesc && correctElement && hasWhitespacePreWrap && preservesFormatting) {
      console.log('\n🎉 SUCCESS: Text formatting is working correctly!');
      console.log('   - Line breaks are preserved');
      console.log('   - Bullet points are maintained');
      console.log('   - Special characters display correctly');
      console.log('   - Copy-paste formatting works as expected');
    } else {
      console.log('\n⚠️ ISSUES FOUND: Some formatting features need attention');
    }
    
  } catch (error) {
    console.log('❌ Test failed with error:', error);
  }
}

// Run the test
testTextFormatting();
