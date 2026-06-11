import { GoogleGenerativeAI, SchemaType, type Schema } from "@google/generative-ai";
import { requireGemini, serverEnv } from "@/lib/env";

let client: GoogleGenerativeAI | null = null;

function getClient(): GoogleGenerativeAI {
  if (!client) {
    client = new GoogleGenerativeAI(requireGemini());
  }
  return client;
}

export function getGeminiModel() {
  return getClient().getGenerativeModel({
    model: serverEnv.geminiModel,
    generationConfig: {
      temperature: 0.4,
      // gemini-2.5 계열은 thinking 토큰이 출력 한도에 포함되므로 넉넉히 잡는다
      maxOutputTokens: 8192,
    },
  });
}

export function getGeminiJsonModel(schema: Schema) {
  return getClient().getGenerativeModel({
    model: serverEnv.geminiModel,
    generationConfig: {
      temperature: 0.3,
      maxOutputTokens: 8192,
      responseMimeType: "application/json",
      responseSchema: schema,
    },
  });
}

export const chatResponseSchema: Schema = {
  type: SchemaType.OBJECT,
  properties: {
    message: {
      type: SchemaType.STRING,
      description: "사용자에게 보여줄 친절한 한국어 답변",
    },
    benefitIds: {
      type: SchemaType.ARRAY,
      items: { type: SchemaType.STRING },
      description: "추천 혜택 ID (0~3개)",
    },
    quickReplies: {
      type: SchemaType.ARRAY,
      items: { type: SchemaType.STRING },
      description: "후속 질문 버튼 (0~3개, 짧은 문장)",
    },
  },
  required: ["message", "benefitIds", "quickReplies"],
};

export interface ChatLlmResult {
  message: string;
  benefitIds: string[];
  quickReplies: string[];
}

export async function embedTexts(texts: string[]): Promise<number[][]> {
  const model = getClient().getGenerativeModel({
    model: serverEnv.geminiEmbeddingModel,
  });

  const vectors: number[][] = [];
  for (const text of texts) {
    const res = await model.embedContent(text.slice(0, 8000));
    vectors.push(res.embedding.values);
  }
  return vectors;
}
