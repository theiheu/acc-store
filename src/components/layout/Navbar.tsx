"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import AuthButton from "@/src/components/common/AuthButton";
import { AccStoreLogo } from "@/src/components/branding";

// Shared link styles
const linkBase =
  "px-3 py-1.5 rounded-md text-sm font-medium transition-colors duration-200 focus:outline-none focus-visible:ring-2 ring-amber-300";
const linkIdle =
  "text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-amber-50/70 dark:hover:bg-amber-300/10";
const linkActive =
  "text-gray-900 dark:text-white bg-amber-50 border border-amber-200 dark:bg-amber-300/10 dark:border-amber-300/30";

// Reusable nav link with underline animation
function NavLink({
  href,
  active,
  children,
  onClick,
  className = "",
}: {
  href: any;
  active?: boolean;
  children: React.ReactNode;
  onClick?: () => void;
  className?: string;
}) {
  const classes = `${linkBase} ${
    active ? linkActive : linkIdle
  } group ${className}`;
  return (
    <Link href={href} onClick={onClick} className={classes}>
      <span className="relative inline-block">
        <span>{children}</span>
        <span
          className={`pointer-events-none absolute left-0 -bottom-0.5 h-0.5 w-full rounded-full bg-amber-400 transition-transform duration-200 origin-left ${
            active ? "scale-x-100" : "scale-x-0"
          } group-hover:scale-x-100`}
        />
      </span>
    </Link>
  );
}

export default function Navbar() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  const isHome = pathname === "/";
  const isProducts = pathname?.startsWith("/products");

  return (
    <header className="sticky top-0 z-40 border-b border-gray-200 dark:border-gray-800 bg-white/70 dark:bg-gray-950/70 backdrop-blur supports-[backdrop-filter]:bg-white/60 supports-[backdrop-filter]:dark:bg-gray-950/60 shadow-sm transition-shadow duration-200 hover:shadow-md">
      <div className="mx-auto max-w-5xl px-4 h-22 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="inline-flex items-center group relative">
          <AccStoreLogo variant="horizontal" size="xl" />
          <span
            className={`pointer-events-none absolute left-0 -bottom-1 h-0.5 w-full rounded-full bg-amber-400 transition-transform duration-200 origin-left ${
              isHome ? "scale-x-100" : "scale-x-0"
            } group-hover:scale-x-100`}
          />
        </Link>

        {/* Desktop left links */}
        <nav className="hidden md:flex items-center gap-2 ml-3">
          <NavLink href="/" active={isHome}>
            Trang chủ
          </NavLink>
          <NavLink href="/products" active={isProducts}>
            Sản phẩm
          </NavLink>
        </nav>

        {/* Desktop right (actions) */}
        <nav className="hidden md:flex items-center gap-2">
          <NavLink href="/deposit" active={pathname === "/deposit"}>
            Nạp tiền
          </NavLink>
          <div className="ml-2">
            <AuthButton />
          </div>
        </nav>

        {/* Mobile controls */}
        <button
          aria-label="Toggle menu"
          aria-expanded={open}
          onClick={() => setOpen((v) => !v)}
          className="md:hidden inline-flex h-9 w-9 items-center justify-center rounded-md border border-gray-300 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
        >
          <span className="relative block w-4">
            <span
              className={`absolute left-0 block h-0.5 w-4 bg-current transition-all ${
                open ? "top-2 rotate-45" : "top-1"
              }`}
            />
            <span
              className={`absolute left-0 block h-0.5 w-4 bg-current transition-all ${
                open ? "opacity-0" : "top-2"
              }`}
            />
            <span
              className={`absolute left-0 block h-0.5 w-4 bg-current transition-all ${
                open ? "top-2 -rotate-45" : "top-3"
              }`}
            />
          </span>
        </button>
      </div>

      {/* Mobile panel */}
      {open && (
        <div className="md:hidden border-t border-gray-200 dark:border-gray-800 bg-white/95 dark:bg-gray-950/95 backdrop-blur px-4 pb-4 shadow-sm">
          <div className="py-3 flex flex-col gap-2">
            <NavLink href="/" active={isHome} onClick={() => setOpen(false)}>
              Trang chủ
            </NavLink>
            <NavLink
              href="/products"
              active={isProducts}
              onClick={() => setOpen(false)}
            >
              Sản phẩm
            </NavLink>
            <NavLink
              href="/deposit"
              active={pathname === "/deposit"}
              onClick={() => setOpen(false)}
            >
              Nạp tiền
            </NavLink>
            <div className="pt-2">
              <AuthButton />
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
