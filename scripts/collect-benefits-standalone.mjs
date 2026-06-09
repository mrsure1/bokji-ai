#!/usr/bin/env node
/**
 * 복지로(중앙+지자체) + 정부24 → Supabase benefits (Next.js 서버 불필요)
 * 사용: npm run collect-benefits:direct
 *
 * ⚠️ src/lib/collector/* 의 TS 구현과 동일한 로직을 JS로 미러링한 러너입니다.
 *    (tsx 미설치 환경에서 전체 수집을 돌리기 위함. 매핑 변경 시 양쪽 동기화 필요)
 */
import { readFileSync, existsSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { createClient } from "@supabase/supabase-js";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");

function loadEnv(path) {
  if (!existsSync(path)) return {};
  const vars = {};
  for (const line of readFileSync(path, "utf-8").split("\n")) {
    const t = line.trim();
    if (!t || t.startsWith("#")) continue;
    const eq = t.indexOf("=");
    if (eq === -1) continue;
    vars[t.slice(0, eq).trim()] = t.slice(eq + 1).trim().replace(/^["']|["']$/g, "");
  }
  return vars;
}

const env = { ...loadEnv(resolve(root, ".env.local")), ...process.env };

const bokjiroKey = env.DATA_GO_KR_SERVICE_KEY;
const gov24Key = env.GOV24_SERVICE_KEY;
const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = env.SUPABASE_SERVICE_ROLE_KEY;

if (!bokjiroKey || !gov24Key) {
  console.error("DATA_GO_KR_SERVICE_KEY, GOV24_SERVICE_KEY 필요");
  process.exit(1);
}
if (!supabaseUrl || !serviceKey) {
  console.error("NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY 필요");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceKey);
const centralBase =
  env.BOKJIRO_CENTRAL_API_URL ?? "https://apis.data.go.kr/B554287/NationalWelfareInformationsV001";
const localBase =
  env.BOKJIRO_LOCAL_API_URL ?? "https://apis.data.go.kr/B554287/LocalGovernmentWelfareInformations";
const gov24Base = env.GOV24_API_BASE_URL ?? "https://api.odcloud.kr/api";

const decode = (s) =>
  s.replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"').replace(/&#39;/g, "'");
const getTag = (xml, tag) => {
  const m = xml.match(new RegExp(`<${tag}>([\\s\\S]*?)</${tag}>`));
  return decode(m?.[1]?.trim() ?? "");
};
const getBlocks = (xml, tag) => xml.match(new RegExp(`<${tag}>[\\s\\S]*?</${tag}>`, "g")) ?? [];
const blockToRecord = (block, tags) => {
  const r = {};
  for (const t of tags) r[t] = getTag(block, t);
  return r;
};
const chunk = (arr, n) => {
  const out = [];
  for (let i = 0; i < arr.length; i += n) out.push(arr.slice(i, i + n));
  return out;
};
// deadline 은 date 컬럼 → ISO 날짜만, 아니면 null ("상시신청" 등 자유텍스트 방어)
const toDateOrNull = (text) => {
  if (!text) return null;
  const ms = [...String(text).matchAll(/(\d{4})[-.\/](\d{1,2})[-.\/](\d{1,2})/g)];
  for (let i = ms.length - 1; i >= 0; i -= 1) {
    const y = Number(ms[i][1]);
    const mo = Number(ms[i][2]);
    const d = Number(ms[i][3]);
    const dt = new Date(Date.UTC(y, mo - 1, d));
    if (dt.getUTCFullYear() === y && dt.getUTCMonth() === mo - 1 && dt.getUTCDate() === d) {
      return `${y}-${String(mo).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
    }
  }
  return null;
};

// ── facet 정규화 (src/lib/benefits/facets.ts 미러) ──────────────────────────
const splitList = (s) =>
  (s ?? "")
    .split(/[,;]/)
    .map((x) => x.trim().replace(/\s*·\s*/g, "·").replace(/\s+/g, " "))
    .filter(Boolean)
    .filter((x) => x !== "구분없음" && x !== "전생애");
const uniq = (a) => [...new Set(a)];
const CATEGORY_KEYWORDS = [["주거","주거"],["임대","주거"],["전세","주거"],["월세","주거"],["에너지","주거"],["의료","의료"],["건강","의료"],["치료","의료"],["병원","의료"],["재활","의료"],["일자리","일자리"],["고용","일자리"],["취업","일자리"],["창업","일자리"],["서민금융","일자리"],["생계","생계"],["긴급","생계"],["생활지원","생계"],["보육","육아"],["육아","육아"],["출산","육아"],["임신","육아"],["산모","육아"],["교육","교육"],["장학","교육"],["학자금","교육"],["장애","장애"],["노인","노인"],["어르신","노인"],["노년","노인"],["돌봄","돌봄"],["요양","돌봄"],["보호","돌봄"],["문화","문화"],["여가","문화"]];
const LIFE_KEYWORDS = [["영유아","영유아"],["유아","영유아"],["아동","아동"],["청소년","청소년"],["청년","청년"],["중장년","중장년"],["노인","노년"],["어르신","노년"],["노년","노년"],["임신","임신·출산"],["출산","임신·출산"],["산모","임신·출산"]];
const HOUSEHOLD_KEYWORDS = [["다문화","다문화·탈북민"],["탈북","다문화·탈북민"],["북한이탈","다문화·탈북민"],["다자녀","다자녀"],["보훈","보훈대상자"],["국가유공","보훈대상자"],["장애","장애인"],["저소득","저소득"],["기초생활","저소득"],["차상위","저소득"],["한부모","한부모·조손"],["조손","한부모·조손"]];
const inferCategory = (text, themes) => {
  const hay = `${text} ${themes.join(" ")}`;
  for (const [kw, cat] of CATEGORY_KEYWORDS) if (hay.includes(kw)) return cat;
  return themes[0] ?? "기타";
};
const inferFromText = (text, dict) => uniq(dict.filter(([kw]) => text.includes(kw)).map(([, v]) => v));
function deriveFacets(source, raw) {
  if (source === "bokjiro-central") {
    const themes = uniq(splitList(raw.intrsThemaArray));
    return { region_sido: null, region_sigungu: null, life_stages: uniq(splitList(raw.lifeArray)), household_types: uniq(splitList(raw.trgterIndvdlArray)), themes, category: inferCategory(`${raw.servNm ?? ""} ${raw.servDgst ?? ""}`, themes) };
  }
  if (source === "bokjiro-local") {
    const themes = uniq(splitList(raw.intrsThemaNmArray));
    return { region_sido: (raw.ctpvNm ?? "").trim() || null, region_sigungu: (raw.sggNm ?? "").trim() || null, life_stages: uniq(splitList(raw.lifeNmArray)), household_types: uniq(splitList(raw.trgterIndvdlNmArray)), themes, category: inferCategory(`${raw.servNm ?? ""} ${raw.servDgst ?? ""}`, themes) };
  }
  if (source === "gov24") {
    const themes = uniq(splitList(raw["서비스분야"]));
    const text = `${raw["서비스명"] ?? ""} ${raw["서비스목적요약"] ?? ""} ${raw["지원대상"] ?? ""} ${raw["선정기준"] ?? ""}`;
    return { region_sido: null, region_sigungu: null, life_stages: inferFromText(text, LIFE_KEYWORDS), household_types: inferFromText(text, HOUSEHOLD_KEYWORDS), themes, category: inferCategory(text, themes) };
  }
  return { region_sido: null, region_sigungu: null, life_stages: [], household_types: [], themes: [], category: null };
}

/**
 * (source, external_id) unique 제약 기반 배치 upsert.
 * incoming 내 중복 servId는 마지막 것만 남기고(dedupe), onConflict로 멱등 처리.
 */
async function batchUpsert(rows) {
  if (!rows.length) return { upserted: 0, dupes: 0 };

  const map = new Map();
  for (const r of rows) map.set(r.external_id, r); // 중복 시 마지막 값 유지
  const deduped = [...map.values()];

  const now = new Date().toISOString();
  let upserted = 0;
  for (const batch of chunk(deduped, 500)) {
    const payload = batch.map((r) => ({ ...r, updated_at: now, collected_at: now }));
    const { error } = await supabase
      .from("benefits")
      .upsert(payload, { onConflict: "source,external_id" });
    if (error) throw error;
    upserted += payload.length;
  }

  return { upserted, dupes: rows.length - deduped.length };
}

const CENTRAL_TAGS = ["servId","servNm","servDgst","servDtlLink","jurMnofNm","jurOrgNm","lifeArray","trgterIndvdlArray","intrsThemaArray","sprtCycNm","srvPvsnNm","onapPsbltYn","rprsCtadr","inqNum","svcfrstRegTs"];
const LOCAL_TAGS = ["servId","servNm","servDgst","servDtlLink","ctpvNm","sggNm","bizChrDeptNm","lifeNmArray","trgterIndvdlNmArray","intrsThemaNmArray","sprtCycNm","srvPvsnNm","aplyMtdNm","inqNum","lastModYmd"];

async function fetchBokjiroAll(base, op, tags) {
  const pageSize = 500;
  const all = [];
  let totalCount = Infinity;
  for (let pageNo = 1; (pageNo - 1) * pageSize < totalCount; pageNo += 1) {
    const q = new URLSearchParams({ serviceKey: bokjiroKey, callTp: "L", pageNo: String(pageNo), numOfRows: String(pageSize), srchKeyCode: "001" });
    const res = await fetch(`${base}/${op}?${q}`);
    const xml = await res.text();
    if (!res.ok || getTag(xml, "resultCode") !== "0") throw new Error(`${op} p${pageNo} 실패: ${xml.slice(0, 160)}`);
    totalCount = Number(getTag(xml, "totalCount") || "0");
    all.push(...getBlocks(xml, "servList").map((b) => blockToRecord(b, tags)));
    if (getBlocks(xml, "servList").length === 0) break;
  }
  return all;
}

async function collectCentral() {
  const items = await fetchBokjiroAll(centralBase, "NationalWelfarelistV001", CENTRAL_TAGS);
  const rows = items.map((item) => {
    const tags = [...item.lifeArray.split(","), ...item.intrsThemaArray.split(",")].map((s) => s.trim()).filter(Boolean);
    return {
      source: "bokjiro-central", external_id: item.servId, title: item.servNm,
      plain_summary: item.servDgst || item.servNm, provider: item.jurOrgNm || item.jurMnofNm,
      apply_url: item.servDtlLink || null, region_scope: "전국",
      target_summary: item.trgterIndvdlArray || null, benefit_summary: item.srvPvsnNm || null,
      requirements: item.lifeArray || null, tags: tags.length ? tags : null,
      raw_content: JSON.stringify(item), review_status: "pending",
      ...deriveFacets("bokjiro-central", item),
    };
  });
  return { fetched: rows.length, ...(await batchUpsert(rows)) };
}

async function collectLocal() {
  const items = await fetchBokjiroAll(localBase, "LcgvWelfarelist", LOCAL_TAGS);
  const rows = items.map((item) => {
    const region = [item.ctpvNm, item.sggNm].filter(Boolean).join(" ").trim();
    const tags = (item.intrsThemaNmArray ?? "").split(",").map((s) => s.trim()).filter(Boolean);
    return {
      source: "bokjiro-local", external_id: item.servId, title: item.servNm,
      plain_summary: item.servDgst || item.servNm, provider: item.bizChrDeptNm || null,
      apply_url: item.servDtlLink || null, region_scope: region || "전국",
      target_summary: item.trgterIndvdlNmArray || null, benefit_summary: item.srvPvsnNm || null,
      requirements: item.lifeNmArray || null, tags: tags.length ? tags : null,
      raw_content: JSON.stringify(item), review_status: "pending",
      ...deriveFacets("bokjiro-local", item),
    };
  });
  return { fetched: rows.length, ...(await batchUpsert(rows)) };
}

async function collectGov24() {
  const items = [];
  let totalCount = Infinity;
  for (let page = 1; (page - 1) * 100 < totalCount; page += 1) {
    const q = new URLSearchParams({ serviceKey: gov24Key, page: String(page), perPage: "100" });
    const res = await fetch(`${gov24Base}/gov24/v3/serviceList?${q}`);
    const body = await res.json();
    if (!res.ok || !Array.isArray(body.data)) throw new Error(`정부24 p${page} 실패`);
    totalCount = Number(body.totalCount ?? 0);
    items.push(...body.data);
    if (body.data.length === 0) break;
  }
  const rows = items.map((item) => ({
    source: "gov24", external_id: item.서비스ID, title: item.서비스명,
    plain_summary: item.서비스목적요약 || item.서비스명, provider: item.소관기관명,
    apply_url: item.상세조회URL || null, region_scope: "전국",
    target_summary: item.지원대상 || null, benefit_summary: item.지원내용 || null,
    requirements: item.선정기준 || null, deadline: toDateOrNull(item.신청기한),
    tags: item.서비스분야 ? [item.서비스분야] : null,
    raw_content: JSON.stringify(item), review_status: "pending",
    ...deriveFacets("gov24", item),
  }));
  return { fetched: rows.length, ...(await batchUpsert(rows)) };
}

console.log("혜택 수집 (standalone, 전체)…\n");

for (const [label, fn] of [["복지로 중앙", collectCentral], ["복지로 지자체", collectLocal], ["정부24", collectGov24]]) {
  try {
    const t0 = Date.now();
    const r = await fn();
    console.log(`✅ ${label}: fetched=${r.fetched} upserted=${r.upserted} dupes=${r.dupes} (${((Date.now() - t0) / 1000).toFixed(1)}s)`);
  } catch (e) {
    console.error(`❌ ${label} 오류:`, e.message);
  }
}

const { count } = await supabase.from("benefits").select("*", { count: "exact", head: true });
console.log(`\n완료 — benefits 총 ${count}건`);
