// 표시용 헬퍼 — 데이터는 모두 Supabase에서 API를 통해 가져온다.

export function ddayLabel(dday: number | null): string {
  return dday === null ? "상시 접수" : `D-${dday}`;
}

export const FIT_META: Record<string, { label: string; tone: "brand" | "amber" }> = {
  high: { label: "가능성 높음", tone: "brand" },
  check: { label: "확인 필요", tone: "amber" },
  low: { label: "가능성 낮음", tone: "amber" },
};
