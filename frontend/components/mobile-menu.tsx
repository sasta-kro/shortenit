"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";

import { Home, Link2, BarChart2, Settings, QrCode, LogOut } from "lucide-react";


import { useAuth } from "@/components/auth-provider";
import { ShieldCheck } from "lucide-react";
import { withoutBasePath } from "@/lib/app-path";

export default function MobileMenu() {
  const { user, logout } = useAuth();
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const appPathname = withoutBasePath(pathname || "/");

  const navItems = [
    { label: "Home", icon: <Home className="w-5 h-5" />, href: "/" },
    { label: "Links", icon: <Link2 className="w-5 h-5" />, href: "/links" },
    { label: "QR Codes", icon: <QrCode className="w-5 h-5" />, href: "/qrcodes" },
    { label: "Analytics", icon: <BarChart2 className="w-5 h-5" />, href: "/analytics" },
    { label: "Settings", icon: <Settings className="w-5 h-5" />, href: "/settings" },
  ];

  if (user?.role === "ADMIN") {
      // Insert Admin before Settings
      navItems.splice(navItems.length - 1, 0, { label: "Admin", icon: <ShieldCheck className="w-5 h-5" />, href: "/admin/users" });
  }

  return (
    <>
      {/* Header */}
      <div className="bg-background border-b border-border p-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-gradient-to-br from-primary via-blue-600 to-violet-600 rounded-lg flex items-center justify-center shadow-md shadow-primary/25">
            <Link2 className="w-4 h-4 text-white" />
          </div>
          <span className="font-bold text-lg bg-clip-text text-transparent bg-gradient-to-r from-foreground to-foreground/60">Shortenit</span>
        </div>
        <button
          onClick={() => setOpen(!open)}
          className="p-2 hover:bg-muted rounded-lg text-foreground hover:cursor-pointer"
        >
          <svg
            className="w-6 h-6"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d={open ? "M6 18L18 6M6 6l12 12" : "M4 6h16M4 12h16M4 18h16"}
            />
          </svg>
        </button>
      </div>

      {/* Mobile Navigation Menu */}
      {open && (
        <div className="bg-background border-b border-border">
          <nav className="flex flex-col p-2 space-y-1">
            {navItems.map((item) => {
              const isActive =
                appPathname === item.href || appPathname.startsWith(item.href + "/");
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setOpen(false)}
                >
                  <div
                    className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                      isActive
                        ? "bg-primary/10 text-primary"
                        : "text-foreground hover:bg-muted"
                    }`}
                  >
                    {item.icon}
                    <span className="text-sm font-medium">{item.label}</span>
                  </div>
                </Link>
              );
            })}
          </nav>
          <div className="px-2 pb-2 space-y-1">
            <div className="border-t border-border my-1" />
            <button
              onClick={() => { setOpen(false); logout(); }}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-destructive hover:bg-destructive/10 hover:cursor-pointer transition-colors"
            >
              <LogOut className="w-5 h-5" />
              <span className="text-sm font-medium">Sign Out</span>
            </button>
          </div>
        </div>
      )}
    </>
  );
}
