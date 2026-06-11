"use client";

import { CategoryIcon } from "@/components/CategoryIcon";
import { HOME_CATEGORIES } from "@/lib/categories";

interface Props {
  value: string;
  onSelect: (key: string) => void;
}

export function CategoryBar({ value, onSelect }: Props) {
  return (
    // 5열 2줄 그리드 — 전체 카테고리를 스크롤 없이 한 화면에 노출
    <div className="mb-5 grid grid-cols-5 gap-x-1 gap-y-3">
      {HOME_CATEGORIES.map((c) => {
        const active = c.key === value;
        return (
          <button
            key={c.key}
            onClick={() => onSelect(c.key)}
            aria-pressed={active}
            className="flex flex-col items-center gap-1.5"
          >
            <span
              className={`flex h-11 w-11 items-center justify-center rounded-2xl border transition-colors ${
                active
                  ? "border-brand bg-brand text-white shadow-[0_8px_16px_-8px_var(--color-brand)]"
                  : "border-line bg-card text-[#5a6066]"
              }`}
            >
              <CategoryIcon id={c.key} className="h-5 w-5" />
            </span>
            <span
              className={`text-[10.5px] leading-tight ${
                active ? "font-semibold text-brand-dark" : "text-muted"
              }`}
            >
              {c.label}
            </span>
          </button>
        );
      })}
    </div>
  );
}
