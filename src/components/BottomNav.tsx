"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const TABS = [
  { href: "/", label: "홈", icon: "🏠" },
  { href: "/chat", label: "상담", icon: "💬" },
  { href: "/saved", label: "보관함", icon: "🔖" },
  { href: "/profile", label: "내 정보", icon: "👤" },
] as const;

export function BottomNav() {
  const pathname = usePathname();
  // 탭 화면에서만 노출 (알림·상세는 뒤로가기 헤더 사용)
  const isTab = TABS.some((t) => t.href === pathname);
  if (!isTab) return null;

  return (
    <nav className="sticky bottom-0 z-30 flex h-16 items-center justify-around border-t border-line bg-card/95 backdrop-blur">
      {TABS.map((t) => {
        const active = t.href === pathname;
        return (
          <Link
            key={t.href}
            href={t.href}
            className="flex w-16 flex-col items-center gap-1 text-[10px]"
            aria-current={active ? "page" : undefined}
          >
            <span
              className={`flex h-7 w-7 items-center justify-center rounded-lg text-base ${
                active ? "bg-brand-light" : ""
              }`}
            >
              {t.icon}
            </span>
            <span className={active ? "font-semibold text-brand" : "text-muted"}>{t.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
