import type { PropsWithChildren, ReactNode } from "react";
import { Button } from "../ui/button";
import { Separator } from "../ui/separator";
import { Trophy, ListTodo } from "lucide-react";

export function AppShell({ title, actions, children }: PropsWithChildren<{ title: string; actions?: ReactNode }>) {
  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-10 border-b bg-background/80 backdrop-blur">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-3 px-4 py-3">
          <div className="flex items-center gap-2">
            <div className="inline-flex h-9 w-9 items-center justify-center rounded-md border bg-card">
              <Trophy className="h-4 w-4 text-primary" />
            </div>
            <div className="flex flex-col leading-tight">
              <span className="text-sm font-semibold">{title}</span>
              <span className="text-xs text-muted-foreground">Tasks • XP • Streak</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {actions}
            <Button variant="secondary" size="sm" disabled className="gap-2">
              <ListTodo className="h-4 w-4" />
              Dashboard
            </Button>
          </div>
        </div>
        <Separator />
      </header>

      <main className="mx-auto w-full max-w-6xl px-4 py-6">{children}</main>
    </div>
  );
}
