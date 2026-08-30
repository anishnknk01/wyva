import { ShieldCheck, Check } from "lucide-react";

const defaultPoints = [
  "Verified profiles",
  "In-app communication",
  "Emergency contact",
  "Report/Block",
];

export function SafetyNotice({
  title = "Your safety matters.",
  points = defaultPoints,
  className = "",
}: {
  title?: string;
  points?: string[];
  className?: string;
}) {
  return (
    <div className={`rounded-2xl border border-teal/30 bg-teal/5 p-4 sm:p-5 ${className}`}>
      <h3 className="flex items-center gap-1.5 text-sm font-semibold text-teal">
        <ShieldCheck className="size-4" />
        {title}
      </h3>
      <ul className="mt-2.5 grid grid-cols-1 gap-1.5 sm:grid-cols-2">
        {points.map((point) => (
          <li key={point} className="flex items-center gap-1.5 text-xs text-foreground">
            <Check className="size-3.5 shrink-0 text-teal" />
            {point}
          </li>
        ))}
      </ul>
    </div>
  );
}
