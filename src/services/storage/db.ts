import Dexie, { type Table } from "dexie";
import type { Task } from "../../domain/tasks/types";
import type { GamificationProfile } from "../../domain/gamification/types";

export type TaskRecord = Task;

export type GamificationRecord = {
  id: "main";
  profile: GamificationProfile;
  updatedAt: string;
};

export class TaskProDb extends Dexie {
  tasks!: Table<TaskRecord, string>;
  gamification!: Table<GamificationRecord, "main">;

  constructor() {
    super("taskpro");
    this.version(1).stores({
      tasks: "id, status, priority, updatedAt",
      gamification: "id",
    });
  }
}

export const db = new TaskProDb();
