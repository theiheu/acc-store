/**
 * Category Cleanup Script
 * 
 * Safely removes old categories and migrates products to new categories
 * 
 * BACKUP: Creates backup files before making changes
 * SAFE: Only removes specified old categories
 * MIGRATION: Moves products from old to new categories
 */

const fs = require('fs');
const path = require('path');

// Configuration
const DATA_DIR = path.join(process.cwd(), '.data');
const BACKUP_DIR = path.join(process.cwd(), '.data-backup');

// Categories to keep (new categories)
const CATEGORIES_TO_KEEP = [
  'tiktok',
  'facebook'
];

// Categories to remove (old categories)
const CATEGORIES_TO_REMOVE = [
  'gaming',
  'social', 
  'productivity'
];

// Category migration mapping (old slug -> new slug)
const CATEGORY_MIGRATION = {
  'gaming': 'uncategorized',
  'social': 'tiktok', // Social products -> TikTok
  'productivity': 'uncategorized'
};

function createBackup() {
  console.log('📦 Creating backup...');
  
  if (!fs.existsSync(BACKUP_DIR)) {
    fs.mkdirSync(BACKUP_DIR, { recursive: true });
  }
  
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const backupSubDir = path.join(BACKUP_DIR, `backup-${timestamp}`);
  fs.mkdirSync(backupSubDir, { recursive: true });
  
  // Backup all data files
  const dataFiles = ['categories.json', 'products.json'];
  dataFiles.forEach(file => {
    const srcPath = path.join(DATA_DIR, file);
    const destPath = path.join(backupSubDir, file);
    
    if (fs.existsSync(srcPath)) {
      fs.copyFileSync(srcPath, destPath);
      console.log(`✅ Backed up: ${file}`);
    }
  });
  
  console.log(`📦 Backup created at: ${backupSubDir}`);
  return backupSubDir;
}

function loadJSON(filePath) {
  if (!fs.existsSync(filePath)) {
    return [];
  }
  
  try {
    const content = fs.readFileSync(filePath, 'utf-8');
    return JSON.parse(content);
  } catch (error) {
    console.error(`❌ Error loading ${filePath}:`, error.message);
    return [];
  }
}

function saveJSON(filePath, data) {
  try {
    const content = JSON.stringify(data, null, 2);
    fs.writeFileSync(filePath, content, 'utf-8');
    return true;
  } catch (error) {
    console.error(`❌ Error saving ${filePath}:`, error.message);
    return false;
  }
}

function cleanupCategories() {
  console.log('🧹 Cleaning up categories...');
  
  const categoriesPath = path.join(DATA_DIR, 'categories.json');
  const categories = loadJSON(categoriesPath);
  
  console.log(`📊 Found ${categories.length} categories`);
  
  // Filter out old categories
  const filteredCategories = categories.filter(category => {
    const shouldKeep = !CATEGORIES_TO_REMOVE.includes(category.slug);
    
    if (!shouldKeep) {
      console.log(`🗑️  Removing category: ${category.name} (${category.slug})`);
    } else {
      console.log(`✅ Keeping category: ${category.name} (${category.slug})`);
    }
    
    return shouldKeep;
  });
  
  // Ensure uncategorized exists
  const hasUncategorized = filteredCategories.some(c => c.slug === 'uncategorized');
  if (!hasUncategorized) {
    console.log('➕ Adding uncategorized category...');
    const now = new Date().toISOString();
    filteredCategories.push({
      id: 'cat-uncategorized',
      name: 'Chưa phân loại',
      slug: 'uncategorized',
      description: 'Danh mục mặc định',
      icon: '🏷️',
      featuredProductIds: [],
      isActive: true,
      createdAt: now,
      updatedAt: now
    });
  }
  
  // Save cleaned categories
  if (saveJSON(categoriesPath, filteredCategories)) {
    console.log(`✅ Categories cleaned: ${categories.length} -> ${filteredCategories.length}`);
    return true;
  }
  
  return false;
}

function migrateProducts() {
  console.log('🔄 Migrating products...');
  
  const productsPath = path.join(DATA_DIR, 'products.json');
  const products = loadJSON(productsPath);
  
  console.log(`📊 Found ${products.length} products`);
  
  let migratedCount = 0;
  
  products.forEach(product => {
    const oldCategory = product.category;
    
    if (CATEGORIES_TO_REMOVE.includes(oldCategory)) {
      const newCategory = CATEGORY_MIGRATION[oldCategory] || 'uncategorized';
      product.category = newCategory;
      migratedCount++;
      
      console.log(`🔄 Migrated product "${product.title}": ${oldCategory} -> ${newCategory}`);
    }
  });
  
  // Save migrated products
  if (saveJSON(productsPath, products)) {
    console.log(`✅ Products migrated: ${migratedCount} products updated`);
    return true;
  }
  
  return false;
}

function validateCleanup() {
  console.log('🔍 Validating cleanup...');
  
  const categoriesPath = path.join(DATA_DIR, 'categories.json');
  const productsPath = path.join(DATA_DIR, 'products.json');
  
  const categories = loadJSON(categoriesPath);
  const products = loadJSON(productsPath);
  
  // Check no old categories remain
  const remainingOldCategories = categories.filter(c => 
    CATEGORIES_TO_REMOVE.includes(c.slug)
  );
  
  if (remainingOldCategories.length > 0) {
    console.log('❌ Validation failed: Old categories still exist:', 
      remainingOldCategories.map(c => c.slug));
    return false;
  }
  
  // Check no products reference old categories
  const productsWithOldCategories = products.filter(p => 
    CATEGORIES_TO_REMOVE.includes(p.category)
  );
  
  if (productsWithOldCategories.length > 0) {
    console.log('❌ Validation failed: Products still reference old categories:', 
      productsWithOldCategories.map(p => `${p.title} (${p.category})`));
    return false;
  }
  
  // Summary
  console.log('✅ Validation passed!');
  console.log(`📊 Final categories: ${categories.length}`);
  console.log(`📊 Final products: ${products.length}`);
  
  categories.forEach(c => {
    const productCount = products.filter(p => p.category === c.slug).length;
    console.log(`   - ${c.name} (${c.slug}): ${productCount} products`);
  });
  
  return true;
}

// Main execution
async function main() {
  console.log('🚀 Starting category cleanup...');
  console.log('');
  
  try {
    // Step 1: Create backup
    const backupPath = createBackup();
    console.log('');
    
    // Step 2: Clean categories
    if (!cleanupCategories()) {
      throw new Error('Failed to cleanup categories');
    }
    console.log('');
    
    // Step 3: Migrate products
    if (!migrateProducts()) {
      throw new Error('Failed to migrate products');
    }
    console.log('');
    
    // Step 4: Validate
    if (!validateCleanup()) {
      throw new Error('Validation failed');
    }
    console.log('');
    
    console.log('🎉 Category cleanup completed successfully!');
    console.log(`📦 Backup available at: ${backupPath}`);
    console.log('');
    console.log('Next steps:');
    console.log('1. Test the application thoroughly');
    console.log('2. Check CategorySidebar and product filtering');
    console.log('3. Verify featured products still work');
    console.log('4. If everything works, you can delete the backup');
    
  } catch (error) {
    console.error('❌ Cleanup failed:', error.message);
    console.log('');
    console.log('🔄 To restore from backup:');
    console.log('1. Stop the application');
    console.log('2. Copy backup files back to .data/ directory');
    console.log('3. Restart the application');
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  main();
}

module.exports = { main };
