"use client";

import { CategoryIcon } from "@/components/CategoryIcon";
import { HOME_CATEGORIES } from "@/lib/categories";

interface Props {
  value: string;
  onSelect: (key: string) => void;
  editing: boolean;
  /** 숨긴 카테고리 키 목록 */
  hidden: string[];
  /** 편집 모드에서 숨김/표시 토글 */
  onToggleHidden: (key: string) => void;
}

export function CategoryBar({ value, onSelect, editing, hidden, onToggleHidden }: Props) {
  // 일반 모드: '전체' + 숨기지 않은 것만. 편집 모드: 전부 표시(숨긴 것은 흐리게).
  const list = editing
    ? HOME_CATEGORIES
    : HOME_CATEGORIES.filter((c) => c.key === "all" || !hidden.includes(c.key));

  return (
    <div className="mb-5 grid grid-cols-5 gap-x-1 gap-y-3">
      {list.map((c) => {
        const isHidden = hidden.includes(c.key);
        const active = !editing && c.key === value;
        const lockable = c.key === "all"; // '전체'는 숨길 수 없음
        return (
          <button
            key={c.key}
            onClick={() => (editing ? !lockable && onToggleHidden(c.key) : onSelect(c.key))}
            aria-pressed={active}
            className="flex flex-col items-center gap-1.5"
          >
            <span
              className={`relative flex h-11 w-11 items-center justify-center rounded-2xl border transition-colors ${
                active
                  ? "border-brand bg-brand text-white shadow-[0_8px_16px_-8px_var(--color-brand)]"
                  : editing && isHidden
                    ? "border-dashed border-[#cfd4cf] bg-card text-[#c4c8c4]"
                    : "border-line bg-card text-[#5a6066]"
              }`}
            >
              <CategoryIcon id={c.key} className="h-5 w-5" />
              {editing && !lockable && (
                <span
                  className={`absolute -right-1.5 -top-1.5 flex h-[18px] w-[18px] items-center justify-center rounded-full text-[12px] font-bold leading-none text-white ${
                    isHidden ? "bg-brand" : "bg-coral"
                  }`}
                >
                  {isHidden ? "+" : "×"}
                </span>
              )}
            </span>
            <span
              className={`text-[10.5px] leading-tight ${
                active
                  ? "font-semibold text-brand-dark"
                  : editing && isHidden
                    ? "text-[#c4c8c4]"
                    : "text-muted"
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
