#!/usr/bin/env node
import { readFileSync } from "node:fs";
import pg from "pg";

function loadEnv() {
  const vars = {};
  for (const line of readFileSync(".env.local", "utf-8").split("\n")) {
    const t = line.trim();
    if (!t || t.startsWith("#")) continue;
    const eq = t.indexOf("=");
    if (eq === -1) continue;
    let v = t.slice(eq + 1).trim();
    if (
      (v.startsWith('"') && v.endsWith('"')) ||
      (v.startsWith("'") && v.endsWith("'"))
    ) {
      v = v.slice(1, -1);
    }
    vars[t.slice(0, eq).trim()] = v;
  }
  return vars;
}

const env = loadEnv();
const ref = "kpnvtgbgmhhdwzxqsobn";
const raw = env.DATABASE_URL || env.DIRECT_URL || "";

console.log("\n=== 환경 변수 ===");
console.log("  DATABASE_URL:", env.DATABASE_URL ? "있음" : "없음");
console.log("  DIRECT_URL  :", env.DIRECT_URL ? "있음" : "없음");

if (!raw) {
  console.log("\n❌ DATABASE_URL / DIRECT_URL 둘 다 없습니다.");
  process.exit(1);
}

if (!env.DATABASE_URL && env.DIRECT_URL) {
  console.log("\n⚠️ DIRECT_URL만 있습니다. 코드는 DATABASE_URL을 읽습니다 → 이름 변경 권장");
}

let parsed;
try {
  parsed = new URL(raw.replace(/^postgres(ql)?:/, "http:"));
} catch {
  console.log("\n❌ URI 파싱 실패 — 비밀번호의 @ 는 %40 으로 인코딩 필요");
  process.exit(1);
}

console.log("\n=== URI 파싱 ===");
console.log("  host    :", parsed.hostname);
console.log("  port    :", parsed.port || "5432");
console.log("  user    :", parsed.username);
console.log("  password:", parsed.password ? `${parsed.password.length}자` : "없음");

const pw = parsed.password ?? "";
const encoded = encodeURIComponent(decodeURIComponent(pw));
const attempts = [
  ["현재 URI", raw],
  ["@ → %40 인코딩", raw.replace(`:${pw}@`, `:${encoded}@`)],
  [
    "Direct db:5432",
    `postgresql://postgres:${encoded}@db.${ref}.supabase.co:5432/postgres`,
  ],
  [
    "Pooler :6543",
    `postgresql://postgres.${ref}:${encoded}@aws-1-ap-northeast-2.pooler.supabase.com:6543/postgres?pgbouncer=true`,
  ],
];

console.log("\n=== Postgres 연결 ===\n");

for (const [label, conn] of attempts) {
  const client = new pg.Client({
    connectionString: conn,
    ssl: { rejectUnauthorized: false },
    connectionTimeoutMillis: 12000,
  });
  try {
    await client.connect();
    await client.query("SELECT 1 AS ok");
    await client.end();
    console.log(`✅ ${label}`);
    if (label !== "현재 URI") {
      console.log("   → .env.local DATABASE_URL을 위 성공한 형식으로 맞추세요.");
    }
    process.exit(0);
  } catch (e) {
    console.log(`❌ ${label}: ${e.message.split("\n")[0]}`);
    try {
      await client.end();
    } catch {
      /* ignore */
    }
  }
}

process.exit(1);
