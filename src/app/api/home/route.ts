import { NextResponse } from "next/server";
import { themesForCategory } from "@/lib/categories";
import { getHomeFeed, isValidUserId } from "@/lib/user/service";

export const runtime = "nodejs";

export async function GET(req: Request) {
  const params = new URL(req.url).searchParams;
  const userId = params.get("userId");
  const category = params.get("category");
  try {
    const feed = await getHomeFeed(
      isValidUserId(userId) ? userId : null,
      themesForCategory(category),
    );
    return NextResponse.json(feed);
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "홈 피드 조회 실패" },
      { status: 500 },
    );
  }
}
