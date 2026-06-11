// 카테고리용 라인 SVG 아이콘 (stroke 기반, 모던 라인 스타일).
import type { SVGProps } from "react";

const PATHS: Record<string, React.ReactNode> = {
  // 전체 — 4분할 그리드
  all: (
    <>
      <rect x="3.5" y="3.5" width="7" height="7" rx="2" />
      <rect x="13.5" y="3.5" width="7" height="7" rx="2" />
      <rect x="3.5" y="13.5" width="7" height="7" rx="2" />
      <rect x="13.5" y="13.5" width="7" height="7" rx="2" />
    </>
  ),
  // 주거 — 집
  housing: (
    <>
      <path d="M4 11 L12 4 L20 11" />
      <path d="M6 10 V20 H18 V10" />
      <path d="M10.5 20 V14.5 H13.5 V20" />
    </>
  ),
  // 일자리 — 서류가방
  job: (
    <>
      <rect x="3" y="7.5" width="18" height="12" rx="2.5" />
      <path d="M8.5 7.5 V6 a2 2 0 0 1 2-2 h3 a2 2 0 0 1 2 2 v1.5" />
      <path d="M3 12.5 h18" />
    </>
  ),
  // 교육 — 학사모
  edu: (
    <>
      <path d="M12 4 L22 9 L12 14 L2 9 Z" />
      <path d="M6 11 V15.5 c0 1.4 2.7 2.7 6 2.7 s6 -1.3 6 -2.7 V11" />
    </>
  ),
  // 생계 — 지갑
  living: (
    <>
      <rect x="3" y="6" width="18" height="13" rx="2.5" />
      <path d="M3 10.5 h18" />
      <circle cx="16.5" cy="14.5" r="1.2" />
    </>
  ),
  // 건강 — 둥근 사각 안의 십자
  health: (
    <>
      <rect x="4" y="4" width="16" height="16" rx="5" />
      <path d="M12 8.5 V15.5 M8.5 12 H15.5" />
    </>
  ),
  // 돌봄 — 두 사람
  care: (
    <>
      <circle cx="9" cy="8" r="3" />
      <path d="M3.8 19 a5.2 5.2 0 0 1 10.4 0" />
      <circle cx="16.7" cy="9" r="2.2" />
      <path d="M15.2 13.3 a4.4 4.4 0 0 1 5.3 4.2" />
    </>
  ),
  // 출산 — 젖병
  birth: (
    <>
      <rect x="8.5" y="8.5" width="7" height="11.5" rx="3.2" />
      <path d="M10 8.5 V6.8 h4 V8.5" />
      <path d="M11 5 h2" />
      <path d="M8.7 12.5 h6.6" />
    </>
  ),
  // 농림 — 새싹
  farm: (
    <>
      <path d="M12 20 V11" />
      <path d="M12 12.5 C12 8.5 8.5 7 5 7.5 C5 11 8 12.5 12 12.5 Z" />
      <path d="M12 11 C12 7.3 15 6 18.5 6.5 C18.5 9.7 16 11 12 11 Z" />
    </>
  ),
  // 안전 — 방패
  safety: (
    <>
      <path d="M12 3.2 L19 6 V11 C19 15.8 12 20 12 20 C12 20 5 15.8 5 11 V6 Z" />
      <path d="M9.2 11.8 L11.2 13.8 L15 9.8" />
    </>
  ),
};

interface Props extends SVGProps<SVGSVGElement> {
  id: string;
}

export function CategoryIcon({ id, ...props }: Props) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.7}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
      {...props}
    >
      {PATHS[id] ?? PATHS.all}
    </svg>
  );
}
