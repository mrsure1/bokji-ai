#!/usr/bin/env node
// 각 정부 API의 totalCount만 1콜씩 확인 (수집 규모 파악용)
import { readFileSync } from "node:fs";

function loadEnv() {
  const vars = {};
  for (const line of readFileSync(".env.local", "utf-8").split("\n")) {
    const t = line.trim();
    if (!t || t.startsWith("#")) continue;
    const eq = t.indexOf("=");
    if (eq === -1) continue;
    let v = t.slice(eq + 1).trim().replace(/^["']|["']$/g, "");
    vars[t.slice(0, eq).trim()] = v;
  }
  return vars;
}

const env = loadEnv();
const dataKey = env.DATA_GO_KR_SERVICE_KEY;
const gov24Key = env.GOV24_SERVICE_KEY;

function tag(xml, name) {
  const m = xml.match(new RegExp(`<${name}>([\\s\\S]*?)</${name}>`));
  return m ? m[1].trim() : "";
}

async function bokjiro(label, base, op) {
  const url = `${base}/${op}?serviceKey=${dataKey}&callTp=L&pageNo=1&numOfRows=1&srchKeyCode=001`;
  try {
    const res = await fetch(url, { headers: { Accept: "application/xml" } });
    const xml = await res.text();
    const code = tag(xml, "resultCode");
    const total = tag(xml, "totalCount");
    if (!res.ok || (code && code !== "0")) {
      console.log(`❌ ${label}: HTTP ${res.status} code=${code} ${tag(xml, "resultMessage")} ${xml.slice(0, 120)}`);
      return;
    }
    console.log(`✅ ${label}: totalCount = ${Number(total).toLocaleString()}`);
  } catch (e) {
    console.log(`❌ ${label}: ${e.message}`);
  }
}

async function gov24() {
  const base = env.GOV24_API_BASE_URL ?? "https://api.odcloud.kr/api";
  const url = `${base}/gov24/v3/serviceList?serviceKey=${encodeURIComponent(gov24Key)}&page=1&perPage=1&returnType=JSON`;
  try {
    const res = await fetch(url, { headers: { Accept: "application/json" } });
    const text = await res.text();
    let body;
    try { body = JSON.parse(text); } catch { console.log(`❌ 정부24: JSON 파싱 실패 ${text.slice(0, 150)}`); return; }
    console.log(`✅ 정부24(serviceList): totalCount = ${Number(body.totalCount ?? 0).toLocaleString()}`);
  } catch (e) {
    console.log(`❌ 정부24: ${e.message}`);
  }
}

const cBase = env.BOKJIRO_CENTRAL_API_URL ?? "https://apis.data.go.kr/B554287/NationalWelfareInformationsV001";
const lBase = env.BOKJIRO_LOCAL_API_URL ?? "https://apis.data.go.kr/B554287/LocalGovernmentWelfareInformations";

console.log("\n=== 정부 API 수집 규모 (totalCount) ===\n");
await bokjiro("복지로 중앙부처(NationalWelfarelistV001)", cBase, "NationalWelfarelistV001");
await bokjiro("복지로 지자체(LocalGovernmentWelfarelistV001)", lBase, "LocalGovernmentWelfarelistV001");
await gov24();
console.log();
