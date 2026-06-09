import { serverEnv } from "@/lib/env";
import type {
  SsisCommonCodeResponse,
  SsisServiceTypeCode,
  SsisSignguCode,
  SsisSidoCode,
} from "./ssis-commoncode-types";
import { getTag, parseSocialServiceItems } from "./xml";

const ENDPOINTS = {
  sido: "/sido",
  signgu: "/sido/signgu",
  serviceType: "/serviceType",
} as const;

type ResponseFormat = "json" | "xml";

interface SocialServiceJsonResponse<T> {
  response: {
    header: { resultCode: string | number; resultMsg: string };
    body?: { items?: { item?: T | T[] } };
  };
}

/**
 * 사회서비스 전자바우처 — 공통코드 조회 (IT-OA-004)
 * @see https://www.data.go.kr/data/15059061/openapi.do
 * v1.5(2024-02) 이후 호출 도메인: api.socialservice.or.kr
 */
export class SsisCommonCodeClient {
  constructor(
    private readonly serviceKey: string,
    private readonly baseUrl: string,
  ) {}

  static fromEnv(): SsisCommonCodeClient {
    const serviceKey = serverEnv.socialserviceApiKey;
    if (!serviceKey) {
      throw new Error("SOCIALSERVICE_API_KEY가 설정되지 않았습니다.");
    }

    return new SsisCommonCodeClient(
      serviceKey,
      serverEnv.socialserviceCommonApiBaseUrl ??
        "https://api.socialservice.or.kr:444/api/service/common",
    );
  }

  fetchSidoCodes(format: ResponseFormat = "json"): Promise<SsisCommonCodeResponse<SsisSidoCode>> {
    return this.request<SsisSidoCode>(ENDPOINTS.sido, {}, ["sidoCode", "sidoName"], format);
  }

  fetchSignguCodes(
    sido: string,
    format: ResponseFormat = "json",
  ): Promise<SsisCommonCodeResponse<SsisSignguCode>> {
    return this.request<SsisSignguCode>(
      ENDPOINTS.signgu,
      { sido },
      ["signguCode", "signguName"],
      format,
    );
  }

  fetchServiceTypeCodes(
    format: ResponseFormat = "json",
  ): Promise<SsisCommonCodeResponse<SsisServiceTypeCode>> {
    return this.request<SsisServiceTypeCode>(
      ENDPOINTS.serviceType,
      {},
      ["serviceTypeCode", "serviceTypeName"],
      format,
    );
  }

  private async request<T extends object>(
    path: string,
    params: Record<string, string>,
    tags: string[],
    format: ResponseFormat,
  ): Promise<SsisCommonCodeResponse<T>> {
    const query = new URLSearchParams({
      ServiceKey: this.serviceKey,
      ...params,
    });
    if (format === "json") query.set("_type", "json");

    const url = `${this.baseUrl}${path}?${query.toString()}`;
    const res = await fetch(url, {
      headers: { Accept: format === "json" ? "application/json" : "application/xml" },
      next: { revalidate: 0 },
    });

    const text = await res.text();
    if (!res.ok) {
      throw new Error(`[ssis-common:${path}] HTTP ${res.status} — ${text.slice(0, 200)}`);
    }

    const parsed =
      format === "json"
        ? this.parseJsonResponse<T>(text)
        : parseSocialServiceItems<T>(text, tags);

    if (parsed.resultCode !== "00" && parsed.resultCode !== "0") {
      throw new Error(
        `[ssis-common:${path}] API 오류 (${parsed.resultCode}): ${parsed.resultMsg}`,
      );
    }

    return parsed;
  }

  private parseJsonResponse<T extends object>(
    text: string,
  ): SsisCommonCodeResponse<T> {
    let body: SocialServiceJsonResponse<T>;
    try {
      body = JSON.parse(text) as SocialServiceJsonResponse<T>;
    } catch {
      throw new Error(`[ssis-common] JSON 파싱 실패 — ${text.slice(0, 200)}`);
    }

    const header = body.response?.header;
    const rawItems = body.response?.body?.items?.item;
    const items = rawItems
      ? Array.isArray(rawItems)
        ? rawItems
        : [rawItems]
      : [];

    return {
      resultCode: String(header?.resultCode ?? ""),
      resultMsg: header?.resultMsg ?? "",
      items,
    };
  }
}

/** XML 응답에서 resultCode만 확인 (테스트 스크립트용) */
export function peekSocialServiceResult(xmlOrJson: string): {
  resultCode: string;
  resultMsg: string;
} {
  if (xmlOrJson.trimStart().startsWith("{")) {
    const body = JSON.parse(xmlOrJson) as SocialServiceJsonResponse<Record<string, string>>;
    return {
      resultCode: String(body.response?.header?.resultCode ?? ""),
      resultMsg: body.response?.header?.resultMsg ?? "",
    };
  }
  return {
    resultCode: getTag(xmlOrJson, "resultCode"),
    resultMsg: getTag(xmlOrJson, "resultMsg"),
  };
}
