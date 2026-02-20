"use client";

import { usePathname } from "next/navigation";
import { BottomNav } from "./BottomNav";
import { Header } from "./Header";

export function NavWrapper({ children, isAuthenticated }: { children: React.ReactNode; isAuthenticated?: boolean }) {
  const pathname = usePathname();
  const noNavPaths = ["/login", "/signup"];
  const showNav = isAuthenticated && !noNavPaths.includes(pathname);

  return (
    <>
      {showNav && <Header />}
      {children}
      {showNav && <BottomNav />}
    </>
  );
}
