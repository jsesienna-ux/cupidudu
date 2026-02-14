"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const navItems = [
  { href: "/", label: "홈", icon: "🏠" },
  { href: "/cards", label: "카드함", icon: "💌" },
  { href: "/chat", label: "채팅", icon: "💬" },
  { href: "/mypage", label: "마이페이지", icon: "👤" },
];

export function BottomNav() {
  const pathname = usePathname();
  const isLoginPage = pathname === "/login";

  if (isLoginPage) return null;

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 border-t border-cupid-pinkSoft bg-white/95 backdrop-blur-sm"
      style={{
        paddingBottom: "max(env(safe-area-inset-bottom), 8px)",
      }}
    >
      <div className="mx-auto flex max-w-lg items-center justify-around px-2 py-2">
        {navItems.map(({ href, label, icon }) => {
          const isActive = pathname === href || (href !== "/" && pathname.startsWith(href));
          return (
            <Link
              key={href}
              href={href}
              className={`flex flex-col items-center gap-0.5 rounded-xl px-4 py-2 transition-colors ${
                isActive
                  ? "text-cupid-pinkDark"
                  : "text-cupid-gray hover:text-cupid-pink"
              }`}
            >
              <span className="text-xl" aria-hidden>
                {icon}
              </span>
              <span className="text-xs font-medium">{label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
