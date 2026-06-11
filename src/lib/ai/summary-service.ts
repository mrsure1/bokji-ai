// AI 쉬운 말 요약 (PRD 3.3) — 상세 조회 시점에 없으면 생성해 benefit_summaries에 캐싱.
// 실패해도 서비스는 원문 필드로 동작해야 하므로(TRD §11) 모든 오류는 null 반환으로 흡수한다.

import { SchemaType, type Schema } from "@google/generative-ai";
import { getGeminiJsonModel } from "@/lib/ai/gemini";
import { createServiceClient } from "@/lib/supabase/server";
import type { Json, Tables } from "@/lib/supabase/database.types";

type BenefitRow = Tables<"benefits">;
type SummaryRow = Tables<"benefit_summaries">;

const summarySchema: Schema = {
  type: SchemaType.OBJECT,
  properties: {
    one_line: { type: SchemaType.STRING, description: "혜택을 한 문장으로. 초등학생도 이해할 쉬운 말" },
    who: { type: SchemaType.STRING, description: "누가 받을 수 있는지" },
    what: { type: SchemaType.STRING, description: "얼마 또는 무엇을 받는지" },
    when_text: { type: SchemaType.STRING, description: "언제까지 신청하는지" },
    how_text: { type: SchemaType.STRING, description: "어디서 어떻게 신청하는지" },
    documents: {
      type: SchemaType.ARRAY,
      items: { type: SchemaType.STRING },
      description: "준비 서류 목록 (원문에 명시된 것만, 없으면 빈 배열)",
    },
    terms: {
      type: SchemaType.ARRAY,
      items: {
        type: SchemaType.OBJECT,
        properties: {
          term: { type: SchemaType.STRING },
          plain: { type: SchemaType.STRING },
        },
        required: ["term", "plain"],
      },
      description: "헷갈릴 수 있는 행정 용어 풀이 (0~4개)",
    },
    cautions: { type: SchemaType.STRING, description: "주의할 점 한 문장 (없으면 빈 문자열)" },
  },
  required: ["one_line", "who", "what", "when_text", "how_text", "documents", "terms", "cautions"],
};

interface SummaryLlm {
  one_line: string;
  who: string;
  what: string;
  when_text: string;
  how_text: string;
  documents: string[];
  terms: { term: string; plain: string }[];
  cautions: string;
}

function buildPrompt(row: BenefitRow): string {
  const src = [
    `혜택명: ${row.title}`,
    row.provider && `제공 기관: ${row.provider}`,
    row.target_summary && `지원 대상(원문): ${row.target_summary}`,
    row.benefit_summary && `지원 내용(원문): ${row.benefit_summary}`,
    row.requirements && `신청 조건(원문): ${row.requirements}`,
    row.deadline && `신청 마감일: ${row.deadline}`,
    row.apply_url && `신청 URL: ${row.apply_url}`,
    row.raw_content && `원문 전체:\n${row.raw_content.slice(0, 6000)}`,
  ]
    .filter(Boolean)
    .join("\n");

  return `당신은 어려운 행정 문서를 쉬운 말로 바꿔주는 "복지 통역사"입니다.
아래 복지 혜택 원문을 초등학생도 이해할 수 있는 짧은 한국어 문장으로 요약하세요.

규칙:
- 원문에 없는 금액·기한·자격 조건을 절대 지어내지 마세요.
- 원문에 정보가 없으면 "원문에서 확인이 필요해요"라고 쓰세요.
- "반드시 받을 수 있다" 같은 수급 확정 표현 금지. "신청할 수 있어요" 수준으로.
- 문장은 짧게, 존댓말로.

=== 원문 ===
${src}`;
}

/** 요약이 없으면 Gemini로 생성해 저장. 이미 있으면 그대로 반환. 실패 시 null. */
export async function ensureSummary(
  row: BenefitRow,
  existing?: SummaryRow | null,
): Promise<SummaryRow | null> {
  if (existing) return existing;
  if (!process.env.GEMINI_API_KEY) return null;

  try {
    const model = getGeminiJsonModel(summarySchema);
    const result = await model.generateContent(buildPrompt(row));
    const parsed = JSON.parse(result.response.text()) as SummaryLlm;

    const termsObj: Record<string, string> = {};
    for (const t of parsed.terms ?? []) {
      if (t.term && t.plain) termsObj[t.term] = t.plain;
    }

    const payload = {
      benefit_id: row.id,
      one_line: parsed.one_line || null,
      who: parsed.who || null,
      what: parsed.what || null,
      when_text: parsed.when_text || null,
      how_text: parsed.how_text || null,
      documents: parsed.documents?.filter(Boolean) ?? [],
      terms: termsObj as Json,
      cautions: parsed.cautions || null,
      is_reviewed: false,
      updated_at: new Date().toISOString(),
    };

    const supabase = createServiceClient();
    const { data, error } = await supabase
      .from("benefit_summaries")
      .upsert(payload, { onConflict: "benefit_id" })
      .select("*")
      .single();

    if (error) return null;
    return data;
  } catch {
    // 생성 실패 → 원문 기반 표시로 폴백 (재시도는 다음 조회 때)
    return null;
  }
}
