import { serverEnv } from "@/lib/env";
import type {
  BokjiroDetailItem,
  BokjiroListItem,
  BokjiroListParams,
  BokjiroListResponse,
  BokjiroLocalListItem,
  BokjiroSource,
} from "./bokjiro-types";
import { blockToRecord, getBlocks, getTag } from "./xml";

const CENTRAL_LIST_TAGS = [
  "servId",
  "servNm",
  "servDgst",
  "servDtlLink",
  "jurMnofNm",
  "jurOrgNm",
  "lifeArray",
  "trgterIndvdlArray",
  "intrsThemaArray",
  "sprtCycNm",
  "srvPvsnNm",
  "onapPsbltYn",
  "rprsCtadr",
  "inqNum",
  "svcfrstRegTs",
] as const;

const LOCAL_LIST_TAGS = [
  "servId",
  "servNm",
  "servDgst",
  "servDtlLink",
  "ctpvNm",
  "sggNm",
  "bizChrDeptNm",
  "lifeNmArray",
  "trgterIndvdlNmArray",
  "intrsThemaNmArray",
  "sprtCycNm",
  "srvPvsnNm",
  "aplyMtdNm",
  "inqNum",
  "lastModYmd",
] as const;

const DETAIL_TAGS = [
  "servId",
  "servNm",
  "jurMnofNm",
  "tgtrDtlCn",
  "slctCritCn",
  "alwServCn",
  "wlfareInfoOutlCn",
  "crtrYr",
  "rprsCtadr",
  "sprtCycNm",
  "srvPvsnNm",
  "lifeArray",
  "trgterIndvdlArray",
  "intrsThemaArray",
] as const;

const OPERATIONS = {
  central: {
    list: "NationalWelfarelistV001",
    detail: "NationalWelfaredetailedV001",
  },
  local: {
    list: "LcgvWelfarelist",
    detail: "LcgvWelfaredetailed",
  },
} as const;

export class BokjiroClient {
  constructor(
    private readonly serviceKey: string,
    private readonly centralBaseUrl: string,
    private readonly localBaseUrl: string,
  ) {}

  static fromEnv(): BokjiroClient {
    const serviceKey = serverEnv.dataGoKrServiceKey;
    if (!serviceKey) {
      throw new Error("DATA_GO_KR_SERVICE_KEY가 설정되지 않았습니다.");
    }

    return new BokjiroClient(
      serviceKey,
      serverEnv.bokjiroCentralApiUrl ??
        "https://apis.data.go.kr/B554287/NationalWelfareInformationsV001",
      serverEnv.bokjiroLocalApiUrl ??
        "https://apis.data.go.kr/B554287/LocalGovernmentWelfareInformations",
    );
  }

  fetchList(
    source: "central",
    params?: BokjiroListParams,
  ): Promise<BokjiroListResponse<BokjiroListItem>>;
  fetchList(
    source: "local",
    params?: BokjiroListParams,
  ): Promise<BokjiroListResponse<BokjiroLocalListItem>>;
  async fetchList(
    source: BokjiroSource,
    params: BokjiroListParams = {},
  ): Promise<BokjiroListResponse<BokjiroListItem | BokjiroLocalListItem>> {
    const query: Record<string, string> = {
      serviceKey: this.serviceKey,
      callTp: "L",
      pageNo: String(params.pageNo ?? 1),
      numOfRows: String(params.numOfRows ?? 10),
      srchKeyCode: params.srchKeyCode ?? "001",
    };

    if (params.searchWrd) query.searchWrd = params.searchWrd;
    if (params.lifeArray) query.lifeArray = params.lifeArray;
    if (params.trgterIndvdlArray) query.trgterIndvdlArray = params.trgterIndvdlArray;
    if (params.intrsThemaArray) query.intrsThemaArray = params.intrsThemaArray;
    if (params.age) query.age = params.age;
    if (params.onapPsbltYn) query.onapPsbltYn = params.onapPsbltYn;
    if (params.orderBy) query.orderBy = params.orderBy;
    if (params.ctpvNm) query.ctpvNm = params.ctpvNm;
    if (params.sggNm) query.sggNm = params.sggNm;

    const tags = source === "local" ? LOCAL_LIST_TAGS : CENTRAL_LIST_TAGS;
    const xml = await this.request(source, "list", query);
    return this.parseListResponse(xml, tags);
  }

  async fetchDetail(source: BokjiroSource, servId: string): Promise<BokjiroDetailItem> {
    const xml = await this.request(source, "detail", {
      serviceKey: this.serviceKey,
      callTp: "D",
      servId,
    });
    return this.parseDetailResponse(xml);
  }

  fetchAllListItems(
    source: "central",
    params?: Omit<BokjiroListParams, "pageNo">,
  ): Promise<BokjiroListItem[]>;
  fetchAllListItems(
    source: "local",
    params?: Omit<BokjiroListParams, "pageNo">,
  ): Promise<BokjiroLocalListItem[]>;
  async fetchAllListItems(
    source: BokjiroSource,
    params: Omit<BokjiroListParams, "pageNo"> = {},
  ): Promise<(BokjiroListItem | BokjiroLocalListItem)[]> {
    const pageSize = Math.min(params.numOfRows ?? 500, 500);
    const first =
      source === "local"
        ? await this.fetchList("local", { ...params, pageNo: 1, numOfRows: pageSize })
        : await this.fetchList("central", { ...params, pageNo: 1, numOfRows: pageSize });
    const items: (BokjiroListItem | BokjiroLocalListItem)[] = [...first.items];

    const totalPages = Math.ceil(first.totalCount / pageSize);
    for (let pageNo = 2; pageNo <= totalPages; pageNo += 1) {
      const page =
        source === "local"
          ? await this.fetchList("local", { ...params, pageNo, numOfRows: pageSize })
          : await this.fetchList("central", { ...params, pageNo, numOfRows: pageSize });
      items.push(...page.items);
    }

    return items;
  }

  private baseUrl(source: BokjiroSource): string {
    return source === "central" ? this.centralBaseUrl : this.localBaseUrl;
  }

  private async request(
    source: BokjiroSource,
    kind: keyof (typeof OPERATIONS)["central"],
    query: Record<string, string>,
  ): Promise<string> {
    const operation = OPERATIONS[source][kind];
    const url = `${this.baseUrl(source)}/${operation}?${new URLSearchParams(query).toString()}`;
    const res = await fetch(url, {
      headers: { Accept: "application/xml" },
      next: { revalidate: 0 },
    });

    const text = await res.text();
    if (!res.ok || text.includes("API not found")) {
      throw new Error(
        `[bokjiro:${source}:${operation}] HTTP ${res.status} — ${text.slice(0, 200)}`,
      );
    }

    return text;
  }

  private parseListResponse<T>(
    xml: string,
    tags: readonly string[],
  ): BokjiroListResponse<T> {
    const resultCode = getTag(xml, "resultCode");
    const resultMessage = getTag(xml, "resultMessage");

    if (resultCode && resultCode !== "0") {
      throw new Error(`복지로 목록 API 오류 (${resultCode}): ${resultMessage}`);
    }

    const items = getBlocks(xml, "servList").map((block) =>
      blockToRecord(block, [...tags]),
    ) as unknown as T[];

    return {
      totalCount: Number(getTag(xml, "totalCount") || "0"),
      pageNo: Number(getTag(xml, "pageNo") || "0"),
      numOfRows: Number(getTag(xml, "numOfRows") || "0"),
      resultCode,
      resultMessage,
      items,
    };
  }

  private parseDetailResponse(xml: string): BokjiroDetailItem {
    const root = getBlocks(xml, "wantedDtl")[0] ?? xml;
    const resultCode = getTag(xml, "resultCode");
    const resultMessage = getTag(xml, "resultMessage");

    if (resultCode && resultCode !== "0") {
      throw new Error(`복지로 상세 API 오류 (${resultCode}): ${resultMessage}`);
    }

    return blockToRecord(root, [...DETAIL_TAGS]) as unknown as BokjiroDetailItem;
  }
}
