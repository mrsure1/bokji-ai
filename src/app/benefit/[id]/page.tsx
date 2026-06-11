"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { ProgressScreen } from "@/components/ProgressScreen";
import { ddayLabel, FIT_META } from "@/lib/data";
import type { Benefit } from "@/lib/types";
import { useApp } from "@/store/AppStore";

export default function BenefitDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [benefit, setBenefit] = useState<Benefit | null>(null);
  const [loading, setLoading] = useState(true);
  const [revealed, setRevealed] = useState(false); // 진행률 100% 후 콘텐츠 노출
  const { isSaved, toggleSave, isChecked, toggleDoc } = useApp();

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(`/api/benefits/${id}`);
        if (res.ok) {
          const data = await res.json();
          if (!cancelled) setBenefit(data.benefit);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [id]);

  if (!revealed) {
    return (
      <ProgressScreen
        done={!loading}
        onDone={() => setRevealed(true)}
        icon="doc"
        messages={[
          "공고를 불러오고 있어요",
          "쉬운 말로 정리하는 중이에요",
          "준비 서류를 확인하고 있어요",
        ]}
      />
    );
  }

  if (!benefit) {
    return (
      <main className="flex flex-1 flex-col items-center justify-center gap-4 p-8 text-center">
        <p className="text-sm text-muted">혜택을 찾을 수 없어요.</p>
        <Link href="/" className="rounded-xl bg-brand px-5 py-3 text-sm font-semibold text-white">
          홈으로
        </Link>
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
    <main className="flex-1 pb-24">
      <header className="sticky top-0 z-10 flex items-center gap-3 border-b border-line bg-card/95 px-4 py-3.5 backdrop-blur">
        <button onClick={() => router.back()} aria-label="뒤로" className="text-lg text-[#3a3d40]">
          ‹
        </button>
        <b className="flex-1 truncate text-base">{benefit.name}</b>
        <button onClick={() => toggleSave(benefit)} className="text-xs font-semibold text-brand">
          {saved ? "저장됨" : "저장"}
        </button>
      </header>

      <div className="space-y-4 p-5">
        <div className="rounded-2xl border border-line bg-card p-4">
          <div className="mb-2 flex items-center justify-between">
            <span
              className={`rounded-md px-2 py-1 font-display text-[10px] font-bold ${
                fit.tone === "brand" ? "bg-brand-light text-brand-dark" : "bg-amber-light text-amber-dark"
              }`}
            >
              {fit.label}
            </span>
            <span className="font-display text-lg font-bold text-brand">{benefit.amount}</span>
          </div>
          <p className="text-sm leading-relaxed text-muted">{benefit.summary}</p>
          {urgent && benefit.dday !== null && (
            <p className="mt-2 text-xs font-semibold text-amber-dark">{ddayLabel(benefit.dday)}</p>
          )}
        </div>

        <section className="rounded-2xl border border-line bg-card p-4">
          <h2 className="mb-3 font-display text-sm font-bold">쉬운 말 요약</h2>
          <dl className="space-y-3">
            {summaryRows.map(([k, v]) => (
              <div key={k}>
                <dt className="text-[11px] font-semibold text-brand-dark">{k}</dt>
                <dd className="mt-0.5 text-[13px] leading-snug">{v}</dd>
              </div>
            ))}
          </dl>
          {benefit.detail.cautions && (
            <p className="mt-3 rounded-lg bg-amber-light px-3 py-2 text-[12px] leading-snug text-amber-dark">
              ⚠️ {benefit.detail.cautions}
            </p>
          )}
        </section>

        {benefit.detail.terms.length > 0 && (
          <section className="rounded-2xl border border-line bg-card p-4">
            <h2 className="mb-3 font-display text-sm font-bold">어려운 용어, 쉽게</h2>
            <dl className="space-y-2.5">
              {benefit.detail.terms.map((t) => (
                <div key={t.term} className="rounded-lg bg-[#f7f7f5] px-3 py-2.5">
                  <dt className="text-[12.5px] font-bold text-brand-dark">{t.term}</dt>
                  <dd className="mt-0.5 text-[12.5px] leading-snug text-[#3a3d40]">{t.plain}</dd>
                </div>
              ))}
            </dl>
          </section>
        )}

        {benefit.documents.length > 0 && (
          <section className="rounded-2xl border border-line bg-card p-4">
            <h2 className="mb-1 font-display text-sm font-bold">준비할 서류</h2>
            <p className="mb-3 text-[11px] text-muted">체크하면 보관함에 저장돼요</p>
            <ul className="space-y-2">
              {benefit.documents.map((doc) => (
                <li key={doc}>
                  <button
                    onClick={() => toggleDoc(benefit, doc)}
                    className="flex w-full items-center gap-2 rounded-lg bg-[#f7f7f5] px-3 py-2 text-left text-[13px]"
                  >
                    <span>{isChecked(benefit.id, doc) ? "✅" : "⬜"}</span>
                    {doc}
                  </button>
                </li>
              ))}
            </ul>
          </section>
        )}

        <a
          href={benefit.applyUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="block rounded-xl bg-brand py-3.5 text-center text-sm font-semibold text-white"
        >
          신청 안내 보기
        </a>
        <p className="text-center text-[11px] text-muted">{benefit.agency}</p>
      </div>
    </main>
  );
}
