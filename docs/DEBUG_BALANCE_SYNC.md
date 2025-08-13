# Debug Balance Sync Issues

## 🐛 Problem
Sau khi nạp tiền thủ công tại trang admin, user tại trang chủ vẫn chưa được cập nhật số tiền và lịch sử giao dịch.

## 🔍 Debug Steps

### Step 1: Check Debug Page
1. Mở trang debug: `http://localhost:3000/debug-balance`
2. Đăng nhập với tài khoản Google
3. Click "Test Direct DataStore" để kiểm tra user có tồn tại không
4. Click "Refresh Debug Info" để xem thông tin chi tiết

### Step 2: Check Browser Console
Mở Developer Tools (F12) và kiểm tra console logs:

**Expected logs khi nạp tiền:**
```
=== Debug DataStore ===
Session email: your-email@gmail.com
=== All Users in DataStore ===
ID: user-xxx, Email: your-email@gmail.com, Name: Your Name, Balance: 0
=== End User List ===

Updating user balance: {userId: "user-xxx", userEmail: "your-email@gmail.com", oldBalance: 0, newBalance: 100000, amount: 100000}
User updated: success
Transaction created: {transactionId: "tx-xxx", userId: "user-xxx", amount: 100000, type: "credit"}

SSE: Broadcasting event: USER_BALANCE_CHANGED {userId: "user-xxx", newBalance: 100000}
SSE: Broadcasting balance change: {userId: "user-xxx", newBalance: 100000}
SSE: Broadcasting transaction creation: {id: "tx-xxx", userId: "user-xxx", amount: 100000}

Balance updated event received: {userId: "user-xxx", newBalance: 100000}
Updating current user balance: your-email@gmail.com new balance: 100000
```

### Step 3: Common Issues & Solutions

#### Issue 1: User không tồn tại trong DataStore
**Symptoms**: Console shows "❌ User not found in dataStore!"

**Solution**: User chưa được tạo trong DataStore khi đăng nhập
```typescript
// Check auth.ts signIn callback
async signIn({ user, account, profile }) {
  if (user.email && user.name) {
    const existingUser = dataStore.getUserByEmail(user.email);
    if (!existingUser) {
      const newUser = dataStore.createUser({
        email: user.email,
        name: user.name,
        // ... other fields
      });
    }
  }
}
```

#### Issue 2: SSE Connection không hoạt động
**Symptoms**: Console không có logs "SSE: Broadcasting..."

**Solutions**:
1. Kiểm tra Network tab có connection `/api/events` không
2. Kiểm tra EventSource connection status
3. Restart development server

#### Issue 3: User ID không khớp
**Symptoms**: Console shows "Current user ID mismatch"

**Solution**: Kiểm tra user ID trong admin và homepage có giống nhau không
```typescript
// In admin, check user ID when updating
console.log('Admin updating user ID:', userId);

// In homepage, check current user ID
console.log('Homepage current user ID:', currentUser?.id);
```

#### Issue 4: DataSyncProvider không cập nhật
**Symptoms**: Balance không thay đổi trên UI dù có events

**Solution**: Kiểm tra DataSyncProvider có nhận events không
```typescript
// Check if events are received
onBalanceUpdated: (data) => {
  console.log('Balance updated event received:', data);
  // Should update UI here
}
```

### Step 4: Manual Testing Procedure

1. **Preparation**:
   - Mở admin dashboard: `http://localhost:3000/admin`
   - Mở debug page: `http://localhost:3000/debug-balance`
   - Mở browser console (F12)

2. **Test User Creation**:
   - Đăng nhập với Google account mới
   - Kiểm tra console có log "New user created" không
   - Kiểm tra admin dashboard có user mới không

3. **Test Balance Update**:
   - Trong admin: Tìm user và click "Top Up"
   - Nhập số tiền (ví dụ: 100000)
   - Click "Add Credits"
   - Kiểm tra console có logs như trên không
   - Kiểm tra debug page có cập nhật balance không

4. **Test Real-time Sync**:
   - Mở account page: `http://localhost:3000/account`
   - Thực hiện top-up từ admin
   - Kiểm tra balance có cập nhật ngay lập tức không
   - Kiểm tra transaction history có xuất hiện không

### Step 5: Fix Common Issues

#### Fix 1: Ensure User Creation on Login
```typescript
// In auth.ts
async signIn({ user, account, profile }) {
  try {
    if (user.email && user.name) {
      const existingUser = dataStore.getUserByEmail(user.email);
      if (!existingUser) {
        const newUser = dataStore.createUser({
          email: user.email,
          name: user.name,
          role: "user",
          status: "active",
          balance: 0,
          totalOrders: 0,
          totalSpent: 0,
          registrationSource: account?.provider || "unknown",
        });
        console.log("New user created:", newUser.email);
      }
    }
    return true;
  } catch (error) {
    console.error("Error in signIn callback:", error);
    return true; // Don't block login
  }
}
```

#### Fix 2: Ensure SSE Connection
```typescript
// Check if EventSource is working
const eventSource = new EventSource('/api/events');
eventSource.onopen = () => console.log('SSE connected');
eventSource.onerror = (error) => console.error('SSE error:', error);
```

#### Fix 3: Force Data Refresh
```typescript
// In DataSyncProvider, force refresh after events
onBalanceUpdated: (data) => {
  // Force refresh all data
  setUsers(dataStore.getUsers());
  setTransactions(dataStore.getTransactions());
  
  // Update current user
  if (currentUserEmail) {
    const updatedUser = dataStore.getPublicUser(currentUserEmail);
    setCurrentUser(updatedUser);
  }
  
  setLastUpdate(new Date());
}
```

### Step 6: Verification Checklist

- [ ] User được tạo khi đăng nhập (check console log)
- [ ] User xuất hiện trong admin dashboard
- [ ] SSE connection hoạt động (check Network tab)
- [ ] Balance update events được broadcast (check console)
- [ ] DataSyncProvider nhận được events (check console)
- [ ] UI cập nhật balance và transactions
- [ ] Real-time sync hoạt động across tabs

### Step 7: Production Considerations

1. **Remove Debug Logs**: Xóa tất cả console.log trước khi deploy
2. **Error Handling**: Thêm proper error handling cho SSE
3. **Reconnection**: Implement SSE reconnection logic
4. **Performance**: Optimize event broadcasting for many users

## 🎯 Expected Behavior

Sau khi fix:
- ✅ User đăng nhập → Xuất hiện ngay trong admin
- ✅ Admin nạp tiền → Balance cập nhật ngay lập tức
- ✅ Transaction history cập nhật real-time
- ✅ Không cần refresh page
- ✅ Hoạt động across multiple tabs/browsers
