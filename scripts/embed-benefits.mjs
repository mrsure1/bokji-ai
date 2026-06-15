#!/usr/bin/env node
/**
 * benefits → 임베딩 생성 → benefit_embeddings(vector(1536)) 적재.
 * - 기본: 아직 임베딩 없는 혜택만(증분). `--all`이면 전체 재생성.
 * 사용: node scripts/embed-benefits.mjs [--all]
 */
import { readFileSync, existsSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { createClient } from "@supabase/supabase-js";
import { GoogleGenerativeAI } from "@google/generative-ai";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
function loadEnv(p) {
  if (!existsSync(p)) return {};
  const v = {};
  for (const line of readFileSync(p, "utf-8").split("\n")) {
    const t = line.trim();
    if (!t || t.startsWith("#")) continue;
    const i = t.indexOf("=");
    if (i === -1) continue;
    v[t.slice(0, i).trim()] = t.slice(i + 1).trim().replace(/^["']|["']$/g, "");
  }
  return v;
}
const env = { ...loadEnv(resolve(root, ".env.local")), ...process.env };

const SUPABASE_URL = env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_KEY = env.SUPABASE_SERVICE_ROLE_KEY;
const GEMINI_KEY = env.GEMINI_API_KEY;
const EMBED_MODEL = env.GEMINI_EMBEDDING_MODEL || "gemini-embedding-001";
const DIM = 1536;
const BATCH = 100;
const ALL = process.argv.includes("--all");

if (!SUPABASE_URL || !SERVICE_KEY || !GEMINI_KEY) {
  console.error("NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, GEMINI_API_KEY 필요");
  process.exit(1);
}

const sb = createClient(SUPABASE_URL, SERVICE_KEY);
const model = new GoogleGenerativeAI(GEMINI_KEY).getGenerativeModel({ model: EMBED_MODEL });

function buildText(b) {
  return [
    b.title,
    b.benefit_summary || b.plain_summary,
    b.target_summary,
    b.requirements,
    b.region_scope,
    (b.themes || []).join(" "),
    (b.life_stages || []).join(" "),
    (b.household_types || []).join(" "),
  ]
    .filter(Boolean)
    .join(" / ")
    .slice(0, 8000);
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function embedBatch(texts) {
  const res = await model.batchEmbedContents({
    requests: texts.map((t) => ({
      content: { parts: [{ text: t }], role: "user" },
      outputDimensionality: DIM,
    })),
  });
  return res.embeddings.map((e) => e.values);
}

async function alreadyEmbedded(ids) {
  if (!ids.length) return new Set();
  const done = new Set();
  for (let i = 0; i < ids.length; i += 1000) {
    const slice = ids.slice(i, i + 1000);
    const { data } = await sb
      .from("benefit_embeddings")
      .select("benefit_id")
      .eq("content_type", "catalog")
      .in("benefit_id", slice);
    (data || []).forEach((r) => done.add(r.benefit_id));
  }
  return done;
}

async function main() {
  const t0 = Date.now();
  let from = 0;
  const PAGE = 1000;
  let totalEmbedded = 0;
  let totalSkipped = 0;

  for (;;) {
    const { data: rows, error } = await sb
      .from("benefits")
      .select(
        "id, title, benefit_summary, plain_summary, target_summary, requirements, region_scope, themes, life_stages, household_types",
      )
      .order("id", { ascending: true })
      .range(from, from + PAGE - 1);
    if (error) throw new Error(error.message);
    if (!rows || rows.length === 0) break;

    const skip = ALL ? new Set() : await alreadyEmbedded(rows.map((r) => r.id));
    const todo = rows.filter((r) => !skip.has(r.id));
    totalSkipped += rows.length - todo.length;

    for (let i = 0; i < todo.length; i += BATCH) {
      const chunk = todo.slice(i, i + BATCH);
      const vectors = await embedBatch(chunk.map(buildText));
      const payload = chunk.map((b, idx) => ({
        benefit_id: b.id,
        content_type: "catalog",
        embedding: `[${vectors[idx].join(",")}]`,
      }));
      const { error: upErr } = await sb
        .from("benefit_embeddings")
        .upsert(payload, { onConflict: "benefit_id,content_type" });
      if (upErr) throw new Error(`upsert: ${upErr.message}`);
      totalEmbedded += chunk.length;
      process.stdout.write(
        `\r적재 ${totalEmbedded}건 (건너뜀 ${totalSkipped}) · ${Math.round((Date.now() - t0) / 1000)}s`,
      );
      await sleep(150);
    }

    from += PAGE;
  }

  console.log(
    `\n완료: 신규 임베딩 ${totalEmbedded}건, 기존 건너뜀 ${totalSkipped}건, ${Math.round((Date.now() - t0) / 1000)}s`,
  );
}

main().catch((e) => {
  console.error("\n실패:", e.message);
  process.exit(1);
});
