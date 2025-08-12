import { ReactNode } from "react";
import { AdminAuthProvider } from "@/src/components/AdminAuthProvider";

export default function AdminRootLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <AdminAuthProvider>
      {children}
    </AdminAuthProvider>
  );
}
