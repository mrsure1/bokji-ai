import { NextResponse } from "next/server";
import { listBenefits } from "@/lib/benefits/service";

export const runtime = "nodejs";

export async function GET() {
  try {
    const benefits = await listBenefits(100);
    return NextResponse.json({ benefits, count: benefits.length });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "조회 실패" },
      { status: 500 },
    );
  }
}
