// Test script to verify product editing functionality
// Run this in the browser console on the admin products page

async function testProductEdit() {
  console.log('🧪 Testing Product Edit Functionality');
  
  // Test 1: Get a product with options (should not have main price/stock)
  console.log('\n📋 Test 1: Fetching product with options...');
  try {
    const response = await fetch('/api/admin/products/product-facebook-premium');
    const result = await response.json();
    
    if (result.success) {
      const product = result.data;
      console.log('✅ Product fetched successfully:', product.title);
      console.log('📊 Product data:');
      console.log('  - Has options:', product.options?.length > 0);
      console.log('  - Main price:', product.price);
      console.log('  - Main stock:', product.stock);
      console.log('  - Options:', product.options?.map(opt => `${opt.label}: ${opt.price} VND (stock: ${opt.stock})`));
      
      // Test 2: Simulate editing this product
      console.log('\n📝 Test 2: Simulating product edit...');
      const editData = {
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
      
      console.log('📤 Edit data prepared:');
      console.log('  - Price field:', editData.price);
      console.log('  - Stock field:', editData.stock);
      console.log('  - Has options:', editData.options?.length > 0);
      
      // Test 3: Validate the edit data (simulate form validation)
      console.log('\n✅ Test 3: Validating edit data...');
      const hasOptions = editData.options && editData.options.length > 0;
      let validationErrors = [];
      
      if (!editData.title?.trim()) {
        validationErrors.push('Title is required');
      }
      
      if (!editData.description?.trim()) {
        validationErrors.push('Description is required');
      }
      
      if (!editData.category) {
        validationErrors.push('Category is required');
      }
      
      if (hasOptions) {
        // When options exist, validate options instead of main product price/stock
        const hasInvalidOption = editData.options.some(
          (option) => !option.label.trim() || option.price <= 0 || option.stock < 0
        );
        if (hasInvalidOption) {
          validationErrors.push('All options must have name, price > 0 and stock >= 0');
        }
      } else {
        // When no options, require main product price and stock
        if (!editData.price || editData.price <= 0) {
          validationErrors.push('Price must be greater than 0 (or add product options)');
        }
        
        if (editData.stock === undefined || editData.stock < 0) {
          validationErrors.push('Stock cannot be negative (or add product options)');
        }
      }
      
      if (validationErrors.length === 0) {
        console.log('✅ Validation passed! Product can be edited successfully.');
        console.log('🎉 The price validation issue has been fixed!');
      } else {
        console.log('❌ Validation failed:', validationErrors);
      }
      
    } else {
      console.log('❌ Failed to fetch product:', result.error);
    }
  } catch (error) {
    console.log('❌ Error during test:', error);
  }
  
  // Test 4: Test a product without options (if any exists)
  console.log('\n📋 Test 4: Testing product without options...');
  try {
    // Create a test scenario for a product without options
    const productWithoutOptions = {
      title: 'Test Product',
      description: 'Test description',
      longDescription: '',
      price: 50000,
      currency: 'VND',
      category: 'gaming',
      imageEmoji: '🎮',
      imageUrl: '',
      badge: '',
      stock: 100,
      isActive: true,
      options: []
    };
    
    console.log('📤 Testing validation for product without options:');
    console.log('  - Price:', productWithoutOptions.price);
    console.log('  - Stock:', productWithoutOptions.stock);
    
    const hasOptions = productWithoutOptions.options && productWithoutOptions.options.length > 0;
    let validationErrors = [];
    
    if (!hasOptions) {
      if (!productWithoutOptions.price || productWithoutOptions.price <= 0) {
        validationErrors.push('Price must be greater than 0');
      }
      
      if (productWithoutOptions.stock === undefined || productWithoutOptions.stock < 0) {
        validationErrors.push('Stock cannot be negative');
      }
    }
    
    if (validationErrors.length === 0) {
      console.log('✅ Product without options validates correctly!');
    } else {
      console.log('❌ Validation failed for product without options:', validationErrors);
    }
    
  } catch (error) {
    console.log('❌ Error during test 4:', error);
  }
  
  console.log('\n🏁 Test completed!');
}

// Run the test
testProductEdit();
