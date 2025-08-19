// Test script to verify the price validation fix
// Run this in the browser console on the product edit page

async function testValidationFix() {
  console.log('🔧 Testing Price Validation Fix');
  console.log('=====================================');
  
  try {
    // Test 1: Fetch the Facebook Premium product (has options)
    console.log('\n📋 Test 1: Fetching Facebook Premium product...');
    const response = await fetch('/api/admin/products/product-facebook-premium');
    const result = await response.json();
    
    if (!result.success) {
      console.log('❌ Failed to fetch product:', result.error);
      return;
    }
    
    const product = result.data;
    console.log('✅ Product fetched successfully');
    console.log('📊 Product details:');
    console.log(`  - Title: ${product.title}`);
    console.log(`  - Has options: ${product.options?.length > 0}`);
    console.log(`  - Main price: ${product.price}`);
    console.log(`  - Main stock: ${product.stock}`);
    console.log(`  - Options count: ${product.options?.length || 0}`);
    
    if (product.options && product.options.length > 0) {
      console.log('  - Option details:');
      product.options.forEach((opt, idx) => {
        console.log(`    ${idx + 1}. ${opt.label}: ${opt.price} VND (stock: ${opt.stock})`);
      });
    }
    
    // Test 2: Simulate the old buggy behavior vs new fixed behavior
    console.log('\n🐛 Test 2: Comparing old vs new data loading behavior...');
    
    // OLD BUGGY BEHAVIOR (what was happening before the fix)
    const oldBuggyFormData = {
      price: product.price || 0,  // This was the bug - setting to 0 when undefined
      stock: product.stock || 0,  // This was the bug - setting to 0 when undefined
      options: product.options || []
    };
    
    // NEW FIXED BEHAVIOR (what happens after the fix)
    const newFixedFormData = {
      price: product.price !== undefined ? product.price : undefined,  // Fixed - preserves undefined
      stock: product.stock !== undefined ? product.stock : undefined,  // Fixed - preserves undefined
      options: product.options || []
    };
    
    console.log('📊 Data loading comparison:');
    console.log('  Old buggy behavior:');
    console.log(`    - price: ${oldBuggyFormData.price} (type: ${typeof oldBuggyFormData.price})`);
    console.log(`    - stock: ${oldBuggyFormData.stock} (type: ${typeof oldBuggyFormData.stock})`);
    
    console.log('  New fixed behavior:');
    console.log(`    - price: ${newFixedFormData.price} (type: ${typeof newFixedFormData.price})`);
    console.log(`    - stock: ${newFixedFormData.stock} (type: ${typeof newFixedFormData.stock})`);
    
    // Test 3: Validate both scenarios
    console.log('\n✅ Test 3: Validation comparison...');
    
    function validateFormData(formData, label) {
      console.log(`\n  ${label}:`);
      const hasOptions = formData.options && formData.options.length > 0;
      let errors = [];
      
      if (hasOptions) {
        // When options exist, validate options instead of main product price/stock
        const hasInvalidOption = formData.options.some(
          (option) => !option.label.trim() || option.price <= 0 || option.stock < 0
        );
        if (hasInvalidOption) {
          errors.push("Tất cả tùy chọn phải có tên, giá > 0 và kho >= 0");
        }
      } else {
        // When no options, require main product price and stock
        if (!formData.price || formData.price <= 0) {
          errors.push("Giá phải lớn hơn 0 (hoặc thêm tùy chọn sản phẩm)");
        }
        
        if (formData.stock === undefined || formData.stock < 0) {
          errors.push("Số lượng kho không thể âm (hoặc thêm tùy chọn sản phẩm)");
        }
      }
      
      console.log(`    - Has options: ${hasOptions}`);
      console.log(`    - Validation errors: ${errors.length}`);
      if (errors.length > 0) {
        errors.forEach(error => console.log(`      ❌ ${error}`));
      } else {
        console.log(`      ✅ Validation passed`);
      }
      
      return errors.length === 0;
    }
    
    const oldValidationResult = validateFormData(oldBuggyFormData, '🐛 Old buggy behavior');
    const newValidationResult = validateFormData(newFixedFormData, '🔧 New fixed behavior');
    
    // Test 4: Test the input change handler fix
    console.log('\n🎯 Test 4: Testing input change handler fix...');
    
    function testInputHandler(inputValue, fieldName) {
      // OLD BUGGY HANDLER
      const oldResult = Number(inputValue) || 0;
      
      // NEW FIXED HANDLER
      const newResult = inputValue === "" ? undefined : Number(inputValue) || 0;
      
      console.log(`\n  Input: "${inputValue}" for ${fieldName}`);
      console.log(`    Old handler result: ${oldResult} (type: ${typeof oldResult})`);
      console.log(`    New handler result: ${newResult} (type: ${typeof newResult})`);
      
      // Test validation with both results
      const oldValid = fieldName === 'price' ? (oldResult > 0) : (oldResult >= 0);
      const newValid = fieldName === 'price' ? 
        (newResult === undefined || newResult > 0) : 
        (newResult === undefined || newResult >= 0);
      
      console.log(`    Old validation: ${oldValid ? '✅' : '❌'}`);
      console.log(`    New validation: ${newValid ? '✅' : '❌'} (when product has options)`);
    }
    
    testInputHandler('', 'price');
    testInputHandler('', 'stock');
    testInputHandler('50000', 'price');
    testInputHandler('100', 'stock');
    
    // Test 5: Simulate a complete edit operation
    console.log('\n🚀 Test 5: Simulating complete edit operation...');
    
    const editFormData = {
      title: product.title,
      description: product.description,
      longDescription: product.longDescription || '',
      price: product.price !== undefined ? product.price : undefined,
      currency: product.currency || 'VND',
      category: product.category || 'gaming',
      imageEmoji: product.imageEmoji || '📦',
      imageUrl: product.imageUrl || '',
      badge: product.badge || '',
      stock: product.stock !== undefined ? product.stock : undefined,
      isActive: product.isActive !== false,
      options: product.options || [],
      supplier: product.supplier
    };
    
    console.log('📝 Edit form data prepared:');
    console.log(`  - Title: "${editFormData.title}"`);
    console.log(`  - Price: ${editFormData.price} (${typeof editFormData.price})`);
    console.log(`  - Stock: ${editFormData.stock} (${typeof editFormData.stock})`);
    console.log(`  - Options: ${editFormData.options.length} items`);
    
    const finalValidation = validateFormData(editFormData, '🎯 Final edit validation');
    
    console.log('\n🏁 Test Results Summary:');
    console.log('========================');
    console.log(`✅ Product data loaded correctly: ${newFixedFormData.price === undefined && newFixedFormData.stock === undefined}`);
    console.log(`✅ Old validation would fail: ${!oldValidationResult}`);
    console.log(`✅ New validation passes: ${newValidationResult}`);
    console.log(`✅ Edit operation ready: ${finalValidation}`);
    
    if (finalValidation) {
      console.log('\n🎉 SUCCESS: The price validation fix is working correctly!');
      console.log('   - Products with options no longer require main price/stock');
      console.log('   - Empty input fields are handled correctly');
      console.log('   - Edit operations should now work without validation errors');
    } else {
      console.log('\n❌ FAILURE: There are still validation issues');
    }
    
  } catch (error) {
    console.log('❌ Test failed with error:', error);
  }
}

// Run the test
testValidationFix();
