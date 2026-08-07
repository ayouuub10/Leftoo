import type { LucideIcon } from "lucide-react";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

export function SectionIntro({
  eyebrow,
  title,
  description,
  align = "start",
  className,
}: {
  eyebrow: string;
  title: string;
  description: string;
  align?: "start" | "center";
  className?: string;
}) {
  return (
    <div className={cn(align === "center" && "mx-auto max-w-2xl text-center", className)}>
      <p className="mb-4 text-xs font-bold uppercase tracking-[0.16em] text-primary">{eyebrow}</p>
      <h2 className="text-2xl font-extrabold tracking-normal leading-snug text-foreground sm:text-3xl lg:text-4xl">
        {title}
      </h2>
      <p className="mt-5 max-w-2xl text-base leading-8 text-muted-foreground sm:text-lg">
        {description}
      </p>
    </div>
  );
}

export function LandingCard({
  icon: Icon,
  title,
  description,
  index,
}: {
  icon: LucideIcon;
  title: string;
  description: string;
  index?: number;
}) {
  return (
    <article className="landing-reveal group rounded-[1.75rem] border border-border/80 bg-card p-6 shadow-[0_18px_50px_-38px_oklch(0.25_0.06_160/0.5)] transition-[transform,box-shadow,border-color] duration-300 motion-safe:hover:-translate-y-1 motion-safe:hover:border-primary/25 motion-safe:hover:shadow-[0_26px_65px_-42px_oklch(0.25_0.08_160/0.62)] sm:p-7">
      <div className="flex items-start justify-between gap-4">
        <span className="landing-card-icon flex h-11 w-11 items-center justify-center rounded-2xl bg-primary-soft text-primary">
          <Icon className="h-5 w-5" strokeWidth={1.8} />
        </span>
        {index != null && (
          <span className="text-sm font-bold tabular-nums text-primary/60">0{index + 1}</span>
        )}
      </div>
      <h3 className="mt-7 text-lg font-bold tracking-[-0.02em] text-foreground">{title}</h3>
      <p className="mt-2.5 text-sm leading-7 text-muted-foreground">{description}</p>
    </article>
  );
}

export function WorkflowCard({
  icon: Icon,
  title,
  description,
  step,
}: {
  icon: LucideIcon;
  title: string;
  description: string;
  step: number;
}) {
  return (
    <article className="landing-reveal relative rounded-[1.75rem] border border-border/80 bg-card p-6 shadow-[0_18px_50px_-38px_oklch(0.25_0.06_160/0.5)] transition-transform duration-300 motion-safe:hover:-translate-y-1 sm:p-7">
      <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-[0_12px_28px_-16px_oklch(0.42_0.13_160/0.85)]">
        <Icon className="h-5 w-5" strokeWidth={1.8} />
      </span>
      <span className="absolute end-6 top-6 text-sm font-bold tabular-nums text-primary/55 sm:end-7 sm:top-7">
        0{step}
      </span>
      <h3 className="mt-7 text-lg font-bold tracking-[-0.02em] text-foreground">{title}</h3>
      <p className="mt-2.5 text-sm leading-7 text-muted-foreground">{description}</p>
    </article>
  );
}

export function CheckedBenefit({ children }: { children: string }) {
  return (
    <li className="flex items-center gap-3 text-sm font-semibold text-foreground">
      <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary-soft text-primary">
        <Check className="h-3 w-3" strokeWidth={3} />
      </span>
      {children}
    </li>
  );
}
