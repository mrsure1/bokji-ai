import { dbRowToBenefit, dbRowToCatalogItem } from "@/lib/benefits/map-db";
import { SEED_BENEFITS } from "@/lib/benefits/seed";
import { createServiceClient } from "@/lib/supabase/server";
import type { TablesInsert } from "@/lib/supabase/database.types";
import type { Benefit } from "@/lib/types";

function supabaseReady(): boolean {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY,
  );
}

export async function listBenefits(limit = 80): Promise<Benefit[]> {
  if (!supabaseReady()) return SEED_BENEFITS;

  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from("benefits")
    .select("*")
    .order("updated_at", { ascending: false })
    .limit(limit);

  if (error || !data?.length) return SEED_BENEFITS;
  return data.map((row) => dbRowToBenefit(row));
}

export async function getBenefitById(id: string): Promise<Benefit | undefined> {
  const seed = SEED_BENEFITS.find((b) => b.id === id);
  if (!supabaseReady()) return seed;

  const supabase = createServiceClient();
  const { data: row } = await supabase.from("benefits").select("*").eq("id", id).maybeSingle();
  if (!row) return seed;

  const { data: summary } = await supabase
    .from("benefit_summaries")
    .select("*")
    .eq("benefit_id", id)
    .maybeSingle();

  return dbRowToBenefit(row, summary);
}

export async function listCatalogForLlm(limit = 60) {
  if (!supabaseReady()) {
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

  const supabase = createServiceClient();
  const { data } = await supabase
    .from("benefits")
    .select("id, title, plain_summary, benefit_summary, tags, region_scope, target_summary, provider, source")
    .order("updated_at", { ascending: false })
    .limit(limit);

  if (!data?.length) {
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
  if (!supabaseReady()) return null;

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

export function countSeedBenefits(): number {
  return SEED_BENEFITS.length;
}
