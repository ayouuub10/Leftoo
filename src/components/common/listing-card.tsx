import { Link } from "@tanstack/react-router";
import { Clock, MapPin, UtensilsCrossed, Heart, BadgeCheck } from "lucide-react";
import { useI18n } from "@/lib/i18n";
import { StatusPill } from "./status-pill";
import { type ListingWithHotel } from "@/lib/domain";
import { cn } from "@/lib/utils";

function timeLabel(iso: string, lang: string) {
  return new Date(iso).toLocaleString(lang === "ar" ? "ar-DZ" : "fr-FR", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function ListingCard({
  listing,
  distance,
  favorite,
  onToggleFavorite,
}: {
  listing: ListingWithHotel;
  distance?: number | null;
  favorite?: boolean;
  onToggleFavorite?: () => void;
}) {
  const { t, lang } = useI18n();

  const unitPrice =
    listing.price_dzd != null && (listing.meals_count ?? 0) > 0
      ? Math.round(listing.price_dzd / (listing.meals_count || 1))
      : listing.price_dzd;

  const priceFormatted =
    unitPrice == null
      ? ""
      : unitPrice === 0
        ? lang === "ar"
          ? "مجاني"
          : "Gratuit"
        : lang === "ar"
          ? `${unitPrice.toLocaleString()} دج / وجبة`
          : `${unitPrice.toLocaleString()} DZD / repas`;

  return (
    <article className="surface-card press rise-in relative overflow-hidden">
      <Link to="/listings/$listingId" params={{ listingId: listing.id }} className="block">
        <div className="soft-gradient relative h-32 w-full overflow-hidden">
          {listing.photo_url ? (
            <img
              src={listing.photo_url}
              alt={listing.title}
              loading="lazy"
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center">
              <UtensilsCrossed className="h-9 w-9 text-primary/40" strokeWidth={1.4} />
            </div>
          )}
          <div className="absolute start-3 top-3 flex gap-2">
            <StatusPill status={listing.status} />
          </div>
        </div>

        <div className="space-y-2 p-4">
          <div className="flex items-start justify-between gap-3">
            <h3 className="line-clamp-1 flex-1 text-[15px] font-bold">{listing.title}</h3>
            {priceFormatted && (
              <span className="flex shrink-0 items-center gap-1 rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-xs font-extrabold text-emerald-600 dark:text-emerald-400">
                {priceFormatted}
              </span>
            )}
          </div>

          {listing.profiles && (
            <p className="flex items-center gap-1 text-xs text-muted-foreground">
              <span className="line-clamp-1">
                {listing.profiles.org_name || listing.profiles.full_name}
              </span>
              {listing.profiles.is_verified && (
                <BadgeCheck className="h-3.5 w-3.5 shrink-0 text-primary" />
              )}
            </p>
          )}

          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
            <span className="flex items-center gap-1 font-semibold text-foreground">
              <UtensilsCrossed className="h-3.5 w-3.5 text-primary" />
              {lang === "ar"
                ? `المتبقي: ${listing.meals_count} وجبة`
                : `Reste: ${listing.meals_count} repas`}
            </span>
            <span className="flex items-center gap-1">
              <Clock className="h-3.5 w-3.5" />
              {timeLabel(listing.pickup_to, lang)}
            </span>
            {distance != null && (
              <span className="flex items-center gap-1">
                <MapPin className="h-3.5 w-3.5" />
                {distance} {t("km")}
              </span>
            )}
          </div>
        </div>
      </Link>

      {onToggleFavorite && (
        <button
          type="button"
          onClick={onToggleFavorite}
          aria-label={t("favorites")}
          className="press absolute end-3 top-3 flex h-8 w-8 items-center justify-center rounded-full bg-card/90 backdrop-blur"
        >
          <Heart
            className={cn(
              "h-4 w-4",
              favorite ? "fill-destructive text-destructive" : "text-muted-foreground",
            )}
          />
        </button>
      )}
    </article>
  );
}
