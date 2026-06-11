import { ensureSummary } from "@/lib/ai/summary-service";
import { dbRowToBenefit, dbRowToCatalogItem } from "@/lib/benefits/map-db";
import { createServiceClient } from "@/lib/supabase/server";
import type { TablesInsert } from "@/lib/supabase/database.types";
import type { Benefit } from "@/lib/types";

export async function listBenefits(limit = 80): Promise<Benefit[]> {
  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from("benefits")
    .select("*")
    .order("updated_at", { ascending: false })
    .limit(limit);

  if (error || !data?.length) return [];
  return data.map((row) => dbRowToBenefit(row));
}

/**
 * 혜택 상세 조회 — 쉬운 말 요약(PRD 3.3)이 없으면 이 시점에 생성해 캐싱한다.
 * 요약 생성 실패 시에도 원문 필드 기반으로 항상 동작한다.
 */
export async function getBenefitById(id: string): Promise<Benefit | undefined> {
  const supabase = createServiceClient();
  const { data: row } = await supabase.from("benefits").select("*").eq("id", id).maybeSingle();
  if (!row) return undefined;

  const { data: existing } = await supabase
    .from("benefit_summaries")
    .select("*")
    .eq("benefit_id", id)
    .maybeSingle();

  const summary = await ensureSummary(row, existing);
  return dbRowToBenefit(row, summary);
}

export async function listBenefitsByIds(ids: string[]): Promise<Benefit[]> {
  if (!ids.length) return [];
  const supabase = createServiceClient();
  const [{ data: rows }, { data: summaries }] = await Promise.all([
    supabase.from("benefits").select("*").in("id", ids),
    supabase.from("benefit_summaries").select("*").in("benefit_id", ids),
  ]);
  const summaryMap = new Map((summaries ?? []).map((s) => [s.benefit_id, s]));
  return (rows ?? []).map((row) => dbRowToBenefit(row, summaryMap.get(row.id)));
}

export async function listCatalogForLlm(limit = 60) {
  const supabase = createServiceClient();
  const { data } = await supabase
    .from("benefits")
    .select("id, title, plain_summary, benefit_summary, tags, region_scope, target_summary, provider, source")
    .order("updated_at", { ascending: false })
    .limit(limit);

  if (!data?.length) return [];

  return data.map((row) =>
    dbRowToCatalogItem({
      ...row,
      external_id: null,
      raw_content: null,
      requirements: null,
      documents: null,
      apply_start: null,
      deadline: null,
      apply_url: null,
      review_status: null,
      collected_at: null,
      updated_at: null,
      region_sido: null,
      region_sigungu: null,
      life_stages: [],
      household_types: [],
      themes: [],
      category: null,
    }),
  );
}

export async function upsertBenefitRow(row: TablesInsert<"benefits">): Promise<string | null> {
  const supabase = createServiceClient();
  const { data: existing } = await supabase
    .from("benefits")
    .select("id")
    .eq("source", row.source)
    .eq("external_id", row.external_id ?? "")
    .maybeSingle();

  const now = new Date().toISOString();
  const payload = { ...row, updated_at: now, collected_at: row.collected_at ?? now };

  if (existing?.id) {
    const { error } = await supabase.from("benefits").update(payload).eq("id", existing.id);
    if (error) throw new Error(`benefits update: ${error.message}`);
    return existing.id;
  }

  const { data, error } = await supabase.from("benefits").insert(payload).select("id").single();
  if (error) throw new Error(`benefits insert: ${error.message}`);
  return data.id;
}
