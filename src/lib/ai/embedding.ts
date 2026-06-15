// Gemini 임베딩 (pgvector 의미검색용). benefit_embeddings.embedding = vector(1536)에 맞춰 1536차원 생성.
import { GoogleGenerativeAI } from "@google/generative-ai";
import { requireGemini, serverEnv } from "@/lib/env";

export const EMBED_DIM = 1536;

let client: GoogleGenerativeAI | null = null;
function model() {
  if (!client) client = new GoogleGenerativeAI(requireGemini());
  return client.getGenerativeModel({ model: serverEnv.geminiEmbeddingModel });
}

function toRequest(text: string) {
  return {
    content: { parts: [{ text: text.slice(0, 8000) }], role: "user" },
    outputDimensionality: EMBED_DIM,
  };
}

/** 검색 질의 1건 → 1536차원 벡터 */
export async function embedQuery(text: string): Promise<number[]> {
  const res = await model().embedContent(toRequest(text));
  return res.embedding.values;
}

/** 인덱싱용 배치 임베딩 (한 번에 최대 100건 권장) */
export async function embedBatch(texts: string[]): Promise<number[][]> {
  if (texts.length === 0) return [];
  const res = await model().batchEmbedContents({ requests: texts.map(toRequest) });
  return res.embeddings.map((e) => e.values);
}
