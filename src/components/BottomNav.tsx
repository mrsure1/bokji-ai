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
    <nav className="sticky bottom-0 z-30 flex items-stretch justify-around gap-2 border-t border-line bg-card/95 px-3 py-2.5 backdrop-blur">
      {TABS.map((t) => {
        const active = t.href === "/" ? pathname === "/" : pathname.startsWith(t.href);
        return (
          <Link
            key={t.href}
            href={t.href}
            aria-current={active ? "page" : undefined}
            className="group flex flex-1 justify-center select-none"
          >
            {/* 아이콘 + 텍스트를 묶은 둥근 3D 버튼 */}
            <span
              className={`flex w-full max-w-[80px] flex-col items-center gap-0.5 rounded-[20px] px-2 pb-2 pt-2.5 transition-all duration-200 ease-out group-hover:-translate-y-1 group-active:translate-y-[2px] ${
                active
                  ? "bg-gradient-to-b from-[#23bf6b] to-[#14914d] text-white shadow-[0_4px_0_0_#0c5731,0_9px_16px_-5px_rgba(15,107,58,0.6)] -translate-y-0.5 group-active:shadow-[0_1px_0_0_#0c5731,0_3px_7px_-3px_rgba(15,107,58,0.55)]"
                  : "bg-gradient-to-b from-white to-[#eef1ee] text-[#5f656b] shadow-[0_3px_0_0_#dbe0db,0_6px_11px_-5px_rgba(0,0,0,0.2)] group-active:shadow-[0_1px_0_0_#dbe0db,0_2px_5px_-3px_rgba(0,0,0,0.18)]"
              }`}
            >
              <NavIcon id={t.icon} className="h-[26px] w-[26px]" />
              <span className="text-[11px] font-semibold leading-none">{t.label}</span>
            </span>
          </Link>
        );
      })}
    </nav>
  );
}
