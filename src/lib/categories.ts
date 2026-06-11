// 홈 카테고리 필터 정의.
// benefits.themes에 출처별로 두 어휘 체계가 섞여 있어(예: "주거·자립" vs "주거"),
// 각 카테고리를 양쪽 어휘 모두에 매핑한다.

export interface HomeCategory {
  key: string;
  /** 칩에 표시할 짧은 라벨 */
  label: string;
  /** 이 카테고리에 해당하는 benefits.themes 값들 (둘 다 매칭) */
  themes: string[];
}

export const HOME_CATEGORIES: HomeCategory[] = [
  { key: "all", label: "전체", themes: [] },
  { key: "housing", label: "주거", themes: ["주거·자립", "주거"] },
  { key: "job", label: "일자리", themes: ["고용·창업", "일자리"] },
  { key: "edu", label: "교육", themes: ["보육·교육", "교육", "보육"] },
  { key: "living", label: "생계", themes: ["생활안정", "생활지원", "서민금융"] },
  { key: "health", label: "의료", themes: ["보건·의료", "신체건강", "정신건강"] },
  { key: "care", label: "돌봄", themes: ["보호·돌봄", "입양·위탁"] },
  { key: "birth", label: "출산", themes: ["임신·출산"] },
  { key: "farm", label: "농림", themes: ["농림축산어업"] },
  { key: "safety", label: "안전", themes: ["문화·환경", "안전·위기", "행정·안전"] },
];

const BY_KEY = new Map(HOME_CATEGORIES.map((c) => [c.key, c]));

/** 카테고리 키 → 매칭할 theme 목록. 'all'이거나 알 수 없으면 빈 배열(=필터 없음). */
export function themesForCategory(key: string | null | undefined): string[] {
  if (!key || key === "all") return [];
  return BY_KEY.get(key)?.themes ?? [];
}
