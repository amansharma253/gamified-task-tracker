import { createAsyncThunk } from "@reduxjs/toolkit";
import type { RootState } from "../../app/store";
import { loadGamification, saveGamification } from "../gamification/gamificationSlice";
import { loadTasks, upsertLocal } from "../tasks/tasksSlice";
import { applyCompletion } from "../../domain/gamification/engine";
import type { Task } from "../../domain/tasks/types";
import * as repo from "../../services/storage/repositories";

export const bootstrapApp = createAsyncThunk("app/bootstrap", async (_, { dispatch }) => {
  await Promise.all([dispatch(loadTasks()), dispatch(loadGamification())]);
});

export const toggleTaskDone = createAsyncThunk(
  "app/toggleTaskDone",
  async (taskId: string, { dispatch, getState }) => {
    const state = getState() as RootState;
    const task = state.tasks.items.find((t) => t.id === taskId);
    const profile = state.gamification.profile;
    if (!task) throw new Error("Task not found");
    if (!profile) throw new Error("Gamification not loaded");

    const nowIso = new Date().toISOString();
    const isCompleting = task.status !== "done";

    let nextTask: Task;
    let nextProfile = profile;

    if (isCompleting) {
      const firstTimeAward = !task.xpAwarded;
      const { next, awardedXp } = applyCompletion(profile, {
        completedAtIso: nowIso,
        priority: task.priority,
        firstTimeAward,
      });

      nextProfile = next;
      nextTask = {
        ...task,
        status: "done",
        completedAt: task.completedAt ?? nowIso,
        xpAwarded: task.xpAwarded || awardedXp > 0,
        updatedAt: nowIso,
      };

      // Persist profile (streak/week tracking can change even without XP).
      // Toast happens in UI to avoid side effects here.
      dispatch(saveGamification(nextProfile));
    } else {
      nextTask = {
        ...task,
        status: "todo",
        completedAt: null,
        updatedAt: nowIso,
      };
    }

    await repo.upsertTask(nextTask);
    dispatch(upsertLocal(nextTask));

    return { task: nextTask, profile: nextProfile };
  }
);
