"use client";

import type React from "react";
import { usePathname } from "next/navigation";
import Sidebar from "@/components/sidebar";
import MobileMenu from "@/components/mobile-menu";
import TopHeader from "@/components/top-header";
import { withoutBasePath } from "@/lib/app-path";

export default function LayoutWrapper({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const isAuthPage = withoutBasePath(pathname || "/").startsWith("/auth");

  if (isAuthPage) {
    return <>{children}</>;
  }

  return (
    <div className="flex h-screen flex-col">
      {/* Mobile menu for small screens */}
      <div className="md:hidden">
        <MobileMenu />
      </div>
      {/* Desktop layout */}
      <div className="hidden md:flex flex-1 overflow-hidden">
        <Sidebar />
        <div className="flex-1 flex flex-col overflow-hidden">
            <TopHeader />
            {children}
        </div>
      </div>
      {/* Mobile layout */}
      <div className="md:hidden flex flex-col flex-1 min-h-0 overflow-hidden">
        {children}
      </div>
    </div>
  );
}
