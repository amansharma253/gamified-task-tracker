export type TaskPriority = "low" | "medium" | "high";
export type TaskStatus = "todo" | "in_progress" | "done";

export type IsoDateString = `${number}-${number}-${number}`;

export type Task = {
  id: string;
  title: string;
  description: string;
  project: string;
  priority: TaskPriority;
  status: TaskStatus;
  dueDate: IsoDateString | null;
  tags: string[];
  createdAt: string; // ISO timestamp
  updatedAt: string; // ISO timestamp
  completedAt: string | null; // ISO timestamp
  xpAwarded: boolean;
};

export type TaskDraft = {
  title: string;
  description?: string;
  project?: string;
  priority?: TaskPriority;
  status?: TaskStatus;
  dueDate?: IsoDateString | null;
  tags?: string[];
};
