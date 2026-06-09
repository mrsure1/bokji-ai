import { NextResponse } from "next/server";
import { getBenefitById } from "@/lib/benefits/service";

export const runtime = "nodejs";

export async function GET(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const benefit = await getBenefitById(id);

  if (!benefit) {
    return NextResponse.json({ error: "혜택을 찾을 수 없습니다." }, { status: 404 });
  }

  return NextResponse.json({ benefit });
}
