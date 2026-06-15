#!/usr/bin/env node
// 임베딩 안 된 혜택만 골라 채운다 (페이지 스킵 없이 효율적).
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
    if (i > -1) v[t.slice(0, i).trim()] = t.slice(i + 1).trim().replace(/^["']|["']$/g, "");
  }
  return v;
}
const env = { ...loadEnv(resolve(root, ".env.local")), ...process.env };
const sb = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);
const model = new GoogleGenerativeAI(env.GEMINI_API_KEY).getGenerativeModel({
  model: env.GEMINI_EMBEDDING_MODEL || "gemini-embedding-001",
});
const DIM = 1536;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const req = (t) => ({ content: { parts: [{ text: t.slice(0, 8000) }], role: "user" }, outputDimensionality: DIM });

async function pageAll(table, col, extra) {
  const out = [];
  for (let from = 0; ; from += 1000) {
    let q = sb.from(table).select(col).order(col === "id" ? "id" : "benefit_id").range(from, from + 999);
    if (extra) q = extra(q);
    const { data, error } = await q;
    if (error) throw new Error(error.message);
    if (!data?.length) break;
    out.push(...data);
    if (data.length < 1000) break;
  }
  return out;
}

async function upsertChunked(rows) {
  let failed = 0;
  for (let i = 0; i < rows.length; i += 25) {
    const part = rows.slice(i, i + 25);
    let ok = false;
    for (let a = 0; a < 4 && !ok; a++) {
      const { error } = await sb.from("benefit_embeddings").upsert(part, { onConflict: "benefit_id,content_type" });
      if (!error) ok = true;
      else await sleep(1500);
    }
    if (!ok) failed += part.length;
  }
  return failed;
}

const buildText = (b) =>
  [b.title, b.benefit_summary || b.plain_summary, b.target_summary, b.requirements, b.region_scope, (b.themes || []).join(" "), (b.life_stages || []).join(" "), (b.household_types || []).join(" ")]
    .filter(Boolean)
    .join(" / ")
    .slice(0, 8000);

(async () => {
  const t0 = Date.now();
  const allIds = (await pageAll("benefits", "id")).map((r) => r.id);
  const doneIds = new Set(
    (await pageAll("benefit_embeddings", "benefit_id", (q) => q.eq("content_type", "catalog"))).map((r) => r.benefit_id),
  );
  const missing = allIds.filter((id) => !doneIds.has(id));
  console.log(`전체 ${allIds.length} / 적재됨 ${doneIds.size} / 남음 ${missing.length}`);

  let done = 0;
  for (let i = 0; i < missing.length; i += 100) {
    const ids = missing.slice(i, i + 100);
    const { data: rows } = await sb
      .from("benefits")
      .select("id,title,benefit_summary,plain_summary,target_summary,requirements,region_scope,themes,life_stages,household_types")
      .in("id", ids);
    if (!rows?.length) continue;
    const vectors = await model.batchEmbedContents({ requests: rows.map((b) => req(buildText(b))) });
    const payload = rows.map((b, idx) => ({
      benefit_id: b.id,
      content_type: "catalog",
      embedding: `[${vectors.embeddings[idx].values.join(",")}]`,
    }));
    const failed = await upsertChunked(payload);
    done += rows.length - failed;
    process.stdout.write(`\r채움 ${done}/${missing.length} · ${Math.round((Date.now() - t0) / 1000)}s`);
    await sleep(150);
  }
  console.log(`\n완료: ${done}건 추가, ${Math.round((Date.now() - t0) / 1000)}s`);
})().catch((e) => {
  console.error("\n실패:", e.message);
  process.exit(1);
});
