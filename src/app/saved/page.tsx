"use client";

import Link from "next/link";
import { useState } from "react";
import { ddayLabel, getBenefit } from "@/lib/data";
import { useApp } from "@/store/AppStore";

type Filter = "all" | "urgent" | "always";
const FILTERS: { key: Filter; label: string }[] = [
  { key: "all", label: "전체" },
  { key: "urgent", label: "마감 임박" },
  { key: "always", label: "상시 접수" },
];

export default function SavedPage() {
  const { savedIds, isChecked, toggleDoc, toggleSave } = useApp();
  const [filter, setFilter] = useState<Filter>("all");

  const benefits = savedIds.map(getBenefit).filter((b): b is NonNullable<typeof b> => b !== undefined);
  const urgentCount = benefits.filter((b) => b.dday !== null && b.dday <= 14).length;
  const visible = benefits.filter((b) =>
    filter === "urgent" ? b.dday !== null && b.dday <= 14 : filter === "always" ? b.dday === null : true
  );

  return (
    <main className="flex-1 px-5 pb-24 pt-5">
      <header className="mb-4">
        <h1 className="text-xl font-bold">보관함</h1>
      </header>

      {benefits.length === 0 ? (
        <div className="mt-24 text-center">
          <p className="text-4xl">🔖</p>
          <p className="mt-3 text-sm text-muted">아직 저장한 혜택이 없어요.</p>
          <Link href="/" className="mt-4 inline-block rounded-xl bg-brand px-5 py-3 text-sm font-semibold text-white">
            혜택 보러 가기
          </Link>
        </div>
      ) : (
        <>
          <div className="mb-4 flex gap-2.5">
            <Stat value={benefits.length} label="저장한 혜택" />
            <Stat value={urgentCount} label="마감 임박" tone="coral" />
            <Stat value={benefits.filter((b) => b.dday !== null).length} label="마감 있음" />
          </div>

          <div className="mb-3.5 flex gap-2">
            {FILTERS.map((f) => (
              <button
                key={f.key}
                onClick={() => setFilter(f.key)}
                className={`rounded-full px-3 py-[7px] text-xs ${
                  filter === f.key ? "bg-ink text-white" : "border border-line bg-card text-muted"
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>

          {visible.length === 0 && (
            <p className="mt-10 text-center text-sm text-muted">해당하는 혜택이 없어요.</p>
          )}

          {visible.map((b) => {
            const done = b.documents.filter((d) => isChecked(b.id, d)).length;
            const urgent = b.dday !== null && b.dday <= 14;
            return (
              <article
                key={b.id}
                className={`mb-3.5 rounded-2xl border bg-card p-4 shadow-[0_2px_10px_rgba(0,0,0,0.03)] ${
                  urgent ? "border-[#f6dada]" : "border-line"
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <Link href={`/benefit/${b.id}`} className="text-[15px] font-bold tracking-tight">
                    {b.name}
                  </Link>
                  <span
                    className={`shrink-0 rounded-md px-2 py-[5px] font-display text-[11px] font-extrabold ${
                      urgent ? "bg-coral-light text-coral" : "bg-brand-light text-brand-dark"
                    }`}
                  >
                    {ddayLabel(b.dday)}
                  </span>
                </div>

                <p className="mb-2 mt-2.5 text-xs text-muted">
                  신청 서류 <b className="text-brand-dark">{done}/{b.documents.length}</b> 준비됨
                </p>
                <div className="mb-3 h-1.5 overflow-hidden rounded-full bg-[#eef0ee]">
                  <span
                    className="block h-full rounded-full bg-brand transition-all"
                    style={{ width: `${(done / b.documents.length) * 100}%` }}
                  />
                </div>

                <ul className="mb-3 flex flex-col gap-2.5">
                  {b.documents.map((doc) => {
                    const checked = isChecked(b.id, doc);
                    return (
                      <li key={doc}>
                        <button
                          onClick={() => toggleDoc(b.id, doc)}
                          className={`flex w-full items-center gap-2.5 text-[13px] ${
                            checked ? "text-muted" : "text-[#3a3d40]"
                          }`}
                        >
                          <span
                            className={`flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded-md border-[1.5px] text-[11px] ${
                              checked ? "border-brand bg-brand text-white" : "border-[#cfd4cf]"
                            }`}
                          >
                            {checked ? "✓" : ""}
                          </span>
                          {doc}
                        </button>
                      </li>
                    );
                  })}
                </ul>

                <div className="flex gap-2">
                  <a
                    href={b.applyUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 rounded-xl bg-brand py-3 text-center text-sm font-bold text-white"
                  >
                    신청하러 가기 →
                  </a>
                  <button
                    onClick={() => toggleSave(b.id)}
                    className="rounded-xl bg-[#f1f1ef] px-4 py-3 text-sm text-[#3a3d40]"
                  >
                    저장 해제
                  </button>
                </div>
              </article>
            );
          })}
        </>
      )}
    </main>
  );
}

function Stat({ value, label, tone }: { value: number; label: string; tone?: "coral" }) {
  return (
    <div className="flex-1 rounded-2xl border border-line bg-card p-3 text-center">
      <b className={`block font-display text-[22px] leading-none ${tone === "coral" ? "text-coral" : ""}`}>
        {value}
      </b>
      <span className="text-[11px] text-muted">{label}</span>
    </div>
  );
}
