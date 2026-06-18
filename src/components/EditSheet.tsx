"use client";

// 프로필 항목 편집용 바텀시트 — 단일 선택 / 복수 선택 / 텍스트 입력 지원.
import { useEffect, useState } from "react";

export type EditSheetConfig =
  | { mode: "options"; title: string; options: readonly string[]; value: string | null; allowClear?: boolean }
  | { mode: "multi"; title: string; options: readonly string[]; value: string[]; max?: number }
  | { mode: "text"; title: string; value: string | null; placeholder?: string; inputMode?: "text" | "numeric" | "tel" };

interface Props {
  config: EditSheetConfig;
  onSave: (value: string | null | string[]) => void;
  onClose: () => void;
}

export function EditSheet({ config, onSave, onClose }: Props) {
  const [text, setText] = useState(config.mode === "text" ? (config.value ?? "") : "");
  const [multi, setMulti] = useState<string[]>(config.mode === "multi" ? config.value : []);

  // 배경 스크롤 잠금
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, []);

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center">
      <button aria-label="닫기" onClick={onClose} className="absolute inset-0 bg-black/40" />
      {/* 최대 높이를 화면의 85%로 제한하고, 길면 내부 스크롤 */}
      <div className="relative flex max-h-[85dvh] w-full max-w-[480px] flex-col rounded-t-3xl bg-card pt-4">
        <span className="mx-auto mb-3 block h-1 w-10 shrink-0 rounded-full bg-[#dfe3df]" />
        <h2 className="mb-3 shrink-0 px-5 text-base font-bold">{config.title}</h2>

        {config.mode === "options" && (
          <div className="flex min-h-0 flex-col gap-2 overflow-y-auto px-5 pb-8">
            {config.options.map((opt) => {
              const active = config.value === opt;
              return (
                <button
                  key={opt}
                  onClick={() => onSave(opt)}
                  className={`shrink-0 rounded-xl border px-4 py-3.5 text-left text-sm ${
                    active
                      ? "border-brand bg-brand-light font-semibold text-brand-dark"
                      : "border-line bg-card"
                  }`}
                >
                  {opt}
                  {active && <span className="float-right text-brand">✓</span>}
                </button>
              );
            })}
            {config.allowClear && config.value && (
              <button onClick={() => onSave(null)} className="shrink-0 py-2 text-center text-xs text-muted underline">
                선택 지우기
              </button>
            )}
          </div>
        )}

        {config.mode === "multi" && (
          <>
            <div className="flex min-h-0 flex-wrap content-start gap-2 overflow-y-auto px-5 pb-2">
              {config.options.map((opt) => {
                const active = multi.includes(opt);
                return (
                  <button
                    key={opt}
                    onClick={() =>
                      setMulti((cur) =>
                        active
                          ? cur.filter((x) => x !== opt)
                          : config.max && cur.length >= config.max
                            ? cur
                            : [...cur, opt],
                      )
                    }
                    className={`h-fit rounded-full border px-3.5 py-2 text-[13px] ${
                      active
                        ? "border-brand bg-brand-light font-semibold text-brand-dark"
                        : "border-line bg-card text-[#3a3d40]"
                    }`}
                  >
                    {opt}
                  </button>
                );
              })}
            </div>
            <div className="shrink-0 px-5 pb-8 pt-3">
              <button
                onClick={() => onSave(multi)}
                className="w-full rounded-2xl bg-brand py-3.5 text-center font-bold text-white"
              >
                저장
              </button>
            </div>
          </>
        )}

        {config.mode === "text" && (
          <form
            className="px-5 pb-8"
            onSubmit={(e) => {
              e.preventDefault();
              onSave(text.trim() || null);
            }}
          >
            <input
              autoFocus
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder={config.placeholder}
              inputMode={config.inputMode ?? "text"}
              className="mb-4 w-full rounded-xl border border-line bg-[#f7f7f5] px-4 py-3.5 text-sm outline-none focus:border-brand"
            />
            <button
              type="submit"
              className="w-full rounded-2xl bg-brand py-3.5 text-center font-bold text-white"
            >
              저장
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
