#!/usr/bin/env node
import { readFileSync, existsSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { createClient } from "@supabase/supabase-js";
import pg from "pg";

const { Client } = pg;
const PROJECT_REF = "kpnvtgbgmhhdwzxqsobn";
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
    vars[t.slice(0, eq).trim()] = t.slice(eq + 1).trim().replace(/^["']|["']$/g, "");
  }
  return vars;
}

const env = loadEnv(envPath);
const url = env.DATABASE_URL ?? env.DIRECT_URL ?? "";

if (!env.DATABASE_URL && env.DIRECT_URL) {
  console.log("⚠️ DIRECT_URL만 설정됨 — DATABASE_URL로 이름 변경 권장 (코드가 DATABASE_URL 사용)\n");
}

const issues = [];

if (!url) {
  console.log("❌ DATABASE_URL이 비어 있습니다.");
  process.exit(1);
}

if (!url.startsWith("postgresql://") && !url.startsWith("postgres://")) {
  issues.push("postgresql:// 로 시작해야 합니다");
}

if (/\[YOUR_[^\]]+\]|YOUR_PASSWORD/i.test(url)) {
  issues.push("비밀번호 placeholder가 아직 남아 있습니다");
}

if (/https?:\/\//.test(url.split("@")[0] ?? "")) {
  issues.push("비밀번호 자리에 https:// URL이 들어가 있습니다 (DB 비밀번호를 넣으세요)");
}

let parsed;
try {
  parsed = new URL(url.replace(/^postgres(ql)?:/, "http:"));
} catch {
  issues.push("URI 파싱 실패 — 특수문자는 URL 인코딩 필요");
}

let connectionType = "unknown";

if (parsed) {
  const host = parsed.hostname;
  const port = parsed.port || "5432";
  const user = parsed.username || "";
  const db = parsed.pathname.replace(/^\//, "") || "";

  console.log("  host    :", host);
  console.log("  port    :", port);
  console.log("  user    :", user || "(없음)");
  console.log("  database:", db || "(없음)");
  console.log("  password:", parsed.password ? `설정됨 (${parsed.password.length}자)` : "없음");

  const isDirect =
    host === `db.${PROJECT_REF}.supabase.co` && user === "postgres" && (port === "5432" || port === "");
  const isPooler =
    host.includes("pooler.supabase.com") &&
    user === `postgres.${PROJECT_REF}` &&
    (port === "6543" || port === "5432");

  if (isDirect) connectionType = "direct";
  else if (isPooler) connectionType = "pooler (Session/Transaction)";
  else {
    issues.push(
      "Supabase 연결 형식이 아닙니다. Direct(db.*.supabase.co:5432) 또는 Pooler(*.pooler.supabase.com:6543) 확인",
    );
  }

  if (db !== "postgres") issues.push("database는 postgres 여야 합니다");
  if (!parsed.password) issues.push("비밀번호가 URI에 없습니다");
}

if (issues.length) {
  console.log("\n❌ 형식 문제:");
  for (const i of issues) console.log("  •", i);
  process.exit(1);
}

console.log("  유형    :", connectionType);
console.log("\n✅ URI 형식 OK\n");

console.log("=== Postgres 직접 연결 테스트 ===\n");

try {
  const client = new Client({
    connectionString: url,
    ssl: { rejectUnauthorized: false },
    connectionTimeoutMillis: 15000,
  });
  await client.connect();
  const res = await client.query("SELECT current_database() AS db, version()");
  await client.end();
  console.log("✅ Postgres 연결 성공");
  console.log("   database:", res.rows[0]?.db);
  console.log("   server  :", String(res.rows[0]?.version).split(" on ")[0]);
} catch (e) {
  console.log("❌ Postgres 연결 실패:", e.message);
  console.log("\n   → 비밀번호 오타, Reset 후 미반영, 또는 Pooler/Direct 모드 불일치일 수 있습니다.");
  process.exit(1);
}

console.log("\n=== Supabase API 연결 테스트 (service_role) ===\n");

const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceKey) {
  console.log("⚠️ SUPABASE URL/service_role 없어 API 테스트 생략");
  process.exit(0);
}

const supabase = createClient(supabaseUrl, serviceKey);
const { count, error } = await supabase.from("benefits").select("*", { count: "exact", head: true });

if (error) {
  console.log("❌ Supabase API 쿼리 실패:", error.message);
  process.exit(1);
}

console.log("✅ Supabase API 연결 성공");
console.log("   benefits 건수:", count ?? 0);
console.log("\n모든 테스트 통과\n");
