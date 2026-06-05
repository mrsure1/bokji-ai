// 도메인 타입 정의 — UI와 데이터 계층이 공유하는 단일 소스.

/** 적합도 (PRD 3.2: 가능성 높음 / 확인 필요 / 가능성 낮음) */
export type FitLevel = "high" | "check" | "low";

/** 복지 혜택 */
export interface Benefit {
  id: string;
  name: string;
  /** 쉬운 말 한 줄 요약 */
  summary: string;
  /** 표시용 금액 문구 (예: "월 20만원") */
  amount: string;
  /** 금액 보조 문구 (예: "최대 12개월") */
  amountNote?: string;
  category: string;
  region: string;
  fit: FitLevel;
  /** 신청 마감까지 남은 일수. null = 상시 접수 */
  dday: number | null;
  /** 마감일 표시 문구 (예: "6월 8일(월)") */
  deadlineLabel?: string;
  conditions: string[];
  documents: string[];
  agency: string;
  applyUrl: string;
  /** 상세 화면용 쉬운 말 요약 (PRD 3.3) */
  detail: {
    who: string;
    what: string;
    when: string;
    how: string;
    terms: { term: string; plain: string }[];
  };
}

export type NotiType = "urgent" | "new" | "change" | "info";

export interface AppNotification {
  id: string;
  type: NotiType;
  title: string;
  time: string;
  benefitId?: string;
}

export interface UserProfile {
  name: string;
  region: string;
  ageHousehold: string;
  jobStatus: string;
  /** 미입력 가능 항목 (추천 정확도에 영향) */
  housing: string | null;
  income: string | null;
  interests: string[];
  alarms: { sms: boolean; email: boolean; night: boolean };
}
