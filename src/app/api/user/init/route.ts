import { NextResponse } from "next/server";
import { createDeviceUser, isValidUserId, userExists } from "@/lib/user/service";

export const runtime = "nodejs";

/** 디바이스 사용자 초기화 — 기존 userId가 유효하면 재사용, 없으면 새로 발급 */
export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const existing = body?.userId;

    if (isValidUserId(existing) && (await userExists(existing))) {
      return NextResponse.json({ userId: existing, created: false });
    }

    const userId = await createDeviceUser();
    return NextResponse.json({ userId, created: true });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "사용자 초기화 실패" },
      { status: 500 },
    );
  }
}
