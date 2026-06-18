// SMS 발송 서비스 (서버 전용) — Solapi REST API 직접 연동.
// SDK 없이 Node 내장 crypto로 HMAC-SHA256 인증 헤더를 만든다.
// 문서: https://developers.solapi.com/references/authentication/api-key
//       https://developers.solapi.com/references/messages/sendManyDetail

import { createHmac, randomBytes } from "node:crypto";
import { serverEnv } from "@/lib/env";

const SOLAPI_BASE = "https://api.solapi.com";

/** 휴대폰 번호를 숫자만 남겨 정규화. 빈 값/형식 미달이면 null. */
export function normalizePhone(input: string | null | undefined): string | null {
  if (!input) return null;
  const digits = input.replace(/\D/g, "");
  if (!digits) return null;
  return digits;
}

/** 한국 휴대폰 번호(010/011/016/017/018/019, 10~11자리)인지 검사. */
export function isValidKoreanMobile(phone: string | null | undefined): boolean {
  const d = normalizePhone(phone);
  if (!d) return false;
  return /^01[016789]\d{7,8}$/.test(d);
}

/** Solapi 자격증명·발신번호가 모두 설정됐는지 (미설정 시 발송 스킵). */
export function isSmsConfigured(): boolean {
  return Boolean(
    serverEnv.solapiApiKey && serverEnv.solapiApiSecret && serverEnv.smsSenderNumber,
  );
}

/** 한국어 2바이트 가정으로 텍스트 바이트 길이 추정 (SMS/LMS 판정용). */
function byteLength(text: string): number {
  let bytes = 0;
  for (const ch of text) bytes += ch.charCodeAt(0) > 0x7f ? 2 : 1;
  return bytes;
}

function authHeader(): string {
  const apiKey = serverEnv.solapiApiKey!;
  const apiSecret = serverEnv.solapiApiSecret!;
  const date = new Date().toISOString();
  const salt = randomBytes(32).toString("hex");
  const signature = createHmac("sha256", apiSecret).update(date + salt).digest("hex");
  return `HMAC-SHA256 apiKey=${apiKey}, date=${date}, salt=${salt}, signature=${signature}`;
}

export interface SmsMessage {
  /** 수신 번호(정규화 권장) */
  to: string;
  /** 본문 */
  text: string;
  /** LMS 제목(선택). 길이가 길어 LMS로 보낼 때만 사용 */
  subject?: string;
}

interface SolapiOutgoing {
  to: string;
  from: string;
  text: string;
  type: "SMS" | "LMS";
  subject?: string;
}

function toOutgoing(msg: SmsMessage, from: string): SolapiOutgoing {
  const isLms = byteLength(msg.text) > 90 || Boolean(msg.subject);
  return {
    to: normalizePhone(msg.to) ?? msg.to,
    from,
    text: msg.text,
    type: isLms ? "LMS" : "SMS",
    ...(isLms ? { subject: msg.subject ?? "복지AI 알림" } : {}),
  };
}

export interface SmsSendResult {
  ok: boolean;
  /** 요청 접수된 건수 */
  count: number;
  /** 실패 건수 */
  failed: number;
  /** 오류 메시지(실패 시) */
  error?: string;
  /** Solapi 원본 응답(디버깅용) */
  raw?: unknown;
}

/**
 * 여러 건을 한 번에 발송 (Solapi sendMany).
 * 자격증명 미설정 시 발송하지 않고 ok:false로 반환한다(throw 안 함).
 */
export async function sendManySms(messages: SmsMessage[]): Promise<SmsSendResult> {
  if (!messages.length) return { ok: true, count: 0, failed: 0 };
  if (!isSmsConfigured()) {
    return { ok: false, count: 0, failed: messages.length, error: "SMS 미설정(.env.local 확인)" };
  }

  const from = normalizePhone(serverEnv.smsSenderNumber)!;
  const body = { messages: messages.map((m) => toOutgoing(m, from)) };

  let res: Response;
  try {
    res = await fetch(`${SOLAPI_BASE}/messages/v4/send-many/detail`, {
      method: "POST",
      headers: {
        Authorization: authHeader(),
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });
  } catch (e) {
    return {
      ok: false,
      count: 0,
      failed: messages.length,
      error: e instanceof Error ? e.message : "네트워크 오류",
    };
  }

  const raw = await res.json().catch(() => null);
  if (!res.ok) {
    const error =
      (raw && typeof raw === "object" && "errorMessage" in raw
        ? String((raw as { errorMessage: unknown }).errorMessage)
        : null) ?? `Solapi 오류 (HTTP ${res.status})`;
    return { ok: false, count: 0, failed: messages.length, error, raw };
  }

  // groupInfo.count.{registeredSuccess, registeredFailed} 형태로 집계가 온다.
  const counts =
    raw && typeof raw === "object" && "groupInfo" in raw
      ? (raw as { groupInfo?: { count?: { registeredSuccess?: number; registeredFailed?: number } } })
          .groupInfo?.count
      : undefined;
  const success = counts?.registeredSuccess ?? messages.length;
  const failed = counts?.registeredFailed ?? 0;
  return { ok: failed === 0, count: success, failed, raw };
}

/** 단건 발송 (테스트·단일 알림용). */
export async function sendSms(msg: SmsMessage): Promise<SmsSendResult> {
  return sendManySms([msg]);
}
