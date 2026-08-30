import { useState } from "react";

import { Input } from "@/components/ui/input";
import { taskBudgetPresets } from "@/lib/tasks";

export function BudgetPicker({
  budget,
  onChangeBudget,
}: {
  budget: number | "";
  onChangeBudget: (budget: number | "") => void;
}) {
  const isPreset = typeof budget === "number" && (taskBudgetPresets as readonly number[]).includes(budget);
  const [customMode, setCustomMode] = useState(!isPreset && budget !== "");

  const showCustomInput = customMode || (!isPreset && budget !== "");

  return (
    <div>
      <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">
        {taskBudgetPresets.map((preset) => {
          const isSelected = isPreset && budget === preset;
          return (
            <button
              key={preset}
              type="button"
              onClick={() => {
                setCustomMode(false);
                onChangeBudget(preset);
              }}
              className={`rounded-xl border px-3 py-2.5 text-sm font-semibold transition-colors ${
                isSelected
                  ? "border-coral bg-coral/10 text-coral"
                  : "border-border bg-background text-foreground hover:border-coral/30"
              }`}
            >
              ₹{preset}
            </button>
          );
        })}
        <button
          type="button"
          onClick={() => {
            setCustomMode(true);
            onChangeBudget("");
          }}
          className={`rounded-xl border px-3 py-2.5 text-sm font-semibold transition-colors ${
            showCustomInput
              ? "border-coral bg-coral/10 text-coral"
              : "border-border bg-background text-foreground hover:border-coral/30"
          }`}
        >
          Custom
        </button>
      </div>

      {showCustomInput && (
        <div className="mt-3 flex items-center gap-2">
          <span className="text-sm font-medium text-muted-foreground">₹</span>
          <Input
            type="number"
            min={100}
            step={50}
            value={budget}
            onChange={(e) => {
              const val = e.target.value;
              onChangeBudget(val === "" ? "" : Number(val));
            }}
            placeholder="e.g. 800"
            className="h-9 w-32"
          />
        </div>
      )}

      <p className="mt-2.5 text-xs text-muted-foreground">
        Wysas can decide whether the task and budget work for them.
      </p>
    </div>
  );
}
