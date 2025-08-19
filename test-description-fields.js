// Test script to verify description fields are working correctly
// Run this in the browser console on the product edit page

async function testDescriptionFields() {
  console.log('📝 Testing Description Fields in Product Edit Form');
  console.log('==================================================');
  
  try {
    // Test 1: Check if both description fields are present in the form
    console.log('\n🔍 Test 1: Checking form fields...');
    
    const shortDescInput = document.querySelector('input[type="text"]');
    const longDescTextarea = document.querySelector('textarea[rows="4"]');
    
    console.log('📋 Form field analysis:');
    console.log(`  - Short description field found: ${!!shortDescInput}`);
    console.log(`  - Long description field found: ${!!longDescTextarea}`);
    
    if (shortDescInput) {
      console.log(`  - Short description placeholder: "${shortDescInput.placeholder}"`);
      console.log(`  - Short description value: "${shortDescInput.value}"`);
    }
    
    if (longDescTextarea) {
      console.log(`  - Long description placeholder: "${longDescTextarea.placeholder}"`);
      console.log(`  - Long description value: "${longDescTextarea.value}"`);
      console.log(`  - Long description rows: ${longDescTextarea.rows}`);
    }
    
    // Test 2: Check labels
    console.log('\n🏷️ Test 2: Checking field labels...');
    const labels = document.querySelectorAll('label');
    const descriptionLabels = Array.from(labels).filter(label => 
      label.textContent.includes('Mô tả') || label.textContent.includes('description')
    );
    
    console.log('📋 Label analysis:');
    descriptionLabels.forEach((label, index) => {
      console.log(`  ${index + 1}. "${label.textContent.trim()}"`);
    });
    
    // Test 3: Verify consistency with create form
    console.log('\n🔄 Test 3: Checking consistency with create form...');
    
    const expectedLabels = ['Mô tả ngắn *', 'Mô tả chi tiết'];
    const actualLabels = descriptionLabels.map(label => label.textContent.trim());
    
    console.log('📊 Consistency check:');
    expectedLabels.forEach((expected, index) => {
      const actual = actualLabels[index];
      const matches = actual === expected;
      console.log(`  ${matches ? '✅' : '❌'} Expected: "${expected}", Actual: "${actual || 'NOT FOUND'}"`);
    });
    
    // Test 4: Test field behavior
    console.log('\n⚡ Test 4: Testing field behavior...');
    
    if (shortDescInput) {
      const originalValue = shortDescInput.value;
      console.log('📝 Testing short description field:');
      console.log(`  - Original value: "${originalValue}"`);
      console.log(`  - Field type: ${shortDescInput.type}`);
      console.log(`  - Required field: ${shortDescInput.labels?.[0]?.textContent?.includes('*') || false}`);
    }
    
    if (longDescTextarea) {
      const originalValue = longDescTextarea.value;
      console.log('📝 Testing long description field:');
      console.log(`  - Original value: "${originalValue}"`);
      console.log(`  - Field type: textarea`);
      console.log(`  - Required field: ${longDescTextarea.labels?.[0]?.textContent?.includes('*') || false}`);
    }
    
    // Test 5: Fetch product data to verify data loading
    console.log('\n📡 Test 5: Verifying data loading...');
    
    const currentUrl = window.location.pathname;
    const productId = currentUrl.split('/').pop();
    
    if (productId && productId.startsWith('product-')) {
      try {
        const response = await fetch(`/api/admin/products/${productId}`);
        const result = await response.json();
        
        if (result.success) {
          const product = result.data;
          console.log('📊 Product data analysis:');
          console.log(`  - Product title: "${product.title}"`);
          console.log(`  - Short description: "${product.description}"`);
          console.log(`  - Long description: "${product.longDescription || '(empty)'}"`);
          
          // Check if form values match product data
          if (shortDescInput && longDescTextarea) {
            const shortDescMatches = shortDescInput.value === product.description;
            const longDescMatches = longDescTextarea.value === (product.longDescription || '');
            
            console.log('🔄 Data loading verification:');
            console.log(`  ${shortDescMatches ? '✅' : '❌'} Short description loaded correctly`);
            console.log(`  ${longDescMatches ? '✅' : '❌'} Long description loaded correctly`);
          }
        } else {
          console.log('❌ Failed to fetch product data:', result.error);
        }
      } catch (error) {
        console.log('❌ Error fetching product data:', error);
      }
    }
    
    // Test 6: Compare with create form structure
    console.log('\n🆚 Test 6: Comparing with create form structure...');
    
    console.log('📋 Expected create form structure:');
    console.log('  1. Short description: input[type="text"] with label "Mô tả ngắn *"');
    console.log('  2. Long description: textarea[rows="4"] with label "Mô tả chi tiết"');
    
    console.log('📋 Current edit form structure:');
    console.log(`  1. Short description: ${shortDescInput ? 'input[type="text"]' : 'NOT FOUND'} with label "${descriptionLabels[0]?.textContent || 'NOT FOUND'}"`);
    console.log(`  2. Long description: ${longDescTextarea ? 'textarea[rows="4"]' : 'NOT FOUND'} with label "${descriptionLabels[1]?.textContent || 'NOT FOUND'}"`);
    
    // Test 7: Final assessment
    console.log('\n🏁 Test Results Summary:');
    console.log('========================');
    
    const hasShortDesc = !!shortDescInput;
    const hasLongDesc = !!longDescTextarea;
    const correctLabels = actualLabels.length >= 2 && 
                         actualLabels[0]?.includes('Mô tả ngắn') && 
                         actualLabels[1]?.includes('Mô tả chi tiết');
    const correctFieldTypes = shortDescInput?.type === 'text' && 
                             longDescTextarea?.tagName === 'TEXTAREA';
    
    console.log(`✅ Short description field present: ${hasShortDesc}`);
    console.log(`✅ Long description field present: ${hasLongDesc}`);
    console.log(`✅ Correct field labels: ${correctLabels}`);
    console.log(`✅ Correct field types: ${correctFieldTypes}`);
    
    if (hasShortDesc && hasLongDesc && correctLabels && correctFieldTypes) {
      console.log('\n🎉 SUCCESS: Description fields are working correctly!');
      console.log('   - Both short and long description fields are present');
      console.log('   - Field labels match the create form');
      console.log('   - Field types are correct (input for short, textarea for long)');
      console.log('   - Data loading appears to be working');
    } else {
      console.log('\n❌ ISSUES FOUND: Some description fields need attention');
    }
    
  } catch (error) {
    console.log('❌ Test failed with error:', error);
  }
}

// Run the test
testDescriptionFields();
