#!/usr/bin/env node
// 마이그레이션 SQL 파일을 원격 Postgres(Supabase)에 적용한다.
// 사용법: node scripts/apply-migration.mjs supabase/migrations/<파일>.sql
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
    if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) {
      v = v.slice(1, -1);
    }
    vars[t.slice(0, eq).trim()] = v;
  }
  return vars;
}

const file = process.argv[2];
if (!file) {
  console.error("사용법: node scripts/apply-migration.mjs <SQL 파일 경로>");
  process.exit(1);
}

const env = loadEnv();
const connectionString = env.DATABASE_URL;
if (!connectionString) {
  console.error("DATABASE_URL이 .env.local에 없습니다.");
  process.exit(1);
}

const sql = readFileSync(file, "utf-8");
const client = new pg.Client({
  connectionString,
  ssl: { rejectUnauthorized: false },
});

try {
  await client.connect();
  console.log(`적용 중: ${file}`);
  await client.query(sql);
  console.log("✅ 마이그레이션 적용 완료");
} catch (e) {
  console.error("❌ 적용 실패:", e.message);
  process.exitCode = 1;
} finally {
  await client.end();
}
