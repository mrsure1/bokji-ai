import { serverEnv } from "@/lib/env";
import type {
  Gov24ByServiceIdParams,
  Gov24ListParams,
  Gov24PagedResponse,
  Gov24ServiceDetailItem,
  Gov24ServiceListItem,
  Gov24SupportConditionsItem,
} from "./gov24-types";

const ENDPOINTS = {
  serviceList: "/gov24/v3/serviceList",
  serviceDetail: "/gov24/v3/serviceDetail",
  supportConditions: "/gov24/v3/supportConditions",
} as const;

export class Gov24Client {
  constructor(
    private readonly serviceKey: string,
    private readonly baseUrl: string,
  ) {}

  static fromEnv(): Gov24Client {
    const serviceKey = serverEnv.gov24ServiceKey;
    if (!serviceKey) {
      throw new Error("GOV24_SERVICE_KEY가 설정되지 않았습니다.");
    }

    return new Gov24Client(
      serviceKey,
      serverEnv.gov24ApiBaseUrl ?? "https://api.odcloud.kr/api",
    );
  }

  async fetchServiceList(
    params: Gov24ListParams = {},
  ): Promise<Gov24PagedResponse<Gov24ServiceListItem>> {
    const query = this.buildListQuery(params);
    return this.request<Gov24ServiceListItem>(ENDPOINTS.serviceList, query);
  }

  async fetchServiceDetail(
    params: Gov24ByServiceIdParams,
  ): Promise<Gov24PagedResponse<Gov24ServiceDetailItem>> {
    const query = this.buildServiceIdQuery(params);
    return this.request<Gov24ServiceDetailItem>(ENDPOINTS.serviceDetail, query);
  }

  async fetchSupportConditions(
    params: Gov24ByServiceIdParams,
  ): Promise<Gov24PagedResponse<Gov24SupportConditionsItem>> {
    const query = this.buildServiceIdQuery(params);
    return this.request<Gov24SupportConditionsItem>(
      ENDPOINTS.supportConditions,
      query,
    );
  }

  async fetchAllServiceList(
    params: Omit<Gov24ListParams, "page"> = {},
  ): Promise<Gov24ServiceListItem[]> {
    const perPage = Math.min(params.perPage ?? 100, 100);
    const first = await this.fetchServiceList({ ...params, page: 1, perPage });
    const items = [...first.data];

    const totalPages = Math.ceil(first.totalCount / perPage);
    for (let page = 2; page <= totalPages; page += 1) {
      const next = await this.fetchServiceList({ ...params, page, perPage });
      items.push(...next.data);
    }

    return items;
  }

  private buildListQuery(params: Gov24ListParams): Record<string, string> {
    const query: Record<string, string> = {
      serviceKey: this.serviceKey,
      page: String(params.page ?? 1),
      perPage: String(params.perPage ?? 10),
    };

    if (params.returnType) query.returnType = params.returnType;
    if (params.serviceNameLike) query["cond[서비스명::LIKE]"] = params.serviceNameLike;
    if (params.agencyNameLike) query["cond[소관기관명::LIKE]"] = params.agencyNameLike;
    if (params.agencyTypeLike) query["cond[소관기관유형::LIKE]"] = params.agencyTypeLike;
    if (params.userTypeLike) query["cond[사용자구분::LIKE]"] = params.userTypeLike;
    if (params.serviceFieldLike) query["cond[서비스분야::LIKE]"] = params.serviceFieldLike;

    return query;
  }

  private buildServiceIdQuery(params: Gov24ByServiceIdParams): Record<string, string> {
    const query: Record<string, string> = {
      serviceKey: this.serviceKey,
      page: String(params.page ?? 1),
      perPage: String(params.perPage ?? 10),
      "cond[서비스ID::EQ]": params.serviceId,
    };

    if (params.returnType) query.returnType = params.returnType;
    return query;
  }

  private async request<T>(
    path: string,
    query: Record<string, string>,
  ): Promise<Gov24PagedResponse<T>> {
    const url = `${this.baseUrl}${path}?${new URLSearchParams(query).toString()}`;
    const res = await fetch(url, {
      headers: { Accept: "application/json" },
      next: { revalidate: 0 },
    });

    const text = await res.text();
    if (!res.ok) {
      throw new Error(`[gov24:${path}] HTTP ${res.status} — ${text.slice(0, 200)}`);
    }

    let body: Gov24PagedResponse<T>;
    try {
      body = JSON.parse(text) as Gov24PagedResponse<T>;
    } catch {
      throw new Error(`[gov24:${path}] JSON 파싱 실패 — ${text.slice(0, 200)}`);
    }

    if (!Array.isArray(body.data)) {
      throw new Error(`[gov24:${path}] 예상치 못한 응답 형식`);
    }

    return body;
  }
}
