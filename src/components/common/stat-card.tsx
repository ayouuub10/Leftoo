import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export function StatCard({
  icon: Icon,
  label,
  value,
  tone = "primary",
}: {
  icon: LucideIcon;
  label: string;
  value: string | number;
  tone?: "primary" | "warning" | "info" | "success";
}) {
  const tones = {
    primary: "bg-primary-soft text-primary",
    warning: "bg-warning/15 text-warning",
    info: "bg-info/12 text-info",
    success: "bg-success/12 text-success",
  } as const;

  return (
    <div className="surface-card rise-in p-4">
      <span className={cn("mb-3 flex h-9 w-9 items-center justify-center rounded-xl", tones[tone])}>
        <Icon className="h-[18px] w-[18px]" />
      </span>
      <p className="text-2xl font-extrabold leading-none tabular-nums">{value}</p>
      <p className="mt-1.5 text-xs text-muted-foreground">{label}</p>
    </div>
  );
}
