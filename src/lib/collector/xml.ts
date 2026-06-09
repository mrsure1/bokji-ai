/** 공공데이터 XML 응답 파싱 (복지로 API) */

export function decodeXmlEntities(text: string): string {
  return text
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");
}

export function getTag(xml: string, tag: string): string {
  const match = xml.match(new RegExp(`<${tag}>([\\s\\S]*?)</${tag}>`));
  return decodeXmlEntities(match?.[1]?.trim() ?? "");
}

export function getBlocks(xml: string, tag: string): string[] {
  const re = new RegExp(`<${tag}>[\\s\\S]*?</${tag}>`, "g");
  return xml.match(re) ?? [];
}

export function blockToRecord(block: string, tags: string[]): Record<string, string> {
  const record: Record<string, string> = {};
  for (const tag of tags) {
    record[tag] = getTag(block, tag);
  }
  return record;
}

/** 사회서비스 전자바우처 API — response/body/items/item 구조 */
export function parseSocialServiceItems<T extends object>(
  xml: string,
  tags: string[],
): { resultCode: string; resultMsg: string; items: T[] } {
  const resultCode = getTag(xml, "resultCode");
  const resultMsg = getTag(xml, "resultMsg");
  const items = getBlocks(xml, "item").map(
    (block) => blockToRecord(block, tags) as T,
  );
  return { resultCode, resultMsg, items };
}
