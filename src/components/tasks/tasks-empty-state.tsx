import Link from "next/link";
import { Inbox } from "lucide-react";

import { Button } from "@/components/ui/button";

export function TasksEmptyState() {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-card/50 px-6 py-16 text-center">
      <span className="flex size-14 items-center justify-center rounded-full bg-muted text-muted-foreground">
        <Inbox className="size-6" />
      </span>
      <h3 className="mt-4 font-heading text-lg font-semibold">
        Nothing planned yet.
      </h3>
      <p className="mt-1.5 max-w-sm text-sm text-muted-foreground">
        There are no open tasks in Mangalore right now. Check back soon, or
        post your own task to get things started.
      </p>
      <Button className="mt-5 rounded-full" render={<Link href="/create-task" />}>
        Post a Task
      </Button>
    </div>
  );
}
