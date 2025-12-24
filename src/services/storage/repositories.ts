import { db } from "./db";
import type { Task } from "../../domain/tasks/types";
import { createNewProfile } from "../../domain/gamification/engine";
import type { GamificationProfile } from "../../domain/gamification/types";

export async function loadAllTasks(): Promise<Task[]> {
  return db.tasks.toArray();
}

export async function upsertTask(task: Task): Promise<void> {
  await db.tasks.put(task);
}

export async function deleteTask(id: string): Promise<void> {
  await db.tasks.delete(id);
}

export async function loadProfile(): Promise<GamificationProfile> {
  const record = await db.gamification.get("main");
  return record?.profile ?? createNewProfile(new Date());
}

export async function saveProfile(profile: GamificationProfile): Promise<void> {
  await db.gamification.put({ id: "main", profile, updatedAt: new Date().toISOString() });
}
