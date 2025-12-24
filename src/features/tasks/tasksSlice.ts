import { createAsyncThunk, createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type { RootState } from "../../app/store";
import type { Task, TaskDraft, TaskStatus } from "../../domain/tasks/types";
import { createTaskFromDraft, updateTaskFromDraft } from "../../domain/tasks/validation";
import * as repo from "../../services/storage/repositories";

export type TasksFilter = { status: TaskStatus | "all"; query: string };

export type TasksState = {
  items: Task[];
  filter: TasksFilter;
  loading: boolean;
};

const initialState: TasksState = {
  items: [],
  filter: { status: "all", query: "" },
  loading: false,
};

export const loadTasks = createAsyncThunk("tasks/load", async () => {
  return repo.loadAllTasks();
});

export const addTask = createAsyncThunk("tasks/add", async (draft: TaskDraft) => {
  const task = createTaskFromDraft(draft);
  await repo.upsertTask(task);
  return task;
});

export const updateTask = createAsyncThunk(
  "tasks/update",
  async ({ id, draft }: { id: string; draft: TaskDraft }, { getState }) => {
    const state = getState() as RootState;
    const existing = state.tasks.items.find((t) => t.id === id);
    if (!existing) throw new Error("Task not found");

    const next = updateTaskFromDraft(existing, draft);
    await repo.upsertTask(next);
    return next;
  }
);

export const deleteTaskById = createAsyncThunk("tasks/delete", async (id: string) => {
  await repo.deleteTask(id);
  return id;
});

const tasksSlice = createSlice({
  name: "tasks",
  initialState,
  reducers: {
    setStatusFilter(state, action: PayloadAction<TasksFilter["status"]>) {
      state.filter.status = action.payload;
    },
    setQuery(state, action: PayloadAction<string>) {
      state.filter.query = action.payload;
    },
    upsertLocal(state, action: PayloadAction<Task>) {
      const idx = state.items.findIndex((t) => t.id === action.payload.id);
      if (idx === -1) state.items.unshift(action.payload);
      else state.items[idx] = action.payload;
    },
  },
  extraReducers(builder) {
    builder
      .addCase(loadTasks.pending, (state) => {
        state.loading = true;
      })
      .addCase(loadTasks.fulfilled, (state, action) => {
        state.items = action.payload.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
        state.loading = false;
      })
      .addCase(loadTasks.rejected, (state) => {
        state.loading = false;
      })
      .addCase(addTask.fulfilled, (state, action) => {
        state.items.unshift(action.payload);
      })
      .addCase(updateTask.fulfilled, (state, action) => {
        const idx = state.items.findIndex((t) => t.id === action.payload.id);
        if (idx !== -1) state.items[idx] = action.payload;
      })
      .addCase(deleteTaskById.fulfilled, (state, action) => {
        state.items = state.items.filter((t) => t.id !== action.payload);
      });
  },
});

export const { setStatusFilter, setQuery, upsertLocal } = tasksSlice.actions;

export const selectTasks = (state: RootState) => state.tasks.items;
export const selectTasksFilter = (state: RootState) => state.tasks.filter;

export const selectVisibleTasks = (state: RootState) => {
  const { status, query } = state.tasks.filter;
  const q = query.trim().toLowerCase();

  return state.tasks.items
    .filter((t) => (status === "all" ? true : t.status === status))
    .filter((t) => {
      if (!q) return true;
      return (
        t.title.toLowerCase().includes(q) ||
        t.project.toLowerCase().includes(q) ||
        t.tags.some((tag) => tag.toLowerCase().includes(q))
      );
    })
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
};

export default tasksSlice.reducer;
