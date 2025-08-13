# Troubleshooting Guide

## Common Error: "Unexpected token '<', "<!DOCTYPE "... is not valid JSON"

This error occurs when an API endpoint returns HTML instead of JSON. Here's how to diagnose and fix it:

### 🔍 Diagnosis Steps

1. **Check Browser Console**
   - Open browser developer tools (F12)
   - Go to Console tab
   - Look for detailed error messages
   - Check Network tab for failed requests

2. **Verify API Endpoint Response**
   - In Network tab, find the failing API request
   - Click on the request to see the response
   - If you see HTML instead of JSON, the endpoint has an error

3. **Check Authentication**
   - Ensure you're logged in with an admin account
   - Verify your email is listed in `src/core/admin-auth.ts` MOCK_ADMINS array
   - Check if session is valid

### 🛠️ Common Fixes

#### Fix 1: Update Admin Email
```typescript
// In src/core/admin-auth.ts
const MOCK_ADMINS: AdminProfile[] = [
  {
    id: "admin-1",
    email: "YOUR_EMAIL_HERE@gmail.com", // ← Update this
    name: "Your Name",
    role: "admin",
    permissions: DEFAULT_ADMIN_PERMISSIONS,
    createdAt: new Date("2024-01-01"),
    lastLoginAt: new Date(),
    isActive: true,
  },
];
```

#### Fix 2: Check Environment Variables
```bash
# Make sure these are set in .env.local
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
NEXTAUTH_SECRET=your_nextauth_secret
NEXTAUTH_URL=http://localhost:3000
```

#### Fix 3: Clear Browser Data
1. Clear cookies and local storage
2. Hard refresh (Ctrl+Shift+R)
3. Try incognito/private browsing mode

#### Fix 4: Restart Development Server
```bash
# Stop the server (Ctrl+C) and restart
npm run dev
```

### 🧪 Testing API Endpoints

Run the test script to check all endpoints:
```bash
node scripts/test-api.js
```

Or test individual endpoints manually:

#### Test Dashboard API
```bash
curl -X GET http://localhost:3000/api/admin/dashboard \
  -H "Content-Type: application/json"
```

#### Test Users API
```bash
curl -X GET http://localhost:3000/api/admin/users \
  -H "Content-Type: application/json"
```

#### Test Products API
```bash
curl -X GET http://localhost:3000/api/admin/products \
  -H "Content-Type: application/json"
```

### 🔧 Debug Mode

Add this to your admin page to see detailed error information:

```typescript
// In app/admin/page.tsx, add this to fetchDashboardStats:
console.log('Fetching dashboard stats...');
const response = await fetch("/api/admin/dashboard");
console.log('Response status:', response.status);
console.log('Response headers:', Object.fromEntries(response.headers.entries()));

if (!response.ok) {
  const text = await response.text();
  console.log('Error response body:', text);
  return;
}
```

### 🚨 Emergency Fixes

If you're still getting errors, try these emergency fixes:

#### Option 1: Disable Real-time Features Temporarily
```typescript
// In src/components/DataSyncProvider.tsx
// Comment out the useRealtimeUpdates call:
// const { isConnected } = useRealtimeUpdates({...});

// Use static data instead:
const isConnected = false;
```

#### Option 2: Use Fallback Data
```typescript
// In admin dashboard, add fallback data:
const fallbackStats = {
  totalUsers: 0,
  activeUsers: 0,
  totalProducts: 0,
  activeProducts: 0,
  totalOrders: 0,
  pendingOrders: 0,
  totalRevenue: 0,
  monthlyRevenue: 0,
  averageOrderValue: 0,
  topSellingProducts: [],
  recentActivity: [],
};

// Use fallback if API fails:
setStats(result.data || fallbackStats);
```

### 📋 Checklist for Admin Access

- [ ] Logged in with Google/Facebook account
- [ ] Email matches admin email in `src/core/admin-auth.ts`
- [ ] Development server is running on port 3000
- [ ] No console errors related to authentication
- [ ] Network tab shows successful API requests
- [ ] Browser cookies are not blocked

### 🔄 Real-time Features Checklist

- [ ] SSE endpoint `/api/events` returns `text/event-stream`
- [ ] EventSource connection established in browser
- [ ] Green connection indicator visible on account page
- [ ] Changes in admin panel trigger events
- [ ] Other tabs receive updates without refresh

### 📞 Getting Help

If you're still experiencing issues:

1. **Check the browser console** for specific error messages
2. **Run the test script** to identify which endpoints are failing
3. **Verify your admin email** is correctly configured
4. **Try the emergency fixes** above to isolate the problem
5. **Check the Network tab** to see exactly what the API is returning

### 🎯 Quick Test Procedure

1. Open admin dashboard (`/admin`)
2. Open browser console (F12)
3. Look for any red error messages
4. If you see the JSON parsing error:
   - Check Network tab for the failing request
   - Look at the response body
   - Follow the fixes above based on what you see

The most common cause is authentication issues - make sure your email is in the MOCK_ADMINS array and you're logged in with that account.
