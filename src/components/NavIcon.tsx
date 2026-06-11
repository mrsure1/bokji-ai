// 하단 네비게이션용 라인 SVG 아이콘 (stroke 기반, 모던 라인 스타일).
import type { SVGProps } from "react";

const PATHS: Record<string, React.ReactNode> = {
  // 홈 — 집
  home: (
    <>
      <path d="M4 11 L12 4 L20 11" />
      <path d="M6 10 V20 H18 V10" />
      <path d="M10.3 20 V14.5 H13.7 V20" />
    </>
  ),
  // 상담 — 말풍선
  chat: (
    <path d="M20.5 11.2 c0 3.9 -3.8 7.1 -8.5 7.1 a9.8 9.8 0 0 1 -2.7 -0.37 L4.6 20 l1.2 -3.7 C4.3 15 3.5 13.2 3.5 11.2 c0 -3.9 3.8 -7.2 8.5 -7.2 s8.5 3.3 8.5 7.2 Z" />
  ),
  // 보관함 — 북마크
  bookmark: (
    <path d="M7 3.8 h10 a1 1 0 0 1 1 1 V20.3 L12 16.3 L6 20.3 V4.8 a1 1 0 0 1 1 -1 Z" />
  ),
  // 내 정보 — 사람
  user: (
    <>
      <circle cx="12" cy="8.2" r="3.7" />
      <path d="M5 19.8 a7 7 0 0 1 14 0" />
    </>
  ),
};

interface Props extends SVGProps<SVGSVGElement> {
  id: string;
}

export function NavIcon({ id, ...props }: Props) {
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
      {PATHS[id] ?? PATHS.home}
    </svg>
  );
}
