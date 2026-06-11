import { chatResponseSchema, getGeminiJsonModel, type ChatLlmResult } from "@/lib/ai/gemini";
import { listBenefitsByIds } from "@/lib/benefits/service";
import { searchCatalog } from "@/lib/benefits/search";
import { requireGemini } from "@/lib/env";
import type { Benefit } from "@/lib/types";

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

export interface ChatProfile {
  name?: string;
  region?: string;
  jobStatus?: string;
  interests?: string[];
}

export interface ChatResponse {
  message: string;
  benefits: Benefit[];
  quickReplies: string[];
}

export async function runWelfareChat(
  userMessage: string,
  history: ChatMessage[] = [],
  profile?: ChatProfile,
): Promise<ChatResponse> {
  requireGemini();

  // 사용자 메시지 + 프로필로 관련 혜택을 먼저 검색해 좁힌 뒤 LLM에 전달.
  // matched=false면 추천 금지 상태(무신호/매칭 0건) → 후보를 비우고 정직하게 안내.
  const { items: catalog, matched } = await searchCatalog(userMessage, profile, 40);
  const usableCatalog = matched ? catalog : [];
  const catalogIds = new Set(usableCatalog.map((c) => c.id));
  const catalogJson = JSON.stringify(usableCatalog, null, 0);

  const profileBlock = profile
    ? `사용자 프로필: ${JSON.stringify(profile, null, 0)}`
    : "사용자 프로필: 미입력";

  const historyBlock =
    history.length > 0
      ? history
          .slice(-6)
          .map((m) => `${m.role === "user" ? "사용자" : "상담AI"}: ${m.content}`)
          .join("\n")
      : "(대화 이력 없음)";

  // 매칭 없음(추천 금지) 시 별도 지침
  const noMatchRule = matched
    ? ""
    : `\n- ⚠️ 지금은 사용자 상황에 맞는 혜택을 찾지 못했습니다(catalog 비어 있음). 혜택을 추천하지 말고(benefitIds=[]), 없는 혜택을 절대 지어내지 마세요. 대신 "조건에 딱 맞는 혜택을 아직 찾지 못했어요"라고 정직하게 말하고, 더 정확히 찾기 위해 필요한 정보(거주 지역·나이·현재 상황 중 1가지)를 자연스럽게 한 가지만 물어보세요.`;

  const system = `당신은 복지AI 복지 상담 AI입니다.
- 일상어로 친절하게 답하세요.
- 수급 가능 여부를 단정하지 말고 "확인이 필요해요"라고 안내하세요.
- ⛔ catalog에 없는 혜택명·금액·기관·제도는 본문(message)에서도 절대 언급하거나 지어내지 마세요. 오직 catalog 안의 사실만 사용합니다.
- benefitIds에는 아래 catalog JSON의 id만 넣으세요. catalog에 없는 id는 절대 금지.
- benefitIds는 0~3개, 사용자 상황과 관련 높은 순. 관련이 약하면 넣지 마세요(억지 추천 금지).
- catalog가 비어 있으면 benefitIds는 반드시 빈 배열이고, 혜택을 지어내지 마세요.${noMatchRule}
- quickReplies는 후속 질문 0~3개 (짧은 한국어).

${profileBlock}

=== catalog ===
${catalogJson}`;

  const prompt = `${system}

=== 최근 대화 ===
${historyBlock}

=== 사용자 메시지 ===
${userMessage}`;

  const model = getGeminiJsonModel(chatResponseSchema);
  const result = await model.generateContent(prompt);
  const text = result.response.text();

  let parsed: ChatLlmResult;
  try {
    parsed = JSON.parse(text) as ChatLlmResult;
  } catch {
    return {
      message: text || "답변을 생성하지 못했어요. 잠시 후 다시 시도해 주세요.",
      benefits: [],
      quickReplies: [],
    };
  }

  // 그라운딩: 추천 카드는 (1) matched 상태이고 (2) 이번 후보(catalog)에 있던 id만 허용.
  // → LLM이 후보 밖 id를 골라도, 매칭이 없을 때 추천하더라도 카드로 나가지 않는다.
  let benefits: Benefit[] = [];
  if (matched) {
    const allowedIds = (parsed.benefitIds ?? []).filter((id) => catalogIds.has(id));
    const fetched = await listBenefitsByIds(allowedIds);
    const byId = new Map(fetched.map((b) => [b.id, b]));
    benefits = allowedIds.map((id) => byId.get(id)).filter((b): b is Benefit => Boolean(b));
  }

  return {
    message: parsed.message,
    benefits: benefits.slice(0, 3),
    quickReplies: (parsed.quickReplies ?? []).slice(0, 3),
  };
}
