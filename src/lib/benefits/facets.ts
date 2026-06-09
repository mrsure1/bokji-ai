// 복지 혜택 → 검색·하드필터용 facet 정규화.
// 사용자 profiles(region_sido/household_type/interests …) 스키마와 대응시켜
// "프로필 ↔ 혜택" 결정적 매칭을 가능하게 하는 통제 어휘 계층.

export interface BenefitFacets {
  region_sido: string | null;
  region_sigungu: string | null;
  life_stages: string[];
  household_types: string[];
  themes: string[];
  category: string | null;
}

/** 콤마/세미콜론 구분 문자열 → 정규화된 토큰 배열 ("임신 · 출산" → "임신·출산") */
function splitList(s: string | null | undefined): string[] {
  return (s ?? "")
    .split(/[,;]/)
    .map((x) => x.trim().replace(/\s*·\s*/g, "·").replace(/\s+/g, " "))
    .filter(Boolean)
    .filter((x) => x !== "구분없음" && x !== "전생애");
}

const uniq = (arr: string[]): string[] => [...new Set(arr)];

const CATEGORY_KEYWORDS: [string, string][] = [
  ["주거", "주거"], ["임대", "주거"], ["전세", "주거"], ["월세", "주거"], ["에너지", "주거"],
  ["의료", "의료"], ["건강", "의료"], ["치료", "의료"], ["병원", "의료"], ["재활", "의료"],
  ["일자리", "일자리"], ["고용", "일자리"], ["취업", "일자리"], ["창업", "일자리"], ["서민금융", "일자리"],
  ["생계", "생계"], ["긴급", "생계"], ["생활지원", "생계"],
  ["보육", "육아"], ["육아", "육아"], ["출산", "육아"], ["임신", "육아"], ["산모", "육아"],
  ["교육", "교육"], ["장학", "교육"], ["학자금", "교육"],
  ["장애", "장애"],
  ["노인", "노인"], ["어르신", "노인"], ["노년", "노인"],
  ["돌봄", "돌봄"], ["요양", "돌봄"], ["보호", "돌봄"],
  ["문화", "문화"], ["여가", "문화"],
];

function inferCategory(text: string, themes: string[]): string {
  const hay = `${text} ${themes.join(" ")}`;
  for (const [kw, cat] of CATEGORY_KEYWORDS) if (hay.includes(kw)) return cat;
  return themes[0] ?? "기타";
}

// 정부24는 생애주기/가구유형 코드가 없어 자유 텍스트에서 키워드로 추론
const LIFE_KEYWORDS: [string, string][] = [
  ["영유아", "영유아"], ["유아", "영유아"], ["아동", "아동"], ["청소년", "청소년"],
  ["청년", "청년"], ["중장년", "중장년"], ["노인", "노년"], ["어르신", "노년"], ["노년", "노년"],
  ["임신", "임신·출산"], ["출산", "임신·출산"], ["산모", "임신·출산"],
];
const HOUSEHOLD_KEYWORDS: [string, string][] = [
  ["다문화", "다문화·탈북민"], ["탈북", "다문화·탈북민"], ["북한이탈", "다문화·탈북민"],
  ["다자녀", "다자녀"], ["보훈", "보훈대상자"], ["국가유공", "보훈대상자"],
  ["장애", "장애인"], ["저소득", "저소득"], ["기초생활", "저소득"], ["차상위", "저소득"],
  ["한부모", "한부모·조손"], ["조손", "한부모·조손"],
];

function inferFromText(text: string, dict: [string, string][]): string[] {
  return uniq(dict.filter(([kw]) => text.includes(kw)).map(([, v]) => v));
}

type RawItem = Record<string, string | undefined>;

/** source별 raw_content(원본 JSON)에서 facet 도출 */
export function deriveFacets(source: string, raw: RawItem): BenefitFacets {
  if (source === "bokjiro-central") {
    const themes = uniq(splitList(raw.intrsThemaArray));
    return {
      region_sido: null,
      region_sigungu: null,
      life_stages: uniq(splitList(raw.lifeArray)),
      household_types: uniq(splitList(raw.trgterIndvdlArray)),
      themes,
      category: inferCategory(`${raw.servNm ?? ""} ${raw.servDgst ?? ""}`, themes),
    };
  }

  if (source === "bokjiro-local") {
    const themes = uniq(splitList(raw.intrsThemaNmArray));
    return {
      region_sido: (raw.ctpvNm ?? "").trim() || null,
      region_sigungu: (raw.sggNm ?? "").trim() || null,
      life_stages: uniq(splitList(raw.lifeNmArray)),
      household_types: uniq(splitList(raw.trgterIndvdlNmArray)),
      themes,
      category: inferCategory(`${raw.servNm ?? ""} ${raw.servDgst ?? ""}`, themes),
    };
  }

  if (source === "gov24") {
    const themes = uniq(splitList(raw["서비스분야"]));
    const text = `${raw["서비스명"] ?? ""} ${raw["서비스목적요약"] ?? ""} ${raw["지원대상"] ?? ""} ${raw["선정기준"] ?? ""}`;
    return {
      region_sido: null,
      region_sigungu: null,
      life_stages: inferFromText(text, LIFE_KEYWORDS),
      household_types: inferFromText(text, HOUSEHOLD_KEYWORDS),
      themes,
      category: inferCategory(text, themes),
    };
  }

  return {
    region_sido: null,
    region_sigungu: null,
    life_stages: [],
    household_types: [],
    themes: [],
    category: null,
  };
}
