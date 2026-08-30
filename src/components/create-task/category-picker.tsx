import { taskCategories, type TaskCategory } from "@/lib/tasks";

export function CategoryPicker({
  value,
  onChange,
}: {
  value: TaskCategory | "";
  onChange: (category: TaskCategory) => void;
}) {
  return (
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
      {taskCategories.map((category) => {
        const isSelected = value === category;
        return (
          <button
            key={category}
            type="button"
            onClick={() => onChange(category)}
            className={`rounded-xl border px-3 py-2 text-left text-xs font-medium transition-colors ${
              isSelected
                ? "border-coral bg-coral/10 text-coral"
                : "border-border bg-background text-foreground hover:border-coral/30"
            }`}
          >
            {category}
          </button>
        );
      })}
    </div>
  );
}
