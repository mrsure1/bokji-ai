#!/usr/bin/env node
/**
 * 환경 변수 설정 상태 확인
 * 사용: node scripts/check-env.mjs
 */
import { readFileSync, existsSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, "..");
const envPath = resolve(root, ".env.local");

const GROUPS = {
  "앱 기본": ["NEXT_PUBLIC_APP_URL"],
  "Supabase (DB/Auth)": [
    "NEXT_PUBLIC_SUPABASE_URL",
    "NEXT_PUBLIC_SUPABASE_ANON_KEY",
    "SUPABASE_SERVICE_ROLE_KEY",
    "DATABASE_URL",
  ],
  "인증": ["AUTH_SECRET", "AUTH_URL"],
  "OpenAI (상담/요약)": ["OPENAI_API_KEY"],
  "공공데이터 (복지 수집)": ["DATA_GO_KR_SERVICE_KEY"],
  "SMS (선택)": ["SOLAPI_API_KEY", "SOLAPI_API_SECRET", "SMS_SENDER_NUMBER"],
  "이메일 (선택)": ["RESEND_API_KEY", "EMAIL_FROM"],
  "Cron": ["CRON_SECRET"],
};

function loadEnvFile(path) {
  if (!existsSync(path)) return {};
  const content = readFileSync(path, "utf-8");
  const vars = {};
  for (const line of content.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    let value = trimmed.slice(eq + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    vars[key] = value;
  }
  return vars;
}

const env = loadEnvFile(envPath);
let allRequiredOk = true;

console.log("\n🔑 WelfareFit 환경 변수 점검\n");
console.log(`파일: ${envPath}`);
console.log(`존재: ${existsSync(envPath) ? "✅" : "❌ (.env.local 없음 — .env.example을 복사하세요)"}\n`);

for (const [group, keys] of Object.entries(GROUPS)) {
  const isOptional = group.includes("선택");
  console.log(`── ${group} ${isOptional ? "(선택)" : ""} ──`);
  for (const key of keys) {
    const value = env[key] ?? process.env[key];
    const filled =
      value &&
      value.length > 0 &&
      !value.includes("YOUR_") &&
      !value.includes("your_") &&
      !value.includes("[YOUR_");
    const icon = filled ? "✅" : isOptional ? "⬜" : "❌";
    if (!filled && !isOptional) allRequiredOk = false;
    const preview = filled ? `${value.slice(0, 8)}…` : "(미설정)";
    console.log(`  ${icon} ${key.padEnd(35)} ${preview}`);
  }
  console.log();
}

if (allRequiredOk) {
  console.log("✅ MVP 필수 환경 변수가 모두 설정되었습니다.\n");
  process.exit(0);
} else {
  console.log("❌ 필수 환경 변수가 비어 있습니다. 아래 발급 가이드를 참고하세요.\n");
  console.log("발급 링크:");
  console.log("  • Supabase    → https://supabase.com/dashboard");
  console.log("  • OpenAI      → https://platform.openai.com/api-keys");
  console.log("  • 공공데이터  → https://www.data.go.kr (복지로 API 2종 활용신청)");
  console.log("  • Solapi SMS  → https://solapi.com (선택)");
  console.log("  • Resend      → https://resend.com/api-keys (선택)\n");
  process.exit(1);
}
