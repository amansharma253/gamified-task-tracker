import { z } from "zod";
import type { IsoDateString, Task, TaskDraft, TaskPriority, TaskStatus } from "./types";

const isoDateSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/)
  .transform((v) => v as IsoDateString);

const prioritySchema = z.enum(["low", "medium", "high"]) satisfies z.ZodType<TaskPriority>;
const statusSchema = z.enum(["todo", "in_progress", "done"]) satisfies z.ZodType<TaskStatus>;

const draftSchema = z.object({
  title: z.string().trim().min(1).max(120),
  description: z.string().trim().max(2000).optional().default(""),
  project: z.string().trim().max(80).optional().default(""),
  priority: prioritySchema.optional().default("medium"),
  status: statusSchema.optional().default("todo"),
  dueDate: isoDateSchema.nullable().optional().default(null),
  tags: z.array(z.string().trim().min(1).max(24)).optional().default([]),
});

function createId(): string {
  // Browser-safe UUID with fallback.
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) return crypto.randomUUID();
  return `t_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`;
}

export function normalizeDraft(input: TaskDraft) {
  return draftSchema.parse(input);
}

export function createTaskFromDraft(input: TaskDraft, now = new Date()): Task {
  const normalized = normalizeDraft(input);
  const timestamp = now.toISOString();

  return {
    id: createId(),
    title: normalized.title,
    description: normalized.description,
    project: normalized.project,
    priority: normalized.priority,
    status: normalized.status,
    dueDate: normalized.dueDate,
    tags: normalized.tags,
    createdAt: timestamp,
    updatedAt: timestamp,
    completedAt: normalized.status === "done" ? timestamp : null,
    xpAwarded: false,
  };
}

export function updateTaskFromDraft(existing: Task, input: TaskDraft, now = new Date()): Task {
  const normalized = normalizeDraft({
    title: input.title ?? existing.title,
    description: input.description ?? existing.description,
    project: input.project ?? existing.project,
    priority: input.priority ?? existing.priority,
    status: input.status ?? existing.status,
    dueDate: input.dueDate ?? existing.dueDate,
    tags: input.tags ?? existing.tags,
  });

  const updatedAt = now.toISOString();
  const nextCompletedAt =
    normalized.status === "done" ? (existing.completedAt ?? updatedAt) : null;

  return {
    ...existing,
    title: normalized.title,
    description: normalized.description,
    project: normalized.project,
    priority: normalized.priority,
    status: normalized.status,
    dueDate: normalized.dueDate,
    tags: normalized.tags,
    updatedAt,
    completedAt: nextCompletedAt,
  };
}
