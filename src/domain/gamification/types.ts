import type { IsoDateString, TaskPriority } from "../tasks/types";

export type BadgeId =
  | "first_complete"
  | "ten_completions"
  | "five_day_streak"
  | "weekly_warrior";

export type WeeklyChallenge = {
  weekStart: IsoDateString;
  target: number;
  progress: number;
};

export type GamificationProfile = {
  xp: number;
  level: number;
  streakDays: number;
  lastCompletionDate: IsoDateString | null;
  totalCompleted: number;
  badges: BadgeId[];
  weekly: WeeklyChallenge;
};

export type CompletionEvent = {
  completedAtIso: string; // ISO timestamp
  priority: TaskPriority;
  firstTimeAward: boolean;
};
