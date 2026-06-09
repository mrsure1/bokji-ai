"use client";

import Link from "next/link";
import { useRef, useState } from "react";
import { FIT_META } from "@/lib/data";
import type { Benefit } from "@/lib/types";
import { useApp } from "@/store/AppStore";

type Msg =
  | { role: "ai" | "user"; text: string }
  | { role: "ai"; text: string; benefits?: Benefit[]; quick?: string[] };

type HistoryItem = { role: "user" | "assistant"; content: string };

export default function ChatPage() {
  const { isSaved, toggleSave, profile } = useApp();
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [draft, setDraft] = useState("");
  const [loading, setLoading] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);

  const scrollEnd = () =>
    requestAnimationFrame(() => endRef.current?.scrollIntoView({ behavior: "smooth" }));

  const send = async (raw: string) => {
    const text = raw.trim();
    if (!text || loading) return;

    const history: HistoryItem[] = msgs
      .filter((m): m is { role: "ai" | "user"; text: string } => "text" in m && !("benefits" in m))
      .map((m) => ({
        role: m.role === "user" ? "user" : "assistant",
        content: m.text,
      }));

    setMsgs((m) => [...m, { role: "user", text }]);
    setDraft("");
    setLoading(true);
    scrollEnd();

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: text,
          history,
          profile: {
            name: profile.name,
            region: profile.region,
            jobStatus: profile.jobStatus,
            interests: profile.interests,
          },
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error ?? "상담 API 오류");
      }

      const reply: Msg = {
        role: "ai",
        text: data.message,
        benefits: data.benefits ?? [],
        quick: data.quickReplies?.length ? data.quickReplies : undefined,
      };
      setMsgs((m) => [...m, reply]);
    } catch (e) {
      setMsgs((m) => [
        ...m,
        {
          role: "ai",
          text:
            e instanceof Error
              ? e.message.includes("GEMINI")
                ? "AI 상담을 쓰려면 GEMINI_API_KEY를 .env.local에 설정해 주세요."
                : `오류: ${e.message}`
              : "잠시 후 다시 시도해 주세요.",
        },
      ]);
    } finally {
      setLoading(false);
      scrollEnd();
    }
  };

  const STARTERS = ["퇴사해서 생활비가 부담돼요", "월세가 너무 부담돼요", "부모님 병원비가 걱정돼요"];

  return (
    <main className="flex min-h-0 flex-1 flex-col bg-[#eef1ee]">
      <header className="flex items-center gap-3 border-b border-line bg-card px-4 py-3.5">
        <Link href="/" aria-label="뒤로" className="text-lg text-[#3a3d40]">
          ‹
        </Link>
        <b className="flex-1 text-base">AI 복지 상담</b>
        <span className="rounded-full bg-brand-light px-2 py-0.5 text-[10px] font-semibold text-brand-dark">
          Gemini
        </span>
      </header>

      <div className="flex flex-1 flex-col gap-3 overflow-y-auto p-4">
        <span className="self-center rounded-full bg-black/5 px-2.5 py-1 text-[11px] text-muted">
          오늘
        </span>

        {msgs.length === 0 && !loading && (
          <div className="max-w-[84%] self-start rounded-2xl rounded-bl-sm border border-line bg-card px-3.5 py-3 shadow-[0_2px_8px_rgba(0,0,0,0.03)]">
            <p className="mb-1 flex items-center gap-1.5 font-display text-xs font-bold text-brand-dark">
              <span className="flex h-5 w-5 items-center justify-center rounded-md bg-brand-light text-[11px]">
                AI
              </span>
              bokji-ai
            </p>
            <p className="text-[13.5px] leading-snug">
              {profile.name}님, 안녕하세요! 걱정되는 상황을 일상어로 말씀해 주시면 맞는 복지 혜택을
              찾아드릴게요.
            </p>
          </div>
        )}

        {msgs.map((m, i) => (
          <div key={i} className="contents">
            {m.role === "user" ? (
              <p className="max-w-[84%] self-end rounded-2xl rounded-br-sm bg-brand px-3.5 py-3 text-[13.5px] leading-snug text-white">
                {m.text}
              </p>
            ) : (
              <div className="max-w-[84%] self-start rounded-2xl rounded-bl-sm border border-line bg-card px-3.5 py-3 shadow-[0_2px_8px_rgba(0,0,0,0.03)]">
                <p className="mb-1 flex items-center gap-1.5 font-display text-xs font-bold text-brand-dark">
                  <span className="flex h-5 w-5 items-center justify-center rounded-md bg-brand-light text-[11px]">
                    AI
                  </span>
                  bokji-ai
                </p>
                <p className="whitespace-pre-wrap text-[13.5px] leading-snug">{m.text}</p>
              </div>
            )}

            {"benefits" in m &&
              m.benefits?.map((b) => (
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
                    disabled={loading}
                    className="rounded-full border border-brand bg-card px-3 py-2 text-[12.5px] text-brand-dark disabled:opacity-50"
                  >
                    {q}
                  </button>
                ))}
              </div>
            )}
          </div>
        ))}

        {loading && (
          <div className="max-w-[84%] self-start rounded-2xl border border-line bg-card px-3.5 py-3 text-[13px] text-muted">
            AI가 답변을 작성하고 있어요…
          </div>
        )}

        {msgs.length === 0 && (
          <div className="flex flex-wrap gap-2 self-start">
            {STARTERS.map((s) => (
              <button
                key={s}
                onClick={() => send(s)}
                disabled={loading}
                className="rounded-full border border-line bg-card px-3 py-2 text-[12.5px] disabled:opacity-50"
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
          disabled={loading}
          className="flex-1 bg-transparent text-[13.5px] outline-none placeholder:text-muted disabled:opacity-50"
        />
        <button
          type="submit"
          disabled={loading || !draft.trim()}
          aria-label="보내기"
          className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand text-white disabled:opacity-40"
        >
          ↑
        </button>
      </form>
    </main>
  );
}
