import { NextResponse } from "next/server";
import { runWelfareChat, type ChatMessage, type ChatProfile } from "@/lib/ai/chat-service";

export const runtime = "nodejs";

interface ChatRequestBody {
  message?: string;
  history?: ChatMessage[];
  profile?: ChatProfile;
}

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as ChatRequestBody;
    const message = body.message?.trim();

    if (!message) {
      return NextResponse.json({ error: "message가 필요합니다." }, { status: 400 });
    }

    const result = await runWelfareChat(message, body.history ?? [], body.profile);
    return NextResponse.json(result);
  } catch (e) {
    const msg = e instanceof Error ? e.message : "상담 처리 중 오류";
    const status = msg.includes("GEMINI_API_KEY") ? 503 : 500;
    return NextResponse.json({ error: msg }, { status });
  }
}
