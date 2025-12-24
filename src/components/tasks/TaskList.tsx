import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "../ui/dropdown-menu";
import { MoreHorizontal, Calendar, Tag, Folder, CheckCircle2, Circle } from "lucide-react";
import type { Task } from "../../domain/tasks/types";

type Props = {
  tasks: Task[];
  onToggleDone: (id: string) => void;
  onEdit: (task: Task) => void;
  onDelete: (id: string) => void;
};

export function TaskList({ tasks, onToggleDone, onEdit, onDelete }: Props) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-base">Tasks</CardTitle>
        <Badge variant="secondary">{tasks.length}</Badge>
      </CardHeader>
      <CardContent className="space-y-2">
        {tasks.length === 0 ? (
          <div className="rounded-md border border-dashed p-6 text-sm text-muted-foreground">
            No tasks yet. Create one and start earning XP.
          </div>
        ) : (
          tasks.map((task) => (
            <div key={task.id} className="flex items-start justify-between gap-3 rounded-md border p-3">
              <div className="flex min-w-0 items-start gap-3">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => onToggleDone(task.id)}
                  aria-label={task.status === "done" ? "Mark as todo" : "Mark as done"}
                  className="mt-0.5"
                >
                  {task.status === "done" ? (
                    <CheckCircle2 className="h-5 w-5" />
                  ) : (
                    <Circle className="h-5 w-5" />
                  )}
                </Button>
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <div className="truncate font-medium">
                      {task.title}
                    </div>
                    <Badge variant={task.priority === "high" ? "default" : "secondary"}>
                      {task.priority}
                    </Badge>
                    {task.status === "done" ? <Badge variant="outline">done</Badge> : null}
                  </div>

                  {task.description ? (
                    <div className="mt-1 text-sm text-muted-foreground">
                      {task.description}
                    </div>
                  ) : null}

                  <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                    {task.project ? (
                      <span className="inline-flex items-center gap-1">
                        <Folder className="h-3.5 w-3.5" />
                        {task.project}
                      </span>
                    ) : null}
                    {task.dueDate ? (
                      <span className="inline-flex items-center gap-1">
                        <Calendar className="h-3.5 w-3.5" />
                        {task.dueDate}
                      </span>
                    ) : null}
                    {task.tags.length ? (
                      <span className="inline-flex items-center gap-1">
                        <Tag className="h-3.5 w-3.5" />
                        {task.tags.slice(0, 3).join(", ")}
                      </span>
                    ) : null}
                  </div>
                </div>
              </div>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" aria-label="Task actions">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => onEdit(task)}>Edit</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => onDelete(task.id)} className="text-destructive">
                    Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}
