# Admin Dashboard Documentation

## Overview

The Admin Dashboard is a comprehensive management system for the ACC Store website, providing administrators with tools to manage users, products, orders, and system analytics.

## Features

### 1. Dashboard Overview
- **Summary Statistics**: Total users, products, orders, and revenue
- **Recent Activity Feed**: Real-time view of admin actions
- **Quick Action Buttons**: Fast access to common tasks
- **Data Visualization**: Charts for key metrics

### 2. User Management
- **User Listing**: Search, filter, and paginate through users
- **User Details**: View comprehensive user information
- **Credit Management**: Add/remove credits from user accounts
- **Account Status**: Activate, suspend, or ban user accounts
- **Transaction History**: View user's financial transactions

### 3. Product Management
- **Product Catalog**: Manage all products with search and filtering
- **Product Creation**: Add new products with detailed information
- **Product Editing**: Update existing product details
- **Inventory Management**: Track stock levels and sales
- **Bulk Operations**: Perform actions on multiple products

### 4. Security & Audit
- **Admin Authentication**: Role-based access control
- **Audit Logging**: Track all admin actions
- **Input Validation**: Prevent malicious input
- **Rate Limiting**: Protect against abuse

## Getting Started

### Prerequisites
- Admin account with appropriate permissions
- Access to the admin panel at `/admin`

### First Time Setup
1. Ensure you have admin privileges
2. Navigate to `/admin` in your browser
3. Log in with your admin credentials
4. You'll be redirected to the dashboard overview

## User Interface

### Navigation
The admin panel uses a sidebar navigation with the following sections:
- **Tổng quan** (Dashboard): Main overview page
- **Quản lý người dùng** (Users): User management
- **Quản lý sản phẩm** (Products): Product management
- **Quản lý đơn hàng** (Orders): Order management
- **Thống kê & Báo cáo** (Analytics): Reports and analytics
- **Nhật ký hoạt động** (Audit): Activity logs
- **Cài đặt hệ thống** (Settings): System settings

### Global Features
- **Global Loading Overlay**: Shows during async operations
- **Toast Notifications**: Success/error messages
- **Responsive Design**: Works on desktop and mobile
- **Dark Mode Support**: Follows system theme

## API Endpoints

### Dashboard
- `GET /api/admin/dashboard` - Get dashboard statistics
- `POST /api/admin/dashboard` - Get chart data

### User Management
- `GET /api/admin/users` - List users with pagination and filters
- `POST /api/admin/users` - Create new user
- `GET /api/admin/users/[id]` - Get user details
- `PUT /api/admin/users/[id]` - Update user
- `DELETE /api/admin/users/[id]` - Delete user
- `POST /api/admin/users/[id]/topup` - Add credits to user
- `GET /api/admin/users/[id]/topup` - Get user transactions

### Product Management
- `GET /api/admin/products` - List products with pagination and filters
- `POST /api/admin/products` - Create new product
- `GET /api/admin/products/[id]` - Get product details
- `PUT /api/admin/products/[id]` - Update product
- `DELETE /api/admin/products/[id]` - Delete product
- `PATCH /api/admin/products/[id]` - Quick updates (stock, status)

## Security

### Authentication
- Uses NextAuth.js for session management
- Admin role verification on all endpoints
- Session-based authentication

### Authorization
- Permission-based access control
- Different permission levels for different actions
- Admin profile with specific permissions

### Input Validation
- Server-side validation for all inputs
- Sanitization to prevent XSS and SQL injection
- Rate limiting to prevent abuse
- Amount limits for financial operations

### Audit Logging
- All admin actions are logged
- Includes timestamp, admin ID, action type, and metadata
- IP address and user agent tracking
- Searchable and filterable logs

## Common Tasks

### Adding Credits to User Account
1. Go to **Quản lý người dùng** (Users)
2. Find the user and click **Nạp tiền** (Top-up)
3. Enter amount and description
4. Click **Nạp tiền** to confirm
5. Transaction will be logged in audit trail

### Creating a New Product
1. Go to **Quản lý sản phẩm** (Products)
2. Click **Thêm sản phẩm** (Add Product)
3. Fill in product details:
   - Name and description
   - Price and category
   - Stock quantity
   - Images and settings
4. Click **Tạo sản phẩm** (Create Product)

### Managing User Status
1. Go to **Quản lý người dùng** (Users)
2. Find the user in the list
3. Use action buttons to:
   - **Khóa** (Suspend): Temporarily disable account
   - **Mở khóa** (Activate): Re-enable account
   - **Cấm vĩnh viễn** (Ban): Permanently disable

### Viewing Audit Logs
1. Go to **Nhật ký hoạt động** (Audit)
2. Use filters to narrow down results:
   - Action type (user, product, order)
   - Target type (user, product, system)
3. Click on entries to view detailed metadata

## Troubleshooting

### Common Issues

**Cannot access admin panel**
- Verify you have admin role in the system
- Check if your account is active
- Clear browser cache and cookies

**API requests failing**
- Check network connectivity
- Verify admin session is still valid
- Look for error messages in browser console

**Data not loading**
- Check if backend services are running
- Verify API endpoints are accessible
- Look for CORS issues in browser console

### Error Messages

**"Admin access required"**
- Your account doesn't have admin privileges
- Contact system administrator

**"Authentication required"**
- Your session has expired
- Log out and log back in

**"Permission denied"**
- Your admin account lacks specific permissions
- Contact system administrator to update permissions

## Best Practices

### Security
- Always log out when finished
- Don't share admin credentials
- Use strong, unique passwords
- Monitor audit logs regularly

### Data Management
- Verify user information before making changes
- Always provide clear descriptions for financial transactions
- Keep product information up to date
- Regularly review and clean up inactive accounts

### Performance
- Use filters to limit large data sets
- Avoid bulk operations during peak hours
- Monitor system performance after major changes

## Support

For technical support or questions about the admin dashboard:
1. Check this documentation first
2. Review audit logs for error patterns
3. Contact the development team with specific error messages
4. Include browser console logs when reporting issues

## Changelog

### Version 1.0.0
- Initial admin dashboard implementation
- User management with credit top-up
- Product management with inventory tracking
- Dashboard overview with statistics
- Audit logging and security features
- Responsive design with dark mode support
