import React from "react";
import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Navbar from "@/src/components/Navbar";
import Footer from "@/src/components/Footer";
import Loader from "@/src/components/Loader";
import Providers from "@/src/components/Providers";

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
  description: "Website bán tài khoản Việt Nam với layout Gumroad",
  icons: {
    icon: [
      { url: "/fav/favicon.svg", type: "image/svg+xml" },
      { url: "/fav/favicon-16x16.svg", sizes: "16x16", type: "image/svg+xml" },
      { url: "/fav/favicon-32x32.svg", sizes: "32x32", type: "image/svg+xml" },
    ],
    shortcut: "/fav/favicon.svg",
    apple: "/fav/favicon-32x32.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="vi" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <Providers>
          <Navbar />
          <main className="min-h-[calc(100dvh-9rem)]">
            <React.Suspense fallback={<Loader label="Đang tải nội dung..." />}>
              {children}
            </React.Suspense>
          </main>
          <Footer />
        </Providers>
      </body>
    </html>
  );
}
