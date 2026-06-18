// 사용자 데이터 서비스 (서버 전용) — 디바이스 계정 기반.
// 클라이언트는 localStorage의 userId만 보관하고, 모든 읽기/쓰기는 API 라우트를 통해
// service role로 수행한다 (RLS는 직접 클라이언트 접근을 차단).

import { dbRowToBenefit } from "@/lib/benefits/map-db";
import {
  benefitMatchesAge,
  benefitSido,
  benefitSigungu,
  canonSido,
  householdHasNoChildren,
  householdLifeStages,
  isChildDependentBenefit,
  isEnterpriseTargetedBenefit,
  sigunguMatches,
  SPECIALIZED_THEMES,
  situationsToBenefitHouseholds,
} from "@/lib/benefits/keywords";
import { normalizePhone } from "@/lib/notifications/sms-service";
import { createServiceClient } from "@/lib/supabase/server";
import type { Json, Tables, TablesUpdate } from "@/lib/supabase/database.types";
import type { AppNotification, Benefit, UserProfile } from "@/lib/types";
import { EMPTY_PROFILE } from "@/lib/types";

type ProfileRow = Tables<"profiles">;
type BenefitRow = Tables<"benefits">;

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function isValidUserId(id: unknown): id is string {
  return typeof id === "string" && UUID_RE.test(id);
}

/** 디바이스 계정 생성 — auth.users 행을 만들어 FK를 충족시킨다. */
export async function createDeviceUser(): Promise<string> {
  const supabase = createServiceClient();
  const { data, error } = await supabase.auth.admin.createUser({
    email: `device-${crypto.randomUUID()}@device.bokji-ai.local`,
    email_confirm: true,
  });
  if (error || !data.user) throw new Error(`디바이스 계정 생성 실패: ${error?.message}`);

  const userId = data.user.id;
  await supabase.from("profiles").insert({ id: userId });
  return userId;
}

/** userId가 실제 존재하는지 확인 (localStorage 손상/DB 초기화 대비) */
export async function userExists(userId: string): Promise<boolean> {
  const supabase = createServiceClient();
  const { data } = await supabase.from("profiles").select("id").eq("id", userId).maybeSingle();
  return Boolean(data);
}

// ── 프로필 ──────────────────────────────────────────────────────

function rowToProfile(row: ProfileRow | null): UserProfile {
  if (!row) return EMPTY_PROFILE;
  return {
    name: row.name,
    regionSido: row.region_sido,
    regionSigungu: row.region_sigungu,
    birthYear: row.birth_year,
    householdSituations: row.household_situations ?? [],
    currentStatus: row.current_status,
    housingType: row.housing_type,
    incomeBand: row.income_band,
    interests: row.interests ?? [],
    phone: row.phone,
    alarms: {
      app: row.alarm_app ?? true,
      sms: row.alarm_sms ?? false,
    },
  };
}

export async function getProfile(userId: string): Promise<UserProfile> {
  const supabase = createServiceClient();
  const { data } = await supabase.from("profiles").select("*").eq("id", userId).maybeSingle();
  return rowToProfile(data);
}

export async function updateProfile(
  userId: string,
  patch: Partial<UserProfile>,
): Promise<UserProfile> {
  const supabase = createServiceClient();
  const update: TablesUpdate<"profiles"> = { updated_at: new Date().toISOString() };

  if ("name" in patch) update.name = patch.name;
  if ("regionSido" in patch) update.region_sido = patch.regionSido;
  if ("regionSigungu" in patch) update.region_sigungu = patch.regionSigungu;
  if ("birthYear" in patch) update.birth_year = patch.birthYear;
  if ("householdSituations" in patch) update.household_situations = patch.householdSituations;
  if ("currentStatus" in patch) update.current_status = patch.currentStatus;
  if ("housingType" in patch) update.housing_type = patch.housingType;
  if ("incomeBand" in patch) update.income_band = patch.incomeBand;
  if ("interests" in patch) update.interests = patch.interests;
  if ("phone" in patch) update.phone = normalizePhone(patch.phone);
  if (patch.alarms) {
    update.alarm_app = patch.alarms.app;
    update.alarm_sms = patch.alarms.sms;
    // 문자 수신 동의를 켤 때 동의 시각을 기록(법적 근거 보관). 끌 때는 보존.
    if (patch.alarms.sms) update.sms_consent_at = new Date().toISOString();
  }

  const { data, error } = await supabase
    .from("profiles")
    .update(update)
    .eq("id", userId)
    .select("*")
    .single();
  if (error) throw new Error(`프로필 저장 실패: ${error.message}`);
  return rowToProfile(data);
}

// ── 저장한 혜택 ──────────────────────────────────────────────────

export interface SavedItem {
  benefit: Benefit;
  checkedDocs: string[];
  savedAt: string | null;
}

async function summariesByBenefitIds(ids: string[]) {
  if (!ids.length) return new Map<string, Tables<"benefit_summaries">>();
  const supabase = createServiceClient();
  const { data } = await supabase.from("benefit_summaries").select("*").in("benefit_id", ids);
  return new Map((data ?? []).map((s) => [s.benefit_id, s]));
}

export async function listSaved(userId: string): Promise<SavedItem[]> {
  const supabase = createServiceClient();
  const { data: saved } = await supabase
    .from("saved_benefits")
    .select("benefit_id, checklist, created_at")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (!saved?.length) return [];

  const ids = saved.map((s) => s.benefit_id);
  const [{ data: rows }, summaries] = await Promise.all([
    supabase.from("benefits").select("*").in("id", ids),
    summariesByBenefitIds(ids),
  ]);

  const byId = new Map((rows ?? []).map((r) => [r.id, r]));
  const items: SavedItem[] = [];
  for (const s of saved) {
    const row = byId.get(s.benefit_id);
    if (!row) continue;
    items.push({
      benefit: dbRowToBenefit(row, summaries.get(s.benefit_id)),
      checkedDocs: Array.isArray(s.checklist) ? (s.checklist as string[]) : [],
      savedAt: s.created_at,
    });
  }
  return items;
}

export async function saveBenefit(userId: string, benefitId: string): Promise<void> {
  const supabase = createServiceClient();
  const { data: existing } = await supabase
    .from("saved_benefits")
    .select("id")
    .eq("user_id", userId)
    .eq("benefit_id", benefitId)
    .maybeSingle();
  if (existing) return;

  const { error } = await supabase
    .from("saved_benefits")
    .insert({ user_id: userId, benefit_id: benefitId, checklist: [] });
  if (error) throw new Error(`저장 실패: ${error.message}`);
}

export async function unsaveBenefit(userId: string, benefitId: string): Promise<void> {
  const supabase = createServiceClient();
  const { error } = await supabase
    .from("saved_benefits")
    .delete()
    .eq("user_id", userId)
    .eq("benefit_id", benefitId);
  if (error) throw new Error(`저장 해제 실패: ${error.message}`);
}

export async function updateChecklist(
  userId: string,
  benefitId: string,
  checkedDocs: string[],
): Promise<void> {
  const supabase = createServiceClient();
  const { error } = await supabase
    .from("saved_benefits")
    .update({ checklist: checkedDocs as Json })
    .eq("user_id", userId)
    .eq("benefit_id", benefitId);
  if (error) throw new Error(`체크리스트 저장 실패: ${error.message}`);
}

// ── 홈 피드 ──────────────────────────────────────────────────────

export interface HomeFeed {
  hero: Benefit | null;
  timeline: Benefit[];
  greetingName: string | null;
  profileFilled: boolean;
}

const FEED_SELECT = "*";
const HOME_SIZE = 9;

function themeOverlap(rowThemes: string[] | null, interests: string[]): number {
  if (!rowThemes?.length || !interests.length) return 0;
  const set = new Set(interests);
  return rowThemes.filter((t) => set.has(t)).length;
}

interface ScoredRow {
  row: BenefitRow;
  sido: string | null; // 혜택 시도(null=전국)
  regionMatch: boolean; // 사용자 시도와 일치
  national: boolean; // 중앙부처/전국 혜택
  otherCity: boolean; // 같은 도(道)지만 다른 시군구 전용 → 부적합(제외 대상)
  ageApplicable: boolean; // 사용자 연령에 적용 가능
  ageScoped: boolean; // 연령 제한이 있는 혜택
  dday: number | null; // 마감까지 남은 일수(null=상시)
  score: number;
}

/** 마감 임박일수록 큰 점수. 같은 지역 티어 안에서 정렬을 지배한다. */
function urgencyScore(dday: number | null): number {
  if (dday === null) return 4; // 상시 접수
  if (dday <= 7) return 90;
  if (dday <= 14) return 72;
  if (dday <= 30) return 50;
  if (dday <= 60) return 32;
  if (dday <= 90) return 20;
  if (dday <= 150) return 11;
  return 5;
}

// 1위 항목이 마감 임박(14일 이내)이 아니면, 상위 후보 중에서 날짜 기반으로 매일 순환시킨다.
// 그래서 personalization 신호가 약한 사용자(빈 프로필 등)에게 같은 혜택이 며칠씩 고정 노출되지 않는다.
// 진짜 임박한 혜택(D-14 이내)이 1위면 순환하지 않고 그대로 둔다(놓치면 안 되므로).
const HERO_ROTATE_POOL = 4;
function rotateHero(sorted: ScoredRow[]): ScoredRow[] {
  if (sorted.length <= 1) return sorted;
  const first = sorted[0];
  if (first.dday !== null && first.dday <= 14) return sorted; // 임박 → 고정
  const pool = Math.min(HERO_ROTATE_POOL, sorted.length);
  const pick = Math.floor(Date.now() / 86400000) % pool; // 일자별 결정적 순환
  if (pick === 0) return sorted;
  const reordered = sorted.slice();
  const [chosen] = reordered.splice(pick, 1);
  reordered.unshift(chosen);
  return reordered;
}


export async function getHomeFeed(
  userId: string | null,
  categoryThemes: string[] = [],
): Promise<HomeFeed> {
  const supabase = createServiceClient();
  const profile = userId ? await getProfile(userId) : EMPTY_PROFILE;

  const userSido = canonSido(profile.regionSido);
  const userSigungu = profile.regionSigungu;
  const householdStages = householdLifeStages(profile.birthYear, profile.householdSituations);
  const noChildren = householdHasNoChildren(profile.householdSituations) === true;
  const householdFacets = situationsToBenefitHouseholds(profile.householdSituations);
  const today = new Date().toISOString().slice(0, 10);

  // gov24 데이터는 region_sido가 비어 있어 DB 단계 지역 필터가 불가능하다.
  // 마감 임박 순으로 넉넉히 가져온 뒤 provider 기반으로 JS에서 지역·연령을 판정한다.
  let query = supabase
    .from("benefits")
    .select(FEED_SELECT)
    .not("deadline", "is", null)
    .gte("deadline", today);
  if (categoryThemes.length) query = query.overlaps("themes", categoryThemes);
  const { data } = await query.order("deadline", { ascending: true }).limit(400);
  const rows = (data ?? []) as BenefitRow[];

  const evaluated: ScoredRow[] = rows.map((row) => {
    const sido = benefitSido(row);
    const national = sido === null;
    const regionMatch = national || (userSido != null && sido === userSido);
    // 같은 도(道)라도 다른 시군구 전용 혜택(예: 고양 사용자에게 안성시 혜택)은 부적합.
    // 도단위("경기도")·전국("보건복지부")은 시군구가 null이라 여기 안 걸린다.
    const benefitSgg = benefitSigungu(row);
    const otherCity =
      benefitSgg !== null && userSigungu != null && !sigunguMatches(benefitSgg, userSigungu);
    const { applicable: ageApplicable, ageScoped } = benefitMatchesAge(row, householdStages);
    const dday = row.deadline
      ? Math.max(0, Math.ceil((new Date(row.deadline).getTime() - Date.now()) / 86400000))
      : null;

    // 정렬 핵심: ① 내가 받을 수 있는 지역(내 시도·전국)을 최우선 티어로 올리고
    //          ② 같은 티어 안에서는 마감이 임박한 순서를 지배적으로 적용한다.
    let score = regionMatch ? 1000 : 0; // 지역 티어 (타지역은 맨 아래로)
    score += urgencyScore(dday); // 마감 임박 우선 (티어 내 지배적)
    if (userSido && sido === userSido) score += 6; // 전국보다 내 시도 약간 우선
    if (userSigungu && row.provider?.includes(userSigungu)) score += 8; // 내 시군구 가점
    score += themeOverlap(row.themes, profile.interests) * 4; // 관심분야
    if (householdFacets.length && row.household_types?.some((h) => householdFacets.includes(h))) {
      score += 5; // 내 가구 상황(한부모·다자녀·장애 등) 정조준
    }
    if (householdStages.length && ageScoped && ageApplicable) score += 3; // 가구 연령대 정조준
    // 관심사와 안 겹치는 특정 직군·산업 전용 테마(농림축산어업 등)는 맨 아래로 강등.
    if (
      (row.themes ?? []).some((t) => SPECIALIZED_THEMES.has(t)) &&
      themeOverlap(row.themes, profile.interests) === 0
    ) {
      score -= 2000;
    }
    return { row, sido, regionMatch, national, otherCity, ageApplicable, ageScoped, dday, score };
  });

  // 강한 규칙(완화 불가): 사용자 연령과 안 맞는 혜택, 자녀 없는 가구의 자녀 의존 혜택,
  // 다른 시군구 전용 혜택, 그리고 개인이 아닌 기업/법인 대상 사업(창업지원 등)은 절대 노출하지 않는다.
  const eligible = evaluated.filter(
    (e) =>
      e.ageApplicable &&
      !e.otherCity &&
      !(noChildren && isChildDependentBenefit(e.row)) &&
      !isEnterpriseTargetedBenefit(e.row),
  );

  // 적용 가능(내 지역/전국) 혜택이 마감 임박 순으로 위에, 타지역은 부족분만 아래에 채워진다.
  eligible.sort((a, b) => b.score - a.score);
  const top = rotateHero(eligible).slice(0, HOME_SIZE);
  const summaries = await summariesByBenefitIds(top.map((e) => e.row.id));

  // fit 재계산: 지역·연령이 내 조건과 맞을수록 "가능성 높음"
  const benefits = top.map((e) => {
    const b = dbRowToBenefit(e.row, summaries.get(e.row.id));
    const strongRegion = userSido ? e.sido === userSido : false;
    const strongAge = Boolean(householdStages.length && e.ageScoped && e.ageApplicable);
    const mismatch = (userSido && !e.regionMatch) || !e.ageApplicable;
    b.fit = mismatch ? "low" : strongRegion || strongAge ? "high" : "check";
    return b;
  });

  const profileFilled = Boolean(
    profile.regionSido || profile.birthYear || profile.interests.length,
  );

  return {
    hero: benefits[0] ?? null,
    timeline: benefits.slice(1),
    greetingName: profile.name,
    profileFilled,
  };
}

// ── 알림 (실데이터 기반 계산) ─────────────────────────────────────

function relTime(iso: string | null): string {
  if (!iso) return "";
  const diffMs = Date.now() - new Date(iso).getTime();
  const day = Math.floor(diffMs / 86400000);
  if (day <= 0) return "오늘";
  if (day === 1) return "어제";
  return `${day}일 전`;
}

export async function getNotifications(userId: string): Promise<AppNotification[]> {
  const supabase = createServiceClient();
  const profile = await getProfile(userId);

  // 앱 알림을 끈 경우 알림을 만들지 않는다 (배지·목록 모두 비움)
  if (!profile.alarms.app) return [];

  const notis: AppNotification[] = [];
  const today = new Date();
  const todayStr = today.toISOString().slice(0, 10);

  // 1) 저장한 혜택 중 마감 임박 (D-14 이내)
  const { data: saved } = await supabase
    .from("saved_benefits")
    .select("benefit_id")
    .eq("user_id", userId);
  const savedIds = (saved ?? []).map((s) => s.benefit_id);

  if (savedIds.length) {
    const { data: urgentRows } = await supabase
      .from("benefits")
      .select("id, title, deadline")
      .in("id", savedIds)
      .not("deadline", "is", null)
      .gte("deadline", todayStr)
      .order("deadline", { ascending: true })
      .limit(5);

    for (const row of urgentRows ?? []) {
      const dday = Math.ceil(
        (new Date(row.deadline as string).getTime() - today.getTime()) / 86400000,
      );
      if (dday <= 14) {
        notis.push({
          id: `urgent-${row.id}`,
          type: "urgent",
          title: `저장한 '${row.title}' 신청이 D-${Math.max(dday, 0)} 남았어요`,
          time: `마감 ${row.deadline}`,
          benefitId: row.id,
        });
      }
    }
  }

  // 2) 관심분야에 맞는 새 혜택 (최근 수집분) — 지역·연령·가구는 provider/life_stages/텍스트로 JS 판정
  if (profile.interests.length) {
    const userSido = canonSido(profile.regionSido);
    const householdStages = householdLifeStages(profile.birthYear, profile.householdSituations);
    const noChildren = householdHasNoChildren(profile.householdSituations) === true;
    const { data: fresh } = await supabase
      .from("benefits")
      .select(
        "id, title, collected_at, themes, life_stages, provider, region_scope, target_summary, benefit_summary",
      )
      .overlaps("themes", profile.interests)
      .order("collected_at", { ascending: false })
      .limit(60);

    let added = 0;
    for (const row of fresh ?? []) {
      if (added >= 4) break;
      if (savedIds.includes(row.id)) continue;
      const sido = benefitSido(row);
      const regionOk = sido === null || userSido == null || sido === userSido;
      const benefitSgg = benefitSigungu(row);
      const otherCity =
        benefitSgg !== null &&
        profile.regionSigungu != null &&
        !sigunguMatches(benefitSgg, profile.regionSigungu);
      const { applicable: ageOk } = benefitMatchesAge(row, householdStages);
      if (!regionOk || otherCity || !ageOk) continue;
      if (noChildren && isChildDependentBenefit(row)) continue;
      notis.push({
        id: `new-${row.id}`,
        type: "new",
        title: `관심 분야에 맞는 '${row.title}'가 등록돼 있어요`,
        time: relTime(row.collected_at),
        benefitId: row.id,
      });
      added++;
    }
  }

  // 3) 프로필 보완 안내 (실제 미입력 항목 기준)
  const missing: string[] = [];
  if (!profile.regionSido) missing.push("거주 지역");
  if (!profile.housingType) missing.push("주거 형태");
  if (!profile.incomeBand) missing.push("소득 구간");
  if (!profile.interests.length) missing.push("관심 분야");
  if (missing.length) {
    notis.push({
      id: "info-profile",
      type: "info",
      title: `${missing[0]}을(를) 알려주시면 더 정확한 혜택을 찾아드려요`,
      time: "내 정보에서 입력",
    });
  }

  return notis.slice(0, 10);
}
