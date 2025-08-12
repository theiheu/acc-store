# Admin Dashboard Setup Guide

## Prerequisites

Before setting up the admin dashboard, ensure you have:

- Node.js 18+ installed
- Next.js 15+ project setup
- NextAuth.js configured
- Admin user credentials

## Installation

The admin dashboard is already integrated into the existing project. No additional installation is required.

## Configuration

### 1. Environment Variables

Add the following environment variables to your `.env.local` file:

```env
# NextAuth Configuration (if not already set)
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-secret-key

# OAuth Providers (if not already set)
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
FACEBOOK_CLIENT_ID=your-facebook-client-id
FACEBOOK_CLIENT_SECRET=your-facebook-client-secret
```

### 2. Admin User Setup

Currently, the system uses a mock admin user. To set up your admin account:

1. Update the `MOCK_ADMINS` array in `src/core/admin-auth.ts`:

```typescript
const MOCK_ADMINS: AdminProfile[] = [
  {
    id: "admin-1",
    email: "acevn236@gmail.com", // Replace with your email
    name: "Fi Acc",
    role: "admin",
    permissions: DEFAULT_ADMIN_PERMISSIONS,
    createdAt: new Date("2024-01-01"),
    lastLoginAt: new Date(),
    isActive: true,
  },
];
```

2. Make sure your OAuth provider account uses the same email address.

### 3. Database Integration (Future)

The current implementation uses mock data. To integrate with a real database:

1. Replace mock data in API routes with database queries
2. Update authentication to check admin status from database
3. Implement proper user and product models
4. Add transaction logging to database

## File Structure

```
src/
├── components/
│   ├── AdminAuthProvider.tsx     # Admin authentication context
│   ├── AdminLayout.tsx           # Main admin layout
│   └── AdminSidebar.tsx          # Navigation sidebar
├── core/
│   ├── admin.ts                  # Admin types and utilities
│   ├── admin-auth.ts             # Admin authentication logic
│   └── admin.test.ts             # Admin tests
└── utils/
    ├── validation.ts             # Input validation utilities
    └── validation.test.ts        # Validation tests

app/
├── admin/
│   ├── layout.tsx                # Admin root layout
│   ├── page.tsx                  # Dashboard overview
│   ├── users/
│   │   ├── page.tsx              # User management
│   │   └── [id]/page.tsx         # User details
│   ├── products/
│   │   ├── page.tsx              # Product management
│   │   ├── create/page.tsx       # Create product
│   │   └── [id]/page.tsx         # Edit product
│   └── audit/
│       └── page.tsx              # Audit logs
└── api/admin/
    ├── dashboard/route.ts        # Dashboard API
    ├── users/
    │   ├── route.ts              # Users API
    │   └── [id]/
    │       ├── route.ts          # User details API
    │       └── topup/route.ts    # User top-up API
    └── products/
        ├── route.ts              # Products API
        └── [id]/route.ts         # Product details API

docs/
├── ADMIN_DASHBOARD.md            # User documentation
└── ADMIN_SETUP.md                # This setup guide
```

## Running the Application

1. Start the development server:

```bash
npm run dev
```

2. Navigate to `http://localhost:3000/admin`

3. Log in with your configured admin account

4. You should see the admin dashboard

## Testing

Run the admin tests:

```bash
# Run all tests
npm test

# Run specific test files
npm test admin.test.ts
npm test validation.test.ts

# Run tests in watch mode
npm test -- --watch
```

## Security Considerations

### Production Deployment

Before deploying to production:

1. **Replace Mock Data**: Implement real database integration
2. **Secure Admin Routes**: Add proper middleware protection
3. **Environment Variables**: Use secure environment variable management
4. **HTTPS**: Ensure all admin routes use HTTPS
5. **Rate Limiting**: Implement rate limiting on admin APIs
6. **Audit Logging**: Store audit logs in secure, tamper-proof storage

### Admin Account Security

1. **Strong Passwords**: Require strong passwords for admin accounts
2. **Two-Factor Authentication**: Implement 2FA for admin accounts
3. **Session Management**: Configure secure session timeouts
4. **IP Restrictions**: Consider IP whitelisting for admin access
5. **Regular Audits**: Review admin actions regularly

## Customization

### Adding New Admin Permissions

1. Update the `AdminPermissions` interface in `src/core/admin.ts`:

```typescript
export interface AdminPermissions {
  // Existing permissions...
  canManageSettings: boolean; // New permission
}
```

2. Update `DEFAULT_ADMIN_PERMISSIONS`:

```typescript
export const DEFAULT_ADMIN_PERMISSIONS: AdminPermissions = {
  // Existing permissions...
  canManageSettings: false, // Default value
};
```

3. Use the permission in components:

```tsx
<AdminPermissionGate permission="canManageSettings">
  <SettingsButton />
</AdminPermissionGate>
```

### Adding New Admin Pages

1. Create the page component in `app/admin/your-page/page.tsx`
2. Add navigation item to `AdminSidebar.tsx`
3. Create API routes if needed in `app/api/admin/your-endpoint/`
4. Add appropriate permission checks

### Customizing the UI

The admin dashboard uses Tailwind CSS and follows the existing design system:

- **Colors**: Amber primary, gray neutrals
- **Components**: Consistent with main site
- **Dark Mode**: Automatic support
- **Responsive**: Mobile-first design

## Troubleshooting

### Common Issues

**"Admin access required" error**

- Check that your email is in the `MOCK_ADMINS` array
- Verify you're logged in with the correct OAuth account
- Clear browser cache and cookies

**API endpoints returning 404**

- Ensure the development server is running
- Check that API routes are in the correct directory structure
- Verify the request URLs match the route files

**TypeScript errors**

- Run `npm run type-check` to see all TypeScript errors
- Ensure all imports are correct
- Check that types are properly exported/imported

**Tests failing**

- Run `npm test` to see specific test failures
- Check that mock data matches expected types
- Verify test imports are correct

### Debug Mode

To enable debug logging, add to your `.env.local`:

```env
DEBUG=admin:*
```

This will log admin-related operations to the console.

## Migration from Mock Data

When ready to move from mock data to a real database:

1. **Choose a Database**: PostgreSQL, MySQL, or MongoDB
2. **Set up ORM**: Prisma, TypeORM, or Mongoose
3. **Create Schemas**: User, Product, Order, Transaction tables
4. **Update API Routes**: Replace mock data with database queries
5. **Add Migrations**: Create database migration scripts
6. **Update Tests**: Mock database calls in tests

Example Prisma schema:

```prisma
model User {
  id        String   @id @default(cuid())
  email     String   @unique
  name      String?
  role      Role     @default(USER)
  status    Status   @default(ACTIVE)
  balance   Int      @default(0)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}

enum Role {
  USER
  ADMIN
}

enum Status {
  ACTIVE
  SUSPENDED
  BANNED
}
```

## Support

For technical support:

1. Check the documentation first
2. Review the troubleshooting section
3. Check GitHub issues for similar problems
4. Contact the development team with:
   - Error messages
   - Browser console logs
   - Steps to reproduce the issue
