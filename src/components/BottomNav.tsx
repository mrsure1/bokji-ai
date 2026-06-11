"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { NavIcon } from "@/components/NavIcon";

const TABS = [
  { href: "/", label: "홈", icon: "home" },
  { href: "/chat", label: "상담", icon: "chat" },
  { href: "/saved", label: "보관함", icon: "bookmark" },
  { href: "/profile", label: "내 정보", icon: "user" },
] as const;

export function BottomNav() {
  const pathname = usePathname();
  // 모든 화면에 노출한다. 상세·알림 등에서는 헤더의 뒤로가기와 함께 공존한다.
  return (
    <nav className="sticky bottom-0 z-30 flex h-16 items-center justify-around border-t border-line bg-card/95 backdrop-blur">
      {TABS.map((t) => {
        // 홈은 정확히 일치할 때만, 나머지는 하위 경로까지 활성 표시
        const active = t.href === "/" ? pathname === "/" : pathname.startsWith(t.href);
        return (
          <Link
            key={t.href}
            href={t.href}
            className="flex w-16 flex-col items-center gap-1 text-[10px]"
            aria-current={active ? "page" : undefined}
          >
            <span
              className={`flex h-7 w-7 items-center justify-center rounded-lg transition-colors ${
                active ? "bg-brand-light text-brand" : "text-[#9aa0a6]"
              }`}
            >
              <NavIcon id={t.icon} className="h-[19px] w-[19px]" />
            </span>
            <span className={active ? "font-semibold text-brand" : "text-muted"}>{t.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
