#!/usr/bin/env node
/**
 * 복지로(중앙) + 정부24 혜택 수집 → Supabase benefits 테이블
 * 사용: npm run collect-benefits
 */
import { readFileSync, existsSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");

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

const envPath = resolve(root, ".env.local");
Object.assign(process.env, loadEnv(envPath));

const base = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
const secret = process.env.CRON_SECRET;

async function main() {
  const headers = { "Content-Type": "application/json" };
  if (secret) headers.Authorization = `Bearer ${secret}`;

  console.log("혜택 수집 시작…");
  console.log(`  endpoint: ${base}/api/cron/collect`);

  const res = await fetch(`${base}/api/cron/collect?gov24MaxPages=20`, {
    method: "POST",
    headers,
  });

  const text = await res.text();
  let body;
  try {
    body = JSON.parse(text);
  } catch {
    console.error("응답 파싱 실패:", text.slice(0, 500));
    process.exit(1);
  }

  console.log(JSON.stringify(body, null, 2));

  if (!res.ok || !body.ok) {
    console.error("\n수집 실패. dev 서버(npm run dev) 실행 또는 CRON_SECRET 확인.");
    process.exit(1);
  }

  console.log("\n완료");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
