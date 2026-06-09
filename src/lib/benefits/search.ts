// 혜택 검색 (가벼운 하이브리드: 하드필터 + facet/키워드 점수화).
// chat-service의 평면 카탈로그 덤프를 대체한다. 임베딩/pgroonga 없이 동작하는 1차 버전.
//
// 할루시네이션 방지 설계:
//  - 추천 후보는 항상 DB 실제 레코드. LLM은 이 중 id만 고른다(본 파일은 후보만 제공).
//  - matched=false(무신호/매칭 0건)면 빈 후보를 반환해, 챗봇이 "없음"을 정직하게 말하도록 한다.
//    (예전처럼 최근 항목으로 억지 폴백 추천하지 않는다.)

import { SEED_BENEFITS } from "@/lib/benefits/seed";
import { canonSido, extractSignals, sidoDbPrefix } from "@/lib/benefits/keywords";
import { createServiceClient } from "@/lib/supabase/server";

export interface SearchProfile {
  region?: string;
  jobStatus?: string;
  interests?: string[];
}

export interface CatalogItem {
  id: string;
  name: string;
  summary: string;
  category: string;
  region: string;
  target: string;
  provider: string;
  source: string;
}

export interface SearchResult {
  items: CatalogItem[];
  /** true = 사용자 신호 기반 실제 매칭. false = 무신호 또는 매칭 0건(추천 금지) */
  matched: boolean;
}

interface BenefitSearchRow {
  id: string;
  title: string;
  plain_summary: string | null;
  benefit_summary: string | null;
  target_summary: string | null;
  provider: string | null;
  source: string;
  category: string | null;
  region_scope: string | null;
  region_sido: string | null;
  themes: string[] | null;
  life_stages: string[] | null;
  household_types: string[] | null;
  deadline: string | null;
}

const SELECT =
  "id, title, plain_summary, benefit_summary, target_summary, provider, source, category, region_scope, region_sido, themes, life_stages, household_types, deadline";

function supabaseReady(): boolean {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY,
  );
}

function seedCatalog(): CatalogItem[] {
  return SEED_BENEFITS.map((b) => ({
    id: b.id,
    name: b.name,
    summary: b.summary,
    category: b.category,
    region: b.region,
    target: b.conditions.join(", "),
    provider: b.agency,
    source: "seed",
  }));
}

function toCatalogItem(row: BenefitSearchRow): CatalogItem {
  return {
    id: row.id,
    name: row.title,
    summary: row.plain_summary ?? row.benefit_summary ?? "",
    category: row.category ?? "기타",
    region: row.region_scope ?? "전국",
    target: row.target_summary ?? "",
    provider: row.provider ?? "",
    source: row.source,
  };
}

/** PostgREST or() 조건용: 배열 ov 값은 따옴표로 감싼다 (·, 공백 안전) */
function ovClause(col: string, values: string[]): string | null {
  if (!values.length) return null;
  const list = values.map((v) => `"${v.replace(/"/g, "")}"`).join(",");
  return `${col}.ov.{${list}}`;
}

function overlapCount(a: string[] | null, b: string[]): number {
  if (!a?.length || !b.length) return 0;
  const set = new Set(a);
  return b.filter((x) => set.has(x)).length;
}

/**
 * 사용자 메시지 + 프로필 → 관련도 높은 혜택 후보 (LLM 전달용).
 * 1) 지역 하드필터(SQL): 전국(region_sido null) + 사용자 시도 한정
 * 2) 신호 필터(SQL): themes/household/life overlap 또는 본문 ilike
 * 3) JS 점수화 후 상위 N
 *
 * @returns matched=false면 추천하면 안 되는 상태(무신호/매칭 0건).
 */
export async function searchCatalog(
  message: string,
  profile?: SearchProfile,
  limit = 40,
): Promise<SearchResult> {
  if (!supabaseReady()) return { items: seedCatalog().slice(0, limit), matched: false };

  // 프로필 관심사·고용상태도 신호로 합침
  const extraText = [profile?.jobStatus, ...(profile?.interests ?? [])].filter(Boolean).join(" ");
  const sig = extractSignals(`${message} ${extraText}`);

  const userCanon = canonSido(profile?.region);
  const dbPrefix = sidoDbPrefix(userCanon);

  // 신호 필터 조립
  const orParts: string[] = [];
  const themesOv = ovClause("themes", sig.themes);
  const houseOv = ovClause("household_types", sig.households);
  const lifeOv = ovClause("life_stages", sig.lifeStages);
  if (themesOv) orParts.push(themesOv);
  if (houseOv) orParts.push(houseOv);
  if (lifeOv) orParts.push(lifeOv);
  for (const kw of sig.keywords.slice(0, 6)) {
    const safe = kw.replace(/[%,()*]/g, "");
    if (!safe) continue;
    orParts.push(`title.ilike.*${safe}*`);
    orParts.push(`plain_summary.ilike.*${safe}*`);
    orParts.push(`benefit_summary.ilike.*${safe}*`);
  }

  const supabase = createServiceClient();

  // 신호가 전혀 없으면: 추천 금지 상태(matched=false). 후보를 비워 챗봇이 되묻게 한다.
  if (orParts.length === 0) {
    return { items: [], matched: false };
  }

  // 신호 기반 검색
  let query = supabase.from("benefits").select(SELECT);
  if (dbPrefix) query = query.or(`region_sido.is.null,region_sido.ilike.${dbPrefix}%`);
  query = query.or(orParts.join(","));

  const { data, error } = await query.limit(300);
  if (error) {
    // 검색 자체 실패 → 안전하게 빈 결과(억지 추천 금지)
    return { items: [], matched: false };
  }

  const rows = (data as BenefitSearchRow[]) ?? [];
  if (!rows.length) {
    // 신호는 있었으나 매칭 0건 = 진짜 "맞는 혜택 없음"
    return { items: [], matched: false };
  }

  const scored = rows.map((row) => {
    let score = 0;
    if (row.region_sido == null) score += 2;
    else if (userCanon && canonSido(row.region_sido) === userCanon) score += 6;
    score += overlapCount(row.household_types, sig.households) * 4;
    score += overlapCount(row.themes, sig.themes) * 3;
    score += overlapCount(row.life_stages, sig.lifeStages) * 2;
    const hay = `${row.title} ${row.plain_summary ?? ""} ${row.benefit_summary ?? ""}`;
    for (const kw of sig.keywords) if (hay.includes(kw)) score += 2;
    if (row.deadline) score += 1;
    return { row, score };
  });

  scored.sort((a, b) => b.score - a.score);
  return { items: scored.slice(0, limit).map((s) => toCatalogItem(s.row)), matched: true };
}
