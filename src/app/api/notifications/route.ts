import { NextResponse } from "next/server";
import { getNotifications, isValidUserId } from "@/lib/user/service";

export const runtime = "nodejs";

export async function GET(req: Request) {
  const userId = new URL(req.url).searchParams.get("userId");
  if (!isValidUserId(userId)) {
    return NextResponse.json({ error: "userId가 필요합니다." }, { status: 400 });
  }
  try {
    const notifications = await getNotifications(userId);
    return NextResponse.json({ notifications });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "알림 조회 실패" },
      { status: 500 },
    );
  }
}
