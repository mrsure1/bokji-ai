import { NextResponse } from "next/server";
import { getProfile, isValidUserId, updateProfile } from "@/lib/user/service";

export const runtime = "nodejs";

export async function GET(req: Request) {
  const userId = new URL(req.url).searchParams.get("userId");
  if (!isValidUserId(userId)) {
    return NextResponse.json({ error: "userId가 필요합니다." }, { status: 400 });
  }
  try {
    const profile = await getProfile(userId);
    return NextResponse.json({ profile });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "프로필 조회 실패" },
      { status: 500 },
    );
  }
}

export async function PUT(req: Request) {
  try {
    const { userId, patch } = await req.json();
    if (!isValidUserId(userId) || !patch || typeof patch !== "object") {
      return NextResponse.json({ error: "userId와 patch가 필요합니다." }, { status: 400 });
    }
    const profile = await updateProfile(userId, patch);
    return NextResponse.json({ profile });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "프로필 저장 실패" },
      { status: 500 },
    );
  }
}
