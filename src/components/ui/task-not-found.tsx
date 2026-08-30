import Link from "next/link";
import { SearchX } from "lucide-react";

import { Button } from "@/components/ui/button";

export function TaskNotFound({
  message = "We couldn't find that task.",
}: {
  message?: string;
}) {
  return (
    <div className="mx-auto flex max-w-md flex-col items-center px-4 py-20 text-center sm:px-6">
      <span className="flex size-14 items-center justify-center rounded-full bg-muted text-muted-foreground">
        <SearchX className="size-6" />
      </span>
      <h1 className="mt-4 font-heading text-xl font-semibold">{message}</h1>
      <p className="mt-1.5 text-sm text-muted-foreground">
        This can happen if the link is incorrect, or if it was opened on a
        different browser or device. Tasks are stored only on this browser
        for the prototype.
      </p>
      <Button className="mt-6 rounded-full" render={<Link href="/tasks" />}>
        Find Tasks
      </Button>
    </div>
  );
}
