import Link from "next/link";
import { ClipboardList } from "lucide-react";

import { Button } from "@/components/ui/button";

export function MyTasksEmptyState() {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-card/50 px-6 py-16 text-center">
      <span className="flex size-14 items-center justify-center rounded-full bg-muted text-muted-foreground">
        <ClipboardList className="size-6" />
      </span>
      <h3 className="mt-4 font-heading text-lg font-semibold">
        Nothing planned yet.
      </h3>
      <p className="mt-1.5 max-w-sm text-sm text-muted-foreground">
        Post a task and a Wysa nearby can pick it up.
      </p>
      <Button className="mt-5 rounded-full" render={<Link href="/create-task" />}>
        Post a Task
      </Button>
    </div>
  );
}
