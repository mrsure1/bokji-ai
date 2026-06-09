/** 정부24 공공서비스(혜택) API — Swagger v3 필드명 그대로 사용 */

export interface Gov24PagedResponse<T> {
  page: number;
  perPage: number;
  totalCount: number;
  currentCount: number;
  matchCount: number;
  data: T[];
}

export interface Gov24ServiceListItem {
  서비스ID: string;
  지원유형: string;
  서비스명: string;
  서비스목적요약: string;
  지원대상: string;
  선정기준: string;
  지원내용: string;
  신청방법: string;
  신청기한: string;
  상세조회URL: string;
  소관기관코드: string;
  소관기관명: string;
  부서명: string;
  조회수: number;
  소관기관유형: string;
  사용자구분: string;
  서비스분야: string;
  접수기관: string;
  전화문의: string;
  등록일시: string;
  수정일시: string;
}

export interface Gov24ServiceDetailItem {
  서비스ID: string;
  지원유형: string;
  서비스명: string;
  서비스목적: string;
  신청기한: string;
  지원대상: string;
  선정기준: string;
  지원내용: string;
  신청방법: string;
  구비서류: string;
  접수기관명: string;
  문의처: string;
  온라인신청사이트URL: string;
  수정일시: string;
  소관기관명: string;
  행정규칙: string | null;
  자치법규: string | null;
  법령: string | null;
  공무원확인구비서류: string | null;
  본인확인필요구비서류: string | null;
}

export interface Gov24SupportConditionsItem {
  서비스ID: string;
  서비스명: string;
  JA0101?: string | null;
  JA0102?: string | null;
  JA0110?: number | null;
  JA0111?: number | null;
  JA0201?: string | null;
  JA0202?: string | null;
  JA0203?: string | null;
  JA0204?: string | null;
  JA0205?: string | null;
  [key: `JA${string}`]: string | number | null | undefined;
}

export interface Gov24ListParams {
  page?: number;
  perPage?: number;
  returnType?: "JSON" | "XML";
  serviceNameLike?: string;
  agencyNameLike?: string;
  agencyTypeLike?: string;
  userTypeLike?: string;
  serviceFieldLike?: string;
}

export interface Gov24ByServiceIdParams {
  page?: number;
  perPage?: number;
  returnType?: "JSON" | "XML";
  serviceId: string;
}
