import { defaultGamificationConfig } from "./config";
import type { GamificationConfig } from "./config";
import type { BadgeId, CompletionEvent, GamificationProfile } from "./types";
import { localYesterdayIso, safeIsoDate, toIsoDateLocal, weekStartIso } from "../dates/localDay";

export function calculateLevel(xp: number, xpPerLevel: number): number {
  return Math.max(1, Math.floor(xp / xpPerLevel) + 1);
}

export function createNewProfile(now = new Date()): GamificationProfile {
  const weekStart = weekStartIso(now);
  return {
    xp: 0,
    level: 1,
    streakDays: 0,
    lastCompletionDate: null,
    totalCompleted: 0,
    badges: [],
    weekly: { weekStart, target: defaultGamificationConfig.weeklyTarget, progress: 0 },
  };
}

function ensureWeekly(profile: GamificationProfile, now: Date, cfg: GamificationConfig) {
  const currentWeek = weekStartIso(now);
  if (profile.weekly.weekStart === currentWeek) return profile;
  return {
    ...profile,
    weekly: { weekStart: currentWeek, target: cfg.weeklyTarget, progress: 0 },
  };
}

function addBadge(badges: BadgeId[], badge: BadgeId): BadgeId[] {
  return badges.includes(badge) ? badges : [...badges, badge];
}

export function applyCompletion(
  profile: GamificationProfile,
  event: CompletionEvent,
  cfg: GamificationConfig = defaultGamificationConfig
): { next: GamificationProfile; awardedXp: number; newBadges: BadgeId[] } {
  const now = new Date(event.completedAtIso);
  const completedDay = safeIsoDate(event.completedAtIso) ?? toIsoDateLocal(now);

  const withWeekly = ensureWeekly(profile, now, cfg);

  let awardedXp = 0;
  let nextXp = withWeekly.xp;
  let totalCompleted = withWeekly.totalCompleted;
  let badges = withWeekly.badges;
  let weeklyProgress = withWeekly.weekly.progress;

  if (event.firstTimeAward) {
    awardedXp = cfg.xpByPriority[event.priority];
    nextXp += awardedXp;
    totalCompleted += 1;

    if (event.priority === "high") weeklyProgress += 1;

    if (totalCompleted >= 1) badges = addBadge(badges, "first_complete");
    if (totalCompleted >= 10) badges = addBadge(badges, "ten_completions");
    if (weeklyProgress >= cfg.weeklyTarget) badges = addBadge(badges, "weekly_warrior");
  }

  // Streak updates are by local day; only update when day changes.
  let streakDays = withWeekly.streakDays;
  let lastCompletionDate = withWeekly.lastCompletionDate;

  if (!lastCompletionDate) {
    streakDays = 1;
    lastCompletionDate = completedDay;
  } else if (lastCompletionDate !== completedDay) {
    // If user completes on consecutive days, increment; else reset.
    const yesterdayIso = localYesterdayIso(now);
    if (lastCompletionDate === yesterdayIso) streakDays = streakDays + 1;
    else streakDays = 1;
    lastCompletionDate = completedDay;
  }

  if (streakDays >= 5) badges = addBadge(badges, "five_day_streak");

  const level = calculateLevel(nextXp, cfg.xpPerLevel);

  const next: GamificationProfile = {
    ...withWeekly,
    xp: nextXp,
    level,
    streakDays,
    lastCompletionDate,
    totalCompleted,
    badges,
    weekly: {
      ...withWeekly.weekly,
      target: cfg.weeklyTarget,
      progress: weeklyProgress,
    },
  };

  const newBadges = next.badges.filter((b) => !profile.badges.includes(b));
  return { next, awardedXp, newBadges };
}
