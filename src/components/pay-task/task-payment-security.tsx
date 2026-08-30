import { Lock, Check } from "lucide-react";

const securityPoints = [
  "Secure checkout",
  "Task details protected",
  "Personal phone number stays private",
];

export function TaskPaymentSecurity() {
  return (
    <div className="rounded-2xl border border-teal/30 bg-teal/5 p-4 sm:p-5">
      <h3 className="flex items-center gap-1.5 text-sm font-semibold text-teal">
        <Lock className="size-4" />
        Your payment is protected.
      </h3>
      <ul className="mt-2.5 flex flex-col gap-1.5">
        {securityPoints.map((point) => (
          <li key={point} className="flex items-center gap-1.5 text-xs text-foreground">
            <Check className="size-3.5 shrink-0 text-teal" />
            {point}
          </li>
        ))}
      </ul>
    </div>
  );
}
