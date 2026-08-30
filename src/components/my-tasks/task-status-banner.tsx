import { PlayCircle, Ban, AlertTriangle } from "lucide-react";

export function TaskStatusBanner({
  variant,
  children,
}: {
  variant: "info" | "warning" | "danger";
  children: React.ReactNode;
}) {
  const styles = {
    info: "border-teal/30 bg-teal/5 text-teal",
    warning: "border-sun/40 bg-sun/10 text-sun-foreground",
    danger: "border-destructive/20 bg-destructive/5 text-destructive",
  }[variant];

  const Icon = variant === "info" ? PlayCircle : variant === "warning" ? AlertTriangle : Ban;

  return (
    <div className={`flex items-center gap-2.5 rounded-2xl border p-4 text-sm ${styles}`}>
      <Icon className="size-4 shrink-0" />
      {children}
    </div>
  );
}
