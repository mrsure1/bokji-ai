import type { Tables } from "@/lib/supabase/database.types";
import type { Benefit, FitLevel } from "@/lib/types";

type BenefitRow = Tables<"benefits">;
type SummaryRow = Tables<"benefit_summaries">;

const CATEGORY_KEYWORDS: [string, string][] = [
  ["주거", "주거"],
  ["의료", "의료"],
  ["일자리", "일자리"],
  ["고용", "일자리"],
  ["취업", "일자리"],
  ["생계", "생계"],
  ["긴급", "생계"],
  ["육아", "육아"],
  ["아동", "육아"],
  ["교육", "교육"],
  ["장애", "장애"],
  ["노인", "노인"],
];

function inferCategory(row: BenefitRow): string {
  const hay = [row.title, ...(row.tags ?? []), row.benefit_summary ?? ""].join(" ");
  for (const [kw, cat] of CATEGORY_KEYWORDS) {
    if (hay.includes(kw)) return cat;
  }
  return row.tags?.[0] ?? "기타";
}

function inferAmount(row: BenefitRow): { amount: string; amountNote?: string } {
  const text = row.benefit_summary ?? row.plain_summary ?? "";
  const won = text.match(/(\d[\d,]*)\s*원/);
  if (won) return { amount: `${won[1]}원` };
  const month = text.match(/월\s*(\d[\d,]*)/);
  if (month) return { amount: `월 ${month[1]}원` };
  return { amount: "지원 내용 확인" };
}

function parseDday(deadline: string | null): { dday: number | null; deadlineLabel?: string } {
  if (!deadline || /상시|수시|없음|별도/i.test(deadline)) {
    return { dday: null };
  }
  const iso = deadline.match(/(\d{4})[-.](\d{1,2})[-.](\d{1,2})/);
  if (iso) {
    const end = new Date(Number(iso[1]), Number(iso[2]) - 1, Number(iso[3]));
    const diff = Math.ceil((end.getTime() - Date.now()) / 86400000);
    return { dday: diff > 0 ? diff : null, deadlineLabel: deadline.slice(0, 20) };
  }
  return { dday: null, deadlineLabel: deadline.slice(0, 30) };
}

function splitLines(text: string | null | undefined, max = 4): string[] {
  if (!text) return [];
  return text
    .split(/[\n,;·]/)
    .map((s) => s.trim())
    .filter(Boolean)
    .slice(0, max);
}

export function dbRowToBenefit(row: BenefitRow, summary?: SummaryRow | null): Benefit {
  const { amount, amountNote } = inferAmount(row);
  const { dday, deadlineLabel } = parseDday(row.deadline);
  const category = inferCategory(row);
  const fit: FitLevel = summary?.is_reviewed ? "high" : "check";

  const who = summary?.who ?? row.target_summary ?? "대상 조건을 확인해 주세요.";
  const what = summary?.what ?? row.benefit_summary ?? row.plain_summary ?? row.title;
  const when = summary?.when_text ?? row.deadline ?? "신청 기한을 확인해 주세요.";
  const how = summary?.how_text ?? row.apply_url ? "온라인 또는 담당 기관에서 신청" : "담당 기관에 문의";

  const termsRaw = summary?.terms;
  const terms =
    termsRaw && typeof termsRaw === "object" && !Array.isArray(termsRaw)
      ? Object.entries(termsRaw as Record<string, string>).map(([term, plain]) => ({
          term,
          plain,
        }))
      : [];

  return {
    id: row.id,
    name: row.title,
    summary: row.plain_summary ?? summary?.one_line ?? what.slice(0, 80),
    amount,
    amountNote,
    category,
    region: row.region_scope ?? "전국",
    fit,
    dday,
    deadlineLabel,
    conditions: splitLines(row.requirements ?? row.target_summary),
    documents: summary?.documents ?? row.documents ?? [],
    agency: row.provider ?? "담당 기관",
    applyUrl: row.apply_url ?? "https://www.gov.kr",
    detail: { who, what, when, how, terms },
  };
}

/** LLM 컨텍스트용 경량 카탈로그 항목 */
export function dbRowToCatalogItem(row: BenefitRow) {
  return {
    id: row.id,
    name: row.title,
    summary: row.plain_summary ?? row.benefit_summary ?? "",
    category: inferCategory(row),
    region: row.region_scope ?? "전국",
    target: row.target_summary ?? "",
    provider: row.provider ?? "",
    source: row.source,
  };
}
