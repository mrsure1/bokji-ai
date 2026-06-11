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
    cautions?: string;
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

/** 사용자 프로필 — profiles 테이블과 1:1 대응 */
export interface UserProfile {
  name: string | null;
  regionSido: string | null;
  regionSigungu: string | null;
  birthYear: number | null;
  /** 가구 상황 (복수: 혼자/배우자/자녀 양육/부모 부양/한부모/조손/다자녀/장애가족) */
  householdSituations: string[];
  /** 직업/현재 상태 (구직자, 직장인, 최근 실직 등) */
  currentStatus: string | null;
  housingType: string | null;
  incomeBand: string | null;
  interests: string[];
  /** 앱 알림 수신 여부 (마감 임박·새 혜택을 앱에서 알림) */
  alarms: { app: boolean };
}

export const EMPTY_PROFILE: UserProfile = {
  name: null,
  regionSido: null,
  regionSigungu: null,
  birthYear: null,
  householdSituations: [],
  currentStatus: null,
  housingType: null,
  incomeBand: null,
  interests: [],
  alarms: { app: true },
};

/** 프로필 선택지 — UI와 매칭 어휘(facets)가 공유 */
export const PROFILE_OPTIONS = {
  sido: ["서울", "부산", "대구", "인천", "광주", "대전", "울산", "세종", "경기", "강원", "충북", "충남", "전북", "전남", "경북", "경남", "제주"],
  householdSituations: [
    "혼자 살아요",
    "배우자와 함께",
    "미성년 자녀 양육",
    "부모님(어르신) 부양",
    "한부모 가정",
    "조손 가정",
    "다자녀 가정",
    "장애가 있는 가족",
  ],
  currentStatus: ["학생", "구직자", "직장인", "프리랜서", "소상공인", "최근 실직", "휴직 중", "무직", "은퇴"],
  housingType: ["월세", "전세", "자가", "고시원·기숙사", "임시 거주"],
  incomeBand: ["소득 없음", "낮음", "중간", "잘 모르겠음"],
  /** benefits.themes 통제 어휘와 동일 */
  interests: ["주거", "생활지원", "일자리", "신체건강", "정신건강", "교육", "보육", "임신·출산", "보호·돌봄", "서민금융", "에너지", "문화·여가", "안전·위기", "법률"],
} as const;
