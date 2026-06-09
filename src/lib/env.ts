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
  /** Google Gemini — https://aistudio.google.com/apikey */
  get geminiApiKey() {
    return optional("GEMINI_API_KEY");
  },
  get geminiModel() {
    return optional("GEMINI_MODEL") ?? "gemini-2.5-flash";
  },
  get geminiEmbeddingModel() {
    return optional("GEMINI_EMBEDDING_MODEL") ?? "gemini-embedding-001";
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
  /** 정부24 공공서비스(혜택) — api.odcloud.kr (복지로와 별도 활용신청) */
  get gov24ServiceKey() {
    return optional("GOV24_SERVICE_KEY");
  },
  get gov24ApiBaseUrl() {
    return optional("GOV24_API_BASE_URL");
  },
  /** 사회서비스 전자바우처 — api.socialservice.or.kr (복지로·정부24와 별도 키) */
  get socialserviceApiKey() {
    return optional("SOCIALSERVICE_API_KEY");
  },
  get socialserviceCommonApiBaseUrl() {
    return optional("SOCIALSERVICE_COMMON_API_BASE_URL");
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
    return optional("EMAIL_FROM") ?? "bokji-ai <noreply@localhost>";
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
    "GEMINI_API_KEY",
    "DATA_GO_KR_SERVICE_KEY",
  ] as const;

  const missing = requiredKeys.filter((key) => !process.env[key]);
  return { ok: missing.length === 0, missing: [...missing] };
}

/** 특정 기능 사용 시 필수 키 강제 */
export function requireGemini(): string {
  return required("GEMINI_API_KEY");
}

export function requireDataGoKr(): string {
  return required("DATA_GO_KR_SERVICE_KEY");
}

export function requireGov24(): string {
  return required("GOV24_SERVICE_KEY");
}

export function requireSocialService(): string {
  return required("SOCIALSERVICE_API_KEY");
}
