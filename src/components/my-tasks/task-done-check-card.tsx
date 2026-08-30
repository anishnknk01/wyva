import { Button } from "@/components/ui/button";

export function TaskDoneCheckCard({
  onTaskDone,
  onNotCompleted,
}: {
  onTaskDone: () => void;
  onNotCompleted: () => void;
}) {
  return (
    <div className="rounded-2xl border border-coral/30 bg-coral/5 p-5 shadow-sm sm:p-6">
      <h2 className="font-heading text-lg font-semibold">
        Has your task been completed?
      </h2>
      <p className="mt-1 text-sm text-muted-foreground">
        The Wysa marked this task as complete. Let us know how it went.
      </p>
      <div className="mt-4 flex flex-col gap-2 sm:flex-row">
        <Button
          variant="outline"
          className="flex-1 rounded-full"
          onClick={onNotCompleted}
        >
          Not completed
        </Button>
        <Button className="flex-1 rounded-full" onClick={onTaskDone}>
          Task done
        </Button>
      </div>
    </div>
  );
}
