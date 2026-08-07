import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

export function EmptyState({
  icon: Icon,
  title,
  body,
  action,
}: {
  icon: LucideIcon;
  title: string;
  body?: string;
  action?: ReactNode;
}) {
  return (
    <div className="rise-in flex flex-col items-center px-6 py-14 text-center">
      <span className="soft-gradient mb-4 flex h-20 w-20 items-center justify-center rounded-3xl border border-border">
        <Icon className="h-8 w-8 text-primary" strokeWidth={1.6} />
      </span>
      <h3 className="text-base font-bold">{title}</h3>
      {body && <p className="mt-1.5 max-w-xs text-sm text-muted-foreground">{body}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}
