import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "../components/ui/tabs";
import { TaskEditorDialog } from "../components/tasks/TaskEditorDialog";
import { TaskList } from "../components/tasks/TaskList";
import { GamificationCard } from "../components/gamification/GamificationCard";
import { useAppDispatch, useAppSelector } from "../app/hooks";
import {
  addTask,
  deleteTaskById,
  selectTasksFilter,
  selectVisibleTasks,
  setQuery,
  setStatusFilter,
  updateTask,
} from "../features/tasks/tasksSlice";
import { bootstrapApp, toggleTaskDone } from "../features/app/appThunks";
import { selectProfile } from "../features/gamification/gamificationSlice";
import type { Task, TaskStatus } from "../domain/tasks/types";

export function DashboardPage() {
  const dispatch = useAppDispatch();
  const tasks = useAppSelector(selectVisibleTasks);
  const filter = useAppSelector(selectTasksFilter);
  const profile = useAppSelector(selectProfile);

  const [editing, setEditing] = useState<Task | null>(null);

  useEffect(() => {
    void dispatch(bootstrapApp());
  }, [dispatch]);

  const headerActions = useMemo(() => {
    return (
      <TaskEditorDialog
        mode="create"
        onSubmit={async (draft) => {
          await dispatch(addTask(draft)).unwrap();
          toast.success("Task created");
        }}
      />
    );
  }, [dispatch]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <div className="text-lg font-semibold">Your work, gamified</div>
          <div className="text-sm text-muted-foreground">
            Mark tasks done to earn XP and build streaks.
          </div>
        </div>
        {headerActions}
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <div className="md:col-span-2 space-y-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <Tabs
              value={filter.status}
              onValueChange={(v) => dispatch(setStatusFilter(v as TaskStatus | "all"))}
            >
              <TabsList>
                <TabsTrigger value="all">All</TabsTrigger>
                <TabsTrigger value="todo">Todo</TabsTrigger>
                <TabsTrigger value="in_progress">In progress</TabsTrigger>
                <TabsTrigger value="done">Done</TabsTrigger>
              </TabsList>
            </Tabs>
            <div className="flex gap-2">
              <Input
                value={filter.query}
                onChange={(e) => dispatch(setQuery(e.target.value))}
                placeholder="Search title, project, tags…"
                className="sm:w-72"
              />
              <Button
                variant="secondary"
                onClick={() => {
                  dispatch(setQuery(""));
                  dispatch(setStatusFilter("all"));
                }}
              >
                Reset
              </Button>
            </div>
          </div>

          <TaskList
            tasks={tasks}
            onToggleDone={(id) => {
              void dispatch(toggleTaskDone(id))
                .unwrap()
                .then((res) => {
                  if (res.task.status === "done") toast.success("Completed (+XP)");
                  else toast.message("Marked as todo");
                })
                .catch(() => toast.error("Could not update task"));
            }}
            onEdit={(t) => setEditing(t)}
            onDelete={(id) => {
              void dispatch(deleteTaskById(id))
                .unwrap()
                .then(() => toast.success("Deleted"))
                .catch(() => toast.error("Could not delete"));
            }}
          />

          {editing ? (
            <TaskEditorDialog
              mode="edit"
              initial={editing}
              open={true}
              onOpenChange={(o) => {
                if (!o) setEditing(null);
              }}
              trigger={<span className="hidden" />}
              onSubmit={async (draft) => {
                await dispatch(updateTask({ id: editing.id, draft })).unwrap();
                toast.success("Saved");
                setEditing(null);
              }}
            />
          ) : null}
        </div>

        <div className="space-y-4">
          {profile ? <GamificationCard profile={profile} /> : null}
          <div className="rounded-md border bg-card p-4 text-sm text-muted-foreground">
            Tip: Completing high priority tasks counts toward the weekly challenge.
          </div>
        </div>
      </div>
    </div>
  );
}
