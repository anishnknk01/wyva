import { Checkbox } from "@/components/ui/checkbox";

export function CheckboxGroup({
  title,
  options,
  selected,
  onToggle,
}: {
  title: string;
  options: readonly string[];
  selected: string[];
  onToggle: (value: string) => void;
}) {
  return (
    <div>
      <h4 className="mb-2.5 text-sm font-semibold">{title}</h4>
      <div className="flex flex-wrap gap-2">
        {options.map((option) => {
          const isChecked = selected.includes(option);
          return (
            <label
              key={option}
              className={`flex cursor-pointer items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${
                isChecked
                  ? "border-coral bg-coral/10 text-coral"
                  : "border-border bg-background text-muted-foreground hover:border-coral/30"
              }`}
            >
              <Checkbox
                checked={isChecked}
                onCheckedChange={() => onToggle(option)}
                className="sr-only"
              />
              {option}
            </label>
          );
        })}
      </div>
    </div>
  );
}
