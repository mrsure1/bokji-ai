import { NextResponse } from "next/server";
import { buildSmsDigests } from "@/lib/notifications/digest";
import { isSmsConfigured, sendSms } from "@/lib/notifications/sms-service";
import { createServiceClient } from "@/lib/supabase/server";
import { serverEnv } from "@/lib/env";

export const runtime = "nodejs";
export const maxDuration = 300;

function authorized(req: Request): boolean {
  const secret = serverEnv.cronSecret;
  if (!secret) return process.env.NODE_ENV === "development";
  const auth = req.headers.get("authorization");
  return auth === `Bearer ${secret}`;
}

/**
 * 선제 알림(SMS) 발송 워커.
 * - alarm_sms=true & 유효 번호 & 저장한 혜택 마감 임박(D-7) 사용자에게 문자 발송
 * - 같은 날 같은 혜택으로 이미 보낸 건은 건너뜀(중복 방지)
 * - 결과를 notification_logs에 기록
 * Vercel Cron 권장: 매일 09:00 (CRON_SEND_NOTIFICATIONS=0 9 * * *)
 */
export async function POST(req: Request) {
  if (!authorized(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!isSmsConfigured()) {
    return NextResponse.json(
      { ok: false, error: "SMS 미설정 — SOLAPI_API_KEY/SECRET/SMS_SENDER_NUMBER 확인" },
      { status: 503 },
    );
  }

  const supabase = createServiceClient();

  try {
    const url = new URL(req.url);
    const withinDays = Number(url.searchParams.get("withinDays")) || undefined;
    const dryRun = url.searchParams.get("dryRun") === "1";

    const digests = await buildSmsDigests({ withinDays });
    if (dryRun) {
      return NextResponse.json({
        ok: true,
        dryRun: true,
        recipients: digests.length,
        preview: digests.slice(0, 5).map((d) => ({ to: d.message.to, text: d.message.text })),
      });
    }

    // 오늘 이미 문자로 보낸 (user_id, benefit_id) 조합 — 중복 발송 방지
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const { data: sentToday } = await supabase
      .from("notification_logs")
      .select("user_id, benefit_id")
      .eq("channel", "sms")
      .eq("status", "sent")
      .gte("sent_at", todayStart.toISOString());
    const alreadySent = new Set(
      (sentToday ?? []).map((r) => `${r.user_id}:${r.benefit_id ?? ""}`),
    );

    let sent = 0;
    let failed = 0;
    let skipped = 0;

    for (const d of digests) {
      if (alreadySent.has(`${d.userId}:${d.benefitId ?? ""}`)) {
        skipped++;
        continue;
      }

      const requestedAt = new Date().toISOString();
      const result = await sendSms(d.message);
      const ok = result.ok && result.count > 0;

      await supabase.from("notification_logs").insert({
        user_id: d.userId,
        type: "urgent",
        channel: "sms",
        status: ok ? "sent" : "failed",
        title: d.title,
        body: d.message.text,
        benefit_id: d.benefitId,
        requested_at: requestedAt,
        sent_at: ok ? new Date().toISOString() : null,
        failure_reason: ok ? null : (result.error ?? "발송 실패"),
      });

      if (ok) sent++;
      else failed++;
    }

    return NextResponse.json({ ok: true, recipients: digests.length, sent, failed, skipped });
  } catch (e) {
    return NextResponse.json(
      { ok: false, error: e instanceof Error ? e.message : "알림 발송 실패" },
      { status: 500 },
    );
  }
}

export async function GET(req: Request) {
  return POST(req);
}
