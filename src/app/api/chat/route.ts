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
    const raw = e instanceof Error ? e.message : "상담 처리 중 오류";
    // AI 한도/결제 문제는 원인별로 구분해 안내한다.
    if (/spending cap|spend cap/i.test(raw)) {
      return NextResponse.json(
        {
          error:
            "AI 월 지출 한도(spend cap)에 도달했어요. Google AI Studio의 지출 한도를 올리면 바로 풀려요. (ai.studio/spend)",
        },
        { status: 503 },
      );
    }
    if (/credits? (are )?depleted|prepayment/i.test(raw)) {
      return NextResponse.json(
        { error: "AI 크레딧이 소진됐어요. 충전하면 다시 이용할 수 있어요. (ai.studio/projects)" },
        { status: 503 },
      );
    }
    if (raw.includes("429") || raw.includes("Too Many Requests") || raw.includes("quota")) {
      return NextResponse.json(
        { error: "지금 AI 상담 사용량이 잠시 가득 찼어요. 잠시 후 다시 시도해 주세요." },
        { status: 503 },
      );
    }
    const status = raw.includes("GEMINI_API_KEY") ? 503 : 500;
    return NextResponse.json({ error: raw }, { status });
  }
}
