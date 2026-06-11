"use client";

// 화면 전환 중 보여주는 진행률 로더.
// 실제 진행 이벤트가 없는 단일 요청이므로, done 전까지 90%까지 ease-out으로 차오르고
// 작업이 끝나면(done=true) 100%를 채운 뒤 onDone으로 콘텐츠 전환을 알린다.
import type { ReactNode } from "react";
import { useEffect, useState } from "react";

/** 상단 아이콘 종류 — 화면별로 알맞은 라인 아이콘을 고른다. */
export type ProgressIcon = "home" | "doc" | "bookmark" | "bell" | "user";

interface Props {
  /** 작업 완료 여부. true가 되면 100%까지 채우고 onDone을 호출한다. */
  done: boolean;
  /** 100% 도달 후 호출 (부모가 실제 콘텐츠로 전환) */
  onDone?: () => void;
  /** 순환 표시할 상태 메시지 */
  messages?: string[];
  /** 상단 아이콘 종류 */
  icon?: ProgressIcon;
}

// 트렌디한 라인(스트로크) 아이콘. 24x24 viewBox 기준, stroke="currentColor".
const ICONS: Record<ProgressIcon, ReactNode> = {
  home: (
    <>
      <path d="M3 9.8 12 3l9 6.8" />
      <path d="M5.5 8.8V19a1 1 0 0 0 1 1h11a1 1 0 0 0 1-1V8.8" />
      <path d="M9.5 20v-5.5h5V20" />
    </>
  ),
  doc: (
    <>
      <path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z" />
      <path d="M14 3v5h5" />
      <path d="M9 13h6M9 17h4" />
    </>
  ),
  bookmark: <path d="M6.5 3.5h11a1 1 0 0 1 1 1v16l-6.5-4.3L5.5 20.5v-16a1 1 0 0 1 1-1z" />,
  bell: (
    <>
      <path d="M18 8.5A6 6 0 0 0 6 8.5c0 6.5-2.5 8.5-2.5 8.5h17S18 15 18 8.5" />
      <path d="M13.7 20.5a2 2 0 0 1-3.4 0" />
    </>
  ),
  user: (
    <>
      <circle cx="12" cy="8" r="3.6" />
      <path d="M5 20a7 7 0 0 1 14 0" />
    </>
  ),
};

export function ProgressScreen({
  done,
  onDone,
  messages = ["불러오고 있어요"],
  icon = "doc",
}: Props) {
  const [pct, setPct] = useState(12);
  const [msgIdx, setMsgIdx] = useState(0);

  // 진행률: done 전엔 90%까지 ease-out으로 차오르고, done이면 다음 틱에 100%로 채운다.
  useEffect(() => {
    const id = setInterval(() => {
      setPct((p) => {
        if (done) return 100;
        if (p >= 90) return p;
        const step = p < 35 ? 6 : p < 65 ? 3 : 1;
        return Math.min(90, p + step);
      });
    }, 220);
    return () => clearInterval(id);
  }, [done]);

  // 완료 후 바가 다 찰 시간을 준 뒤 콘텐츠로 전환
  useEffect(() => {
    if (!done) return;
    const t = setTimeout(() => onDone?.(), 560);
    return () => clearTimeout(t);
  }, [done, onDone]);

  // 상태 메시지 순환
  useEffect(() => {
    if (done || messages.length <= 1) return;
    const id = setInterval(() => setMsgIdx((i) => (i + 1) % messages.length), 1500);
    return () => clearInterval(id);
  }, [done, messages.length]);

  const label = done ? "거의 다 됐어요" : messages[msgIdx];

  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-7 px-10 text-center">
      {/* 모던 라인 아이콘 타일: 그린 그라데이션 + 은은한 글로우 */}
      <div className="relative" aria-hidden>
        <span className="absolute inset-0 -z-10 rounded-[20px] bg-brand/35 blur-xl animate-icon-glow" />
        <span className="grid h-16 w-16 place-items-center rounded-[20px] bg-gradient-to-br from-[#1fbf72] to-[#0f8a4c] text-white shadow-[0_12px_28px_-8px_rgba(24,160,88,0.6)]">
          <svg
            width="30"
            height="30"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={1.7}
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            {ICONS[icon]}
          </svg>
        </span>
      </div>

      <div
        className="w-full max-w-[260px]"
        role="progressbar"
        aria-valuenow={pct}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={label}
      >
        <div className="relative h-1.5 w-full overflow-hidden rounded-full bg-line">
          <div
            className="absolute inset-y-0 left-0 overflow-hidden rounded-full bg-gradient-to-r from-[#16b06a] via-[#1fc77a] to-[#46e0a3] shadow-[0_0_12px_-1px_rgba(31,199,122,0.7)] transition-[width] duration-300 ease-out"
            style={{ width: `${pct}%` }}
          >
            {!done && (
              <span className="absolute inset-y-0 -left-1/3 w-1/3 -skew-x-12 animate-progress-shimmer bg-gradient-to-r from-transparent via-white/60 to-transparent" />
            )}
          </div>
        </div>

        <div className="mt-2.5 flex items-center justify-between">
          <span className="text-[11.5px] text-muted transition-opacity">{label}</span>
          <span className="font-display text-[12px] font-bold tabular-nums text-brand-dark">
            {pct}%
          </span>
        </div>
      </div>
    </main>
  );
}
