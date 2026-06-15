// 혜택 검색 (가벼운 하이브리드: 하드필터 + facet/키워드 점수화).
// chat-service의 평면 카탈로그 덤프를 대체한다. 임베딩/pgroonga 없이 동작하는 1차 버전.
//
// 할루시네이션 방지 설계:
//  - 추천 후보는 항상 DB 실제 레코드. LLM은 이 중 id만 고른다(본 파일은 후보만 제공).
//  - matched=false(무신호/매칭 0건)면 빈 후보를 반환해, 챗봇이 "없음"을 정직하게 말하도록 한다.
//    (예전처럼 최근 항목으로 억지 폴백 추천하지 않는다.)

import { embedQuery } from "@/lib/ai/embedding";
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
// 벡터 의미검색 임계값. 한국어 짧은 질의는 무관해도 ~0.58 기본 유사도가 깔리므로 그 위를 신호로 본다.
const VEC_STRONG = 0.6; // 키워드 신호가 전혀 없을 때 "추천 가능" 판단 (노이즈 0.58 위)
const VEC_WEAK = 0.58; // RRF에 포함할 최소 유사도
const RRF_K = 60;
// 키워드(정확 일치)를 벡터(의미 근사)보다 무겁게 → 정밀도↑. 벡터는 사전 누락분 보강용.
const KW_WEIGHT = 1.6;
const VEC_WEIGHT = 1.0;

async function keywordRanked(
  supabase: ReturnType<typeof createServiceClient>,
  sig: ReturnType<typeof extractSignals>,
  userCanon: string | null,
  dbPrefix: string | null,
): Promise<BenefitSearchRow[]> {
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
    orParts.push(`title.ilike.*${safe}*`, `plain_summary.ilike.*${safe}*`, `benefit_summary.ilike.*${safe}*`);
  }
  if (orParts.length === 0) return [];

  let query = supabase.from("benefits").select(SELECT);
  if (dbPrefix) query = query.or(`region_sido.is.null,region_sido.ilike.${dbPrefix}%`);
  query = query.or(orParts.join(","));
  const { data } = await query.limit(300);
  const rows = (data as BenefitSearchRow[]) ?? [];

  return rows
    .map((row) => {
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
    })
    .sort((a, b) => b.score - a.score)
    .map((s) => s.row);
}

/**
 * 하이브리드 검색: 키워드/facet 검색 + 벡터(pgvector) 의미검색을 RRF로 융합.
 * - 임베딩 미적재/오류 시 키워드 검색만으로 동작(폴백).
 * - 키워드 신호도 없고 의미적으로도 약하면 matched=false (챗봇이 되묻게).
 */
export async function searchCatalog(
  message: string,
  profile?: SearchProfile,
  limit = 40,
): Promise<SearchResult> {
  const extraText = [profile?.jobStatus, ...(profile?.interests ?? [])].filter(Boolean).join(" ");
  const sig = extractSignals(`${message} ${extraText}`);
  const userCanon = canonSido(profile?.region);
  const dbPrefix = sidoDbPrefix(userCanon);
  const supabase = createServiceClient();

  // 1) 키워드/facet 후보
  const kwRows = await keywordRanked(supabase, sig, userCanon, dbPrefix);
  const kwIds = kwRows.map((r) => r.id);

  // 2) 벡터 의미검색 (임베딩 있으면). 실패해도 키워드로 폴백.
  let vecHits: { benefit_id: string; similarity: number }[] = [];
  try {
    const qvec = await embedQuery(`${message} ${extraText}`.slice(0, 2000));
    const { data } = await supabase.rpc("match_benefits", {
      query_embedding: qvec,
      match_count: 40,
    });
    vecHits = data ?? [];
  } catch {
    /* 임베딩/RPC 실패 → 키워드 결과만 사용 */
  }
  const bestSim = vecHits[0]?.similarity ?? 0;

  // 3) 추천 가능 여부
  const keywordMatched = kwIds.length > 0;
  const vectorMatched = bestSim >= VEC_STRONG;
  if (!keywordMatched && !vectorMatched) return { items: [], matched: false };

  // 4) RRF 융합 (키워드 순위 + 벡터 순위)
  const vecIds = vecHits.filter((h) => h.similarity >= VEC_WEAK).map((h) => h.benefit_id);
  const rrf = new Map<string, number>();
  kwIds.forEach((id, i) => rrf.set(id, (rrf.get(id) ?? 0) + KW_WEIGHT / (RRF_K + i + 1)));
  vecIds.forEach((id, i) => rrf.set(id, (rrf.get(id) ?? 0) + VEC_WEIGHT / (RRF_K + i + 1)));

  const topIds = [...rrf.entries()].sort((a, b) => b[1] - a[1]).slice(0, limit).map(([id]) => id);
  if (topIds.length === 0) return { items: [], matched: false };

  // 5) 후보 행 확보(키워드행 + 벡터 전용 id 보충) → topIds 순서대로 CatalogItem
  const rowMap = new Map<string, BenefitSearchRow>(kwRows.map((r) => [r.id, r]));
  const missing = topIds.filter((id) => !rowMap.has(id));
  if (missing.length) {
    const { data } = await supabase.from("benefits").select(SELECT).in("id", missing);
    (data as BenefitSearchRow[] | null)?.forEach((r) => rowMap.set(r.id, r));
  }

  const items = topIds
    .map((id) => rowMap.get(id))
    .filter((r): r is BenefitSearchRow => Boolean(r))
    .map((r) => toCatalogItem(r));

  return { items, matched: true };
}
