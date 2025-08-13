"use client";

import { useState } from "react";
import { dataStore } from "@/src/core/data-store";
import { useToastContext } from "@/src/components/ToastProvider";

export default function TestLoginPage() {
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const { show } = useToastContext();

  const simulateNewUserLogin = () => {
    if (!email || !name) {
      show("Vui lòng nhập email và tên", "error");
      return;
    }

    try {
      // Check if user already exists
      const existingUser = dataStore.getUserByEmail(email);
      
      if (existingUser) {
        // Update last login time
        dataStore.updateUser(existingUser.id, {
          lastLoginAt: new Date(),
        });
        show(`Người dùng ${name} đã đăng nhập lại`, "info");
      } else {
        // Create new user
        const newUser = dataStore.createUser({
          email,
          name,
          role: "user",
          status: "active",
          balance: 0,
          totalOrders: 0,
          totalSpent: 0,
          registrationSource: "google",
        });
        
        show(`Người dùng mới ${name} đã được tạo!`, "success");
        console.log("New user created:", newUser);
      }
      
      // Clear form
      setEmail("");
      setName("");
    } catch (error) {
      console.error("Error simulating login:", error);
      show("Có lỗi xảy ra", "error");
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-12">
      <div className="max-w-md mx-auto">
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
          <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-6">
            🧪 Test New User Login
          </h1>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 dark:bg-gray-700 dark:text-gray-100"
                placeholder="user@example.com"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Tên
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 dark:bg-gray-700 dark:text-gray-100"
                placeholder="Nguyễn Văn A"
              />
            </div>
            
            <button
              onClick={simulateNewUserLogin}
              className="w-full bg-amber-600 hover:bg-amber-700 text-white font-medium py-2 px-4 rounded-lg transition-colors"
            >
              Mô phỏng đăng nhập mới
            </button>
          </div>
          
          <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-300/10 rounded-lg">
            <h3 className="font-medium text-blue-900 dark:text-blue-100 mb-2">
              📋 Hướng dẫn test:
            </h3>
            <ol className="text-sm text-blue-800 dark:text-blue-200 space-y-1">
              <li>1. Mở trang admin (/admin) ở tab khác</li>
              <li>2. Nhập email và tên ở đây</li>
              <li>3. Nhấn "Mô phỏng đăng nhập mới"</li>
              <li>4. Kiểm tra tab admin - user mới sẽ xuất hiện ngay lập tức</li>
              <li>5. Số liệu thống kê cũng sẽ cập nhật tự động</li>
            </ol>
          </div>
          
          <div className="mt-4 p-4 bg-amber-50 dark:bg-amber-300/10 rounded-lg">
            <h3 className="font-medium text-amber-900 dark:text-amber-100 mb-2">
              ⚡ Real-time Features:
            </h3>
            <ul className="text-sm text-amber-800 dark:text-amber-200 space-y-1">
              <li>• Người dùng mới xuất hiện ngay trong admin</li>
              <li>• Thống kê tổng số user cập nhật tự động</li>
              <li>• Danh sách "Người dùng mới" cập nhật real-time</li>
              <li>• Không cần refresh trang</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
