"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { EditSheet, type EditSheetConfig } from "@/components/EditSheet";
import { ProgressScreen } from "@/components/ProgressScreen";
import { PROFILE_OPTIONS, type UserProfile } from "@/lib/types";
import { useApp } from "@/store/AppStore";

type FieldKey =
  | "name"
  | "region"
  | "birthYear"
  | "household"
  | "currentStatus"
  | "housingType"
  | "incomeBand"
  | "interests"
  | "phone";

/** 한국 휴대폰 번호(숫자만 10~11자리) 검사 — 클라이언트 측 1차 검증 */
const isMobilePhone = (p: string | null | undefined): boolean =>
  !!p && /^01[016789]\d{7,8}$/.test(p.replace(/\D/g, ""));

/** 표시용 하이픈 포맷 (01012345678 → 010-1234-5678) */
const fmtPhone = (p: string | null): string | null => {
  if (!p) return null;
  const d = p.replace(/\D/g, "");
  if (d.length === 11) return `${d.slice(0, 3)}-${d.slice(3, 7)}-${d.slice(7)}`;
  if (d.length === 10) return `${d.slice(0, 3)}-${d.slice(3, 6)}-${d.slice(6)}`;
  return p;
};

export default function ProfilePage() {
  const router = useRouter();
  const { ready, profile, saveProfile } = useApp();
  const [editing, setEditing] = useState<FieldKey | null>(null);
  const [sigunguStep, setSigunguStep] = useState<string | null>(null); // 시도 선택 후 시군구 입력
  const [toast, setToast] = useState<string | null>(null);
  const [revealed, setRevealed] = useState(false);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 2500);
  };

  const save = async (patch: Partial<UserProfile>) => {
    try {
      await saveProfile(patch);
    } catch (e) {
      showToast(e instanceof Error ? e.message : "저장에 실패했어요.");
    }
  };

  const alarmFields: { key: keyof UserProfile["alarms"]; label: string; sub?: string }[] = [
    { key: "app", label: "앱 알림 받기", sub: "마감 임박·새 혜택을 앱에서 알려드려요" },
    { key: "sms", label: "문자(SMS) 알림 받기", sub: "저장한 혜택 마감이 임박하면 문자로 보내드려요" },
  ];

  // 알림 토글 — 문자 알림은 전화번호가 있어야 켤 수 있다.
  const toggleAlarm = (key: keyof UserProfile["alarms"]) => {
    const next = !profile.alarms[key];
    if (key === "sms" && next && !isMobilePhone(profile.phone)) {
      showToast("문자 알림을 받으려면 전화번호를 먼저 입력해 주세요.");
      setEditing("phone");
      return;
    }
    save({ alarms: { ...profile.alarms, [key]: next } });
  };

  const regionLabel = profile.regionSido
    ? `${profile.regionSido}${profile.regionSigungu ? ` ${profile.regionSigungu}` : ""}`
    : null;
  const ageLabel = profile.birthYear
    ? `${new Date().getFullYear() - profile.birthYear + 1}세 (${profile.birthYear}년생)`
    : null;

  const completeness: (string | null)[] = [
    profile.name,
    profile.regionSido,
    profile.birthYear ? "y" : null,
    profile.householdSituations.length ? "y" : null,
    profile.currentStatus,
    profile.housingType,
    profile.incomeBand,
    profile.interests.length ? "y" : null,
  ];
  const percent = Math.round(
    (completeness.filter(Boolean).length / completeness.length) * 100,
  );
  const missingCount = completeness.filter((v) => !v).length;

  // 편집 시트 구성
  const sheetConfig: Record<FieldKey, EditSheetConfig> = {
    name: { mode: "text", title: "이름 또는 별명", value: profile.name, placeholder: "예: 지영" },
    region: {
      mode: "options",
      title: "거주 지역 (시/도)",
      options: PROFILE_OPTIONS.sido,
      value: profile.regionSido,
      allowClear: true,
    },
    birthYear: {
      mode: "text",
      title: "출생년도",
      value: profile.birthYear ? String(profile.birthYear) : null,
      placeholder: "예: 1997",
      inputMode: "numeric",
    },
    household: {
      mode: "multi",
      title: "가구 상황 (해당되는 것 모두)",
      options: PROFILE_OPTIONS.householdSituations,
      value: profile.householdSituations,
    },
    currentStatus: {
      mode: "options",
      title: "현재 상태",
      options: PROFILE_OPTIONS.currentStatus,
      value: profile.currentStatus,
      allowClear: true,
    },
    housingType: {
      mode: "options",
      title: "주거 형태",
      options: PROFILE_OPTIONS.housingType,
      value: profile.housingType,
      allowClear: true,
    },
    incomeBand: {
      mode: "options",
      title: "소득 구간 (대략이면 충분해요)",
      options: PROFILE_OPTIONS.incomeBand,
      value: profile.incomeBand,
      allowClear: true,
    },
    interests: {
      mode: "multi",
      title: "관심 분야 (최대 5개)",
      options: PROFILE_OPTIONS.interests,
      value: profile.interests,
      max: 5,
    },
    phone: {
      mode: "text",
      title: "전화번호 (문자 알림용)",
      value: profile.phone,
      placeholder: "예: 010-1234-5678",
      inputMode: "tel",
    },
  };

  const handleSheetSave = (key: FieldKey, value: string | null | string[]) => {
    setEditing(null);
    switch (key) {
      case "name":
        save({ name: value as string | null });
        break;
      case "region": {
        const sido = value as string | null;
        save({ regionSido: sido, regionSigungu: sido ? profile.regionSigungu : null });
        if (sido) setSigunguStep(sido); // 시군구 이어서 입력
        break;
      }
      case "birthYear": {
        const n = value ? parseInt(value as string, 10) : null;
        if (value && (!n || n < 1900 || n > new Date().getFullYear())) {
          showToast("출생년도를 다시 확인해 주세요.");
          return;
        }
        save({ birthYear: n });
        break;
      }
      case "household":
        save({ householdSituations: value as string[] });
        break;
      case "currentStatus":
        save({ currentStatus: value as string | null });
        break;
      case "housingType":
        save({ housingType: value as string | null });
        break;
      case "incomeBand":
        save({ incomeBand: value as string | null });
        break;
      case "interests":
        save({ interests: value as string[] });
        break;
      case "phone": {
        const raw = (value as string | null)?.replace(/\D/g, "") || null;
        if (raw && !isMobilePhone(raw)) {
          showToast("휴대폰 번호 형식을 확인해 주세요. (예: 010-1234-5678)");
          return;
        }
        // 번호를 지우면 문자 알림도 함께 끈다(보낼 대상이 없어지므로).
        save({ phone: raw, ...(raw ? {} : { alarms: { ...profile.alarms, sms: false } }) });
        break;
      }
    }
  };

  if (!revealed) {
    return (
      <ProgressScreen
        done={ready}
        onDone={() => setRevealed(true)}
        icon="user"
        messages={["내 정보를 불러오고 있어요", "추천 설정을 확인하는 중이에요"]}
      />
    );
  }

  return (
    <main className="flex-1 px-5 pb-24 pt-5">
      <header className="mb-5">
        <h1 className="text-xl font-bold">내 정보</h1>
      </header>

      {percent === 0 && (
        <div className="mb-4 rounded-2xl border border-[#cfe9d8] bg-brand-light px-4 py-3.5">
          <b className="text-[13.5px] text-brand-dark">처음 오셨네요! 먼저 내 정보를 알려주세요</b>
          <p className="mt-1 text-xs leading-snug text-[#3a5a47]">
            지역·연령·상황에 딱 맞는 혜택을 찾아드려요. 한 번 입력하면 다음부터는 바로 홈으로
            들어가요.
          </p>
        </div>
      )}

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
          <b className="text-[15px]">{profile.name ? `${profile.name}님 프로필` : "프로필을 만들어 보세요"}</b>
          <p className="mt-1 text-xs leading-snug text-muted">
            {missingCount > 0
              ? `${missingCount}가지를 더 알려주시면 추천이 훨씬 정확해져요.`
              : "프로필이 충분히 채워졌어요. 더 정확한 추천을 받을 수 있어요."}
          </p>
        </div>
      </div>

      <p className="mb-2.5 mt-5 px-1 text-xs font-semibold text-muted">내 상황 (추천에 반영)</p>
      <div className="mb-5 overflow-hidden rounded-2xl border border-line bg-card">
        <Row icon="✏️" label="이름" value={profile.name} onEdit={() => setEditing("name")} />
        <Row icon="📍" label="거주지" value={regionLabel} onEdit={() => setEditing("region")} />
        <Row icon="🎂" label="출생년도" value={ageLabel} onEdit={() => setEditing("birthYear")} />
        <Row
          icon="👨‍👩‍👧"
          label="가구 상황"
          value={profile.householdSituations.length ? profile.householdSituations.join(" · ") : null}
          onEdit={() => setEditing("household")}
        />
        <Row icon="💼" label="현재 상태" value={profile.currentStatus} onEdit={() => setEditing("currentStatus")} />
        <Row icon="🏠" label="주거 형태" sub="추천 정확도 ↑" value={profile.housingType} onEdit={() => setEditing("housingType")} />
        <Row icon="💰" label="소득 구간" sub="추천 정확도 ↑" value={profile.incomeBand} onEdit={() => setEditing("incomeBand")} />
        <Row
          icon="⭐"
          label="관심 분야"
          value={profile.interests.length ? profile.interests.join(" · ") : null}
          onEdit={() => setEditing("interests")}
          last
        />
      </div>

      <button
        onClick={() => router.push("/")}
        className="mb-6 w-full rounded-2xl bg-brand py-4 text-center font-bold text-white shadow-[0_10px_20px_-12px_rgba(24,160,88,0.6)] active:scale-[0.99]"
      >
        저장하고 홈으로 가기
      </button>

      <p className="mb-2.5 px-1 text-xs font-semibold text-muted">알림 설정</p>
      <div className="mb-5 overflow-hidden rounded-2xl border border-line bg-card">
        <Row
          icon="📱"
          label="전화번호"
          sub="문자 알림에 사용"
          value={fmtPhone(profile.phone)}
          onEdit={() => setEditing("phone")}
        />
        {alarmFields.map((f) => (
          <div
            key={f.key}
            className="flex items-center gap-3 border-b border-line px-4 py-3.5 last:border-b-0"
          >
            <span className="flex h-[30px] w-[30px] shrink-0 items-center justify-center rounded-lg bg-brand-light text-sm">
              🔔
            </span>
            <div className="flex-1">
              <b className="block text-[13.5px]">{f.label}</b>
              {f.sub && <span className="text-[11.5px] text-muted">{f.sub}</span>}
            </div>
            <button
              role="switch"
              aria-checked={profile.alarms[f.key]}
              aria-label={f.label}
              onClick={() => toggleAlarm(f.key)}
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

      <p className="px-1 text-[11px] leading-relaxed text-muted">
        입력한 정보는 맞춤 추천과 알림에만 사용돼요. 모든 항목은 선택 입력이며 언제든 지울 수
        있어요. 변경 사항은 자동으로 저장돼요. 문자 알림을 켜면 저장한 혜택의 마감 임박 안내를
        입력한 번호로 보내드리며, 언제든 토글을 꺼서 수신을 중단할 수 있어요.
      </p>

      {editing && (
        <EditSheet
          config={sheetConfig[editing]}
          onSave={(v) => handleSheetSave(editing, v)}
          onClose={() => setEditing(null)}
        />
      )}

      {sigunguStep && (
        <EditSheet
          config={{
            mode: "text",
            title: `${sigunguStep} 시/군/구`,
            value: profile.regionSigungu,
            placeholder: "예: 관악구 (건너뛰려면 비워두세요)",
          }}
          onSave={(v) => {
            setSigunguStep(null);
            save({ regionSigungu: (v as string | null) || null });
          }}
          onClose={() => setSigunguStep(null)}
        />
      )}

      {toast && (
        <p className="fixed bottom-20 left-1/2 z-50 -translate-x-1/2 rounded-full bg-ink px-4 py-2 text-xs text-white">
          {toast}
        </p>
      )}
    </main>
  );
}

function Row({
  icon,
  label,
  sub,
  value,
  onEdit,
  last,
}: {
  icon: string;
  label: string;
  sub?: string;
  value: string | null;
  onEdit: () => void;
  last?: boolean;
}) {
  const missing = !value;
  return (
    <button
      onClick={onEdit}
      className={`flex w-full items-center gap-3 px-4 py-3.5 text-left active:bg-black/[0.02] ${
        last ? "" : "border-b border-line"
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
        <span className="max-w-[150px] truncate text-[12.5px] text-[#3a3d40]">{value}</span>
      )}
      <span className="text-[15px] text-[#c4c8c4]">›</span>
    </button>
  );
}
