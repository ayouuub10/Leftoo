import { useEffect, useRef, useState, type ReactNode } from "react";
import { Loader2 } from "lucide-react";

/** Lightweight touch pull-to-refresh for mobile scroll containers. */
export function PullToRefresh({
  onRefresh,
  children,
}: {
  onRefresh: () => Promise<unknown>;
  children: ReactNode;
}) {
  const [pull, setPull] = useState(0);
  const [busy, setBusy] = useState(false);
  const startY = useRef<number | null>(null);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const onStart = (e: TouchEvent) => {
      if (window.scrollY > 0 || busy) return;
      startY.current = e.touches[0].clientY;
    };
    const onMove = (e: TouchEvent) => {
      if (startY.current == null) return;
      const delta = e.touches[0].clientY - startY.current;
      if (delta > 0) setPull(Math.min(delta * 0.45, 76));
    };
    const onEnd = async () => {
      if (startY.current == null) return;
      startY.current = null;
      if (pull > 52) {
        setBusy(true);
        setPull(48);
        try {
          await onRefresh();
        } finally {
          setBusy(false);
        }
      }
      setPull(0);
    };

    el.addEventListener("touchstart", onStart, { passive: true });
    el.addEventListener("touchmove", onMove, { passive: true });
    el.addEventListener("touchend", onEnd);
    return () => {
      el.removeEventListener("touchstart", onStart);
      el.removeEventListener("touchmove", onMove);
      el.removeEventListener("touchend", onEnd);
    };
  }, [pull, busy, onRefresh]);

  return (
    <div ref={ref}>
      <div
        className="flex items-center justify-center overflow-hidden transition-[height] duration-200"
        style={{ height: pull }}
      >
        <Loader2
          className="h-5 w-5 text-primary"
          style={{
            opacity: Math.min(pull / 40, 1),
            transform: `rotate(${pull * 4}deg)`,
            animation: busy ? "spin 1s linear infinite" : undefined,
          }}
        />
      </div>
      {children}
    </div>
  );
}
