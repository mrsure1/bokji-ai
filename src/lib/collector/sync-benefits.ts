import type { TablesInsert } from "@/lib/supabase/database.types";
import { BokjiroClient } from "@/lib/collector/bokjiro-client";
import type {
  BokjiroListItem,
  BokjiroLocalListItem,
} from "@/lib/collector/bokjiro-types";
import { Gov24Client } from "@/lib/collector/gov24-client";
import type { Gov24ServiceListItem } from "@/lib/collector/gov24-types";
import { upsertBenefitRow } from "@/lib/benefits/service";
import { deriveFacets } from "@/lib/benefits/facets";

type RawItem = Record<string, string | undefined>;

type SourceStat = { fetched: number; upserted: number; errors: string[] };

/**
 * benefits.deadline 은 Postgres date 컬럼. 정부24 신청기한엔 "상시신청" 등
 * 자유 텍스트가 섞여 있어, ISO 날짜만 추출하고 아니면 null 반환. (원문은 raw_content 보존)
 * 범위("~")가 있으면 마감일(마지막 날짜)을 사용.
 */
function toDateOrNull(text: string | null | undefined): string | null {
  if (!text) return null;
  const matches = [...text.matchAll(/(\d{4})[-.\/](\d{1,2})[-.\/](\d{1,2})/g)];
  // 마감일(마지막 날짜)부터 역순으로, 실재하는 날짜를 찾으면 사용 (2024-04-31 등 거부)
  for (let i = matches.length - 1; i >= 0; i -= 1) {
    const y = Number(matches[i][1]);
    const mo = Number(matches[i][2]);
    const d = Number(matches[i][3]);
    const dt = new Date(Date.UTC(y, mo - 1, d));
    if (dt.getUTCFullYear() === y && dt.getUTCMonth() === mo - 1 && dt.getUTCDate() === d) {
      return `${y}-${String(mo).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
    }
  }
  return null;
}

export interface CollectResult {
  bokjiroCentral: SourceStat;
  bokjiroLocal: SourceStat;
  gov24: SourceStat;
}

function mapBokjiroItem(item: BokjiroListItem): TablesInsert<"benefits"> {
  const tags = [
    ...item.lifeArray.split(",").map((s) => s.trim()),
    ...item.intrsThemaArray.split(",").map((s) => s.trim()),
  ].filter(Boolean);

  return {
    source: "bokjiro-central",
    external_id: item.servId,
    title: item.servNm,
    plain_summary: item.servDgst || item.servNm,
    provider: item.jurOrgNm || item.jurMnofNm,
    apply_url: item.servDtlLink || null,
    region_scope: "전국",
    target_summary: item.trgterIndvdlArray || null,
    benefit_summary: item.srvPvsnNm || null,
    requirements: item.lifeArray || null,
    tags: tags.length ? tags : null,
    raw_content: JSON.stringify(item),
    review_status: "pending",
    ...deriveFacets("bokjiro-central", item as unknown as RawItem),
  };
}

function mapBokjiroLocalItem(item: BokjiroLocalListItem): TablesInsert<"benefits"> {
  const region = [item.ctpvNm, item.sggNm].filter(Boolean).join(" ").trim();
  const tags = (item.intrsThemaNmArray ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

  return {
    source: "bokjiro-local",
    external_id: item.servId,
    title: item.servNm,
    plain_summary: item.servDgst || item.servNm,
    provider: item.bizChrDeptNm || null,
    apply_url: item.servDtlLink || null,
    region_scope: region || "전국",
    target_summary: item.trgterIndvdlNmArray || null,
    benefit_summary: item.srvPvsnNm || null,
    requirements: item.lifeNmArray || null,
    tags: tags.length ? tags : null,
    raw_content: JSON.stringify(item),
    review_status: "pending",
    ...deriveFacets("bokjiro-local", item as unknown as RawItem),
  };
}

function mapGov24Item(item: Gov24ServiceListItem): TablesInsert<"benefits"> {
  const tags = item.서비스분야 ? [item.서비스분야] : null;

  return {
    source: "gov24",
    external_id: item.서비스ID,
    title: item.서비스명,
    plain_summary: item.서비스목적요약 || item.서비스명,
    provider: item.소관기관명,
    apply_url: item.상세조회URL || null,
    region_scope: "전국",
    target_summary: item.지원대상 || null,
    benefit_summary: item.지원내용 || null,
    requirements: item.선정기준 || null,
    deadline: toDateOrNull(item.신청기한),
    tags,
    raw_content: JSON.stringify(item),
    review_status: "pending",
    ...deriveFacets("gov24", item as unknown as RawItem),
  };
}

export interface CollectOptions {
  /** 정부24 최대 페이지 (페이지당 100건). 기본값: 전체 수집(상한 없음) */
  gov24MaxPages?: number;
  skipBokjiro?: boolean;
  /** 지자체(local) 수집 생략 */
  skipBokjiroLocal?: boolean;
  skipGov24?: boolean;
}

export async function collectBenefits(options: CollectOptions = {}): Promise<CollectResult> {
  const result: CollectResult = {
    bokjiroCentral: { fetched: 0, upserted: 0, errors: [] },
    bokjiroLocal: { fetched: 0, upserted: 0, errors: [] },
    gov24: { fetched: 0, upserted: 0, errors: [] },
  };

  if (!options.skipBokjiro) {
    try {
      const client = BokjiroClient.fromEnv();
      const items = await client.fetchAllListItems("central", { numOfRows: 500 });
      result.bokjiroCentral.fetched = items.length;

      for (const item of items) {
        try {
          const id = await upsertBenefitRow(mapBokjiroItem(item));
          if (id) result.bokjiroCentral.upserted += 1;
        } catch (e) {
          result.bokjiroCentral.errors.push(
            `${item.servId}: ${e instanceof Error ? e.message : String(e)}`,
          );
        }
      }
    } catch (e) {
      result.bokjiroCentral.errors.push(e instanceof Error ? e.message : String(e));
    }
  }

  if (!options.skipBokjiroLocal) {
    try {
      const client = BokjiroClient.fromEnv();
      const items = await client.fetchAllListItems("local", { numOfRows: 500 });
      result.bokjiroLocal.fetched = items.length;

      for (const item of items) {
        try {
          const id = await upsertBenefitRow(mapBokjiroLocalItem(item));
          if (id) result.bokjiroLocal.upserted += 1;
        } catch (e) {
          result.bokjiroLocal.errors.push(
            `${item.servId}: ${e instanceof Error ? e.message : String(e)}`,
          );
        }
      }
    } catch (e) {
      result.bokjiroLocal.errors.push(e instanceof Error ? e.message : String(e));
    }
  }

  if (!options.skipGov24) {
    try {
      const client = Gov24Client.fromEnv();
      // 기본값: 상한 없이 전체 수집. (totalCount 도달 시 자동 종료)
      const maxPages = options.gov24MaxPages ?? Number.POSITIVE_INFINITY;
      const items: Gov24ServiceListItem[] = [];

      for (let page = 1; page <= maxPages; page += 1) {
        const res = await client.fetchServiceList({ page, perPage: 100 });
        items.push(...res.data);
        if (page * 100 >= res.totalCount) break;
      }

      result.gov24.fetched = items.length;

      for (const item of items) {
        try {
          const id = await upsertBenefitRow(mapGov24Item(item));
          if (id) result.gov24.upserted += 1;
        } catch (e) {
          result.gov24.errors.push(
            `${item.서비스ID}: ${e instanceof Error ? e.message : String(e)}`,
          );
        }
      }
    } catch (e) {
      result.gov24.errors.push(e instanceof Error ? e.message : String(e));
    }
  }

  return result;
}
