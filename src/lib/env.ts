/**
 * 환경 변수 타입 안전 접근
 * .env.local 값이 없으면 undefined — 런타임에서 graceful fallback
 */
function required(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`환경 변수 ${name}이(가) 설정되지 않았습니다. .env.local을 확인하세요.`);
  }
  return value;
}

function optional(name: string): string | undefined {
  return process.env[name];
}

/** 서버 전용 — API Route, 워커, Cron에서 사용 */
export const serverEnv = {
  get databaseUrl() {
    return optional("DATABASE_URL");
  },
  get supabaseServiceRoleKey() {
    return optional("SUPABASE_SERVICE_ROLE_KEY");
  },
  get authSecret() {
    return optional("AUTH_SECRET");
  },
  get openaiApiKey() {
    return optional("OPENAI_API_KEY");
  },
  get openaiModel() {
    return optional("OPENAI_MODEL") ?? "gpt-4o-mini";
  },
  get openaiEmbeddingModel() {
    return optional("OPENAI_EMBEDDING_MODEL") ?? "text-embedding-3-small";
  },
  get dataGoKrServiceKey() {
    return optional("DATA_GO_KR_SERVICE_KEY");
  },
  get bokjiroCentralApiUrl() {
    return optional("BOKJIRO_CENTRAL_API_URL");
  },
  get bokjiroLocalApiUrl() {
    return optional("BOKJIRO_LOCAL_API_URL");
  },
  get cronSecret() {
    return optional("CRON_SECRET");
  },
  get solapiApiKey() {
    return optional("SOLAPI_API_KEY");
  },
  get solapiApiSecret() {
    return optional("SOLAPI_API_SECRET");
  },
  get smsSenderNumber() {
    return optional("SMS_SENDER_NUMBER");
  },
  get resendApiKey() {
    return optional("RESEND_API_KEY");
  },
  get emailFrom() {
    return optional("EMAIL_FROM") ?? "WelfareFit <noreply@localhost>";
  },
} as const;

/** 클라이언트 노출 가능 */
export const clientEnv = {
  get appUrl() {
    return optional("NEXT_PUBLIC_APP_URL") ?? "http://localhost:3000";
  },
  get supabaseUrl() {
    return optional("NEXT_PUBLIC_SUPABASE_URL");
  },
  get supabaseAnonKey() {
    return optional("NEXT_PUBLIC_SUPABASE_ANON_KEY");
  },
} as const;

/** 필수 키 존재 여부 검사 (개발 시 진단용) */
export function checkRequiredEnv(): { ok: boolean; missing: string[] } {
  const requiredKeys = [
    "NEXT_PUBLIC_SUPABASE_URL",
    "NEXT_PUBLIC_SUPABASE_ANON_KEY",
    "SUPABASE_SERVICE_ROLE_KEY",
    "DATABASE_URL",
    "OPENAI_API_KEY",
    "DATA_GO_KR_SERVICE_KEY",
  ] as const;

  const missing = requiredKeys.filter((key) => !process.env[key]);
  return { ok: missing.length === 0, missing: [...missing] };
}

/** 특정 기능 사용 시 필수 키 강제 */
export function requireOpenAI(): string {
  return required("OPENAI_API_KEY");
}

export function requireDataGoKr(): string {
  return required("DATA_GO_KR_SERVICE_KEY");
}
