/**
 * Master Cleanup Script
 * 
 * Orchestrates the complete category cleanup process:
 * 1. Data cleanup (categories and products)
 * 2. Code cleanup (remove old references)
 * 3. Validation and testing
 */

const { main: cleanupCategories } = require('./cleanup-categories');
const { main: cleanupCodeReferences } = require('./cleanup-code-references');

async function runFullCleanup() {
  console.log('🧹 CATEGORY CLEANUP - FULL PROCESS');
  console.log('=====================================');
  console.log('');
  console.log('This script will:');
  console.log('1. 📦 Create backups of all data and code files');
  console.log('2. 🗑️  Remove old categories (gaming, social, productivity)');
  console.log('3. ✅ Keep new categories (Tiktok, Facebook)');
  console.log('4. 🔄 Migrate products to appropriate new categories');
  console.log('5. 🔧 Update code references');
  console.log('6. ✅ Validate all changes');
  console.log('');
  
  // Confirmation prompt
  const readline = require('readline');
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });
  
  const answer = await new Promise(resolve => {
    rl.question('Do you want to proceed? (y/N): ', resolve);
  });
  rl.close();
  
  if (answer.toLowerCase() !== 'y' && answer.toLowerCase() !== 'yes') {
    console.log('❌ Cleanup cancelled by user');
    process.exit(0);
  }
  
  console.log('');
  console.log('🚀 Starting cleanup process...');
  console.log('');
  
  try {
    // Step 1: Data cleanup
    console.log('📊 STEP 1: DATA CLEANUP');
    console.log('========================');
    await cleanupCategories();
    console.log('');
    
    // Step 2: Code cleanup  
    console.log('🔧 STEP 2: CODE CLEANUP');
    console.log('========================');
    await cleanupCodeReferences();
    console.log('');
    
    // Step 3: Final summary
    console.log('🎉 CLEANUP COMPLETED SUCCESSFULLY!');
    console.log('===================================');
    console.log('');
    console.log('✅ What was done:');
    console.log('   - Removed old categories: gaming, social, productivity');
    console.log('   - Kept new categories: Tiktok, Facebook, uncategorized');
    console.log('   - Migrated products to new categories');
    console.log('   - Updated code references');
    console.log('   - Created backups of all changes');
    console.log('');
    console.log('🧪 NEXT STEPS - TESTING:');
    console.log('========================');
    console.log('1. 🔄 Restart your development server');
    console.log('2. 🌐 Open /products page');
    console.log('3. 🔍 Check CategorySidebar shows only new categories');
    console.log('4. 📊 Verify product counts are correct');
    console.log('5. 🎯 Test filtering by clicking categories');
    console.log('6. ⚙️  Test admin /admin/categories page');
    console.log('7. ✨ Test featured products functionality');
    console.log('');
    console.log('🔄 IF ISSUES OCCUR:');
    console.log('===================');
    console.log('1. Check console for errors');
    console.log('2. Restore from backup files:');
    console.log('   - .data-backup/ for data files');
    console.log('   - .backup files for code files');
    console.log('3. Report issues with specific error messages');
    console.log('');
    console.log('📁 BACKUP LOCATIONS:');
    console.log('====================');
    console.log('- Data: .data-backup/backup-[timestamp]/');
    console.log('- Code: *.backup files in src/core/');
    console.log('');
    console.log('🗑️  CLEANUP BACKUPS (after testing):');
    console.log('====================================');
    console.log('- Delete .data-backup/ directory');
    console.log('- Delete *.backup files');
    console.log('');
    
  } catch (error) {
    console.error('❌ CLEANUP FAILED:', error.message);
    console.log('');
    console.log('🔄 RECOVERY STEPS:');
    console.log('==================');
    console.log('1. Stop the application');
    console.log('2. Restore data files from .data-backup/');
    console.log('3. Restore code files from *.backup files');
    console.log('4. Restart the application');
    console.log('5. Report the error for investigation');
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  runFullCleanup();
}

module.exports = { runFullCleanup };
