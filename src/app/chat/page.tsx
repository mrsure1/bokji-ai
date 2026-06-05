"use client";

import Link from "next/link";
import { useRef, useState } from "react";
import { getBenefits, FIT_META } from "@/lib/data";
import type { Benefit } from "@/lib/types";
import { useApp } from "@/store/AppStore";

type Msg =
  | { role: "ai" | "user"; text: string }
  | { role: "ai"; text: string; benefits: Benefit[]; quick?: string[] };

const ALL = getBenefits();

// 일상어 키워드 → 관련 혜택 매칭 (추후 AI API로 교체)
function match(input: string): Benefit[] {
  const q = input.toLowerCase();
  const has = (...k: string[]) => k.some((w) => q.includes(w));
  const pick = (cats: string[]) => ALL.filter((b) => cats.includes(b.category));
  let res: Benefit[] = [];
  if (has("월세", "집", "주거", "전세", "방")) res = pick(["주거"]);
  else if (has("실직", "퇴사", "생활비", "생계", "돈", "급")) res = pick(["생계", "일자리"]);
  else if (has("병원", "의료", "아파", "치료", "수술")) res = pick(["의료"]);
  else if (has("일자리", "구직", "취업", "훈련")) res = pick(["일자리"]);
  if (res.length === 0) res = ALL.filter((b) => b.fit === "high");
  return res.slice(0, 2);
}

const GREETING: Msg = {
  role: "ai",
  text: "안녕하세요 지영님! 요즘 어떤 점이 걱정되세요? 편하게 일상어로 말씀해 주세요.",
};
const STARTERS = ["퇴사해서 생활비가 부담돼요", "월세가 너무 부담돼요", "부모님 병원비가 걱정돼요"];

export default function ChatPage() {
  const { isSaved, toggleSave } = useApp();
  const [msgs, setMsgs] = useState<Msg[]>([GREETING]);
  const [draft, setDraft] = useState("");
  const endRef = useRef<HTMLDivElement>(null);

  const send = (raw: string) => {
    const text = raw.trim();
    if (!text) return;
    const found = match(text);
    const reply: Msg = {
      role: "ai",
      text: found.length
        ? "말씀 주신 상황으로 받을 수 있는 혜택을 찾아봤어요."
        : "조금 더 자세히 말씀해 주시면 더 정확히 찾아드릴게요.",
      benefits: found,
      quick: ["서울특별시", "경기도", "기타 지역"],
    };
    setMsgs((m) => [...m, { role: "user", text }, reply]);
    setDraft("");
    requestAnimationFrame(() => endRef.current?.scrollIntoView({ behavior: "smooth" }));
  };

  return (
    <main className="flex min-h-0 flex-1 flex-col bg-[#eef1ee]">
      <header className="flex items-center gap-3 border-b border-line bg-card px-4 py-3.5">
        <Link href="/" aria-label="뒤로" className="text-lg text-[#3a3d40]">‹</Link>
        <b className="flex-1 text-base">AI 복지 상담</b>
      </header>

      <div className="flex flex-1 flex-col gap-3 overflow-y-auto p-4">
        <span className="self-center rounded-full bg-black/5 px-2.5 py-1 text-[11px] text-muted">오늘</span>
        {msgs.map((m, i) => (
          <div key={i} className="contents">
            {m.role === "user" ? (
              <p className="max-w-[84%] self-end rounded-2xl rounded-br-sm bg-brand px-3.5 py-3 text-[13.5px] leading-snug text-white">
                {m.text}
              </p>
            ) : (
              <div className="max-w-[84%] self-start rounded-2xl rounded-bl-sm border border-line bg-card px-3.5 py-3 shadow-[0_2px_8px_rgba(0,0,0,0.03)]">
                <p className="mb-1 flex items-center gap-1.5 font-display text-xs font-bold text-brand-dark">
                  <span className="flex h-5 w-5 items-center justify-center rounded-md bg-brand-light text-[11px]">AI</span>
                  복지AI
                </p>
                <p className="text-[13.5px] leading-snug">{m.text}</p>
              </div>
            )}

            {"benefits" in m &&
              m.benefits.map((b) => (
                <div
                  key={b.id}
                  className="w-[84%] self-start rounded-2xl border border-line bg-card p-3.5 shadow-[0_2px_8px_rgba(0,0,0,0.03)]"
                >
                  <div className="mb-1.5 flex items-center justify-between">
                    <span
                      className={`rounded-md px-2 py-1 font-display text-[10px] font-bold ${
                        FIT_META[b.fit].tone === "brand"
                          ? "bg-brand-light text-brand-dark"
                          : "bg-amber-light text-amber-dark"
                      }`}
                    >
                      {FIT_META[b.fit].label}
                    </span>
                    <span className="font-display text-sm font-bold text-brand">{b.amount}</span>
                  </div>
                  <b className="text-sm">{b.name}</b>
                  <p className="mb-2.5 mt-1.5 text-xs leading-snug text-muted">{b.summary}</p>
                  <div className="flex gap-2">
                    <Link
                      href={`/benefit/${b.id}`}
                      className="flex-1 rounded-lg bg-brand py-2 text-center text-xs font-semibold text-white"
                    >
                      상세보기
                    </Link>
                    <button
                      onClick={() => toggleSave(b.id)}
                      className="flex-1 rounded-lg bg-[#f1f1ef] py-2 text-center text-xs text-[#3a3d40]"
                    >
                      {isSaved(b.id) ? "저장됨" : "저장"}
                    </button>
                  </div>
                </div>
              ))}

            {"quick" in m && m.quick && (
              <div className="flex flex-wrap gap-2 self-start">
                {m.quick.map((q) => (
                  <button
                    key={q}
                    onClick={() => send(q)}
                    className="rounded-full border border-brand bg-card px-3 py-2 text-[12.5px] text-brand-dark"
                  >
                    {q}
                  </button>
                ))}
              </div>
            )}
          </div>
        ))}

        {msgs.length === 1 && (
          <div className="flex flex-wrap gap-2 self-start">
            {STARTERS.map((s) => (
              <button
                key={s}
                onClick={() => send(s)}
                className="rounded-full border border-line bg-card px-3 py-2 text-[12.5px]"
              >
                {s}
              </button>
            ))}
          </div>
        )}
        <div ref={endRef} />
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          send(draft);
        }}
        className="flex items-center gap-2.5 border-t border-line bg-card px-3.5 py-3"
      >
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder="상황을 적어주세요…"
          className="flex-1 bg-transparent text-[13.5px] outline-none placeholder:text-muted"
        />
        <button
          type="submit"
          aria-label="보내기"
          className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand text-white"
        >
          ↑
        </button>
      </form>
    </main>
  );
}
