import { NextResponse } from "next/server";
import {
  isSmsConfigured,
  isValidKoreanMobile,
  sendSms,
} from "@/lib/notifications/sms-service";
import { serverEnv } from "@/lib/env";

export const runtime = "nodejs";

// 발신번호 등록 후 실제 발송이 되는지 확인하는 테스트 엔드포인트.
// 보호: 개발 모드이거나 Authorization: Bearer <CRON_SECRET> 일 때만 허용.
function authorized(req: Request): boolean {
  const secret = serverEnv.cronSecret;
  if (process.env.NODE_ENV === "development") return true;
  if (!secret) return false;
  return req.headers.get("authorization") === `Bearer ${secret}`;
}

export async function POST(req: Request) {
  if (!authorized(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!isSmsConfigured()) {
    return NextResponse.json(
      { ok: false, error: "SMS 미설정 — .env.local의 SOLAPI_API_KEY/SECRET/SMS_SENDER_NUMBER 확인" },
      { status: 503 },
    );
  }

  const url = new URL(req.url);
  const to = url.searchParams.get("to");
  const text =
    url.searchParams.get("text") ??
    "[복지AI] 문자 알림 테스트입니다. 이 문자가 보이면 발송 설정이 정상이에요.";

  if (!isValidKoreanMobile(to)) {
    return NextResponse.json(
      { ok: false, error: "유효한 휴대폰 번호(to=01012345678)를 쿼리로 전달하세요." },
      { status: 400 },
    );
  }

  const result = await sendSms({ to: to as string, text });
  return NextResponse.json(result, { status: result.ok ? 200 : 502 });
}

export async function GET(req: Request) {
  return POST(req);
}
