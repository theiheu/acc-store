"use client";

import Link from "next/link";
import { useEffect, useState, useRef } from "react";
import { loadUser, saveUser, type User } from "@/src/core/auth";
import { useToastContext } from "@/src/components/ToastProvider";

export default function AuthButton() {
  const [user, setUser] = useState<User | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    setUser(loadUser());
  }, []);

  function login() {
    const email = window.prompt("Nhập email để đăng nhập:", "you@example.com");
    if (!email) return;
    const u: User = { email };
    saveUser(u);
    setUser(u);
  }

  function logout() {
    saveUser(null);
    setUser(null);
    setOpen(false);
  }

  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      if (!open) return;
      const target = e.target as Node;
      if (menuRef.current && !menuRef.current.contains(target)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, [open]);

  const { show } = useToastContext();

  if (!mounted) return null;

  if (user) {
    const label = user.name || user.email;
    return (
      <div className="relative" ref={menuRef}>
        <button
          aria-haspopup="menu"
          aria-expanded={open}
          onClick={() => setOpen((v) => !v)}
          className="inline-flex items-center gap-2 text-sm px-3 py-1.5 rounded-md border border-gray-300 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800"
        >
          <span className="i-mdi-account-circle" aria-hidden />
          <span
            className={`transition-transform ${
              open ? "rotate-180" : "rotate-0"
            }`}
            aria-hidden
          >
            ▾
          </span>
        </button>

        {open && (
          <div
            role="menu"
            aria-label="Tài khoản"
            className="absolute right-0 mt-2 min-w-56 rounded-lg border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 shadow-lg p-1"
          >
            <Link
              href="/account"
              role="menuitem"
              tabIndex={0}
              onClick={() => setOpen(false)}
              className="flex items-center gap-2 px-3 py-2 rounded-md text-sm hover:bg-amber-50 dark:hover:bg-amber-300/10"
            >
              Thông tin tài khoản
            </Link>

            <button
              role="menuitem"
              tabIndex={0}
              onClick={() => {
                logout();
                show("Đã đăng xuất");
              }}
              className="w-full text-left flex items-center gap-2 px-3 py-2 rounded-md text-sm hover:bg-amber-50 dark:hover:bg-amber-300/10"
            >
              Đăng xuất
            </button>
          </div>
        )}
      </div>
    );
  }

  return (
    <a
      href="/login?next=/account"
      className="text-sm px-3 py-1.5 rounded bg-gray-900 text-white dark:bg-white dark:text-gray-900"
    >
      Đăng nhập
    </a>
  );
}
