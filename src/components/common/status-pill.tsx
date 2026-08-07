import { cn } from "@/lib/utils";
import { useI18n } from "@/lib/i18n";
import {
  LISTING_STATUS_KEY,
  REQUEST_STATUS_KEY,
  type ListingStatus,
  type RequestStatus,
} from "@/lib/domain";

const LISTING_TONE: Record<ListingStatus, string> = {
  available: "bg-success/12 text-success",
  reserved: "bg-warning/15 text-warning",
  collected: "bg-info/12 text-info",
  expired: "bg-muted text-muted-foreground",
};

const REQUEST_TONE: Record<RequestStatus, string> = {
  pending: "bg-warning/15 text-warning",
  accepted: "bg-success/12 text-success",
  rejected: "bg-destructive/12 text-destructive",
  completed: "bg-info/12 text-info",
  cancelled: "bg-muted text-muted-foreground",
};

export function StatusPill({
  status,
  kind = "listing",
  className,
}: {
  status: string;
  kind?: "listing" | "request";
  className?: string;
}) {
  const { t } = useI18n();
  const tone =
    kind === "listing"
      ? LISTING_TONE[status as ListingStatus]
      : REQUEST_TONE[status as RequestStatus];
  const label =
    kind === "listing"
      ? t(LISTING_STATUS_KEY[status as ListingStatus])
      : t(REQUEST_STATUS_KEY[status as RequestStatus]);

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-bold",
        tone ?? "bg-muted text-muted-foreground",
        className,
      )}
    >
      {label}
    </span>
  );
}
