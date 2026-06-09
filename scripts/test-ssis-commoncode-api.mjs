#!/usr/bin/env node
/**
 * 사회서비스 공통코드 API 연결 테스트
 * 사용: npm run test-ssis-commoncode
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
const key = env.SOCIALSERVICE_API_KEY;
const base =
  env.SOCIALSERVICE_COMMON_API_BASE_URL ??
  "https://api.socialservice.or.kr:444/api/service/common";

if (!key) {
  console.error("SOCIALSERVICE_API_KEY가 .env.local에 없습니다.");
  process.exit(1);
}

async function call(label, path, params = {}) {
  const q = new URLSearchParams({ ServiceKey: key, _type: "json", ...params });
  const url = `${base}${path}?${q}`;
  const res = await fetch(url);
  const text = await res.text();
  console.log(`\n=== ${label} ===`);
  console.log("status:", res.status);

  let json;
  try {
    json = JSON.parse(text);
    const code = String(json?.response?.header?.resultCode ?? "");
    const msg = json?.response?.header?.resultMsg ?? "";
    console.log("resultCode:", code, "|", msg);

    const items = json?.response?.body?.items?.item;
    const list = items ? (Array.isArray(items) ? items : [items]) : [];
    console.log("items:", list.length);
    console.log(JSON.stringify(list.slice(0, 3), null, 2));
    return { code, list };
  } catch {
    console.log(text.slice(0, 400));
    return { code: "?", list: [] };
  }
}

const sido = await call("시도 코드 /sido", "/sido");

if (sido.code === "99") {
  console.log("\n--- 안내 ---");
  console.log("SERVICE KEY IS NOT REGISTERED → socialservice 서버에 키 미등록/동기화 대기");
  console.log("1. data.go.kr 15059061 활용신청 승인 확인 (마이페이지)");
  console.log("2. 승인 후 ~30분 대기 (가이드 동기화 시간)");
  console.log("3. 안내 페이지: https://www.socialservice.or.kr:444/user/pubdata/openapi/openapiList.do");
  console.log("   (api.socialservice.or.kr/user/... 는 404 — 포털 UI는 www 도메인)");
  process.exit(1);
}

const sidoCode = sido.list[0]?.sidoCode ?? "008";
await call("시군구 코드 /sido/signgu", "/sido/signgu", { sido: sidoCode });
await call("사업구분 코드 /serviceType", "/serviceType");

console.log("\n--- 참고 ---");
console.log("가이드: OpenAPI활용가이드_사회서비스전자바우처_1.5vr.docx");
console.log("operations: getSido → /sido, getSigngu → /sido/signgu, getServiceType → /serviceType");
