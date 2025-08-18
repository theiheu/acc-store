/**
 * Code References Cleanup Script
 * 
 * Removes old category references from code files
 * Updates hardcoded category lists and default values
 */

const fs = require('fs');
const path = require('path');

// Files to update
const FILES_TO_UPDATE = [
  'src/core/products.ts',
  'src/core/data-store.ts'
];

// Old category references to remove
const OLD_CATEGORY_REFS = [
  'gaming',
  'social', 
  'productivity'
];

function createBackup(filePath) {
  const backupPath = filePath + '.backup';
  fs.copyFileSync(filePath, backupPath);
  console.log(`📦 Backed up: ${path.basename(filePath)}`);
  return backupPath;
}

function updateProductsFile() {
  const filePath = path.join(process.cwd(), 'src/core/products.ts');
  
  if (!fs.existsSync(filePath)) {
    console.log(`⚠️  File not found: ${filePath}`);
    return false;
  }
  
  console.log('🔄 Updating src/core/products.ts...');
  createBackup(filePath);
  
  let content = fs.readFileSync(filePath, 'utf-8');
  
  // Replace old CategoryId type
  const oldCategoryType = `export type CategoryId = "all" | "gaming" | "social" | "productivity";`;
  const newCategoryType = `export type CategoryId = "all" | "tiktok" | "facebook" | "uncategorized";`;
  
  content = content.replace(oldCategoryType, newCategoryType);
  
  // Replace old CATEGORIES array
  const oldCategoriesArray = `export const CATEGORIES: {
  id: Exclude<CategoryId, "all">;
  label: string;
  icon: string;
}[] = [
  { id: "gaming", label: "Tài khoản Gaming", icon: "🎮" },
  { id: "social", label: "Tài khoản Social Media", icon: "📱" },
  { id: "productivity", label: "Tài khoản Productivity", icon: "⚙️" },
];`;

  const newCategoriesArray = `export const CATEGORIES: {
  id: Exclude<CategoryId, "all">;
  label: string;
  icon: string;
}[] = [
  { id: "tiktok", label: "TikTok", icon: "🎵" },
  { id: "facebook", label: "Facebook", icon: "📘" },
  { id: "uncategorized", label: "Chưa phân loại", icon: "🏷️" },
];`;
  
  content = content.replace(oldCategoriesArray, newCategoriesArray);
  
  fs.writeFileSync(filePath, content, 'utf-8');
  console.log('✅ Updated src/core/products.ts');
  return true;
}

function updateDataStoreFile() {
  const filePath = path.join(process.cwd(), 'src/core/data-store.ts');
  
  if (!fs.existsSync(filePath)) {
    console.log(`⚠️  File not found: ${filePath}`);
    return false;
  }
  
  console.log('🔄 Updating src/core/data-store.ts...');
  createBackup(filePath);
  
  let content = fs.readFileSync(filePath, 'utf-8');
  
  // Replace initializeData default categories
  const oldInitializeCategories = `    const defaultCategories: Array<
      Omit<Category, "id" | "createdAt" | "updatedAt">
    > = [
      {
        name: "Gaming",
        slug: "gaming",
        description: "Tài khoản Gaming",
        isActive: true,
      },
      {
        name: "Social",
        slug: "social",
        description: "Tài khoản Social Media",
        isActive: true,
      },
      {
        name: "Productivity",
        slug: "productivity",
        description: "Tài khoản Productivity",
        isActive: true,
      },
      {
        name: "Chưa phân loại",
        slug: "uncategorized",
        description: "Danh mục mặc định",
        isActive: true,
      },
    ];`;

  const newInitializeCategories = `    const defaultCategories: Array<
      Omit<Category, "id" | "createdAt" | "updatedAt">
    > = [
      {
        name: "TikTok",
        slug: "tiktok",
        description: "Tài khoản TikTok",
        icon: "🎵",
        isActive: true,
      },
      {
        name: "Facebook",
        slug: "facebook", 
        description: "Tài khoản Facebook",
        icon: "📘",
        isActive: true,
      },
      {
        name: "Chưa phân loại",
        slug: "uncategorized",
        description: "Danh mục mặc định",
        icon: "🏷️",
        isActive: true,
      },
    ];`;
  
  content = content.replace(oldInitializeCategories, newInitializeCategories);
  
  // Replace ensureProductsLoaded default categories
  const oldEnsureCategories = `      const defaults: Array<Omit<Category, "id" | "createdAt" | "updatedAt">> =
        [
          {
            name: "Gaming",
            slug: "gaming",
            description: "Tài khoản Gaming",
            isActive: true,
          },
          {
            name: "Social",
            slug: "social",
            description: "Tài khoản Social Media",
            isActive: true,
          },
          {
            name: "Productivity",
            slug: "productivity",
            description: "Tài khoản Productivity",
            isActive: true,
          },
          {
            name: "Chưa phân loại",
            slug: "uncategorized",
            description: "Danh mục mặc định",
            isActive: true,
          },
        ];`;

  const newEnsureCategories = `      const defaults: Array<Omit<Category, "id" | "createdAt" | "updatedAt">> =
        [
          {
            name: "TikTok",
            slug: "tiktok",
            description: "Tài khoản TikTok",
            icon: "🎵",
            isActive: true,
          },
          {
            name: "Facebook",
            slug: "facebook",
            description: "Tài khoản Facebook", 
            icon: "📘",
            isActive: true,
          },
          {
            name: "Chưa phân loại",
            slug: "uncategorized",
            description: "Danh mục mặc định",
            icon: "🏷️",
            isActive: true,
          },
        ];`;
  
  content = content.replace(oldEnsureCategories, newEnsureCategories);
  
  fs.writeFileSync(filePath, content, 'utf-8');
  console.log('✅ Updated src/core/data-store.ts');
  return true;
}

function validateCodeChanges() {
  console.log('🔍 Validating code changes...');
  
  const filesToCheck = [
    'src/core/products.ts',
    'src/core/data-store.ts'
  ];
  
  let hasOldReferences = false;
  
  filesToCheck.forEach(relativePath => {
    const filePath = path.join(process.cwd(), relativePath);
    
    if (!fs.existsSync(filePath)) {
      return;
    }
    
    const content = fs.readFileSync(filePath, 'utf-8');
    
    OLD_CATEGORY_REFS.forEach(oldRef => {
      if (content.includes(`"${oldRef}"`)) {
        console.log(`❌ Found old reference "${oldRef}" in ${relativePath}`);
        hasOldReferences = true;
      }
    });
  });
  
  if (!hasOldReferences) {
    console.log('✅ No old category references found in code');
    return true;
  }
  
  return false;
}

// Main execution
async function main() {
  console.log('🚀 Starting code cleanup...');
  console.log('');
  
  try {
    // Update files
    updateProductsFile();
    updateDataStoreFile();
    console.log('');
    
    // Validate
    if (!validateCodeChanges()) {
      throw new Error('Validation failed - old references still exist');
    }
    console.log('');
    
    console.log('🎉 Code cleanup completed successfully!');
    console.log('');
    console.log('Files updated:');
    console.log('- src/core/products.ts');
    console.log('- src/core/data-store.ts');
    console.log('');
    console.log('Backup files created with .backup extension');
    console.log('You can delete them after testing');
    
  } catch (error) {
    console.error('❌ Code cleanup failed:', error.message);
    console.log('');
    console.log('🔄 To restore from backup:');
    console.log('1. Rename .backup files back to original names');
    console.log('2. Restart the application');
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  main();
}

module.exports = { main };
