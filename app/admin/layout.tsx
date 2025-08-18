import { ReactNode } from "react";
import { Metadata } from "next";
import { AdminAuthProvider } from "@/src/components/AdminAuthProvider";

export const metadata: Metadata = {
  title: "Quản trị hệ thống",
  description: "Dashboard quản trị hệ thống bán tài khoản game",
  robots: {
    index: false,
    follow: false,
  },
};

export default function AdminRootLayout({ children }: { children: ReactNode }) {
  return <AdminAuthProvider>{children}</AdminAuthProvider>;
}
