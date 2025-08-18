# Category Cleanup Scripts

## Overview

These scripts safely remove old categories and migrate the system to use only new categories.

## Problem

The system currently has two sets of categories causing confusion:
- **Old categories**: gaming, social, productivity (hardcoded, inconsistent)
- **New categories**: Tiktok, Facebook (user-created, with featured products)

## Solution

Complete cleanup process that:
1. 🗑️ Removes old categories from database
2. 🔄 Migrates products to appropriate new categories  
3. 🔧 Updates code references
4. ✅ Validates all changes
5. 📦 Creates backups for safety

## Quick Start

```bash
# Run complete cleanup (recommended)
npm run cleanup:categories

# Or run individual steps
npm run cleanup:data-only    # Only data cleanup
npm run cleanup:code-only    # Only code cleanup
```

## What Gets Changed

### Data Changes (.data/ directory)
- **categories.json**: Removes old categories, keeps new ones
- **products.json**: Updates product categories to new slugs

### Code Changes
- **src/core/products.ts**: Updates CategoryId type and CATEGORIES array
- **src/core/data-store.ts**: Updates default categories in initialization

### Migration Rules
- `gaming` products → `uncategorized`
- `social` products → `tiktok` 
- `productivity` products → `uncategorized`

## Safety Features

### Automatic Backups
- **Data backups**: `.data-backup/backup-[timestamp]/`
- **Code backups**: `*.backup` files in source directories

### Validation
- Verifies no old categories remain
- Checks no products reference old categories
- Validates data integrity

### Recovery
If issues occur, restore from backups:
```bash
# Stop application
# Copy backup files back to original locations
# Restart application
```

## Testing Checklist

After running cleanup, test these areas:

### Frontend Testing
- [ ] `/products` page loads without errors
- [ ] CategorySidebar shows only new categories (Tiktok, Facebook, Chưa phân loại)
- [ ] Product counts are correct in sidebar
- [ ] Clicking categories filters products correctly
- [ ] Search functionality works
- [ ] Featured products display properly

### Admin Testing  
- [ ] `/admin/categories` page loads
- [ ] Only new categories are listed
- [ ] Can edit categories and featured products
- [ ] Can create new categories
- [ ] Product management works correctly

### Console Testing
- [ ] No JavaScript errors in browser console
- [ ] No 404 errors for missing categories
- [ ] API endpoints return correct data

## File Structure

```
scripts/
├── README.md                    # This file
├── run-cleanup.js              # Main orchestrator script
├── cleanup-categories.js       # Data cleanup (categories + products)
├── cleanup-code-references.js  # Code cleanup (remove old refs)
└── package.json                # Added npm scripts
```

## Script Details

### run-cleanup.js
- Interactive confirmation prompt
- Runs both data and code cleanup
- Comprehensive logging and error handling
- Detailed next steps instructions

### cleanup-categories.js
- Creates timestamped backups
- Removes old categories safely
- Migrates products to new categories
- Ensures uncategorized category exists
- Validates data integrity

### cleanup-code-references.js  
- Updates TypeScript types
- Replaces hardcoded category arrays
- Updates default category initialization
- Validates no old references remain

## Troubleshooting

### Common Issues

**"Categories not loading"**
- Check `.data/categories.json` exists and is valid JSON
- Verify DataSyncProvider is working
- Check browser console for errors

**"Products not filtering correctly"**
- Verify product categories match category slugs
- Check slugify function is working
- Validate category migration completed

**"Featured products missing"**
- Check category featuredProductIds arrays
- Verify product IDs are correct
- Test FeaturedProductsSelector component

### Recovery Steps

1. **Stop the application**
2. **Restore data files**:
   ```bash
   cp .data-backup/backup-[timestamp]/* .data/
   ```
3. **Restore code files**:
   ```bash
   mv src/core/products.ts.backup src/core/products.ts
   mv src/core/data-store.ts.backup src/core/data-store.ts
   ```
4. **Restart application**

## Support

If you encounter issues:
1. Check the console logs for specific error messages
2. Verify backup files exist before cleanup
3. Test individual components in isolation
4. Report issues with full error details and steps to reproduce

## Cleanup After Success

Once everything is working correctly:
```bash
# Remove backup directories
rm -rf .data-backup/

# Remove backup files  
rm src/core/*.backup
```
