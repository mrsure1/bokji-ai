// ──────────────────────────────────────────────────────────────────
// 데이터 접근 계층 (단일 교체 지점)
// 현재는 시드 데이터를 반환합니다. 실제 API 키 / DB 연결 시
// 이 파일의 접근 함수 내부만 교체하면 화면 코드는 그대로 동작합니다.
// ──────────────────────────────────────────────────────────────────
import type { AppNotification, Benefit, UserProfile } from "./types";

const BENEFITS: Benefit[] = [
  {
    id: "youth-rent",
    name: "청년 월세 한시 특별지원",
    summary: "무주택 청년에게 매달 월세를 보태드려요.",
    amount: "월 20만원",
    amountNote: "최대 12개월",
    category: "주거",
    region: "서울 청년",
    fit: "high",
    dday: 3,
    deadlineLabel: "6월 8일(월)",
    conditions: ["만 19~34세", "서울 거주", "무주택"],
    documents: ["임대차계약서", "통장사본", "주민등록등본", "가족관계증명서"],
    agency: "서울특별시 / 국토교통부",
    applyUrl: "https://www.gov.kr",
    detail: {
      who: "서울에 사는 만 19~34세 무주택 청년이면 신청할 수 있어요.",
      what: "매달 20만원씩 최대 12개월(총 240만원) 월세를 지원해요.",
      when: "6월 8일(월)까지 신청해야 이번 회차에 포함돼요.",
      how: "복지로 또는 정부24에서 온라인으로 신청해요.",
      terms: [
        { term: "무주택", plain: "본인 명의의 집이 없는 상태예요." },
        { term: "소득인정액", plain: "버는 돈과 재산을 합쳐 계산한 금액이에요." },
      ],
    },
  },
  {
    id: "seoul-housing-voucher",
    name: "서울형 주택바우처",
    summary: "무주택 저소득 청년의 월세를 보조해요.",
    amount: "월 8만원",
    category: "주거",
    region: "서울",
    fit: "check",
    dday: 9,
    conditions: ["서울 거주", "기준 중위소득 60% 이하"],
    documents: ["임대차계약서", "소득 증빙"],
    agency: "서울특별시",
    applyUrl: "https://www.gov.kr",
    detail: {
      who: "서울에 사는 저소득 무주택 가구가 받을 수 있어요.",
      what: "매달 8만원씩 월세를 보조해요.",
      when: "주민센터에서 상시 접수하지만 예산 소진 시 마감돼요.",
      how: "거주지 동주민센터를 방문해 신청해요.",
      terms: [{ term: "기준 중위소득", plain: "전체 가구를 줄 세웠을 때 가운데 소득이에요." }],
    },
  },
  {
    id: "disaster-medical",
    name: "재난적 의료비 지원",
    summary: "큰 병원비 부담을 덜어드려요.",
    amount: "최대 3천만원",
    category: "의료",
    region: "전국",
    fit: "check",
    dday: 16,
    conditions: ["소득 기준 충족", "의료비 부담 비율 확인"],
    documents: ["진료비 영수증", "소득 증빙", "진단서"],
    agency: "보건복지부 / 국민건강보험공단",
    applyUrl: "https://www.gov.kr",
    detail: {
      who: "갑작스러운 큰 병원비로 부담이 큰 가구가 대상이에요.",
      what: "본인부담 의료비의 일부를 최대 3천만원까지 지원해요.",
      when: "퇴원일 다음 날부터 180일 이내에 신청해요.",
      how: "국민건강보험공단 지사에 방문해 신청해요.",
      terms: [{ term: "본인부담금", plain: "건강보험이 적용된 뒤 내가 실제로 낸 돈이에요." }],
    },
  },
  {
    id: "national-employment",
    name: "국민취업지원제도",
    summary: "구직 기간 동안 생활을 지원해요.",
    amount: "월 50만원",
    amountNote: "6개월",
    category: "일자리",
    region: "전국",
    fit: "high",
    dday: null,
    conditions: ["15~69세 구직자", "소득·재산 기준 충족"],
    documents: ["신분증", "구직 신청서"],
    agency: "고용노동부",
    applyUrl: "https://www.gov.kr",
    detail: {
      who: "일을 찾고 있는 15~69세라면 신청할 수 있어요.",
      what: "구직촉진수당을 월 50만원씩 6개월 동안 지원해요.",
      when: "상시 접수해요.",
      how: "고용센터 또는 취업이룸 누리집에서 신청해요.",
      terms: [{ term: "구직촉진수당", plain: "일자리를 찾는 동안 생활을 돕는 돈이에요." }],
    },
  },
  {
    id: "emergency-living",
    name: "긴급복지 생계지원",
    summary: "갑작스러운 위기 상황의 생활비를 도와요.",
    amount: "1인 71만원",
    category: "생계",
    region: "전국",
    fit: "check",
    dday: null,
    conditions: ["갑작스러운 위기사유 발생", "소득 확인 필요"],
    documents: ["신분증", "위기사유 증빙"],
    agency: "보건복지부",
    applyUrl: "https://www.gov.kr",
    detail: {
      who: "실직·질병 등 갑작스러운 위기로 생계가 어려운 가구가 대상이에요.",
      what: "1인 가구 기준 약 71만원의 생계비를 지원해요.",
      when: "위기 상황 발생 시 바로 신청하세요.",
      how: "보건복지상담센터(129) 또는 주민센터에 신청해요.",
      terms: [{ term: "위기사유", plain: "실직·질병·재난처럼 갑자기 생긴 어려움이에요." }],
    },
  },
];

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

// 접근 함수 — 추후 async API 호출로 교체 가능.
export function getBenefits(): Benefit[] {
  return BENEFITS;
}
export function getBenefit(id: string): Benefit | undefined {
  return BENEFITS.find((b) => b.id === id);
}
/** 홈 히어로: 가능성 높음 중 마감이 가장 임박한 1건 */
export function getHeroBenefit(): Benefit {
  const high = BENEFITS.filter((b) => b.fit === "high" && b.dday !== null);
  const pool = high.length ? high : BENEFITS;
  return [...pool].sort((a, b) => (a.dday ?? 9999) - (b.dday ?? 9999))[0];
}
/** 타임라인: 히어로 외 나머지를 마감 임박순(상시는 뒤)으로 */
export function getTimeline(): Benefit[] {
  const heroId = getHeroBenefit().id;
  return BENEFITS.filter((b) => b.id !== heroId).sort(
    (a, b) => (a.dday ?? 9999) - (b.dday ?? 9999)
  );
}
export function getNotifications(): AppNotification[] {
  return NOTIFICATIONS;
}
export function getProfileSeed(): UserProfile {
  return PROFILE_SEED;
}

// 표시 헬퍼
export function ddayLabel(dday: number | null): string {
  return dday === null ? "상시 접수" : `D-${dday}`;
}
export const FIT_META: Record<string, { label: string; tone: "brand" | "amber" }> = {
  high: { label: "가능성 높음", tone: "brand" },
  check: { label: "확인 필요", tone: "amber" },
  low: { label: "가능성 낮음", tone: "amber" },
};
