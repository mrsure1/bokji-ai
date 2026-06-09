#!/usr/bin/env node
import { readFileSync, existsSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const envPath = resolve(root, ".env.local");

function loadEnv(path) {
  if (!existsSync(path)) return {};
  const vars = {};
  for (const line of readFileSync(path, "utf-8").split("\n")) {
    const t = line.trim();
    if (!t || t.startsWith("#")) continue;
    const eq = t.indexOf("=");
    if (eq === -1) continue;
    vars[t.slice(0, eq).trim()] = t.slice(eq + 1).trim();
  }
  return vars;
}

const env = { ...loadEnv(envPath), ...process.env };
const rawKey = env.SOCIALSERVICE_API_KEY ?? env.DATA_GO_KR_SERVICE_KEY;
if (!rawKey) {
  console.error("키 없음");
  process.exit(1);
}

const variants = [
  ["plain ServiceKey", rawKey],
  ["encodeURIComponent ServiceKey", encodeURIComponent(rawKey)],
  ["decodeURIComponent then encode", encodeURIComponent(decodeURIComponent(rawKey))],
];

const base = "https://api.socialservice.or.kr:444/api/service/common/sido";

async function test(label, keyValue, paramName = "ServiceKey") {
  const url = `${base}?${paramName}=${keyValue}&_type=json`;
  const res = await fetch(url);
  const text = await res.text();
  const code = text.match(/"resultCode"\s*:\s*"?([^",}]+)/)?.[1] ?? text.match(/<resultCode>([^<]+)/)?.[1];
  const msg = text.match(/"resultMsg"\s*:\s*"([^"]+)/)?.[1] ?? text.match(/<resultMsg>([^<]+)/)?.[1];
  console.log(`[${label}] ${paramName} → code=${code} | ${msg}`);
}

console.log("키 길이:", rawKey.length);
console.log("승인일 기준: data.go.kr 승인 ≠ socialservice 서버 등록 (동기화 지연 가능)\n");

for (const [label, key] of variants) {
  await test(label, key);
  await test(`${label} (serviceKey)`, key, "serviceKey");
}

// data.go.kr 페이지에서 apis.data.go.kr 경로 탐색
const html = await fetch("https://www.data.go.kr/data/15059061/openapi.do", {
  headers: { "User-Agent": "Mozilla/5.0" },
}).then((r) => r.text());

const apisUrls = [...html.matchAll(/https:\/\/apis\.data\.go\.kr[^"'\s<>]*/g)].map((m) => m[0]);
console.log("\napis.data.go.kr URLs on page:", apisUrls.length ? apisUrls : "(없음 — 직접 socialservice 호출이 맞음)");
