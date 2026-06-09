#!/usr/bin/env node
// search.ts의 핵심 SQL(지역 .or + facet .ov + 키워드 ilike)이 실제 DB에서 동작하는지 검증
import { readFileSync } from "node:fs";
import { createClient } from "@supabase/supabase-js";

const env = {};
for (const l of readFileSync(".env.local", "utf8").split("\n")) {
  const t = l.trim(); if (!t || t.startsWith("#")) continue;
  const i = t.indexOf("="); if (i < 0) continue;
  env[t.slice(0, i).trim()] = t.slice(i + 1).trim().replace(/^["']|["']$/g, "");
}
const sb = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);
const SELECT = "id, title, source, category, region_sido, themes, household_types, life_stages";

const ov = (col, vals) => vals.length ? `${col}.ov.{${vals.map((v) => `"${v}"`).join(",")}}` : null;

async function scenario(label, { dbPrefix, themes = [], households = [], lifeStages = [], keywords = [] }) {
  let q = sb.from("benefits").select(SELECT);
  if (dbPrefix) q = q.or(`region_sido.is.null,region_sido.ilike.${dbPrefix}%`);
  const orParts = [];
  for (const c of [ov("themes", themes), ov("household_types", households), ov("life_stages", lifeStages)]) if (c) orParts.push(c);
  for (const kw of keywords) { orParts.push(`title.ilike.*${kw}*`); orParts.push(`plain_summary.ilike.*${kw}*`); }
  if (orParts.length) q = q.or(orParts.join(","));
  const { data, error } = await q.limit(300);
  console.log(`\n=== ${label} ===`);
  if (error) { console.log("  ❌", error.message); return; }
  console.log(`  후보 ${data.length}건 (상위 5 + 지역분포)`);
  for (const r of data.slice(0, 5)) console.log(`   - [${r.region_sido ?? "전국"}/${r.category}] ${r.title}`);
  const byRegion = {};
  for (const r of data) { const k = r.region_sido ?? "전국"; byRegion[k] = (byRegion[k] || 0) + 1; }
  console.log("  지역분포:", Object.entries(byRegion).sort((a,b)=>b[1]-a[1]).slice(0,5).map(([k,v])=>`${k}:${v}`).join(", "));
}

// "퇴사해서 월세가 부담돼" + 서울 거주
await scenario('"퇴사해서 월세가 부담돼" (서울)', { dbPrefix: "서울", themes: ["일자리", "주거"], keywords: ["퇴사", "월세"] });
// "부모님 병원비가 많이 나와" 지역 미상
await scenario('"부모님 병원비가 많이 나와" (지역미상)', { themes: ["신체건강"], lifeStages: ["노년"], keywords: ["병원"] });
// "광주 사는데 저소득 노인 돌봄"
await scenario('"광주 저소득 노인 돌봄"', { dbPrefix: "광주", themes: ["보호·돌봄"], households: ["저소득"], lifeStages: ["노년"], keywords: ["돌봄"] });
// 신호 없음 폴백 확인 (전남 거주, 무신호)
await scenario('무신호 폴백 (전남, 신호없음)', { dbPrefix: "전라남" });
