"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { getNotifications } from "@/lib/data";
import type { NotiType } from "@/lib/types";
import { useApp } from "@/store/AppStore";

const NOTIS = getNotifications();
const META: Record<NotiType, { icon: string; kind: string; cls: string }> = {
  urgent: { icon: "⏰", kind: "마감 임박", cls: "bg-coral-light text-coral" },
  new: { icon: "✨", kind: "새 혜택", cls: "bg-brand-light text-brand-dark" },
  change: { icon: "🔄", kind: "변경", cls: "bg-sky-light text-sky" },
  info: { icon: "📝", kind: "정보 보완", cls: "bg-amber-light text-amber-dark" },
};
const isToday = (t: string) => t.includes("전") ? !t.includes("일 전") : true;

export default function NotificationsPage() {
  const { readNotis, markAllRead } = useApp();
  // 진입 시점의 읽음 상태를 스냅샷으로 고정한 뒤, 모두 읽음 처리해 배지를 비움
  const [snapshot] = useState<string[]>(() => readNotis);
  useEffect(() => {
    markAllRead();
  }, [markAllRead]);

  const today = NOTIS.filter((n) => isToday(n.time));
  const week = NOTIS.filter((n) => !isToday(n.time));

  return (
    <main className="flex-1 px-4 pb-8 pt-3">
      <header className="-mx-4 mb-4 flex items-center gap-3 border-b border-line bg-card px-4 py-3.5">
        <Link href="/" aria-label="뒤로" className="text-lg text-[#3a3d40]">‹</Link>
        <b className="flex-1 text-base">알림</b>
        <Link href="/profile" aria-label="알림 설정" className="text-base">⚙</Link>
      </header>

      <div className="mb-4 flex items-center gap-2.5 rounded-2xl border border-[#d9e6fb] bg-sky-light px-3.5 py-3">
        <span className="text-[15px]">📩</span>
        <p className="flex-1 text-xs leading-snug text-[#2c5fa8]">문자·이메일로도 받는 중이에요</p>
        <Link href="/profile" className="text-[11.5px] font-semibold text-sky">설정</Link>
      </div>

      {[
        { title: "오늘", items: today },
        { title: "이번 주", items: week },
      ].map(
        (g) =>
          g.items.length > 0 && (
            <section key={g.title}>
              <p className="mb-2.5 mt-1 px-1 text-xs font-semibold text-muted">{g.title}</p>
              {g.items.map((n) => {
                const m = META[n.type];
                const unread = !snapshot.includes(n.id);
                const Inner = (
                  <div
                    className={`relative mb-2.5 flex gap-3 rounded-2xl border p-3.5 ${
                      unread ? "border-[#cfe9d8] bg-[#fbfffc]" : "border-line bg-card"
                    }`}
                  >
                    {unread && <span className="absolute left-[7px] top-[18px] h-1.5 w-1.5 rounded-full bg-brand" />}
                    <span className={`flex h-[38px] w-[38px] shrink-0 items-center justify-center rounded-xl text-[17px] ${m.cls}`}>
                      {m.icon}
                    </span>
                    <div className="flex-1">
                      <span className={`mb-1.5 inline-block rounded px-1.5 py-[3px] font-display text-[10px] font-bold ${m.cls}`}>
                        {m.kind}
                      </span>
                      <b className="block text-[13.5px] font-semibold leading-snug">{n.title}</b>
                      <span className="text-[11px] text-muted">{n.time}</span>
                    </div>
                  </div>
                );
                return n.benefitId ? (
                  <Link key={n.id} href={`/benefit/${n.benefitId}`} className="block">
                    {Inner}
                  </Link>
                ) : (
                  <div key={n.id}>{Inner}</div>
                );
              })}
            </section>
          )
      )}
    </main>
  );
}
