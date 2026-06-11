"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { CategoryBar } from "@/components/CategoryBar";
import { ProgressScreen } from "@/components/ProgressScreen";
import { HOME_CATEGORIES } from "@/lib/categories";
import { ddayLabel } from "@/lib/data";
import type { Benefit } from "@/lib/types";
import { useApp } from "@/store/AppStore";

interface HomeFeed {
  hero: Benefit | null;
  timeline: Benefit[];
  greetingName: string | null;
  profileFilled: boolean;
}

export default function HomePage() {
  const { userId, ready, isSaved, toggleSave, unreadCount } = useApp();
  const [feed, setFeed] = useState<HomeFeed | null>(null);
  const [loading, setLoading] = useState(true);
  const [switching, setSwitching] = useState(false);
  const [category, setCategory] = useState("all");
  const timelineRef = useRef<HTMLDivElement>(null);
  const [showCue, setShowCue] = useState(true);
  const [revealed, setRevealed] = useState(false); // 진행률 100% 후 콘텐츠 노출

  // 초기 로드 (전체 카테고리)
  useEffect(() => {
    if (!ready) return;
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(`/api/home?category=all${userId ? `&userId=${userId}` : ""}`);
        if (res.ok) {
          const data = await res.json();
          if (!cancelled) setFeed(data);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [ready, userId]);

  // 카테고리 선택 → 해당 카테고리로 다시 불러옴 (전체 화면 로더 대신 가벼운 전환)
  const selectCategory = async (key: string) => {
    if (key === category || switching) return;
    setCategory(key);
    setSwitching(true);
    try {
      const res = await fetch(`/api/home?category=${key}${userId ? `&userId=${userId}` : ""}`);
      if (res.ok) setFeed(await res.json());
    } finally {
      setSwitching(false);
    }
  };

  const categoryLabel = HOME_CATEGORIES.find((c) => c.key === category)?.label ?? "";

  // 타임라인이 화면에 들어오면 스크롤 단서를 숨김 (놓침 방지 UI)
  useEffect(() => {
    const el = timelineRef.current;
    if (!el) return;
    const ob = new IntersectionObserver(([e]) => setShowCue(!e.isIntersecting), {
      threshold: 0.15,
    });
    ob.observe(el);
    return () => ob.disconnect();
  }, [feed]);

  const hero = feed?.hero ?? null;
  const timeline = feed?.timeline ?? [];
  const name = feed?.greetingName;
  const heroUrgent = hero?.dday != null && hero.dday <= 14; // 14일 이내만 "마감 임박"

  if (!revealed) {
    return (
      <ProgressScreen
        done={ready && !loading}
        onDone={() => setRevealed(true)}
        icon="home"
        messages={[
          "맞춤 혜택을 찾고 있어요",
          "마감 임박 순으로 정리하는 중이에요",
          "딱 맞는 혜택을 고르고 있어요",
        ]}
      />
    );
  }

  return (
    <main className="flex-1 px-5 pb-24 pt-5">
      {/* 헤더 */}
      <header className="mb-4 flex items-center justify-between">
        <span className="font-display text-lg font-extrabold">
          bokji<span className="text-brand">-ai</span>
        </span>
        <Link
          href="/notifications"
          aria-label="알림"
          className="relative flex h-9 w-9 items-center justify-center rounded-xl border border-line bg-card text-[15px]"
        >
          🔔
          {unreadCount > 0 && (
            <span className="absolute right-2 top-2 h-[7px] w-[7px] rounded-full border-2 border-card bg-coral" />
          )}
        </Link>
      </header>

      {/* 카테고리 선택 (가로 스크롤) */}
      <CategoryBar value={category} onSelect={selectCategory} />

      <div className={switching ? "pointer-events-none opacity-40 transition-opacity" : "transition-opacity"}>
      {!hero ? (
        <div className="mt-20 text-center">
          <p className="text-4xl">🍃</p>
          <p className="mt-3 text-sm text-muted">
            {category === "all"
              ? "지금 마감 임박한 혜택을 찾지 못했어요."
              : `'${categoryLabel}' 분야에 지금 마감 임박한 혜택이 없어요.`}
          </p>
          <Link
            href="/chat"
            className="mt-4 inline-block rounded-xl bg-brand px-5 py-3 text-sm font-semibold text-white"
          >
            AI 상담으로 혜택 찾기
          </Link>
        </div>
      ) : (
        <>
          <p className="text-sm text-muted">
            {name ? `${name}님, ` : ""}
            {heroUrgent ? (
              <>
                <b className="text-coral">{ddayLabel(hero.dday)} 마감</b>이에요
              </>
            ) : (
              <>
                오늘의 <b className="text-brand-dark">맞춤 혜택</b>이에요
              </>
            )}
          </p>
          <h1 className="mb-4 text-[22px] font-bold tracking-tight">오늘 이거 하나, 꼭 챙기세요</h1>

          {/* 프로필 미입력 안내 */}
          {!feed?.profileFilled && (
            <Link
              href="/profile"
              className="mb-4 flex items-center gap-2.5 rounded-2xl border border-[#d9e6fb] bg-sky-light px-3.5 py-3"
            >
              <span className="text-[15px]">🙋</span>
              <span className="flex-1 text-xs leading-snug text-[#2c5fa8]">
                <b>내 정보</b>를 입력하면 지역·관심사에 딱 맞는 혜택을 골라드려요
              </span>
              <span className="text-[11.5px] font-semibold text-sky">입력 →</span>
            </Link>
          )}

          {/* 히어로 카드 */}
          <section className="relative overflow-hidden rounded-3xl border border-[#f6dada] bg-card p-5 shadow-[0_18px_42px_-22px_rgba(235,87,87,0.35)]">
            <span className="absolute inset-y-0 left-0 w-[5px] bg-coral" />
            {heroUrgent ? (
              <span className="mb-3 inline-flex items-center gap-2 rounded-full bg-coral-light px-3 py-[7px] font-display text-xs font-extrabold text-coral">
                <span className="h-2 w-2 animate-pulse-ring rounded-full bg-coral" />
                {ddayLabel(hero.dday)} · 마감 임박
              </span>
            ) : (
              <span className="mb-3 inline-flex items-center gap-2 rounded-full bg-brand-light px-3 py-[7px] font-display text-xs font-extrabold text-brand-dark">
                <span className="h-2 w-2 rounded-full bg-brand" />
                {ddayLabel(hero.dday)} · 맞춤 추천
              </span>
            )}
            {feed?.profileFilled && (
              <p className="mb-2 text-xs font-semibold text-brand-dark">
                <span className="mr-1 inline-block h-[6px] w-[6px] rounded-full bg-brand align-middle" />
                {name ? `${name}님 조건 기반 추천` : "내 조건 기반 추천"}
              </p>
            )}
            <h2 className="mb-2 text-[20px] font-bold leading-snug tracking-tight">{hero.name}</h2>
            <p className="mb-2 font-display text-[26px] font-extrabold leading-none text-brand">
              {hero.amount}
              {hero.amountNote && (
                <span className="font-display text-[15px] font-semibold text-muted"> / {hero.amountNote}</span>
              )}
            </p>
            <p className="mb-4 line-clamp-3 text-[13px] leading-relaxed text-muted">{hero.summary}</p>

            <div className="mb-4 flex flex-col gap-2 text-[13px] text-[#3a3d40]">
              {hero.conditions.length > 0 && (
                <div className="flex gap-2">
                  <span className="w-4 shrink-0 text-center text-brand">✓</span>
                  <span className="line-clamp-2">{hero.conditions.join(" · ")}</span>
                </div>
              )}
              <div className="flex gap-2">
                <span className="w-4 shrink-0 text-center text-brand">🗓️</span>
                <span>
                  신청 마감{" "}
                  <b className="ml-0.5 text-coral">{hero.deadlineLabel ?? ddayLabel(hero.dday)}</b>
                </span>
              </div>
              <div className="flex gap-2">
                <span className="w-4 shrink-0 text-center text-brand">🏢</span>
                <span className="line-clamp-1">{hero.agency}</span>
              </div>
            </div>

            <Link
              href={`/benefit/${hero.id}`}
              className="block rounded-2xl bg-brand py-4 text-center font-bold text-white shadow-[0_12px_22px_-12px_rgba(24,160,88,0.6)] active:scale-[0.99]"
            >
              쉬운 말 요약 보고 신청하기 →
            </Link>
            <div className="mt-3 flex justify-center gap-5 text-[12.5px] text-muted">
              <button onClick={() => toggleSave(hero)} className="flex items-center gap-1">
                {isSaved(hero.id) ? "🔖 저장됨" : "🔖 저장"}
              </button>
              <Link href="/chat" className="flex items-center gap-1">💬 물어보기</Link>
            </div>
          </section>

          {/* 타임라인 */}
          {timeline.length > 0 && (
            <>
              <div className="mb-3 mt-7 flex items-baseline justify-between px-1">
                <h3 className="text-base font-bold tracking-tight">곧 마감되는 다른 혜택</h3>
                <span className="text-[12.5px] text-muted">전체 {timeline.length + 1}건</span>
              </div>
              <div ref={timelineRef} className="relative pl-6">
                <span className="absolute bottom-4 left-[7px] top-1.5 w-0.5 bg-line" />
                {timeline.map((b) => {
                  const urgent = b.dday !== null && b.dday <= 14;
                  return (
                    <Link key={b.id} href={`/benefit/${b.id}`} className="relative mb-3 block">
                      <span
                        className={`absolute -left-[19px] top-[18px] h-3 w-3 rounded-full border-[3px] bg-card ${
                          urgent ? "border-amber" : "border-brand"
                        }`}
                      />
                      <span
                        className={`mb-2 inline-block rounded-md px-2 py-[5px] font-display text-[11px] font-extrabold ${
                          urgent ? "bg-amber-light text-amber-dark" : "bg-brand-light text-brand-dark"
                        }`}
                      >
                        {ddayLabel(b.dday)}
                      </span>
                      <div className="rounded-2xl border border-line bg-card p-4 shadow-[0_4px_14px_rgba(0,0,0,0.04)]">
                        <div className="flex items-start justify-between gap-2.5">
                          <b className="text-[15px] leading-snug tracking-tight">{b.name}</b>
                          <span className="whitespace-nowrap font-display text-sm font-bold text-brand">
                            {b.amount}
                          </span>
                        </div>
                        <p className="mt-1.5 line-clamp-2 text-xs leading-snug text-muted">{b.summary}</p>
                      </div>
                    </Link>
                  );
                })}
              </div>
            </>
          )}

          {/* 스크롤 단서 바 (놓침 방지) */}
          {showCue && timeline.length > 0 && (
            <button
              onClick={() => timelineRef.current?.scrollIntoView({ behavior: "smooth" })}
              className="fixed bottom-[72px] left-1/2 z-20 flex w-[calc(100%-2rem)] max-w-[448px] -translate-x-1/2 items-center gap-3 rounded-2xl border border-line bg-card px-3.5 py-3 text-left shadow-[0_12px_28px_-10px_rgba(0,0,0,0.22)]"
            >
              <span className="flex items-center gap-1.5 rounded-lg bg-coral-light px-2.5 py-[7px] font-display text-[11px] font-extrabold text-coral">
                <span className="h-1.5 w-1.5 rounded-full bg-coral" />
                {ddayLabel(timeline[0]?.dday ?? null)}
              </span>
              <span className="flex-1 text-[13px] leading-tight text-[#3a3d40]">
                아래로 내리면 <b>곧 마감되는 혜택 {timeline.length}건</b>이 더 있어요
              </span>
              <span className="flex h-[30px] w-[30px] animate-bob items-center justify-center rounded-full bg-brand text-[15px] text-white">
                ⌄
              </span>
            </button>
          )}
        </>
      )}
      </div>
    </main>
  );
}
