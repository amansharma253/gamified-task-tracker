import { daysBetween, startOfWeekIso, todayISO } from '../utils/dates.js';

const XP_BY_PRIORITY = {
  High: 25,
  Medium: 15,
  Low: 10
};

function createDefaultGamification() {
  return {
    xp: 0,
    level: 1,
    streak: 0,
    lastCompletionDate: null,
    badges: [],
    totalCompleted: 0,
    challenges: {
      weeklyHighPriority: {
        target: 5,
        progress: 0,
        startedAt: startOfWeekIso()
      }
    }
  };
}

export function initialGamification(existing) {
  if (existing) return ensureShape(existing);
  return createDefaultGamification();
}

export function applyCompletion(gamification, task) {
  const nowIso = todayISO();
  const next = ensureShape({ ...gamification });
  const xpGain = XP_BY_PRIORITY[task.priority] || XP_BY_PRIORITY.Medium;
  next.xp += xpGain;
  next.totalCompleted += 1;

  // Streak handling
  if (!next.lastCompletionDate) {
    next.streak = 1;
  } else {
    const delta = daysBetween(next.lastCompletionDate, nowIso);
    if (delta === 0) {
      // same day, keep streak
    } else if (delta === 1) {
      next.streak += 1;
    } else {
      next.streak = 1;
    }
  }
  next.lastCompletionDate = nowIso;

  // Badges
  addBadgeIfMissing(next, 'first-complete', next.totalCompleted >= 1);
  addBadgeIfMissing(next, 'ten-completions', next.totalCompleted >= 10);
  addBadgeIfMissing(next, 'five-day-streak', next.streak >= 5);

  // Weekly challenge progress (high priority only)
  const weekStart = startOfWeekIso();
  const challenge = next.challenges.weeklyHighPriority;
  if (challenge.startedAt !== weekStart) {
    challenge.progress = 0;
    challenge.startedAt = weekStart;
  }
  if (task.priority === 'High') {
    challenge.progress = Math.min(challenge.target, challenge.progress + 1);
  }

  next.level = computeLevel(next.xp);
  return next;
}

function computeLevel(xp) {
  const base = 100;
  return Math.max(1, Math.floor(xp / base) + 1);
}

function addBadgeIfMissing(state, badge, condition) {
  if (condition && !state.badges.includes(badge)) {
    state.badges.push(badge);
  }
}

function ensureShape(data) {
  const defaults = createDefaultGamification();
  return {
    ...defaults,
    ...data,
    badges: Array.isArray(data?.badges) ? data.badges : [],
    challenges: data?.challenges || defaults.challenges
  };
}
