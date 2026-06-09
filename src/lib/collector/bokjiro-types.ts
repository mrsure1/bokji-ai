export type BokjiroSource = "central" | "local";

export type BokjiroSrchKeyCode = "001" | "002" | "003";

export interface BokjiroListParams {
  pageNo?: number;
  numOfRows?: number;
  srchKeyCode?: BokjiroSrchKeyCode;
  searchWrd?: string;
  lifeArray?: string;
  trgterIndvdlArray?: string;
  intrsThemaArray?: string;
  age?: string;
  onapPsbltYn?: "Y" | "N";
  orderBy?: "date" | "popular";
  /** 지자체 API — 시도 코드 (활용가이드 참고) */
  ctpvNm?: string;
  sggNm?: string;
}

export interface BokjiroListItem {
  servId: string;
  servNm: string;
  servDgst: string;
  servDtlLink: string;
  jurMnofNm: string;
  jurOrgNm: string;
  lifeArray: string;
  trgterIndvdlArray: string;
  intrsThemaArray: string;
  sprtCycNm: string;
  srvPvsnNm: string;
  onapPsbltYn: string;
  rprsCtadr: string;
  inqNum: string;
  svcfrstRegTs: string;
}

/**
 * 지자체 복지서비스 목록 항목 (LcgvWelfarelist).
 * 중앙부처와 필드가 다름: 지역(ctpvNm/sggNm)이 있고, 코드 대신 *NmArray(명칭) 사용.
 */
export interface BokjiroLocalListItem {
  servId: string;
  servNm: string;
  servDgst: string;
  servDtlLink: string;
  /** 시도명 (예: 전라남도) */
  ctpvNm: string;
  /** 시군구명 (예: 해남군) */
  sggNm: string;
  /** 담당부서 (제공기관 대용) */
  bizChrDeptNm: string;
  lifeNmArray: string;
  trgterIndvdlNmArray: string;
  intrsThemaNmArray: string;
  sprtCycNm: string;
  srvPvsnNm: string;
  /** 신청방법 (예: 방문) */
  aplyMtdNm: string;
  inqNum: string;
  /** 최종수정일 (YYYYMMDD) */
  lastModYmd: string;
}

export interface BokjiroListResponse<T = BokjiroListItem> {
  totalCount: number;
  pageNo: number;
  numOfRows: number;
  resultCode: string;
  resultMessage: string;
  items: T[];
}

export interface BokjiroDetailItem {
  servId: string;
  servNm: string;
  jurMnofNm: string;
  tgtrDtlCn: string;
  slctCritCn: string;
  alwServCn: string;
  wlfareInfoOutlCn: string;
  crtrYr: string;
  rprsCtadr: string;
  sprtCycNm: string;
  srvPvsnNm: string;
  lifeArray: string;
  trgterIndvdlArray: string;
  intrsThemaArray: string;
}

export interface BokjiroApiError extends Error {
  resultCode: string;
  resultMessage: string;
}
