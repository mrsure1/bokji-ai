// 사용자 일상어 → facet 토큰 매핑 (가벼운 온톨로지: 통제 어휘 + 동의어 사전).
// 매핑 대상 토큰은 benefits 테이블 facet 컬럼의 통제 어휘와 정확히 일치해야 한다.

/** 관심주제(themes) 동의어 — 복지로 관심주제 코드표 어휘로 매핑 */
const THEME_SYNONYMS: [string, string][] = [
  ["월세", "주거"], ["전세", "주거"], ["임대", "주거"], ["집세", "주거"], ["보증금", "주거"], ["주거", "주거"], ["전입", "주거"],
  ["난방", "에너지"], ["전기요금", "에너지"], ["연료", "에너지"], ["에너지", "에너지"], ["가스요금", "에너지"],
  ["병원", "신체건강"], ["치료", "신체건강"], ["진료", "신체건강"], ["수술", "신체건강"], ["의료비", "신체건강"], ["건강", "신체건강"], ["입원", "신체건강"], ["질병", "신체건강"], ["재활", "신체건강"],
  ["우울", "정신건강"], ["심리", "정신건강"], ["정신", "정신건강"], ["스트레스", "정신건강"], ["자살", "정신건강"],
  ["취업", "일자리"], ["구직", "일자리"], ["일자리", "일자리"], ["실직", "일자리"], ["퇴사", "일자리"], ["창업", "일자리"], ["직업훈련", "일자리"], ["고용", "일자리"],
  ["생활비", "생활지원"], ["생계", "생활지원"], ["긴급", "생활지원"], ["생활지원", "생활지원"], ["공과금", "생활지원"],
  ["대출", "서민금융"], ["빚", "서민금융"], ["채무", "서민금융"], ["금융", "서민금융"], ["자금", "서민금융"],
  ["어린이집", "보육"], ["유치원", "보육"], ["보육", "보육"], ["돌봄교실", "보육"],
  ["학비", "교육"], ["학자금", "교육"], ["장학", "교육"], ["등록금", "교육"], ["교육", "교육"], ["학원", "교육"],
  ["출산", "임신·출산"], ["임신", "임신·출산"], ["산모", "임신·출산"], ["난임", "임신·출산"], ["산후", "임신·출산"],
  ["요양", "보호·돌봄"], ["돌봄", "보호·돌봄"], ["간병", "보호·돌봄"], ["간호", "보호·돌봄"],
  ["문화", "문화·여가"], ["여가", "문화·여가"], ["체육", "문화·여가"], ["여행", "문화·여가"],
  ["재난", "안전·위기"], ["위기", "안전·위기"], ["폭력", "안전·위기"], ["학대", "안전·위기"],
  ["법률", "법률"], ["소송", "법률"], ["변호", "법률"],
];

/** 생애주기(life_stages) 동의어 */
const LIFE_SYNONYMS: [string, string][] = [
  ["영유아", "영유아"], ["아기", "영유아"], ["유아", "영유아"], ["신생아", "영유아"],
  ["아동", "아동"], ["어린이", "아동"], ["초등", "아동"],
  ["청소년", "청소년"], ["중학생", "청소년"], ["고등학생", "청소년"], ["학생", "청소년"],
  ["청년", "청년"], ["대학생", "청년"], ["사회초년", "청년"],
  ["중장년", "중장년"], ["중년", "중장년"], ["장년", "중장년"],
  ["노인", "노년"], ["어르신", "노년"], ["노년", "노년"], ["고령", "노년"], ["은퇴", "노년"],
  ["임신", "임신·출산"], ["출산", "임신·출산"], ["산모", "임신·출산"],
];

/** 가구유형(household_types) 동의어 */
const HOUSEHOLD_SYNONYMS: [string, string][] = [
  ["다문화", "다문화·탈북민"], ["탈북", "다문화·탈북민"], ["북한이탈", "다문화·탈북민"], ["이주", "다문화·탈북민"],
  ["다자녀", "다자녀"], ["자녀가 많", "다자녀"],
  ["보훈", "보훈대상자"], ["국가유공", "보훈대상자"], ["유공자", "보훈대상자"],
  ["장애", "장애인"], ["장애인", "장애인"],
  ["저소득", "저소득"], ["기초생활", "저소득"], ["수급자", "저소득"], ["차상위", "저소득"], ["형편이 어렵", "저소득"], ["가난", "저소득"],
  ["한부모", "한부모·조손"], ["조손", "한부모·조손"], ["미혼모", "한부모·조손"], ["혼자 키", "한부모·조손"],
];

/** 시도 정규화: 사용자/데이터 표기를 표준 키로, 그리고 DB region_sido 검색용 접두사로 */
const SIDO_CANON: [string, string, string][] = [
  // [표준키, 매칭 substring, DB ilike 접두사]
  ["서울", "서울", "서울"],
  ["부산", "부산", "부산"],
  ["대구", "대구", "대구"],
  ["인천", "인천", "인천"],
  ["광주", "광주", "광주"],
  ["대전", "대전", "대전"],
  ["울산", "울산", "울산"],
  ["세종", "세종", "세종"],
  ["경기", "경기", "경기"],
  ["강원", "강원", "강원"],
  ["충북", "충청북", "충청북"],
  ["충북", "충북", "충청북"],
  ["충남", "충청남", "충청남"],
  ["충남", "충남", "충청남"],
  ["전북", "전라북", "전라북"],
  ["전북", "전북", "전라북"],
  ["전남", "전라남", "전라남"],
  ["전남", "전남", "전라남"],
  ["경북", "경상북", "경상북"],
  ["경북", "경북", "경상북"],
  ["경남", "경상남", "경상남"],
  ["경남", "경남", "경상남"],
  ["제주", "제주", "제주"],
];

/** 연령 관련 생애주기 토큰 (life_stages 중 연령으로 판별 가능한 것) */
export const AGE_LIFE_STAGES = new Set([
  "영유아",
  "아동",
  "청소년",
  "청년",
  "중장년",
  "노년",
]);

/** 출생년도 → 생애주기 토큰. birthYear 없으면 null(연령 미상) */
export function birthYearToLifeStage(birthYear: number | null | undefined): string | null {
  if (!birthYear) return null;
  const age = new Date().getFullYear() - birthYear + 1; // 한국식 나이(근사)
  if (age <= 7) return "영유아";
  if (age <= 13) return "아동";
  if (age <= 19) return "청소년";
  if (age <= 39) return "청년";
  if (age <= 64) return "중장년";
  return "노년";
}

/**
 * 혜택이 어느 시/도 전용인지 추정.
 * gov24 데이터는 region_sido가 비어 있고 provider/제목에 지역이 들어 있다.
 * @returns 표준 시도 키(예: "경기") 또는 null(=중앙부처/전국 혜택으로 간주)
 */
export function benefitSido(input: {
  region_sido?: string | null;
  provider?: string | null;
  region_scope?: string | null;
  title?: string | null;
}): string | null {
  return (
    canonSido(input.region_sido) ??
    canonSido(input.provider) ??
    canonSido(input.region_scope) ??
    canonSido(input.title)
  );
}

// 미성년 자녀가 있어야 받을 수 있는 혜택(입학·교복·보육 등)을 식별하는 마커.
// gov24 데이터는 이런 혜택의 life_stages를 비워 두는 경우가 많아 텍스트로 보강한다.
const CHILD_DEPENDENT_RE =
  /자녀|초등|중학교|중학생|고등학교|고등학생|초·중·고|초중고|중·고|신입생|입학준비금|입학축하금|입학지원금|교복|어린이집|유치원|보육|누리과정|영유아|아동|청소년|양육|육아|학부모|돌봄교실|다자녀|장학/;
const CHILD_LIFE_STAGES = new Set(["영유아", "아동", "청소년"]);

/**
 * 혜택이 "미성년 자녀를 둔 가구"를 전제로 하는지.
 * @returns true면 자녀 없는 가구에는 보여주지 않는 것이 적절하다.
 */
export function isChildDependentBenefit(input: {
  title?: string | null;
  target_summary?: string | null;
  benefit_summary?: string | null;
  life_stages?: string[] | null;
}): boolean {
  if ((input.life_stages ?? []).some((s) => CHILD_LIFE_STAGES.has(s))) return true;
  const hay = `${input.title ?? ""} ${input.target_summary ?? ""} ${input.benefit_summary ?? ""}`;
  return CHILD_DEPENDENT_RE.test(hay);
}

/** 가구 상황 → benefits.household_types facet 어휘 매핑 (해당되는 것만) */
const SITUATION_TO_FACET: Record<string, string> = {
  "한부모 가정": "한부모·조손",
  "조손 가정": "한부모·조손",
  "다자녀 가정": "다자녀",
  "장애가 있는 가족": "장애인",
};

export function situationsToBenefitHouseholds(situations: string[] | null | undefined): string[] {
  const out = new Set<string>();
  for (const s of situations ?? []) {
    const facet = SITUATION_TO_FACET[s];
    if (facet) out.add(facet);
  }
  return [...out];
}

/** 미성년 자녀가 있음을 함의하는 가구 상황 */
const CHILD_SITUATIONS = ["미성년 자녀 양육", "한부모 가정", "조손 가정", "다자녀 가정"];

/**
 * 가구 상황상 "부양 중인 미성년 자녀가 없음"이 확실한지.
 * @returns true(자녀 없음) / false(자녀 있음) / null(미입력·판단 보류)
 */
export function householdHasNoChildren(situations: string[] | null | undefined): boolean | null {
  if (!situations || situations.length === 0) return null;
  return !situations.some((s) => CHILD_SITUATIONS.includes(s));
}

/**
 * 가구 구성원 전체의 생애주기 토큰.
 * 본인 나이뿐 아니라 부양 대상(미성년 자녀·어르신 부모)의 생애주기까지 포함시켜,
 * 예컨대 56세가 부모를 부양하면 '노년' 대상 혜택(장기요양 등)도 적합하게 만든다.
 */
export function householdLifeStages(
  birthYear: number | null | undefined,
  situations: string[] | null | undefined,
): string[] {
  const set = new Set<string>();
  const self = birthYearToLifeStage(birthYear);
  if (self) set.add(self);
  const sits = situations ?? [];
  if (sits.some((s) => ["미성년 자녀 양육", "한부모 가정", "다자녀 가정"].includes(s))) {
    set.add("영유아");
    set.add("아동");
    set.add("청소년");
  }
  if (sits.includes("조손 가정")) {
    set.add("아동");
    set.add("청소년");
    set.add("노년");
  }
  if (sits.includes("부모님(어르신) 부양")) set.add("노년");
  return [...set];
}

// 제목/대상 텍스트로 연령대를 추론하는 보조 사전 (life_stages가 비어 있는 gov24 데이터 보강).
const AGE_TEXT_MARKERS: [RegExp, string][] = [
  [/영유아|어린이집|유치원|보육/, "영유아"],
  [/초등|아동/, "아동"],
  [/청소년|중학생|고등학생|중·고생|중고생/, "청소년"],
  [/청년|대학생|사회초년/, "청년"],
  [/중장년|중년|장년/, "중장년"],
  [/노인|어르신|고령|시니어|경로/, "노년"],
];

/** 혜택이 겨냥하는 연령대 토큰. life_stages 우선, 비어 있으면 텍스트로 추론. */
export function inferAgeStages(input: {
  life_stages?: string[] | null;
  title?: string | null;
  target_summary?: string | null;
  benefit_summary?: string | null;
}): string[] {
  const fromLife = (input.life_stages ?? []).filter((s) => AGE_LIFE_STAGES.has(s));
  if (fromLife.length) return fromLife;
  const hay = `${input.title ?? ""} ${input.target_summary ?? ""} ${input.benefit_summary ?? ""}`;
  const set = new Set<string>();
  for (const [re, stage] of AGE_TEXT_MARKERS) if (re.test(hay)) set.add(stage);
  return [...set];
}

/**
 * 혜택이 가구 구성원 중 누군가의 연령대에 맞는지. 연령 단서가 없으면 전연령으로 본다.
 * @param householdStages 가구 전체 생애주기(본인 + 부양 자녀/부모). 비어 있으면 연령 미상.
 */
export function benefitMatchesAge(
  input: {
    life_stages?: string[] | null;
    title?: string | null;
    target_summary?: string | null;
    benefit_summary?: string | null;
  },
  householdStages: string[],
): { applicable: boolean; ageScoped: boolean } {
  const ageTokens = inferAgeStages(input);
  if (ageTokens.length === 0) return { applicable: true, ageScoped: false }; // 전연령
  if (householdStages.length === 0) return { applicable: true, ageScoped: true }; // 연령 미상
  return { applicable: ageTokens.some((t) => householdStages.includes(t)), ageScoped: true };
}

export interface ExtractedSignals {
  themes: string[];
  lifeStages: string[];
  households: string[];
  /** 본문 ilike 검색용 핵심 명사 */
  keywords: string[];
}

function collect(text: string, dict: [string, string][]): { tokens: string[]; hits: string[] } {
  const tokens = new Set<string>();
  const hits = new Set<string>();
  for (const [surface, token] of dict) {
    if (text.includes(surface)) {
      tokens.add(token);
      hits.add(surface);
    }
  }
  return { tokens: [...tokens], hits: [...hits] };
}

/** 사용자 메시지에서 facet 신호 추출 */
export function extractSignals(message: string): ExtractedSignals {
  const t = message.replace(/\s+/g, " ");
  const theme = collect(t, THEME_SYNONYMS);
  const life = collect(t, LIFE_SYNONYMS);
  const house = collect(t, HOUSEHOLD_SYNONYMS);
  const keywords = [...new Set([...theme.hits, ...life.hits, ...house.hits])];
  return {
    themes: theme.tokens,
    lifeStages: life.tokens,
    households: house.tokens,
    keywords,
  };
}

/** 시도 표기 → 표준 키 (예: "전라남도 해남군" → "전남", "서울 관악구" → "서울") */
export function canonSido(text: string | null | undefined): string | null {
  if (!text) return null;
  for (const [key, sub] of SIDO_CANON) {
    if (text.includes(sub)) return key;
  }
  return null;
}

/** 표준 키 → DB region_sido ilike 접두사 (예: "전남" → "전라남") */
export function sidoDbPrefix(canonKey: string | null | undefined): string | null {
  if (!canonKey) return null;
  const found = SIDO_CANON.find(([key]) => key === canonKey);
  return found ? found[2] : null;
}
