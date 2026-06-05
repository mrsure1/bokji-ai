"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { ddayLabel, FIT_META, getBenefit } from "@/lib/data";
import { useApp } from "@/store/AppStore";

export default function BenefitDetailPage() {
  const { id } = useParams<{ id: string }>();
  const benefit = getBenefit(id);
  const { isSaved, toggleSave, isChecked, toggleDoc } = useApp();

  if (!benefit) {
    return (
      <main className="flex flex-1 flex-col items-center justify-center gap-4 p-8 text-center">
        <p className="text-sm text-muted">혜택을 찾을 수 없어요.</p>
        <Link href="/" className="rounded-xl bg-brand px-5 py-3 text-sm font-semibold text-white">홈으로</Link>
      </main>
    );
  }

  const saved = isSaved(benefit.id);
  const fit = FIT_META[benefit.fit];
  const urgent = benefit.dday !== null && benefit.dday <= 14;

  const summaryRows: [string, string][] = [
    ["누가", benefit.detail.who],
    ["얼마·무엇", benefit.detail.what],
    ["언제까지", benefit.detail.when],
    ["어디서·어떻게", benefit.detail.how],
  ];

  return (
    <main className="flex-1 pb-28">
      <header className="sticky top-0 z-10 flex items-center gap-3 border-b border-line bg-card/95 px-4 py-3.5 backdrop-blur">
        <Link href="/" aria-label="뒤로" className="text-lg text-[#3a3d40]">‹</Link>
        <b className="flex-1 truncate text-base">{benefit.name}</b>
        <button onClick={() => toggleSave(benefit.id)} aria-label="저장" className="text-lg">
          {saved ? "🔖" : "🏷️"}
        </button>
      </header>

      <div className="px-5 pt-5">
        <div className="mb-3 flex flex-wrap items-center gap-2">
          <span className={`rounded-md px-2 py-1 font-display text-[11px] font-bold ${fit.tone === "brand" ? "bg-brand-light text-brand-dark" : "bg-amber-light text-amber-dark"}`}>
            {fit.label}
          </span>
          <span className={`rounded-md px-2 py-1 font-display text-[11px] font-extrabold ${urgent ? "bg-coral-light text-coral" : "bg-brand-light text-brand-dark"}`}>
            {ddayLabel(benefit.dday)}
          </span>
          <span className="text-xs text-muted">{benefit.region} · {benefit.category}</span>
        </div>

        <h1 className="text-[22px] font-bold tracking-tight">{benefit.name}</h1>
        <p className="mt-2 font-display text-[30px] font-extrabold leading-none text-brand">
          {benefit.amount}
          {benefit.amountNote && <span className="font-display text-sm font-semibold text-muted"> / {benefit.amountNote}</span>}
        </p>

        {/* 쉬운 말 요약 */}
        <section className="mt-5 rounded-2xl border border-line bg-card p-4">
          <p className="mb-3 text-[15px] font-bold leading-snug">💡 {benefit.summary}</p>
          <dl className="flex flex-col gap-3">
            {summaryRows.map(([k, v]) => (
              <div key={k} className="flex gap-3">
                <dt className="w-16 shrink-0 text-[13px] font-semibold text-brand-dark">{k}</dt>
                <dd className="flex-1 text-[13px] leading-relaxed text-[#3a3d40]">{v}</dd>
              </div>
            ))}
          </dl>
        </section>

        {/* 준비 서류 체크리스트 */}
        <h2 className="mb-2.5 mt-6 px-1 text-sm font-bold">준비 서류</h2>
        <ul className="flex flex-col gap-2.5 rounded-2xl border border-line bg-card p-4">
          {benefit.documents.map((doc) => {
            const checked = isChecked(benefit.id, doc);
            return (
              <li key={doc}>
                <button
                  onClick={() => toggleDoc(benefit.id, doc)}
                  className={`flex w-full items-center gap-2.5 text-[13.5px] ${checked ? "text-muted line-through" : "text-[#3a3d40]"}`}
                >
                  <span className={`flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded-md border-[1.5px] text-[11px] ${checked ? "border-brand bg-brand text-white" : "border-[#cfd4cf]"}`}>
                    {checked ? "✓" : ""}
                  </span>
                  {doc}
                </button>
              </li>
            );
          })}
        </ul>

        {/* 헷갈리는 용어 풀이 */}
        {benefit.detail.terms.length > 0 && (
          <>
            <h2 className="mb-2.5 mt-6 px-1 text-sm font-bold">헷갈리는 말 풀이</h2>
            <div className="flex flex-col gap-2.5 rounded-2xl border border-line bg-card p-4">
              {benefit.detail.terms.map((t) => (
                <p key={t.term} className="text-[13px] leading-relaxed">
                  <b className="text-brand-dark">{t.term}</b> — <span className="text-[#3a3d40]">{t.plain}</span>
                </p>
              ))}
            </div>
          </>
        )}

        <p className="mt-5 px-1 text-xs text-muted">문의: {benefit.agency}</p>
      </div>

      {/* 하단 고정 신청 바 */}
      <div className="fixed bottom-0 left-1/2 z-20 w-full max-w-[480px] -translate-x-1/2 border-t border-line bg-card/95 px-5 py-3.5 backdrop-blur">
        <div className="flex gap-2.5">
          <button onClick={() => toggleSave(benefit.id)} className="rounded-2xl bg-[#f1f1ef] px-5 py-3.5 text-sm font-semibold text-[#3a3d40]">
            {saved ? "저장됨" : "저장"}
          </button>
          <a
            href={benefit.applyUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 rounded-2xl bg-brand py-3.5 text-center text-sm font-bold text-white shadow-[0_12px_22px_-12px_rgba(24,160,88,0.6)]"
          >
            신청하러 가기 →
          </a>
        </div>
      </div>
    </main>
  );
}
