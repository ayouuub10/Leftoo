import { createFileRoute, Navigate, useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import {
  MapPin,
  Search,
  SlidersHorizontal,
  UtensilsCrossed,
  AlertCircle,
  Building2,
  X,
} from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";
import { ListingCard } from "@/components/common/listing-card";
import { ListSkeleton } from "@/components/common/skeletons";
import { EmptyState } from "@/components/common/empty-state";
import { PullToRefresh } from "@/components/common/pull-to-refresh";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { useI18n } from "@/lib/i18n";
import { availableListingsQuery, favoritesQuery } from "@/lib/data";
import { WILAYAS, distanceKm, resolveEntityCoords } from "@/lib/domain";
import { cn } from "@/lib/utils";

type RadiusTier = "5" | "15" | "30" | "all";
type SortMode = "nearest" | "newest" | "earliest_deadline";

type BrowseSearchParams = {
  hotelId?: string;
  hotelName?: string;
};

export const Route = createFileRoute("/_authenticated/browse")({
  validateSearch: (search: Record<string, unknown>): BrowseSearchParams => {
    return {
      hotelId: typeof search.hotelId === "string" ? search.hotelId : undefined,
      hotelName: typeof search.hotelName === "string" ? search.hotelName : undefined,
    };
  },
  head: () => ({
    meta: [
      { title: "Lefto — استكشاف الفائض الجغرافي | Proximité & Offres" },
      {
        name: "description",
        content: "Trouvez les surplus alimentaires les plus proches par géolocalisation et rayon.",
      },
      { property: "og:title", content: "Lefto — Explorer par proximité" },
      { property: "og:description", content: "Surplus disponibles par proximité GPS en Algérie." },
    ],
  }),
  component: Browse,
});

function Browse() {
  const { t, lang } = useI18n();
  const { user, profile, role } = useAuth();
  const searchParams = Route.useSearch();
  const navigate = useNavigate();

  const qc = useQueryClient();
  const listings = useQuery(availableListingsQuery());
  const favorites = useQuery({ ...favoritesQuery(user?.id ?? ""), enabled: !!user });

  const [q, setQ] = useState("");
  const [wilaya, setWilaya] = useState<string>(
    role === "admin" ? (profile?.wilaya ?? "all") : "all",
  );
  const [showFilters, setShowFilters] = useState(false);

  // Automatically resolve user/charity coordinates from profile (or registered Wilaya)
  const myCoords = useMemo(() => resolveEntityCoords(profile), [profile]);

  const [radiusTier, setRadiusTier] = useState<RadiusTier>("all");
  const [sortMode, setSortMode] = useState<SortMode>("nearest");

  const hotelIdFilter = searchParams.hotelId;
  const hotelNameFilter = searchParams.hotelName;

  const favIds = new Set((favorites.data ?? []).map((f) => f.listing_id));

  const toggleFav = useMutation({
    mutationFn: async (listingId: string) => {
      if (!user) return;
      const existing = (favorites.data ?? []).find((f) => f.listing_id === listingId);
      if (existing) await supabase.from("favorites").delete().eq("id", existing.id);
      else await supabase.from("favorites").insert({ user_id: user.id, listing_id: listingId });
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["favorites"] }),
  });

  // Compute distance for all listings automatically based on registered Wilaya / coordinates
  const processed = useMemo(() => {
    const rawListings = listings.data ?? [];
    const search = q.trim().toLowerCase();
    const list = rawListings.filter((l) => {
      if (l.status !== "available" || (l.meals_count ?? 0) <= 0) return false;
      if (hotelIdFilter && l.hotel_id !== hotelIdFilter) return false;
      if (wilaya !== "all" && l.wilaya !== wilaya) return false;
      if (search) {
        const titleMatch = l.title.toLowerCase().includes(search);
        const hotelMatch = (l.profiles?.org_name || l.profiles?.full_name || "")
          .toLowerCase()
          .includes(search);
        return titleMatch || hotelMatch;
      }
      return true;
    });

    // Attach computed distance for each hotel
    return list.map((l) => {
      const hotelCoords = resolveEntityCoords({
        lat: l.lat,
        lng: l.lng,
        wilaya: l.wilaya || l.profiles?.wilaya,
      });
      const dist = myCoords && hotelCoords ? distanceKm(myCoords, hotelCoords) : null;
      return { ...l, computedDist: dist };
    });
  }, [listings.data, q, wilaya, myCoords, hotelIdFilter]);

  // Radius filtering with Auto-Expansion Engine
  const { finalRows, autoExpanded, effectiveTier } = useMemo(() => {
    if (radiusTier === "all" || !myCoords) {
      return { finalRows: processed, autoExpanded: false, effectiveTier: "all" as RadiusTier };
    }

    const maxKm = parseFloat(radiusTier);
    const rowsWithinRadius = processed.filter(
      (l) => l.computedDist != null && l.computedDist <= maxKm,
    );

    if (rowsWithinRadius.length > 0) {
      return { finalRows: rowsWithinRadius, autoExpanded: false, effectiveTier: radiusTier };
    }

    // Auto-expansion logic: Try next radius tiers
    const tiers: RadiusTier[] = ["5", "15", "30", "all"];

    for (const t of tiers) {
      if (t === "all") {
        return { finalRows: processed, autoExpanded: true, effectiveTier: "all" };
      }
      const limit = parseFloat(t);
      if (limit > maxKm) {
        const broader = processed.filter((l) => l.computedDist != null && l.computedDist <= limit);
        if (broader.length > 0) {
          return { finalRows: broader, autoExpanded: true, effectiveTier: t };
        }
      }
    }

    return { finalRows: processed, autoExpanded: true, effectiveTier: "all" };
  }, [processed, radiusTier, myCoords]);

  // Sorting logic
  const sortedRows = useMemo(() => {
    const list = [...finalRows];
    if (sortMode === "nearest") {
      return list.sort((a, b) => {
        if (a.computedDist != null && b.computedDist != null)
          return a.computedDist - b.computedDist;
        if (a.computedDist != null) return -1;
        if (b.computedDist != null) return 1;
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      });
    }
    if (sortMode === "earliest_deadline") {
      return list.sort((a, b) => new Date(a.pickup_to).getTime() - new Date(b.pickup_to).getTime());
    }
    // Newest
    return list.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  }, [finalRows, sortMode]);

  if (role === "hotel") {
    return <Navigate to="/listings" />;
  }

  return (
    <AppShell
      title={t("browse")}
      action={
        role === "admin" ? (
          <button
            type="button"
            onClick={() => setShowFilters((s) => !s)}
            aria-label={t("filters")}
            className={cn(
              "press flex h-9 w-9 items-center justify-center rounded-full transition-colors",
              showFilters
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:bg-muted",
            )}
          >
            <SlidersHorizontal className="h-4 w-4" />
          </button>
        ) : undefined
      }
    >
      <PullToRefresh onRefresh={() => listings.refetch()}>
        {/* Active Hotel Filter Banner */}
        {hotelIdFilter && (
          <div className="surface-card mb-3 p-3.5 rounded-2xl border-primary/30 bg-primary/5 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5 min-w-0">
              <span className="brand-gradient flex h-9 w-9 items-center justify-center rounded-xl text-white shrink-0">
                <Building2 className="h-4 w-4" />
              </span>
              <div className="min-w-0">
                <p className="text-[11px] font-semibold text-muted-foreground">
                  {lang === "ar" ? "عروض حصرية للفندق:" : "Offres exclusives de l'hôtel :"}
                </p>
                <p className="text-xs font-bold text-foreground truncate">
                  {hotelNameFilter || (lang === "ar" ? "فندق مخصص" : "Hôtel spécifique")}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => navigate({ to: "/browse", search: {} })}
              className="press flex items-center gap-1 rounded-xl border border-border bg-card px-2.5 py-1.5 text-xs font-bold text-foreground hover:bg-accent shrink-0"
            >
              <X className="h-3.5 w-3.5 text-muted-foreground" />
              <span>{lang === "ar" ? "عرض جميع الفنادق" : "Tous les hôtels"}</span>
            </button>
          </div>
        )}

        {/* Wilaya Location Status Bar */}
        <div className="surface-card p-3 mb-3 flex items-center justify-between text-xs rounded-2xl border-primary/20 bg-primary/5">
          <div className="flex items-center gap-2.5 min-w-0">
            <MapPin className="h-4 w-4 text-primary shrink-0" />
            <span className="font-bold text-foreground truncate">
              {profile?.wilaya
                ? lang === "ar"
                  ? `الولاية المسجلة: ${profile.wilaya} — حساب المسافات تلقائياً`
                  : `Wilaya du profil : ${profile.wilaya} — Calcul automatique`
                : lang === "ar"
                  ? "يرجى تحديد ولايتك في الملف الشخصي لحساب المسافات"
                  : "Veuillez préciser votre wilaya dans votre profil"}
            </span>
          </div>
        </div>

        {/* Search Bar */}
        <div className="relative mb-3">
          <Search className="pointer-events-none absolute inset-y-0 start-4 my-auto h-4 w-4 text-muted-foreground" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder={t("search")}
            maxLength={80}
            className="w-full rounded-2xl border border-input bg-card py-3.5 pe-4 ps-11 text-sm outline-none focus:border-primary focus:ring-4 focus:ring-primary/12"
          />
        </div>

        {/* Quick Filter Bar & Controls */}
        <div className="mb-3 space-y-2">
          <div className="flex items-center justify-between gap-2 overflow-x-auto pb-1">
            {/* Radius Tabs */}
            <div className="flex items-center gap-1.5 shrink-0">
              {(["all", "5", "15", "30"] as RadiusTier[]).map((r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => setRadiusTier(r)}
                  className={cn(
                    "press rounded-full border px-3 py-1 text-[11px] font-extrabold transition-all",
                    radiusTier === r
                      ? "border-primary bg-primary text-primary-foreground shadow-sm"
                      : "border-border bg-card text-muted-foreground",
                  )}
                >
                  {r === "all"
                    ? lang === "ar"
                      ? "كل المسافات"
                      : "Toutes distances"
                    : `${r} ${t("km")}`}
                </button>
              ))}
            </div>

            {/* Sorting Dropdown */}
            <select
              value={sortMode}
              onChange={(e) => setSortMode(e.target.value as SortMode)}
              className="rounded-xl border border-input bg-card px-2.5 py-1 text-[11px] font-bold outline-none focus:border-primary shrink-0"
            >
              <option value="nearest">
                {lang === "ar" ? "📍 الأقرب أولاً" : "📍 Plus proche"}
              </option>
              <option value="newest">{lang === "ar" ? "🕒 الأحدث نشرًا" : "🕒 Plus récent"}</option>
              <option value="earliest_deadline">
                {lang === "ar" ? "⏰ أقرب موعد استلام" : "⏰ Fin imminente"}
              </option>
            </select>
          </div>

          {/* Wilaya Expandable Drawer */}
          {role === "admin" && showFilters && (
            <div className="surface-card rise-in space-y-3 p-4">
              <label className="text-xs font-bold text-muted-foreground block">
                {t("wilaya")}:
              </label>
              <select
                value={wilaya}
                onChange={(e) => setWilaya(e.target.value)}
                className="w-full rounded-2xl border border-input bg-card px-4 py-3 text-sm outline-none focus:border-primary"
              >
                <option value="all">{`${t("wilaya")} · ${t("all")}`}</option>
                {WILAYAS.map((w) => (
                  <option key={w} value={w}>
                    {w}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        {/* Auto Expansion Notice Banner */}
        {autoExpanded && (
          <div className="mb-4 rounded-2xl border border-amber-500/30 bg-amber-500/10 p-3.5 text-xs text-amber-900 dark:text-amber-300 flex items-start gap-2.5">
            <AlertCircle className="h-4 w-4 shrink-0 text-amber-600 dark:text-amber-400 mt-0.5" />
            <div>
              <p className="font-bold">
                {lang === "ar"
                  ? `تم توسيع نطاق البحث تلقائياً إلى ${effectiveTier === "all" ? "جميع المناطق" : `${effectiveTier} كم`}`
                  : `Rayon élargi automatiquement à ${effectiveTier === "all" ? "toutes les zones" : `${effectiveTier} km`}`}
              </p>
              <p className="text-[11px] opacity-90 mt-0.5">
                {lang === "ar"
                  ? `لم نجد عروض surplus في حدود ${radiusTier} كم، لذا قمنا بعرض العروض المتوفرة في النطاق الأقرب إليك.`
                  : `Aucun surplus dans un rayon de ${radiusTier} km. Affichage des offres disponibles les plus proches.`}
              </p>
            </div>
          </div>
        )}

        {/* Listings List */}
        {listings.isLoading ? (
          <ListSkeleton />
        ) : sortedRows.length === 0 ? (
          <EmptyState icon={UtensilsCrossed} title={t("emptyBrowse")} body={t("emptyBrowseBody")} />
        ) : (
          <div className="space-y-3">
            {sortedRows.map((l) => (
              <ListingCard
                key={l.id}
                listing={l}
                distance={l.computedDist}
                favorite={favIds.has(l.id)}
                onToggleFavorite={user ? () => toggleFav.mutate(l.id) : undefined}
              />
            ))}
          </div>
        )}
      </PullToRefresh>
    </AppShell>
  );
}
