import { useEffect, useMemo, useState } from "react";
import { Button } from "../ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../ui/dialog";
import { Input } from "../ui/input";
import { Textarea } from "../ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import type { IsoDateString, Task, TaskDraft, TaskPriority, TaskStatus } from "../../domain/tasks/types";

type Props = {
  mode: "create" | "edit";
  initial?: Task;
  trigger?: React.ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  onSubmit: (draft: TaskDraft) => Promise<void> | void;
};

export function TaskEditorDialog({ mode, initial, trigger, open, onOpenChange, onSubmit }: Props) {
  const [uncontrolledOpen, setUncontrolledOpen] = useState(false);
  const isControlled = typeof open === "boolean";
  const isOpen = isControlled ? open : uncontrolledOpen;

  function setOpen(next: boolean) {
    if (!isControlled) setUncontrolledOpen(next);
    onOpenChange?.(next);
  }
  const [busy, setBusy] = useState(false);

  const defaults = useMemo(() => {
    if (!initial) {
      return {
        title: "",
        description: "",
        project: "",
        priority: "medium" as TaskPriority,
        status: "todo" as TaskStatus,
        dueDate: "" as string,
        tags: "",
      };
    }
    return {
      title: initial.title,
      description: initial.description,
      project: initial.project,
      priority: initial.priority,
      status: initial.status,
      dueDate: initial.dueDate ?? "",
      tags: initial.tags.join(", "),
    };
  }, [initial]);

  const [title, setTitle] = useState(defaults.title);
  const [description, setDescription] = useState(defaults.description);
  const [project, setProject] = useState(defaults.project);
  const [priority, setPriority] = useState<TaskPriority>(defaults.priority);
  const [status, setStatus] = useState<TaskStatus>(defaults.status);
  const [dueDate, setDueDate] = useState(defaults.dueDate);
  const [tags, setTags] = useState(defaults.tags);

  useEffect(() => {
    if (!isOpen) return;
    setTitle(defaults.title);
    setDescription(defaults.description);
    setProject(defaults.project);
    setPriority(defaults.priority);
    setStatus(defaults.status);
    setDueDate(defaults.dueDate);
    setTags(defaults.tags);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, initial?.id]);

  function reset() {
    setTitle(defaults.title);
    setDescription(defaults.description);
    setProject(defaults.project);
    setPriority(defaults.priority);
    setStatus(defaults.status);
    setDueDate(defaults.dueDate);
    setTags(defaults.tags);
  }

  async function submit() {
    setBusy(true);
    try {
      const draft: TaskDraft = {
        title,
        description,
        project,
        priority,
        status,
        dueDate: dueDate.trim() ? (dueDate.trim() as IsoDateString) : null,
        tags: tags
          .split(",")
          .map((t) => t.trim())
          .filter(Boolean),
      };

      await onSubmit(draft);
      setOpen(false);
      reset();
    } finally {
      setBusy(false);
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger ?? <Button>{mode === "create" ? "New task" : "Edit"}</Button>}
      </DialogTrigger>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>{mode === "create" ? "Create task" : "Edit task"}</DialogTitle>
          <DialogDescription>
            Keep it short. The XP engine rewards meaningful completions.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4">
          <div className="grid gap-2">
            <div className="text-sm font-medium">Title</div>
            <Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Ship onboarding flow" />
          </div>

          <div className="grid gap-2">
            <div className="text-sm font-medium">Description</div>
            <Textarea id="desc" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="What does done look like?" />
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="grid gap-2">
              <div className="text-sm font-medium">Project</div>
              <Input id="project" value={project} onChange={(e) => setProject(e.target.value)} placeholder="TaskPro" />
            </div>

            <div className="grid gap-2">
              <div className="text-sm font-medium">Due date</div>
              <Input id="due" type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="grid gap-2">
              <div className="text-sm font-medium">Priority</div>
              <Select value={priority} onValueChange={(v) => setPriority(v as TaskPriority)}>
                <SelectTrigger>
                  <SelectValue placeholder="Priority" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-2">
              <div className="text-sm font-medium">Status</div>
              <Select value={status} onValueChange={(v) => setStatus(v as TaskStatus)}>
                <SelectTrigger>
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todo">Todo</SelectItem>
                  <SelectItem value="in_progress">In progress</SelectItem>
                  <SelectItem value="done">Done</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid gap-2">
            <div className="text-sm font-medium">Tags (comma separated)</div>
            <Input id="tags" value={tags} onChange={(e) => setTags(e.target.value)} placeholder="frontend, ux" />
          </div>
        </div>

        <DialogFooter>
          <Button variant="secondary" onClick={() => setOpen(false)} disabled={busy}>
            Cancel
          </Button>
          <Button onClick={submit} disabled={busy || !title.trim()}>
            {mode === "create" ? "Create" : "Save"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
