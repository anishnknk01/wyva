import { Input } from "@/components/ui/input";
import { taskDurations } from "@/lib/tasks";

export function DurationPicker({
  durationId,
  customHours,
  onChangeDuration,
  onChangeCustomHours,
}: {
  durationId: string;
  customHours: number;
  onChangeDuration: (id: string) => void;
  onChangeCustomHours: (hours: number) => void;
}) {
  return (
    <div>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-5">
        {taskDurations.map((duration) => {
          const isSelected = durationId === duration.id;
          return (
            <button
              key={duration.id}
              type="button"
              onClick={() => onChangeDuration(duration.id)}
              className={`rounded-xl border px-3 py-2.5 text-sm font-medium transition-colors ${
                isSelected
                  ? "border-coral bg-coral/10 text-coral"
                  : "border-border bg-background text-foreground hover:border-coral/30"
              }`}
            >
              {duration.label}
            </button>
          );
        })}
      </div>

      {durationId === "custom" && (
        <div className="mt-3 flex items-center gap-2">
          <Input
            type="number"
            min={1}
            max={12}
            value={customHours}
            onChange={(e) => onChangeCustomHours(Number(e.target.value) || 1)}
            className="h-9 w-24"
          />
          <span className="text-sm text-muted-foreground">hours</span>
        </div>
      )}
    </div>
  );
}
