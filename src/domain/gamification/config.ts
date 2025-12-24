import type { TaskPriority } from "../tasks/types";

export type GamificationConfig = {
  xpByPriority: Record<TaskPriority, number>;
  xpPerLevel: number;
  weeklyTarget: number;
};

export const defaultGamificationConfig: GamificationConfig = {
  xpByPriority: {
    low: 10,
    medium: 15,
    high: 25,
  },
  xpPerLevel: 100,
  weeklyTarget: 5,
};
