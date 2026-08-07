import { createFileRoute, Link, Navigate } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import {
  Boxes,
  Clock,
  MapPin,
  Search,
  ShieldCheck,
  UtensilsCrossed,
  BadgeCheck,
  Building2,
  Calendar,
  X,
  Filter as FilterIcon,
  RotateCcw,
  Trash2,
} from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";
import { EmptyState } from "@/components/common/empty-state";
import { ListSkeleton } from "@/components/common/skeletons";
import { StatusPill } from "@/components/common/status-pill";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { useI18n } from "@/lib/i18n";
import { allListingsQuery, allProfilesQuery } from "@/lib/data";
import { WILAYAS, type ListingStatus, type Profile } from "@/lib/domain";
import { cn } from "@/lib/utils";

type StatusFilter = "all" | ListingStatus;

type OffersSearch = {
  wilaya?: string;
  status?: StatusFilter;
  hotelId?: string;
  date?: string;
  q?: string;
};

export const Route = createFileRoute("/_authenticated/admin/offers")({
  validateSearch: (search: Record<string, unknown>): OffersSearch => {
    return {
      wilaya: (search.wilaya as string) || undefined,
      status: (search.status as StatusFilter) || undefined,
      hotelId: (search.hotelId as string) || undefined,
      date: (search.date as string) || undefined,
      q: (search.q as string) || undefined,
    };
  },
  head: () => ({
    meta: [
      { title: "Lefto — عروض الفائض | Offres" },
      {
        name: "description",
        content: "Consultez et supervisez toutes les offres de surplus publiées par les hôtels.",
      },
      { property: "og:title", content: "Lefto — Offres Admin" },
      { property: "og:description", content: "Supervision globale des offres de nourriture." },
    ],
  }),
  component: AdminOffersPage,
});

function AdminOffersPage() {
  const { t, lang } = useI18n();
  const { role, profile } = useAuth();
  const searchParams = Route.useSearch();
  const qc = useQueryClient();

  const q = useQuery({ ...allListingsQuery(), enabled: role === "admin" });
  const profilesQ = useQuery({ ...allProfilesQuery(), enabled: role === "admin" });

  const deleteListing = useMutation({
    mutationFn: async (id: string) => {
      // Clean up associated requests first
      await supabase.from("food_requests").delete().eq("listing_id", id);
      const { error } = await supabase.from("listings").delete().eq("id", id);
      if (error) throw new Error(error.message);
    },
    onSuccess: () => {
      toast.success(lang === "ar" ? "تم حذف المنشور بنجاح" : "Offre supprimée avec succès");
      qc.invalidateQueries({ queryKey: ["listings"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const [term, setTerm] = useState(searchParams.q ?? "");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>(searchParams.status ?? "all");
  const [selectedWilaya, setSelectedWilaya] = useState<string>(
    searchParams.wilaya ?? (role === "admin" ? (profile?.wilaya ?? "all") : "all"),
  );
  const [selectedHotelId, setSelectedHotelId] = useState<string>(searchParams.hotelId ?? "all");
  const [selectedDate, setSelectedDate] = useState<string>(searchParams.date ?? "");
  const [sortBy, setSortBy] = useState<"newest" | "price_low" | "price_high" | "meals">("newest");

  useEffect(() => {
    if (searchParams.wilaya !== undefined) setSelectedWilaya(searchParams.wilaya);
    if (searchParams.status !== undefined) setStatusFilter(searchParams.status);
    if (searchParams.hotelId !== undefined) setSelectedHotelId(searchParams.hotelId);
    if (searchParams.date !== undefined) setSelectedDate(searchParams.date);
    if (searchParams.q !== undefined) setTerm(searchParams.q);
  }, [
    searchParams.wilaya,
    searchParams.status,
    searchParams.hotelId,
    searchParams.date,
    searchParams.q,
  ]);

  if (role !== "admin") {
    return <Navigate to="/dashboard" />;
  }

  const raw = q.data ?? [];
  const hotels = (profilesQ.data ?? []).filter((p) => p.role === "hotel");
  const search = term.trim().toLowerCase();

  let filtered = raw.filter((l) => {
    if (statusFilter !== "all" && l.status !== statusFilter) return false;
    if (selectedWilaya !== "all" && l.wilaya !== selectedWilaya) return false;
    if (selectedHotelId !== "all" && l.hotel_id !== selectedHotelId) return false;
    if (selectedDate) {
      const createdStr = new Date(l.created_at).toISOString().split("T")[0];
      if (createdStr !== selectedDate) return false;
    }
    if (search) {
      const matchTitle = l.title.toLowerCase().includes(search);
      const matchHotel = (l.profiles?.org_name || l.profiles?.full_name || "")
        .toLowerCase()
        .includes(search);
      const matchWilaya = (l.wilaya || "").toLowerCase().includes(search);
      return matchTitle || matchHotel || matchWilaya;
    }
    return true;
  });

  filtered = [...filtered].sort((a, b) => {
    if (sortBy === "price_low") return (a.price_dzd ?? 0) - (b.price_dzd ?? 0);
    if (sortBy === "price_high") return (b.price_dzd ?? 0) - (a.price_dzd ?? 0);
    if (sortBy === "meals") return (b.meals_count ?? 0) - (a.meals_count ?? 0);
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
  });

  const hasActiveFilters =
    statusFilter !== "all" ||
    selectedWilaya !== "all" ||
    selectedHotelId !== "all" ||
    selectedDate !== "" ||
    term !== "";

  const resetFilters = () => {
    setStatusFilter("all");
    setSelectedWilaya("all");
    setSelectedHotelId("all");
    setSelectedDate("");
    setTerm("");
  };

  return (
    <AppShell title={lang === "ar" ? "عروض الفائض" : "Toutes les offres Lefto"}>
      <div className="space-y-4">
        {/* Search & Main Controls */}
        <div className="space-y-3">
          <div className="relative">
            <Search className="pointer-events-none absolute inset-y-0 start-4 my-auto h-4 w-4 text-muted-foreground" />
            <input
              value={term}
              onChange={(e) => setTerm(e.target.value)}
              maxLength={80}
              placeholder={
                lang === "ar"
                  ? "البحث بعنوان العرض أو اسم الفندق..."
                  : "Rechercher offre ou hôtel..."
              }
              className="w-full rounded-2xl border border-input bg-card py-3.5 pe-4 ps-11 text-sm outline-none focus:border-primary focus:ring-4 focus:ring-primary/12"
            />
          </div>

          {/* Filter Bar: Wilaya, Hotel, Date, Sort */}
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            {/* Wilaya Filter */}
            <select
              value={selectedWilaya}
              onChange={(e) => setSelectedWilaya(e.target.value)}
              className="rounded-xl border border-input bg-card px-3 py-2 text-xs font-semibold outline-none focus:border-primary"
            >
              <option value="all">{lang === "ar" ? "كل الولايات" : "Toutes les wilayas"}</option>
              {WILAYAS.map((w) => (
                <option key={w} value={w}>
                  {w}
                </option>
              ))}
            </select>

            {/* Hotel Filter */}
            <select
              value={selectedHotelId}
              onChange={(e) => setSelectedHotelId(e.target.value)}
              className="rounded-xl border border-input bg-card px-3 py-2 text-xs font-semibold outline-none focus:border-primary"
            >
              <option value="all">{lang === "ar" ? "كل الفنادق" : "Tous les hôtels"}</option>
              {hotels.map((h) => (
                <option key={h.id} value={h.id}>
                  {h.org_name || h.full_name}
                </option>
              ))}
            </select>

            {/* Date Filter */}
            <div className="relative">
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="w-full rounded-xl border border-input bg-card px-3 py-2 text-xs font-semibold outline-none focus:border-primary"
              />
            </div>

            {/* Sort Dropdown */}
            <select
              value={sortBy}
              onChange={(e) =>
                setSortBy(e.target.value as "newest" | "price_low" | "price_high" | "meals")
              }
              className="rounded-xl border border-input bg-card px-3 py-2 text-xs font-semibold outline-none focus:border-primary"
            >
              <option value="newest">{lang === "ar" ? "الأحدث" : "Plus récents"}</option>
              <option value="price_low">
                {lang === "ar" ? "السعر: من الأقل" : "Prix croissant"}
              </option>
              <option value="price_high">
                {lang === "ar" ? "السعر: من الأعلى" : "Prix décroissant"}
              </option>
              <option value="meals">{lang === "ar" ? "عدد الوجبات" : "Repas max"}</option>
            </select>
          </div>

          {/* Active Filters Clear Button */}
          {hasActiveFilters && (
            <div className="flex items-center justify-between rounded-xl bg-primary/5 px-3 py-2 border border-primary/20 text-xs">
              <span className="font-semibold text-primary">
                {lang === "ar"
                  ? `تم التصفية (${filtered.length} نتيجة)`
                  : `Filtré (${filtered.length} résultats)`}
              </span>
              <button
                type="button"
                onClick={resetFilters}
                className="press flex items-center gap-1 font-bold text-destructive hover:underline"
              >
                <RotateCcw className="h-3.5 w-3.5" />
                <span>{lang === "ar" ? "إلغاء التصفية" : "Réinitialiser"}</span>
              </button>
            </div>
          )}

          {/* Status Tabs */}
          <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1">
            {(["all", "available", "reserved", "collected", "expired"] as StatusFilter[]).map(
              (sf) => (
                <button
                  key={sf}
                  type="button"
                  onClick={() => setStatusFilter(sf)}
                  className={cn(
                    "press shrink-0 rounded-full border px-3.5 py-1.5 text-xs font-semibold",
                    statusFilter === sf
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-border bg-card text-muted-foreground",
                  )}
                >
                  {sf === "all"
                    ? lang === "ar"
                      ? "الكل"
                      : "Tous"
                    : sf === "available"
                      ? lang === "ar"
                        ? "متاح"
                        : "Disponible"
                      : sf === "reserved"
                        ? lang === "ar"
                          ? "محجوز"
                          : "Réservé"
                        : sf === "collected"
                          ? lang === "ar"
                            ? "تم الاستلام (مكتمل)"
                            : "Collecté (Complété)"
                          : lang === "ar"
                            ? "منتهي"
                            : "Expiré"}
                </button>
              ),
            )}
          </div>
        </div>

        {/* List of Offers */}
        {q.isLoading ? (
          <ListSkeleton count={4} />
        ) : filtered.length === 0 ? (
          <EmptyState
            icon={Boxes}
            title={lang === "ar" ? "لا توجد عروض تطابق البحث والتصفية" : "Aucune offre trouvée"}
          />
        ) : (
          <ul className="space-y-3">
            {filtered.map((l) => (
              <li key={l.id} className="surface-card p-4 space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <Link
                      to="/listings/$listingId"
                      params={{ listingId: l.id }}
                      className="line-clamp-1 text-sm font-extrabold hover:text-primary transition-colors"
                    >
                      {l.title}
                    </Link>
                    <p className="flex items-center gap-1 text-xs text-muted-foreground mt-0.5">
                      <Building2 className="h-3.5 w-3.5 text-primary" />
                      <span>{l.profiles?.org_name || l.profiles?.full_name || "—"}</span>
                      {l.profiles?.is_verified && (
                        <BadgeCheck className="h-3.5 w-3.5 text-primary" />
                      )}
                    </p>
                  </div>
                  <StatusPill status={l.status} />
                </div>

                <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl bg-muted/50 p-3 text-xs">
                  <span className="font-semibold text-foreground flex items-center gap-1">
                    <UtensilsCrossed className="h-3.5 w-3.5 text-primary" />
                    {l.meals_count ?? 0} {lang === "ar" ? "وجبة" : "repas"}
                  </span>
                  <span className="font-bold text-emerald-600 dark:text-emerald-400">
                    {l.price_dzd != null && (l.meals_count ?? 0) > 0
                      ? lang === "ar"
                        ? `${Math.round(l.price_dzd / (l.meals_count || 1)).toLocaleString()} دج / وجبة`
                        : `${Math.round(l.price_dzd / (l.meals_count || 1)).toLocaleString()} DZD / repas`
                      : "مجاني"}
                  </span>
                  <span className="text-muted-foreground flex items-center gap-1">
                    <MapPin className="h-3.5 w-3.5" />
                    {l.wilaya ?? "—"}
                  </span>
                </div>

                <div className="flex items-center justify-between border-t border-border pt-2 text-[11px] text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {new Date(l.created_at).toLocaleDateString(lang === "ar" ? "ar-DZ" : "fr-FR")}
                  </span>

                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => {
                        if (
                          window.confirm(
                            lang === "ar"
                              ? "هل أنت متأكد من حذف هذا المنشور تماماً؟"
                              : "Voulez-vous vraiment supprimer cette offre ?",
                          )
                        ) {
                          deleteListing.mutate(l.id);
                        }
                      }}
                      disabled={deleteListing.isPending}
                      className="press flex items-center gap-1 rounded-xl bg-destructive/10 px-2.5 py-1 text-xs font-bold text-destructive hover:bg-destructive/20 transition-colors"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                      <span>{lang === "ar" ? "حذف" : "Supprimer"}</span>
                    </button>

                    <Link
                      to="/listings/$listingId"
                      params={{ listingId: l.id }}
                      className="press text-xs font-bold text-primary hover:underline"
                    >
                      {lang === "ar" ? "معاينة ←" : "Voir →"}
                    </Link>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </AppShell>
  );
}
