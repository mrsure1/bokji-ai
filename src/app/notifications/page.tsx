"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { ProgressScreen } from "@/components/ProgressScreen";
import type { NotiType } from "@/lib/types";
import { KEY_READ, useApp } from "@/store/AppStore";

const META: Record<NotiType, { icon: string; kind: string; cls: string }> = {
  urgent: { icon: "⏰", kind: "마감 임박", cls: "bg-coral-light text-coral" },
  new: { icon: "✨", kind: "새 혜택", cls: "bg-brand-light text-brand-dark" },
  change: { icon: "🔄", kind: "변경", cls: "bg-sky-light text-sky" },
  info: { icon: "📝", kind: "정보 보완", cls: "bg-amber-light text-amber-dark" },
};

export default function NotificationsPage() {
  const { ready, notifications, markAllRead, profile } = useApp();
  // 진입 시점의 읽음 상태를 localStorage에서 스냅샷으로 고정 (이후 모두 읽음 처리)
  const [snapshot] = useState<string[]>(() => {
    if (typeof window === "undefined") return [];
    try {
      return JSON.parse(localStorage.getItem(KEY_READ) ?? "[]") as string[];
    } catch {
      return [];
    }
  });

  const [revealed, setRevealed] = useState(false);

  const markedRef = useRef(false);
  useEffect(() => {
    if (!ready || markedRef.current) return;
    markedRef.current = true;
    const t = setTimeout(markAllRead, 0);
    return () => clearTimeout(t);
  }, [ready, markAllRead]);

  const urgent = notifications.filter((n) => n.type === "urgent");
  const rest = notifications.filter((n) => n.type !== "urgent");
  const alarmsOn = profile.alarms.app;

  if (!revealed) {
    return (
      <ProgressScreen
        done={ready}
        onDone={() => setRevealed(true)}
        icon="bell"
        messages={["알림을 불러오고 있어요", "새 소식을 확인하는 중이에요"]}
      />
    );
  }

  return (
    <main className="flex-1 px-4 pb-24 pt-3">
      <header className="-mx-4 mb-4 flex items-center gap-3 border-b border-line bg-card px-4 py-3.5">
        <Link href="/" aria-label="뒤로" className="text-lg text-[#3a3d40]">‹</Link>
        <b className="flex-1 text-base">알림</b>
        <Link href="/profile" aria-label="알림 설정" className="text-base">⚙</Link>
      </header>

      <div className="mb-4 flex items-center gap-2.5 rounded-2xl border border-[#d9e6fb] bg-sky-light px-3.5 py-3">
        <span className="text-[15px]">🔔</span>
        <p className="flex-1 text-xs leading-snug text-[#2c5fa8]">
          {alarmsOn
            ? "마감 임박·새 혜택 소식을 앱에서 모아 알려드려요"
            : "앱 알림이 꺼져 있어요. 설정에서 켜면 소식을 받을 수 있어요"}
        </p>
        <Link href="/profile" className="text-[11.5px] font-semibold text-sky">설정</Link>
      </div>

      {!alarmsOn ? (
        <div className="mt-20 text-center">
          <p className="text-4xl">🔕</p>
          <p className="mt-3 text-sm text-muted">앱 알림이 꺼져 있어요.</p>
          <Link
            href="/profile"
            className="mt-4 inline-block rounded-xl bg-brand px-5 py-3 text-sm font-semibold text-white"
          >
            알림 켜러 가기
          </Link>
        </div>
      ) : notifications.length === 0 ? (
        <div className="mt-20 text-center">
          <p className="text-4xl">🔕</p>
          <p className="mt-3 text-sm text-muted">아직 새 알림이 없어요.</p>
          <p className="mt-1 text-xs text-muted">
            혜택을 저장하거나 관심 분야를 등록하면 맞춤 소식을 알려드려요.
          </p>
        </div>
      ) : (
        [
          { title: "마감 임박", items: urgent },
          { title: "맞춤 소식", items: rest },
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
                      {unread && (
                        <span className="absolute left-[7px] top-[18px] h-1.5 w-1.5 rounded-full bg-brand" />
                      )}
                      <span
                        className={`flex h-[38px] w-[38px] shrink-0 items-center justify-center rounded-xl text-[17px] ${m.cls}`}
                      >
                        {m.icon}
                      </span>
                      <div className="flex-1">
                        <span
                          className={`mb-1.5 inline-block rounded px-1.5 py-[3px] font-display text-[10px] font-bold ${m.cls}`}
                        >
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
                    <Link key={n.id} href="/profile" className="block">
                      {Inner}
                    </Link>
                  );
                })}
              </section>
            ),
        )
      )}
    </main>
  );
}
