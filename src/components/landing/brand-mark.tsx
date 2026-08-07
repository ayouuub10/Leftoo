import { cn } from "@/lib/utils";

export function BrandMark({
  className,
  priority = false,
}: {
  className?: string;
  priority?: boolean;
}) {
  return (
    <img
      src="/lefto-logo.jpg"
      alt="Lefto"
      width={1280}
      height={1280}
      loading={priority ? "eager" : "lazy"}
      className={cn("object-contain", className)}
    />
  );
}
