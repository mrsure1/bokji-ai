import { NextResponse } from "next/server";
import { collectBenefits } from "@/lib/collector/sync-benefits";
import { serverEnv } from "@/lib/env";

export const runtime = "nodejs";
export const maxDuration = 300;

function authorized(req: Request): boolean {
  const secret = serverEnv.cronSecret;
  if (!secret) return process.env.NODE_ENV === "development";
  const auth = req.headers.get("authorization");
  return auth === `Bearer ${secret}`;
}

export async function POST(req: Request) {
  if (!authorized(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const url = new URL(req.url);
    // 파라미터가 있으면 페이지 상한 적용, 없으면 전체 수집
    const maxPagesParam = url.searchParams.get("gov24MaxPages");
    const gov24MaxPages = maxPagesParam ? Number(maxPagesParam) : undefined;

    const result = await collectBenefits(
      gov24MaxPages ? { gov24MaxPages } : {},
    );
    return NextResponse.json({ ok: true, ...result });
  } catch (e) {
    return NextResponse.json(
      { ok: false, error: e instanceof Error ? e.message : "수집 실패" },
      { status: 500 },
    );
  }
}

export async function GET(req: Request) {
  return POST(req);
}
