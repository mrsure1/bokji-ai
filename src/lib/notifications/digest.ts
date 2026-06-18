// 선제 알림 다이제스트 빌더 (서버 전용).
// "문자를 보낼 가치가 있는" 사용자만 추려서, 보낼 본문까지 만들어 반환한다.
// 핵심 가치: 저장한 혜택의 신청 마감 임박 알림(놓치면 손해인 정보).

import { createServiceClient } from "@/lib/supabase/server";
import { isValidKoreanMobile, type SmsMessage } from "@/lib/notifications/sms-service";

/** 한 사용자에게 보낼 한 통의 문자 + 로그 메타. */
export interface UserSmsDigest {
  userId: string;
  message: SmsMessage;
  /** notification_logs 기록용 */
  benefitId: string | null;
  title: string;
}

const DEFAULT_WITHIN_DAYS = 7; // 마감 D-7 이내만 문자 발송
const MAX_ITEMS_PER_SMS = 3;

function ddayOf(deadline: string, today: Date): number {
  return Math.ceil((new Date(deadline).getTime() - today.getTime()) / 86400000);
}

function fmtDate(deadline: string): string {
  const d = new Date(deadline);
  return `${d.getMonth() + 1}/${d.getDate()}`;
}

/**
 * 문자 발송 대상자별 다이제스트를 만든다.
 * - alarm_sms=true 이고 유효한 휴대폰 번호가 있는 사용자만
 * - 그중 저장한 혜택의 마감이 withinDays 이내인 경우만 (없으면 발송 안 함)
 */
export async function buildSmsDigests(opts?: {
  withinDays?: number;
}): Promise<UserSmsDigest[]> {
  const withinDays = opts?.withinDays ?? DEFAULT_WITHIN_DAYS;
  const supabase = createServiceClient();
  const today = new Date();
  const todayStr = today.toISOString().slice(0, 10);

  // 1) 수신 동의 + 번호 있는 사용자
  const { data: recipients } = await supabase
    .from("profiles")
    .select("id, name, phone")
    .eq("alarm_sms", true)
    .not("phone", "is", null);

  const valid = (recipients ?? []).filter((r) => isValidKoreanMobile(r.phone));
  if (!valid.length) return [];

  const userIds = valid.map((r) => r.id);

  // 2) 이 사용자들이 저장한 혜택
  const { data: saved } = await supabase
    .from("saved_benefits")
    .select("user_id, benefit_id")
    .in("user_id", userIds);
  if (!saved?.length) return [];

  const savedByUser = new Map<string, string[]>();
  for (const s of saved) {
    const arr = savedByUser.get(s.user_id) ?? [];
    arr.push(s.benefit_id);
    savedByUser.set(s.user_id, arr);
  }

  // 3) 저장된 혜택 중 마감 임박분만 조회
  const allBenefitIds = [...new Set(saved.map((s) => s.benefit_id))];
  const { data: benefitRows } = await supabase
    .from("benefits")
    .select("id, title, deadline, apply_url")
    .in("id", allBenefitIds)
    .not("deadline", "is", null)
    .gte("deadline", todayStr);

  const urgentById = new Map<string, { title: string; deadline: string; dday: number }>();
  for (const b of benefitRows ?? []) {
    if (!b.deadline) continue;
    const dday = ddayOf(b.deadline, today);
    if (dday >= 0 && dday <= withinDays) {
      urgentById.set(b.id, { title: b.title, deadline: b.deadline, dday });
    }
  }
  if (!urgentById.size) return [];

  // 4) 사용자별 본문 구성
  const digests: UserSmsDigest[] = [];
  for (const r of valid) {
    const ids = savedByUser.get(r.id) ?? [];
    const urgent = ids
      .map((id) => urgentById.get(id))
      .filter((v): v is NonNullable<typeof v> => Boolean(v))
      .sort((a, b) => a.dday - b.dday)
      .slice(0, MAX_ITEMS_PER_SMS);
    if (!urgent.length) continue;

    const lines = urgent.map(
      (u) => `· ${u.title} 신청 마감 D-${Math.max(u.dday, 0)} (${fmtDate(u.deadline)})`,
    );
    const greeting = r.name ? `${r.name}님, ` : "";
    const text =
      `[복지AI] 저장하신 혜택 마감이 다가와요\n` +
      `${greeting}아래 신청을 놓치지 마세요.\n` +
      `${lines.join("\n")}\n` +
      `자세히: 복지AI 앱에서 확인\n` +
      `수신거부: 앱 > 내 정보 > 알림 끄기`;

    digests.push({
      userId: r.id,
      message: { to: r.phone as string, text, subject: "복지AI 마감 임박 알림" },
      benefitId: ids.find((id) => urgentById.has(id)) ?? null,
      title: urgent[0].title,
    });
  }

  return digests;
}
