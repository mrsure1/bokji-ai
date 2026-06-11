"use client";

// 사용자 상태 저장소 — 디바이스 계정(userId) 기반으로 Supabase에 실저장.
// 모든 변경은 낙관적 업데이트 후 API 동기화. userId와 알림 읽음 상태만 localStorage에 보관.
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import type { AppNotification, Benefit, UserProfile } from "@/lib/types";
import { EMPTY_PROFILE } from "@/lib/types";

const KEY_USER = "bokji-ai:userId";
export const KEY_READ = "bokji-ai:readNotis";

export interface SavedEntry {
  benefit: Benefit;
  checkedDocs: string[];
}

interface AppContextValue {
  userId: string | null;
  ready: boolean;
  profile: UserProfile;
  savedItems: SavedEntry[];
  notifications: AppNotification[];
  readNotis: string[];
  unreadCount: number;
  isSaved: (id: string) => boolean;
  toggleSave: (benefit: Benefit) => void;
  isChecked: (benefitId: string, doc: string) => boolean;
  toggleDoc: (benefit: Benefit, doc: string) => void;
  markAllRead: () => void;
  saveProfile: (patch: Partial<UserProfile>) => Promise<void>;
}

const AppContext = createContext<AppContextValue | null>(null);

async function api<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(path, {
    headers: { "Content-Type": "application/json" },
    ...init,
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error ?? `요청 실패 (${res.status})`);
  return data as T;
}

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [userId, setUserId] = useState<string | null>(null);
  const [ready, setReady] = useState(false);
  const [profile, setProfile] = useState<UserProfile>(EMPTY_PROFILE);
  const [savedItems, setSavedItems] = useState<SavedEntry[]>([]);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [readNotis, setReadNotis] = useState<string[]>([]);
  const initOnce = useRef(false);

  // 초기화: 디바이스 계정 확보 → 프로필/보관함/알림 로드
  useEffect(() => {
    if (initOnce.current) return;
    initOnce.current = true;

    (async () => {
      try {
        const stored = localStorage.getItem(KEY_USER);
        const { userId: uid } = await api<{ userId: string }>("/api/user/init", {
          method: "POST",
          body: JSON.stringify({ userId: stored }),
        });
        localStorage.setItem(KEY_USER, uid);
        setUserId(uid);

        try {
          setReadNotis(JSON.parse(localStorage.getItem(KEY_READ) ?? "[]"));
        } catch {
          /* 무시 */
        }

        const [p, s, n] = await Promise.allSettled([
          api<{ profile: UserProfile }>(`/api/profile?userId=${uid}`),
          api<{ items: { benefit: Benefit; checkedDocs: string[] }[] }>(`/api/saved?userId=${uid}`),
          api<{ notifications: AppNotification[] }>(`/api/notifications?userId=${uid}`),
        ]);
        if (p.status === "fulfilled") setProfile(p.value.profile);
        if (s.status === "fulfilled")
          setSavedItems(s.value.items.map((i) => ({ benefit: i.benefit, checkedDocs: i.checkedDocs })));
        if (n.status === "fulfilled") setNotifications(n.value.notifications);
      } catch {
        // 서버 연결 실패 — 화면은 빈 상태로 동작
      } finally {
        setReady(true);
      }
    })();
  }, []);

  const refreshNotifications = useCallback(async (uid: string) => {
    try {
      const { notifications: list } = await api<{ notifications: AppNotification[] }>(
        `/api/notifications?userId=${uid}`,
      );
      setNotifications(list);
    } catch {
      /* 무시 */
    }
  }, []);

  const value = useMemo<AppContextValue>(() => {
    const isSaved = (id: string) => savedItems.some((s) => s.benefit.id === id);

    const toggleSave = (benefit: Benefit) => {
      if (!userId) return;
      if (isSaved(benefit.id)) {
        setSavedItems((items) => items.filter((s) => s.benefit.id !== benefit.id));
        api(`/api/saved?userId=${userId}&benefitId=${benefit.id}`, { method: "DELETE" }).catch(
          () => setSavedItems((items) => [...items, { benefit, checkedDocs: [] }]),
        );
      } else {
        setSavedItems((items) => [{ benefit, checkedDocs: [] }, ...items]);
        api("/api/saved", {
          method: "POST",
          body: JSON.stringify({ userId, benefitId: benefit.id }),
        }).catch(() =>
          setSavedItems((items) => items.filter((s) => s.benefit.id !== benefit.id)),
        );
      }
    };

    const isChecked = (benefitId: string, doc: string) =>
      savedItems.find((s) => s.benefit.id === benefitId)?.checkedDocs.includes(doc) ?? false;

    const toggleDoc = (benefit: Benefit, doc: string) => {
      if (!userId) return;
      const entry = savedItems.find((s) => s.benefit.id === benefit.id);

      // 저장 안 된 혜택의 서류를 체크하면 자동으로 보관함에 저장
      if (!entry) {
        const next = [doc];
        setSavedItems((items) => [{ benefit, checkedDocs: next }, ...items]);
        api("/api/saved", {
          method: "POST",
          body: JSON.stringify({ userId, benefitId: benefit.id }),
        })
          .then(() =>
            api("/api/saved", {
              method: "PATCH",
              body: JSON.stringify({ userId, benefitId: benefit.id, checkedDocs: next }),
            }),
          )
          .catch(() => setSavedItems((items) => items.filter((s) => s.benefit.id !== benefit.id)));
        return;
      }

      const next = entry.checkedDocs.includes(doc)
        ? entry.checkedDocs.filter((d) => d !== doc)
        : [...entry.checkedDocs, doc];
      setSavedItems((items) =>
        items.map((s) => (s.benefit.id === benefit.id ? { ...s, checkedDocs: next } : s)),
      );
      api("/api/saved", {
        method: "PATCH",
        body: JSON.stringify({ userId, benefitId: benefit.id, checkedDocs: next }),
      }).catch(() => {
        /* 다음 동기화에서 복구 */
      });
    };

    const markAllRead = () => {
      const ids = notifications.map((n) => n.id);
      setReadNotis(ids);
      localStorage.setItem(KEY_READ, JSON.stringify(ids));
    };

    const saveProfile = async (patch: Partial<UserProfile>) => {
      if (!userId) return;
      const prev = profile;
      setProfile((p) => ({ ...p, ...patch, alarms: { ...p.alarms, ...(patch.alarms ?? {}) } }));
      try {
        const { profile: next } = await api<{ profile: UserProfile }>("/api/profile", {
          method: "PUT",
          body: JSON.stringify({ userId, patch }),
        });
        setProfile(next);
        refreshNotifications(userId);
      } catch {
        setProfile(prev);
        throw new Error("프로필 저장에 실패했어요. 잠시 후 다시 시도해 주세요.");
      }
    };

    return {
      userId,
      ready,
      profile,
      savedItems,
      notifications,
      readNotis,
      unreadCount: notifications.filter((n) => !readNotis.includes(n.id)).length,
      isSaved,
      toggleSave,
      isChecked,
      toggleDoc,
      markAllRead,
      saveProfile,
    };
  }, [userId, ready, profile, savedItems, notifications, readNotis, refreshNotifications]);

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be used within AppProvider");
  return ctx;
}
