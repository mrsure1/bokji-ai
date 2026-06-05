"use client";

// 사용자 조작 상태 저장소. localStorage로 새로고침 후에도 유지됩니다.
// (추후 DB 연결 시 이 계층을 서버 동기화로 교체)
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { getNotifications, getProfileSeed } from "@/lib/data";
import type { UserProfile } from "@/lib/types";

type PersistState = {
  savedIds: string[];
  checked: Record<string, string[]>; // benefitId -> 준비된 서류명 목록
  readNotis: string[];
  profile: UserProfile;
};

const STORAGE_KEY = "bokji-ai:v1";

const initialState: PersistState = {
  savedIds: ["youth-rent"],
  checked: { "youth-rent": ["임대차계약서", "통장사본"] },
  readNotis: [],
  profile: getProfileSeed(),
};

interface AppContextValue extends PersistState {
  toggleSave: (id: string) => void;
  isSaved: (id: string) => boolean;
  toggleDoc: (benefitId: string, doc: string) => void;
  isChecked: (benefitId: string, doc: string) => boolean;
  markAllRead: () => void;
  unreadCount: number;
  setAlarm: (key: keyof UserProfile["alarms"], value: boolean) => void;
  setProfileField: (key: "housing" | "income", value: string) => void;
}

const AppContext = createContext<AppContextValue | null>(null);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<PersistState>(initialState);
  const [hydrated, setHydrated] = useState(false);

  // 최초 마운트 시 localStorage에서 복원
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) setState({ ...initialState, ...JSON.parse(raw) });
    } catch {
      /* 무시하고 기본값 사용 */
    }
    setHydrated(true);
  }, []);

  // 변경 시 저장 (복원 완료 후에만)
  useEffect(() => {
    if (hydrated) localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }, [state, hydrated]);

  const value = useMemo<AppContextValue>(() => {
    return {
      ...state,
      toggleSave: (id) =>
        setState((s) => ({
          ...s,
          savedIds: s.savedIds.includes(id)
            ? s.savedIds.filter((x) => x !== id)
            : [...s.savedIds, id],
        })),
      isSaved: (id) => state.savedIds.includes(id),
      toggleDoc: (benefitId, doc) =>
        setState((s) => {
          const cur = s.checked[benefitId] ?? [];
          const next = cur.includes(doc) ? cur.filter((d) => d !== doc) : [...cur, doc];
          return { ...s, checked: { ...s.checked, [benefitId]: next } };
        }),
      isChecked: (benefitId, doc) => (state.checked[benefitId] ?? []).includes(doc),
      markAllRead: () =>
        setState((s) => ({ ...s, readNotis: getNotifications().map((n) => n.id) })),
      unreadCount: getNotifications().filter((n) => !state.readNotis.includes(n.id)).length,
      setAlarm: (key, val) =>
        setState((s) => ({ ...s, profile: { ...s.profile, alarms: { ...s.profile.alarms, [key]: val } } })),
      setProfileField: (key, val) =>
        setState((s) => ({ ...s, profile: { ...s.profile, [key]: val } })),
    };
  }, [state]);

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be used within AppProvider");
  return ctx;
}
