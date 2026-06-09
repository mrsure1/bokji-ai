#!/usr/bin/env node
/**
 * 정부24 공공서비스(혜택) API 연결 테스트
 * 사용: npm run test-gov24
 */
import { readFileSync, existsSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, "..");

function loadEnvFile(path) {
  if (!existsSync(path)) return {};
  const vars = {};
  for (const line of readFileSync(path, "utf-8").split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;
    vars[trimmed.slice(0, eq).trim()] = trimmed.slice(eq + 1).trim();
  }
  return vars;
}

const env = { ...loadEnvFile(resolve(root, ".env.local")), ...process.env };
const key = env.GOV24_SERVICE_KEY;
const base = env.GOV24_API_BASE_URL ?? "https://api.odcloud.kr/api";

if (!key) {
  console.error("GOV24_SERVICE_KEY가 .env.local에 없습니다.");
  process.exit(1);
}

async function get(path, params) {
  const q = new URLSearchParams({ serviceKey: key, ...params });
  const url = `${base}${path}?${q}`;
  const res = await fetch(url);
  const text = await res.text();
  console.log(`\n=== ${path} ===`);
  console.log("status:", res.status);
  let json;
  try {
    json = JSON.parse(text);
    console.log(JSON.stringify(json, null, 2).slice(0, 1500));
  } catch {
    console.log(text.slice(0, 500));
  }
  return { ok: res.ok, json };
}

const list = await get("/gov24/v3/serviceList", { page: "1", perPage: "2" });
const serviceId = list.json?.data?.[0]?.["서비스ID"];

if (serviceId) {
  await get("/gov24/v3/serviceDetail", {
    page: "1",
    perPage: "1",
    "cond[서비스ID::EQ]": serviceId,
  });
  await get("/gov24/v3/supportConditions", {
    page: "1",
    perPage: "1",
    "cond[서비스ID::EQ]": serviceId,
  });
}

console.log("\n--- 참고 ---");
console.log("전체 서비스 수:", list.json?.totalCount ?? "(확인 실패)");
console.log("Swagger: https://infuser.odcloud.kr/api/stages/44436/api-docs");
