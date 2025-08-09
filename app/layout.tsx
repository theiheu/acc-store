import React from "react";
import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Navbar from "@/src/components/Navbar";
import Footer from "@/src/components/Footer";
import ToastProvider from "@/src/components/ToastProvider";
import Loader from "@/src/components/Loader";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "ACC Store",
  description: "Website bán tài khoản với layout Gumroad",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="vi">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <ToastProvider>
          <Navbar />
          <main className="min-h-[calc(100dvh-7rem)]">
            <React.Suspense fallback={<Loader label="Đang tải nội dung..." />}>
              {children}
            </React.Suspense>
          </main>
          <Footer />
        </ToastProvider>
      </body>
    </html>
  );
}
