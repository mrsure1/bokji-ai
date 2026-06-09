#!/usr/bin/env node
/**
 * 복지로 공공 API 연결 테스트
 * 사용: node scripts/test-bokjiro-api.mjs
 *
 * 활용가이드(v2.2) 필수 파라미터:
 * - callTp: L(목록) / D(상세)
 * - srchKeyCode: 001(서비스명) — 목록 조회 시
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
const key = env.DATA_GO_KR_SERVICE_KEY;
if (!key) {
  console.error("DATA_GO_KR_SERVICE_KEY가 .env.local에 없습니다.");
  process.exit(1);
}

const centralBase =
  env.BOKJIRO_CENTRAL_API_URL ??
  "https://apis.data.go.kr/B554287/NationalWelfareInformationsV001";
const localBase =
  env.BOKJIRO_LOCAL_API_URL ??
  "https://apis.data.go.kr/B554287/LocalGovernmentWelfareInformations";

async function tryUrl(label, url) {
  const res = await fetch(url);
  const text = await res.text();
  console.log(`\n=== ${label} ===`);
  console.log("status:", res.status);
  console.log(text.slice(0, 800));
  return { ok: res.status === 200 && !text.includes("API not found"), text };
}

const listQuery = new URLSearchParams({
  serviceKey: key,
  callTp: "L",
  pageNo: "1",
  numOfRows: "3",
  srchKeyCode: "001",
});

const detailQuery = new URLSearchParams({
  serviceKey: key,
  callTp: "D",
  servId: "WLF00000024",
});

const centralList = await tryUrl(
  "중앙부처 목록 NationalWelfarelistV001",
  `${centralBase}/NationalWelfarelistV001?${listQuery}`,
);

if (centralList.ok) {
  const servId = centralList.text.match(/<servId>([^<]+)/)?.[1];
  if (servId) {
    await tryUrl(
      "중앙부처 상세 NationalWelfaredetailedV001",
      `${centralBase}/NationalWelfaredetailedV001?${new URLSearchParams({
        serviceKey: key,
        callTp: "D",
        servId,
      })}`,
    );
  }
} else {
  await tryUrl(
    "중앙부처 상세 (샘플 servId)",
    `${centralBase}/NationalWelfaredetailedV001?${detailQuery}`,
  );
}

await tryUrl(
  "지자체 목록 LocalGovernmentWelfarelistV001",
  `${localBase}/LocalGovernmentWelfarelistV001?${listQuery}`,
);

console.log("\n--- 참고 ---");
console.log("중앙부처 operation: NationalWelfarelistV001 / NationalWelfaredetailedV001");
console.log("지자체 404 시 → data.go.kr 15108347 활용신청 및 활용가이드 확인");
