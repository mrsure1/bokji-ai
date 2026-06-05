"use client";

import { useApp } from "@/store/AppStore";
import type { UserProfile } from "@/lib/types";

export default function ProfilePage() {
  const { profile, setAlarm, setProfileField } = useApp();

  const fields: { key: keyof UserProfile["alarms"]; label: string; sub?: string }[] = [
    { key: "sms", label: "문자(SMS) 받기" },
    { key: "email", label: "이메일 받기" },
    { key: "night", label: "야간 방해 금지", sub: "21시~8시" },
  ];

  const filled = [profile.region, profile.ageHousehold, profile.jobStatus, profile.housing, profile.income, profile.interests.length ? "y" : null];
  const percent = Math.round((filled.filter(Boolean).length / filled.length) * 100);
  const missing = [profile.housing, profile.income].filter((v) => v === null).length;

  return (
    <main className="flex-1 px-5 pb-24 pt-5">
      <header className="mb-5">
        <h1 className="text-xl font-bold">내 정보</h1>
      </header>

      <div className="mb-2 flex items-center gap-4 rounded-2xl border border-line bg-card p-[18px]">
        <div
          className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full"
          style={{ background: `conic-gradient(var(--color-brand) ${percent}%, #eef0ee ${percent}%)` }}
          role="img"
          aria-label={`프로필 완성도 ${percent}%`}
        >
          <span className="flex h-12 w-12 items-center justify-center rounded-full bg-card font-display text-[15px] font-extrabold text-brand-dark">
            {percent}%
          </span>
        </div>
        <div>
          <b className="text-[15px]">{profile.name}님 프로필</b>
          <p className="mt-1 text-xs leading-snug text-muted">
            {missing > 0 ? (
              <>
                {missing}가지만 더 알려주면 <em className="font-semibold not-italic text-brand-dark">+월 32만원</em> 혜택을 확인할 수 있어요
              </>
            ) : (
              "프로필이 충분히 채워졌어요. 더 정확한 추천을 받을 수 있어요."
            )}
          </p>
        </div>
      </div>

      <a
        href="#situation"
        className="mb-5 block rounded-2xl bg-brand py-3.5 text-center font-bold text-white shadow-[0_10px_20px_-12px_rgba(24,160,88,0.6)]"
      >
        프로필 완성하고 더 찾기 →
      </a>

      <p id="situation" className="mb-2.5 px-1 text-xs font-semibold text-muted">내 상황 (추천에 반영)</p>
      <div className="mb-5 overflow-hidden rounded-2xl border border-line bg-card">
        <Row icon="📍" label="거주지" value={profile.region} />
        <Row icon="👤" label="연령 · 가구" value={profile.ageHousehold} />
        <Row icon="💼" label="직업 상태" value={profile.jobStatus} />
        <Row
          icon="🏠"
          label="주거 형태"
          sub="추천 정확도 ↑"
          value={profile.housing}
          onFill={() => setProfileField("housing", "월세")}
        />
        <Row
          icon="💰"
          label="소득 구간"
          sub="추천 정확도 ↑"
          value={profile.income}
          onFill={() => setProfileField("income", "중간")}
          last
        />
      </div>

      <p className="mb-2.5 px-1 text-xs font-semibold text-muted">알림 설정</p>
      <div className="mb-5 overflow-hidden rounded-2xl border border-line bg-card">
        {fields.map((f, i) => (
          <div
            key={f.key}
            className={`flex items-center gap-3 px-4 py-3.5 ${i < fields.length - 1 ? "border-b border-line" : ""}`}
          >
            <span className="flex h-[30px] w-[30px] shrink-0 items-center justify-center rounded-lg bg-brand-light text-sm">
              {f.key === "sms" ? "💬" : f.key === "email" ? "📧" : "🔕"}
            </span>
            <div className="flex-1">
              <b className="block text-[13.5px]">{f.label}</b>
              {f.sub && <span className="text-[11.5px] text-muted">{f.sub}</span>}
            </div>
            <button
              role="switch"
              aria-checked={profile.alarms[f.key]}
              aria-label={f.label}
              onClick={() => setAlarm(f.key, !profile.alarms[f.key])}
              className={`relative h-[23px] w-10 shrink-0 rounded-full transition-colors ${
                profile.alarms[f.key] ? "bg-brand" : "bg-[#d3d6d3]"
              }`}
            >
              <span
                className={`absolute top-[3px] h-[17px] w-[17px] rounded-full bg-white transition-all ${
                  profile.alarms[f.key] ? "right-[3px]" : "left-[3px]"
                }`}
              />
            </button>
          </div>
        ))}
      </div>

      <p className="mb-2.5 px-1 text-xs font-semibold text-muted">계정</p>
      <div className="overflow-hidden rounded-2xl border border-line bg-card">
        <Row icon="🔒" label="개인정보·동의 관리" value="" last />
      </div>
    </main>
  );
}

function Row({
  icon,
  label,
  sub,
  value,
  onFill,
  last,
}: {
  icon: string;
  label: string;
  sub?: string;
  value: string | null;
  onFill?: () => void;
  last?: boolean;
}) {
  const missing = value === null;
  return (
    <button
      onClick={onFill}
      disabled={!onFill && !missing}
      className={`flex w-full items-center gap-3 px-4 py-3.5 text-left ${last ? "" : "border-b border-line"} ${
        onFill ? "active:bg-black/[0.02]" : ""
      }`}
    >
      <span className="flex h-[30px] w-[30px] shrink-0 items-center justify-center rounded-lg bg-brand-light text-sm">
        {icon}
      </span>
      <div className="flex-1">
        <b className="block text-[13.5px]">{label}</b>
        {sub && missing && <span className="text-[11.5px] text-muted">{sub}</span>}
      </div>
      {missing ? (
        <span className="text-[11px] font-semibold text-coral">입력 필요</span>
      ) : (
        <span className="text-[12.5px] text-[#3a3d40]">{value}</span>
      )}
      <span className="text-[15px] text-[#c4c8c4]">›</span>
    </button>
  );
}
