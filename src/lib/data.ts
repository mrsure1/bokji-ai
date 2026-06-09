// ──────────────────────────────────────────────────────────────────
// 데이터 접근 계층 (단일 교체 지점)
// 홈 등 클라이언트 화면은 시드 데이터 사용. API/채팅은 Supabase + 시드 폴백.
// ──────────────────────────────────────────────────────────────────
import { SEED_BENEFITS } from "@/lib/benefits/seed";
import type { AppNotification, Benefit, UserProfile } from "./types";

export { SEED_BENEFITS };

const NOTIFICATIONS: AppNotification[] = [
  { id: "n1", type: "urgent", title: "청년 월세 한시 특별지원, 오늘 포함 3일 남았어요", time: "2시간 전", benefitId: "youth-rent" },
  { id: "n2", type: "new", title: "조건에 맞는 '서울형 주택바우처'가 새로 등록됐어요", time: "오전 9:10", benefitId: "seoul-housing-voucher" },
  { id: "n3", type: "change", title: "저장한 '국민취업지원제도' 안내가 업데이트됐어요", time: "어제", benefitId: "national-employment" },
  { id: "n4", type: "info", title: "1가지만 더 알려주면 +월 32만원 혜택을 확인할 수 있어요", time: "2일 전" },
  { id: "n5", type: "new", title: "'재난적 의료비 지원'이 관심 분야에 추가됐어요", time: "3일 전", benefitId: "disaster-medical" },
];

const PROFILE_SEED: UserProfile = {
  name: "지영",
  region: "서울 관악구",
  ageHousehold: "29세 · 1인 가구",
  jobStatus: "최근 실직",
  housing: null,
  income: null,
  interests: ["주거", "생계", "일자리"],
  alarms: { sms: true, email: true, night: false },
};

export function getBenefits(): Benefit[] {
  return SEED_BENEFITS;
}
export function getBenefit(id: string): Benefit | undefined {
  return SEED_BENEFITS.find((b) => b.id === id);
}
export function getHeroBenefit(): Benefit {
  const high = SEED_BENEFITS.filter((b) => b.fit === "high" && b.dday !== null);
  const pool = high.length ? high : SEED_BENEFITS;
  return [...pool].sort((a, b) => (a.dday ?? 9999) - (b.dday ?? 9999))[0];
}
export function getTimeline(): Benefit[] {
  const heroId = getHeroBenefit().id;
  return SEED_BENEFITS.filter((b) => b.id !== heroId).sort(
    (a, b) => (a.dday ?? 9999) - (b.dday ?? 9999),
  );
}
export function getNotifications(): AppNotification[] {
  return NOTIFICATIONS;
}
export function getProfileSeed(): UserProfile {
  return PROFILE_SEED;
}

export function ddayLabel(dday: number | null): string {
  return dday === null ? "상시 접수" : `D-${dday}`;
}
export const FIT_META: Record<string, { label: string; tone: "brand" | "amber" }> = {
  high: { label: "가능성 높음", tone: "brand" },
  check: { label: "확인 필요", tone: "amber" },
  low: { label: "가능성 낮음", tone: "amber" },
};
