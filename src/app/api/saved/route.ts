import { NextResponse } from "next/server";
import {
  isValidUserId,
  listSaved,
  saveBenefit,
  unsaveBenefit,
  updateChecklist,
} from "@/lib/user/service";

export const runtime = "nodejs";

export async function GET(req: Request) {
  const userId = new URL(req.url).searchParams.get("userId");
  if (!isValidUserId(userId)) {
    return NextResponse.json({ error: "userId가 필요합니다." }, { status: 400 });
  }
  try {
    const items = await listSaved(userId);
    return NextResponse.json({ items });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "보관함 조회 실패" },
      { status: 500 },
    );
  }
}

export async function POST(req: Request) {
  try {
    const { userId, benefitId } = await req.json();
    if (!isValidUserId(userId) || typeof benefitId !== "string") {
      return NextResponse.json({ error: "userId와 benefitId가 필요합니다." }, { status: 400 });
    }
    await saveBenefit(userId, benefitId);
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "저장 실패" },
      { status: 500 },
    );
  }
}

export async function DELETE(req: Request) {
  const url = new URL(req.url);
  const userId = url.searchParams.get("userId");
  const benefitId = url.searchParams.get("benefitId");
  if (!isValidUserId(userId) || !benefitId) {
    return NextResponse.json({ error: "userId와 benefitId가 필요합니다." }, { status: 400 });
  }
  try {
    await unsaveBenefit(userId, benefitId);
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "저장 해제 실패" },
      { status: 500 },
    );
  }
}

export async function PATCH(req: Request) {
  try {
    const { userId, benefitId, checkedDocs } = await req.json();
    if (!isValidUserId(userId) || typeof benefitId !== "string" || !Array.isArray(checkedDocs)) {
      return NextResponse.json(
        { error: "userId, benefitId, checkedDocs가 필요합니다." },
        { status: 400 },
      );
    }
    await updateChecklist(userId, benefitId, checkedDocs.filter((d) => typeof d === "string"));
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "체크리스트 저장 실패" },
      { status: 500 },
    );
  }
}
