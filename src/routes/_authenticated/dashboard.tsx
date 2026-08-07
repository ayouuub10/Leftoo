import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import {
  calculateCommission,
  getRequestPrice,
  WILAYAS,
  type Profile,
  type Listing,
  type RequestWithRelations,
} from "@/lib/domain";
import { supabase } from "@/integrations/supabase/client";
import {
  Boxes,
  CheckCircle2,
  Clock3,
  HeartHandshake,
  Building2,
  UtensilsCrossed,
  PlusCircle,
  Inbox,
  Users,
  QrCode,
  MapPin,
  X,
  User,
  ShieldCheck,
  Bookmark,
  Coins,
  ChevronDown,
  ChevronUp,
  Loader2,
  Search,
  Check,
  Phone,
  Receipt,
  ArrowUpRight,
} from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";
import { StatCard } from "@/components/common/stat-card";
import { StatsSkeleton, ListSkeleton } from "@/components/common/skeletons";
import { EmptyState } from "@/components/common/empty-state";
import { ListingCard } from "@/components/common/listing-card";
import { StatusPill } from "@/components/common/status-pill";
import { PaymentMethodDisplay } from "@/components/common/payment-method";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/use-auth";
import { useI18n } from "@/lib/i18n";
import {
  hotelListingsQuery,
  hotelRequestsQuery,
  myRequestsQuery,
  allListingsQuery,
  allRequestsQuery,
  allProfilesQuery,
} from "@/lib/data";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({
    meta: [
      { title: "Lefto — لوحة التحكم | Tableau de bord" },
      { name: "description", content: "Suivez vos surplus, demandes et repas sauvés sur Lefto." },
      { property: "og:title", content: "Lefto — Tableau de bord" },
      { property: "og:description", content: "Votre activité anti-gaspillage en un coup d'œil." },
    ],
  }),
  component: DashboardPage,
});

function DashboardPage() {
  const { t } = useI18n();
  const { profile, role } = useAuth();
  const name = profile?.org_name || profile?.full_name || "";

  return (
    <AppShell title={t("dashboard")} subtitle={name}>
      {role === "hotel" ? (
        <HotelDashboard />
      ) : role === "admin" ? (
        <AdminDashboard />
      ) : (
        <CharityDashboard />
      )}
    </AppShell>
  );
}

function HotelDashboard() {
  const { t, lang } = useI18n();
  const { user, profile } = useAuth();
  const id = user?.id ?? "";
  const listings = useQuery({ ...hotelListingsQuery(id), enabled: !!id });
  const requests = useQuery({ ...hotelRequestsQuery(id), enabled: !!id });

  const rows = listings.data ?? [];
  const reqs = requests.data ?? [];
  const meals = rows
    .filter((l) => l.status === "collected")
    .reduce((sum, l) => sum + (l.meals_count ?? 0), 0);

  const pendingRequests = reqs.filter((r) => r.status === "pending");
  const completedRequests = reqs.filter((r) => r.status === "completed");

  const confirmedHotelReqs = reqs.filter(
    (r) => r.status === "accepted" || r.status === "completed",
  );
  const hotelRequestVolume = confirmedHotelReqs.reduce((s, r) => s + getRequestPrice(r), 0);
  const hotelDirectVolume = rows
    .filter(
      (l) =>
        (l.status === "reserved" || l.status === "collected") &&
        !confirmedHotelReqs.some((r) => r.listing_id === l.id),
    )
    .reduce((s, l) => s + (l.price_dzd ?? 0), 0);

  const hotelTotalRecette = hotelRequestVolume + hotelDirectVolume;
  const hotelCommission = Math.round(hotelTotalRecette * 0.15);
  const hotelNet = hotelTotalRecette - hotelCommission;

  const hotelCaisseReceivedVol = confirmedHotelReqs
    .filter((r) => r.caisse_status === "received")
    .reduce((s, r) => s + getRequestPrice(r), 0);
  const hotelCaissePendingVol = hotelTotalRecette - hotelCaisseReceivedVol;

  return (
    <div className="space-y-6">
      {/* Hotel Profile Summary */}
      <div className="surface-card rounded-2xl p-4 border border-border bg-card space-y-3">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400 font-black text-lg border border-amber-500/20">
              <Building2 className="h-6 w-6" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h2 className="text-base font-extrabold text-foreground truncate">
                  {profile?.org_name || profile?.full_name || (lang === "ar" ? "فندق" : "Hôtel")}
                </h2>
                {profile?.is_verified && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/15 px-2 py-0.5 text-[10px] font-extrabold text-emerald-700 dark:text-emerald-300 border border-emerald-500/30 shrink-0">
                    <ShieldCheck className="h-3 w-3" />
                    {lang === "ar" ? "موثّق" : "Vérifié"}
                  </span>
                )}
              </div>
              <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground mt-0.5 font-medium">
                <span className="inline-flex items-center gap-1">
                  <MapPin className="h-3.5 w-3.5 text-primary" />
                  {profile?.wilaya || "Alger"}
                </span>
                <span>•</span>
                <span>{lang === "ar" ? "حساب فندق" : "Compte Hôtel"}</span>
              </div>
            </div>
          </div>

          <Link
            to="/profile"
            className="press shrink-0 rounded-xl bg-muted px-3 py-1.5 text-xs font-bold text-foreground hover:bg-muted/80 transition-colors flex items-center gap-1"
          >
            <User className="h-3.5 w-3.5" />
            <span>{lang === "ar" ? "الملف" : "Profil"}</span>
          </Link>
        </div>
      </div>

      {/* Hotel Recette & Caisse Box */}
      <div className="surface-card space-y-3 p-4 rounded-2xl border border-amber-500/20 bg-card">
        <div className="flex items-center justify-between border-b border-border pb-2">
          <h3 className="text-xs font-bold text-foreground flex items-center gap-1.5">
            <Coins className="h-4 w-4 text-amber-500" />
            {lang === "ar" ? "مبيعات الفندق وتحصيل الخزينة" : "Recette & Suivi de Caisse"}
          </h3>
          <span className="text-[10px] font-extrabold text-amber-600 dark:text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-full">
            {lang === "ar" ? "عمولة المنصة 15%" : "Commission 15%"}
          </span>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-2 text-center text-xs pt-1">
          <div className="rounded-xl bg-muted p-2 border border-border">
            <p className="text-[10px] text-muted-foreground font-semibold">
              {lang === "ar" ? "إجمالي المبيعات" : "Recette Totale"}
            </p>
            <p className="font-extrabold text-foreground mt-0.5">
              {hotelTotalRecette.toLocaleString()} DZD
            </p>
          </div>
          <div className="rounded-xl bg-emerald-500/10 p-2 border border-emerald-500/20">
            <p className="text-[10px] text-emerald-700 dark:text-emerald-400 font-bold">
              {lang === "ar" ? "صافي دخل الفندق (85%)" : "Net Hôtel (85%)"}
            </p>
            <p className="font-extrabold text-emerald-600 dark:text-emerald-400 mt-0.5">
              {hotelNet.toLocaleString()} DZD
            </p>
          </div>
          <div className="rounded-xl bg-emerald-500/10 p-2 border border-emerald-500/20">
            <p className="text-[10px] text-emerald-700 dark:text-emerald-400 font-bold">
              {lang === "ar" ? "العمولة التي استلمتها المنصة" : "Comm. reçue par plateforme"}
            </p>
            <p className="font-extrabold text-emerald-600 dark:text-emerald-400 mt-0.5">
              {Math.round(hotelCaisseReceivedVol * 0.15).toLocaleString()} DZD
            </p>
          </div>
          <div className="rounded-xl bg-amber-500/10 p-2 border border-amber-500/20">
            <p className="text-[10px] text-amber-700 dark:text-amber-400 font-bold">
              {lang === "ar" ? "العمولة التي لم تستلمها المنصة" : "Comm. non reçue"}
            </p>
            <p className="font-extrabold text-amber-600 dark:text-amber-400 mt-0.5">
              {Math.round(hotelCaissePendingVol * 0.15).toLocaleString()} DZD
            </p>
          </div>
        </div>
      </div>

      {/* Hotel Statistics */}
      {listings.isLoading || requests.isLoading ? (
        <StatsSkeleton />
      ) : (
        <div className="grid grid-cols-2 gap-3">
          <StatCard icon={Boxes} label={t("statPublished")} value={rows.length} />
          <StatCard
            icon={Clock3}
            tone="warning"
            label={t("statActiveRequests")}
            value={pendingRequests.length}
          />
          <StatCard
            icon={CheckCircle2}
            tone="success"
            label={t("statCompleted")}
            value={completedRequests.length}
          />
          <StatCard icon={UtensilsCrossed} tone="info" label={t("statMeals")} value={meals} />
        </div>
      )}

      {/* Primary Action Button */}
      <Link
        to="/listings/new"
        className="press brand-gradient shadow-raised flex items-center justify-center gap-2 rounded-2xl py-4 text-[15px] font-bold text-primary-foreground"
      >
        <PlusCircle className="h-5 w-5" />
        {t("newSurplus")}
      </Link>

      {/* My Published Surplus Offers */}
      <section className="space-y-3">
        <SectionHeader title={t("myListings")} to="/listings" />
        {listings.isLoading ? (
          <ListSkeleton count={2} />
        ) : rows.length === 0 ? (
          <EmptyState icon={Boxes} title={t("emptyListings")} body={t("emptyListingsBody")} />
        ) : (
          <div className="space-y-3">
            {rows.slice(0, 3).map((l) => (
              <ListingCard key={l.id} listing={{ ...l, profiles: null }} />
            ))}
          </div>
        )}
      </section>

      {/* Received Requests & Sales */}
      <section className="space-y-3">
        <SectionHeader
          title={lang === "ar" ? "الطلبات والمبيعات الواردة" : "Demandes & ventes reçues"}
          to="/requests"
        />
        {requests.isLoading ? (
          <ListSkeleton count={2} />
        ) : reqs.length === 0 ? (
          <EmptyState
            icon={Inbox}
            title={lang === "ar" ? "لا توجد طلبات بعد" : "Aucune demande reçue"}
            body={
              lang === "ar"
                ? "ستظهر هنا جميع طلبات الشراء والاستلام المقدمة من الجمعيات الخيريّة."
                : "Les demandes envoyées par les associations apparaîtront ici."
            }
          />
        ) : (
          <ul className="space-y-2">
            {reqs.slice(0, 4).map((r) => (
              <li key={r.id} className="surface-card flex items-center justify-between gap-3 p-3.5">
                <Link
                  to="/requests/$requestId"
                  params={{ requestId: r.id }}
                  className="min-w-0 flex-1 hover:underline"
                >
                  <p className="line-clamp-1 text-sm font-bold text-foreground">
                    {r.listings?.title ?? "—"}
                  </p>
                  <p className="line-clamp-1 text-xs text-muted-foreground mt-0.5">
                    {r.charity?.org_name ||
                      r.charity?.full_name ||
                      (lang === "ar" ? "جمعية" : "Association")}
                  </p>
                </Link>
                <div className="flex flex-col items-end gap-1 shrink-0">
                  <StatusPill status={r.status} kind="request" />
                  <PaymentMethodDisplay methodId={r.payment_method} variant="pill" />
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

function CharityDashboard() {
  const { t, lang } = useI18n();
  const { user, profile } = useAuth();
  const id = user?.id ?? "";
  const requests = useQuery({ ...myRequestsQuery(id), enabled: !!id });

  const reqs = requests.data ?? [];
  const pendingCount = reqs.filter((r) => r.status === "pending").length;
  const acceptedReqs = reqs.filter((r) => r.status === "accepted");
  const completedReqs = reqs.filter((r) => r.status === "completed");
  const mealsSaved = completedReqs.reduce((sum, r) => sum + (r.listings?.meals_count ?? 0), 0);

  return (
    <div className="space-y-6">
      {/* Charity Profile Summary */}
      <div className="surface-card rounded-2xl p-4 border border-border bg-card space-y-3">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-black text-lg border border-emerald-500/20">
              <HeartHandshake className="h-6 w-6" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h2 className="text-base font-extrabold text-foreground truncate">
                  {profile?.org_name ||
                    profile?.full_name ||
                    (lang === "ar" ? "جمعية خيرية" : "Association")}
                </h2>
                {profile?.is_verified && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/15 px-2 py-0.5 text-[10px] font-extrabold text-emerald-700 dark:text-emerald-300 border border-emerald-500/30 shrink-0">
                    <ShieldCheck className="h-3 w-3" />
                    {lang === "ar" ? "معتمدة" : "Vérifiée"}
                  </span>
                )}
              </div>
              <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground mt-0.5 font-medium">
                <span className="inline-flex items-center gap-1">
                  <MapPin className="h-3.5 w-3.5 text-primary" />
                  {profile?.wilaya || "Alger"}
                </span>
                <span>•</span>
                <span>{lang === "ar" ? "جمعية معتمدة" : "Association Caritative"}</span>
              </div>
            </div>
          </div>

          <Link
            to="/profile"
            className="press shrink-0 rounded-xl bg-muted px-3 py-1.5 text-xs font-bold text-foreground hover:bg-muted/80 transition-colors flex items-center gap-1"
          >
            <User className="h-3.5 w-3.5" />
            <span>{lang === "ar" ? "الملف" : "Profil"}</span>
          </Link>
        </div>
      </div>

      {/* Charity Statistics */}
      {requests.isLoading ? (
        <StatsSkeleton />
      ) : (
        <div className="grid grid-cols-2 gap-3">
          <StatCard
            icon={Inbox}
            label={lang === "ar" ? "إجمالي طلباتي" : "Total demandes"}
            value={reqs.length}
          />
          <StatCard
            icon={Clock3}
            tone="warning"
            label={t("statActiveRequests")}
            value={pendingCount}
          />
          <StatCard
            icon={CheckCircle2}
            tone="success"
            label={t("statAccepted")}
            value={acceptedReqs.length}
          />
          <StatCard icon={UtensilsCrossed} tone="info" label={t("statMeals")} value={mealsSaved} />
        </div>
      )}

      {/* Active Pickup Notice Widget (If accepted requests exist) */}
      {acceptedReqs.length > 0 && (
        <div className="surface-card rounded-2xl p-4 border-2 border-primary/30 bg-primary/5 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-primary-foreground font-bold shrink-0">
                <QrCode className="h-5 w-5" />
              </span>
              <div>
                <h3 className="text-sm font-extrabold text-foreground">
                  {lang === "ar" ? "طلب جاهز للاستلام!" : "Collecte en attente !"}
                </h3>
                <p className="text-xs text-muted-foreground">
                  {lang === "ar"
                    ? `لديك ${acceptedReqs.length} طلبات مقبولة جاهزة للتحصيل`
                    : `${acceptedReqs.length} demande(s) acceptée(s) prêt(s)`}
                </p>
              </div>
            </div>
            <Link
              to="/requests"
              search={{ filter: "accepted" }}
              className="press shrink-0 rounded-xl bg-primary px-3 py-1.5 text-xs font-bold text-primary-foreground"
            >
              {lang === "ar" ? "عرض الطلبات المقبولة" : "Voir les demandes"}
            </Link>
          </div>
        </div>
      )}

      {/* Quick Navigation Widgets */}
      <div className="space-y-2">
        <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider px-1">
          {lang === "ar" ? "روابط سريعة" : "Accès rapide"}
        </h3>
        <div className="grid grid-cols-3 gap-2.5">
          <Link
            to="/browse"
            className="surface-card flex flex-col items-center justify-center p-3 text-center space-y-1.5 hover:border-primary/50 transition-all press"
          >
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
              <Boxes className="h-5 w-5" />
            </span>
            <span className="text-xs font-bold text-foreground">
              {lang === "ar" ? "استكشاف الفائض" : "Explorer"}
            </span>
          </Link>

          <Link
            to="/requests"
            className="surface-card flex flex-col items-center justify-center p-3 text-center space-y-1.5 hover:border-primary/50 transition-all press"
          >
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400">
              <Inbox className="h-5 w-5" />
            </span>
            <span className="text-xs font-bold text-foreground">
              {lang === "ar" ? "طلباتي ومشترياتي" : "Mes demandes"}
            </span>
          </Link>

          <Link
            to="/favorites"
            className="surface-card flex flex-col items-center justify-center p-3 text-center space-y-1.5 hover:border-primary/50 transition-all press"
          >
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-rose-500/10 text-rose-600 dark:text-rose-400">
              <Bookmark className="h-5 w-5" />
            </span>
            <span className="text-xs font-bold text-foreground">
              {lang === "ar" ? "المفضلة" : "Favoris"}
            </span>
          </Link>
        </div>
      </div>

      {/* My Requests & Purchases List */}
      <section className="space-y-3">
        <SectionHeader
          title={lang === "ar" ? "طلباتي ومشترياتي الأخيرة" : "Mes demandes & achats récents"}
          to="/requests"
        />
        {requests.isLoading ? (
          <ListSkeleton count={2} />
        ) : reqs.length === 0 ? (
          <EmptyState
            icon={Inbox}
            title={lang === "ar" ? "لا توجد طلبات بعد" : "Aucune demande"}
            body={
              lang === "ar"
                ? "تصفّح عروض الفائض المتاحة وقدم طلب استلام للوجبات."
                : "Explorez les surplus disponibles et faites votre première demande."
            }
            action={
              <Link
                to="/browse"
                className="press brand-gradient inline-flex items-center gap-2 rounded-2xl px-5 py-3 text-sm font-bold text-primary-foreground"
              >
                <Boxes className="h-4 w-4" />
                {lang === "ar" ? "تصفح الفائض المتاح" : "Parcourir le surplus"}
              </Link>
            }
          />
        ) : (
          <ul className="space-y-2">
            {reqs.slice(0, 4).map((r) => (
              <li key={r.id} className="surface-card flex items-center justify-between gap-3 p-3.5">
                <Link
                  to="/requests/$requestId"
                  params={{ requestId: r.id }}
                  className="min-w-0 flex-1 hover:underline"
                >
                  <p className="line-clamp-1 text-sm font-bold text-foreground">
                    {r.listings?.title ?? "—"}
                  </p>
                  <p className="line-clamp-1 text-xs text-muted-foreground mt-0.5">
                    {r.hotel?.org_name || r.hotel?.full_name || (lang === "ar" ? "فندق" : "Hôtel")}
                  </p>
                </Link>
                <div className="flex flex-col items-end gap-1 shrink-0">
                  <StatusPill status={r.status} kind="request" />
                  <PaymentMethodDisplay methodId={r.payment_method} variant="pill" />
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* Impact & Activity Overview Widget */}
      <div className="surface-card rounded-2xl p-4 space-y-3 bg-gradient-to-br from-card via-card to-primary/5 border border-border">
        <div className="flex items-center gap-2">
          <UtensilsCrossed className="h-5 w-5 text-primary" />
          <h3 className="text-sm font-extrabold text-foreground">
            {lang === "ar"
              ? "ملخص أثر الجمعية في الحد من الهدر"
              : "Aperçu de votre impact anti-gaspillage"}
          </h3>
        </div>
        <p className="text-xs text-muted-foreground leading-relaxed">
          {lang === "ar"
            ? "تساهم جمعيتك بشكل مباشر في إنقاذ وجبات الطعام المطبوخة والطازجة وإعادة توزيعها للعائلات المحتاجة عبر قطاعات الجزائر."
            : "Votre association contribue directement à récupérer le surplus alimentaire et le redistribuer aux familles."}
        </p>
        <div className="grid grid-cols-2 gap-2 pt-1 text-xs">
          <div className="rounded-xl bg-card p-2.5 border border-border">
            <span className="text-muted-foreground block text-[11px]">
              {lang === "ar" ? "مجموع الوجبات المستلمة:" : "Repas sauvés :"}
            </span>
            <span className="font-extrabold text-primary text-sm">{mealsSaved}</span>
          </div>
          <div className="rounded-xl bg-card p-2.5 border border-border">
            <span className="text-muted-foreground block text-[11px]">
              {lang === "ar" ? "طلبات قيد المعالجة:" : "Demandes actives :"}
            </span>
            <span className="font-extrabold text-foreground text-sm">
              {pendingCount + acceptedReqs.length}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

function AdminDashboard() {
  const { t, lang } = useI18n();
  const { profile, role } = useAuth();
  const listings = useQuery(allListingsQuery());
  const requests = useQuery(allRequestsQuery());
  const profiles = useQuery(allProfilesQuery());

  const [selectedWilaya, setSelectedWilaya] = useState<string>("all");

  const peopleRaw = profiles.data ?? [];
  const rowsRaw = listings.data ?? [];
  const reqsRaw = requests.data ?? [];

  const people = peopleRaw.filter((p) => selectedWilaya === "all" || p.wilaya === selectedWilaya);
  const rows = rowsRaw.filter((l) => selectedWilaya === "all" || l.wilaya === selectedWilaya);
  const reqs = reqsRaw.filter(
    (r) =>
      selectedWilaya === "all" ||
      r.hotel?.wilaya === selectedWilaya ||
      r.listings?.wilaya === selectedWilaya,
  );

  const confirmedRequests = reqs.filter((r) => r.status === "accepted" || r.status === "completed");
  const countedListingIds = new Set(confirmedRequests.map((r) => r.listing_id).filter(Boolean));

  const requestVolume = confirmedRequests.reduce((s, r) => s + getRequestPrice(r), 0);

  const directListingVolume = rows
    .filter(
      (l) => (l.status === "reserved" || l.status === "collected") && !countedListingIds.has(l.id),
    )
    .reduce((s, l) => s + (l.price_dzd ?? 0), 0);

  const totalVolumeDzd = requestVolume + directListingVolume;
  const financial = calculateCommission(totalVolumeDzd);

  // Caisse breakdown
  const caisseReceivedReqs = confirmedRequests.filter((r) => r.caisse_status === "received");
  const caisseReceivedVolume = caisseReceivedReqs.reduce((s, r) => s + getRequestPrice(r), 0);

  const caissePendingReqs = confirmedRequests.filter((r) => r.caisse_status !== "received");
  const caissePendingVolume =
    caissePendingReqs.reduce((s, r) => s + getRequestPrice(r), 0) + directListingVolume;

  const caisseReceivedCommission = Math.round(caisseReceivedVolume * 0.15);
  const caissePendingCommission = Math.round(caissePendingVolume * 0.15);

  const meals = rows
    .filter((l) => l.status === "collected")
    .reduce((s, l) => s + (l.meals_count ?? 0), 0);

  const hotelsCount = people.filter((p) => p.role === "hotel").length;
  const charitiesCount = people.filter((p) => p.role === "charity").length;

  const activeWilayaParam = selectedWilaya !== "all" ? selectedWilaya : undefined;

  return (
    <div className="space-y-6">
      {/* Wilaya Filter Bar */}
      <div className="surface-card rounded-2xl p-4 flex flex-wrap items-center justify-between gap-3 border border-border bg-card">
        <div className="flex items-center gap-2">
          <MapPin className="h-4 w-4 text-primary shrink-0" />
          <span className="text-xs font-bold text-foreground">
            {lang === "ar"
              ? "تصفية لوحة التحكم حسب الولاية:"
              : "Filtrer le tableau de bord par wilaya :"}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <select
            value={selectedWilaya}
            onChange={(e) => setSelectedWilaya(e.target.value)}
            className="rounded-xl border border-input bg-card px-3 py-1.5 text-xs font-bold outline-none focus:border-primary"
          >
            <option value="all">{lang === "ar" ? "كل الولايات" : "Toutes les wilayas"}</option>
            {WILAYAS.map((w) => (
              <option key={w} value={w}>
                {w}
              </option>
            ))}
          </select>

          {selectedWilaya !== "all" && (
            <button
              type="button"
              onClick={() => setSelectedWilaya("all")}
              className="press flex items-center gap-1 rounded-full bg-primary/10 px-2.5 py-1 text-xs font-bold text-primary shrink-0"
              title={lang === "ar" ? "عرض جميع الولايات" : "Toutes les wilayas"}
            >
              <span>{lang === "ar" ? "إلغاء" : "Effacer"}</span>
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* 6 Financial Overview Cards */}
      <div className="surface-card space-y-4 p-5 rounded-2xl border border-primary/30 bg-card">
        <div className="flex items-center justify-between border-b border-border pb-3">
          <h3 className="text-sm font-extrabold text-foreground flex items-center gap-2">
            <Coins className="h-4 w-4 text-primary" />
            {lang === "ar"
              ? "لوحة الإحصائيات المالية للعمولات والتحصيل"
              : "Aperçu Financier & Caisse"}
            {selectedWilaya !== "all" && (
              <span className="ms-1.5 text-xs font-normal text-primary">({selectedWilaya})</span>
            )}
          </h3>
          <span className="rounded-full bg-emerald-500/10 px-2.5 py-1 text-xs font-extrabold text-emerald-600 dark:text-emerald-400">
            {lang === "ar" ? "نسبة العمولة 15%" : "Taux 15%"}
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 pt-1">
          {/* 1. GMV Total Sales */}
          <div className="rounded-xl border border-border bg-muted/50 p-3 flex flex-col justify-between">
            <p className="text-[11px] font-bold text-muted-foreground">
              {lang === "ar" ? "إجمالي المبيعات (GMV)" : "Volume Total (GMV)"}
            </p>
            <p className="text-sm font-extrabold text-foreground mt-1">
              {totalVolumeDzd.toLocaleString()} DZD
            </p>
          </div>

          {/* 2. Lefto Commission 15% */}
          <div className="rounded-xl border border-amber-500/20 bg-amber-500/10 p-3 flex flex-col justify-between">
            <p className="text-[11px] font-bold text-amber-700 dark:text-amber-400">
              {lang === "ar" ? "عمولة لفتو (15%)" : "Commission Lefto (15%)"}
            </p>
            <p className="text-sm font-extrabold text-amber-600 dark:text-amber-400 mt-1">
              {financial.commission.toLocaleString()} DZD
            </p>
          </div>

          {/* 3. Hotels Net Share 85% */}
          <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-3 flex flex-col justify-between">
            <p className="text-[11px] font-bold text-emerald-700 dark:text-emerald-400">
              {lang === "ar" ? "صافي الفنادق (85%)" : "Net Hôtels (85%)"}
            </p>
            <p className="text-sm font-extrabold text-emerald-600 dark:text-emerald-400 mt-1">
              {financial.hotelNet.toLocaleString()} DZD
            </p>
          </div>

          {/* 4. Received in Caisse */}
          <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/15 p-3 flex flex-col justify-between">
            <div className="flex items-center justify-between gap-1">
              <p className="text-[11px] font-bold text-emerald-800 dark:text-emerald-300 flex items-center gap-1">
                <CheckCircle2 className="h-3.5 w-3.5" />
                {lang === "ar" ? "العمولة التي استلمتها المنصة" : "Comm. reçue par plateforme"}
              </p>
            </div>
            <p className="text-sm font-extrabold text-emerald-700 dark:text-emerald-300 mt-1">
              {caisseReceivedCommission.toLocaleString()} DZD
            </p>
          </div>

          {/* 5. Pending Caisse Collection */}
          <div className="rounded-xl border border-amber-500/30 bg-amber-500/15 p-3 flex flex-col justify-between">
            <div className="flex items-center justify-between gap-1">
              <p className="text-[11px] font-bold text-amber-800 dark:text-amber-300 flex items-center gap-1">
                <Clock3 className="h-3.5 w-3.5" />
                {lang === "ar" ? "العمولة التي لم تستلمها المنصة" : "Comm. non reçue"}
              </p>
            </div>
            <p className="text-sm font-extrabold text-amber-700 dark:text-amber-300 mt-1">
              {caissePendingCommission.toLocaleString()} DZD
            </p>
          </div>

          {/* 6. Confirmed Operations Count */}
          <div className="rounded-xl border border-primary/20 bg-primary/10 p-3 flex flex-col justify-between">
            <p className="text-[11px] font-bold text-primary">
              {lang === "ar" ? "المبيعات والعمليات المؤكدة" : "Ventes confirmées"}
            </p>
            <p className="text-sm font-extrabold text-primary mt-1">
              {confirmedRequests.length}{" "}
              {lang === "ar"
                ? confirmedRequests.length >= 3 && confirmedRequests.length <= 10
                  ? "عمليات"
                  : "عملية"
                : "ventes"}
            </p>
            <p className="text-[10px] font-semibold text-primary/80 mt-0.5">
              {lang === "ar"
                ? `${people.filter((p) => p.role === "hotel").length} فندق نشط`
                : `${people.filter((p) => p.role === "hotel").length} hôtels actifs`}
            </p>
          </div>
        </div>
      </div>

      {/* Per Hotel Recette & Caisse Management Table */}
      <HotelRecetteCaisseSection hotels={peopleRaw} requests={reqsRaw} listings={rowsRaw} />

      {profiles.isLoading || listings.isLoading || requests.isLoading ? (
        <StatsSkeleton />
      ) : (
        <div className="grid grid-cols-2 gap-3">
          {/* Hotels Card */}
          <Link
            to="/admin/organizations"
            search={{ filter: "hotel", wilaya: activeWilayaParam }}
            className="block press"
          >
            <StatCard icon={Building2} label={t("statHotels")} value={hotelsCount} />
          </Link>

          {/* Charities Card */}
          <Link
            to="/admin/organizations"
            search={{ filter: "charity", wilaya: activeWilayaParam }}
            className="block press"
          >
            <StatCard
              icon={HeartHandshake}
              tone="success"
              label={t("statCharities")}
              value={charitiesCount}
            />
          </Link>

          {/* Published Offers Card */}
          <Link to="/admin/offers" search={{ wilaya: activeWilayaParam }} className="block press">
            <StatCard
              icon={Boxes}
              tone="info"
              label={lang === "ar" ? "عروض الفائض" : "Offres de surplus"}
              value={rows.length}
            />
          </Link>

          {/* Completed Meals Card */}
          <Link
            to="/requests"
            search={{ filter: "completed", wilaya: activeWilayaParam }}
            className="block press"
          >
            <StatCard icon={UtensilsCrossed} tone="warning" label={t("statMeals")} value={meals} />
          </Link>
        </div>
      )}

      {/* Recent Offers Summary for Admin */}
      <section className="space-y-3">
        <SectionHeader
          title={lang === "ar" ? "أحدث عروض الفائض المنشورة" : "Offres récents"}
          to="/admin/offers"
          search={{ wilaya: activeWilayaParam }}
        />
        {listings.isLoading ? (
          <ListSkeleton count={3} />
        ) : rows.length === 0 ? (
          <EmptyState icon={Boxes} title={lang === "ar" ? "لا توجد عروض منشورة" : "Aucune offre"} />
        ) : (
          <div className="space-y-3">
            {rows.slice(0, 3).map((l) => (
              <ListingCard key={l.id} listing={l} />
            ))}
          </div>
        )}
      </section>

      {/* Organizations Summary */}
      <section className="space-y-3">
        <SectionHeader
          title={
            role === "charity"
              ? t("partnerHotels")
              : role === "hotel"
                ? lang === "ar"
                  ? "الجمعيات الخيريّة"
                  : "Associations"
                : t("organizations")
          }
          to="/admin/organizations"
          search={{ wilaya: activeWilayaParam }}
        />
        <ul className="space-y-2">
          {people.slice(0, 4).map((p) => (
            <li key={p.id} className="surface-card flex items-center gap-3 p-3.5">
              <span className="bg-primary-soft flex h-9 w-9 items-center justify-center rounded-xl text-primary shrink-0">
                <Users className="h-4 w-4" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="line-clamp-1 text-sm font-semibold">{p.org_name || p.full_name}</p>
                <p className="text-xs text-muted-foreground">{p.wilaya ?? "—"}</p>
              </div>
              <span className="text-[11px] font-bold text-muted-foreground">
                {p.is_verified ? t("verified") : t("unverified")}
              </span>
            </li>
          ))}
        </ul>
      </section>

      {/* Requests Summary */}
      <section className="space-y-3">
        <SectionHeader
          title={t("requests")}
          to="/requests"
          search={{ filter: "completed", wilaya: activeWilayaParam }}
        />
        <ul className="space-y-2">
          {reqs.slice(0, 4).map((r) => (
            <li key={r.id} className="surface-card flex items-center gap-3 p-3.5">
              <Link
                to="/requests/$requestId"
                params={{ requestId: r.id }}
                className="min-w-0 flex-1 hover:underline"
              >
                <p className="line-clamp-1 text-sm font-semibold">{r.listings?.title ?? "—"}</p>
                <p className="line-clamp-1 text-xs text-muted-foreground">
                  {r.charity?.org_name || r.charity?.full_name || ""}
                </p>
              </Link>
              <div className="flex flex-col items-end gap-1 shrink-0">
                <StatusPill status={r.status} kind="request" />
                <PaymentMethodDisplay methodId={r.payment_method} variant="pill" />
              </div>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}

function SectionHeader({
  title,
  to,
  search,
}: {
  title: string;
  to: string;
  search?: Record<string, unknown>;
}) {
  const { t } = useI18n();
  return (
    <div className="flex items-center justify-between">
      <h2 className="text-base font-bold">{title}</h2>
      <Link
        to={to as never}
        search={search as never}
        className="text-xs font-semibold text-primary"
      >
        {t("viewAll")}
      </Link>
    </div>
  );
}

function HotelRecetteCaisseSection({
  hotels,
  requests,
  listings,
}: {
  hotels: Profile[];
  requests: RequestWithRelations[];
  listings: Listing[];
}) {
  const { lang } = useI18n();
  const qc = useQueryClient();
  const [expandedHotelId, setExpandedHotelId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");

  const settleHotelMutation = useMutation({
    mutationFn: async ({
      hotelId,
      caisseStatus,
    }: {
      hotelId: string;
      caisseStatus: "received" | "pending";
    }) => {
      const { error } = await supabase
        .from("food_requests")
        .update({ caisse_status: caisseStatus })
        .eq("hotel_id", hotelId)
        .in("status", ["accepted", "completed"]);
      if (error) throw error;
    },
    onSuccess: (_, variables) => {
      toast.success(
        variables.caisseStatus === "received"
          ? lang === "ar"
            ? "تم تأكيد استلام الخزينة لجميع مبيعات هذا الفندق بنجاح"
            : "Recette de l'hôtel marquée comme reçue en caisse"
          : lang === "ar"
            ? "تم إرجاع مبيعات الفندق لحالة الانتظار"
            : "Recette remise en attente de caisse",
      );
      qc.invalidateQueries({ queryKey: ["requests"] });
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const settleSingleRequestMutation = useMutation({
    mutationFn: async ({
      requestId,
      caisseStatus,
    }: {
      requestId: string;
      caisseStatus: "received" | "pending";
    }) => {
      const { error } = await supabase
        .from("food_requests")
        .update({ caisse_status: caisseStatus })
        .eq("id", requestId);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success(
        lang === "ar"
          ? "تم تحديث حالة المعاملة بالخزينة بنجاح"
          : "Statut de la transaction mis à jour",
      );
      qc.invalidateQueries({ queryKey: ["requests"] });
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const hotelStats = useMemo(() => {
    return hotels
      .filter(
        (h) =>
          h.role === "hotel" ||
          listings.some((l) => l.hotel_id === h.id) ||
          requests.some(
            (r) => r.hotel_id === h.id || r.hotel?.id === h.id || r.listings?.hotel_id === h.id,
          ),
      )
      .map((h) => {
        const hReqs = requests.filter(
          (r) =>
            (r.hotel_id === h.id || r.hotel?.id === h.id || r.listings?.hotel_id === h.id) &&
            (r.status === "accepted" || r.status === "completed"),
        );
        const countedListingIds = new Set(hReqs.map((r) => r.listing_id).filter(Boolean));
        const hDirectListings = listings.filter(
          (l) =>
            l.hotel_id === h.id &&
            (l.status === "reserved" || l.status === "collected") &&
            !countedListingIds.has(l.id),
        );

        const reqVolume = hReqs.reduce((s, r) => s + getRequestPrice(r), 0);
        const directVolume = hDirectListings.reduce((s, l) => s + (l.price_dzd ?? 0), 0);
        const totalRecette = reqVolume + directVolume;
        const commission = Math.round(totalRecette * 0.15);
        const hotelNet = totalRecette - commission;

        const receivedReqs = hReqs.filter((r) => r.caisse_status === "received");
        const receivedVol = receivedReqs.reduce((s, r) => s + getRequestPrice(r), 0);

        const pendingReqs = hReqs.filter((r) => r.caisse_status !== "received");
        const pendingVol = pendingReqs.reduce((s, r) => s + getRequestPrice(r), 0) + directVolume;

        return {
          hotel: h,
          requests: hReqs,
          directListings: hDirectListings,
          totalRecette,
          commission,
          hotelNet,
          receivedVol,
          pendingVol,
          receivedCount: receivedReqs.length,
          pendingCount: pendingReqs.length + hDirectListings.length,
        };
      })
      .filter((item) => {
        if (!searchTerm.trim()) return true;
        const name = (item.hotel.org_name || item.hotel.full_name || "").toLowerCase();
        const wilaya = (item.hotel.wilaya || "").toLowerCase();
        return name.includes(searchTerm.toLowerCase()) || wilaya.includes(searchTerm.toLowerCase());
      });
  }, [hotels, requests, listings, searchTerm]);

  return (
    <section className="space-y-4 surface-card p-4 rounded-2xl border border-border bg-card">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border pb-3">
        <div className="flex items-center gap-2">
          <Receipt className="h-5 w-5 text-primary" />
          <div>
            <h3 className="text-sm font-extrabold text-foreground">
              {lang === "ar"
                ? "مبيعات الفنادق وتأكيد تحصيل الخزينة (la caisse)"
                : "Recette par hôtel & Suivi de caisse"}
            </h3>
            <p className="text-[11px] text-muted-foreground font-medium">
              {lang === "ar"
                ? "إدارة التحصيل والعمولات لكل فندق مع إمكانية تأكيد الاستلام المالي"
                : "Aperçu des ventes et validation des encaissements par hôtel"}
            </p>
          </div>
        </div>

        {/* Search Bar */}
        <div className="relative min-w-[200px]">
          <Search className="absolute start-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder={lang === "ar" ? "ابحث باسم الفندق..." : "Rechercher un hôtel..."}
            className="w-full rounded-xl border border-input bg-background ps-8 pe-3 py-1.5 text-xs font-semibold placeholder:text-muted-foreground outline-none focus:border-primary"
          />
        </div>
      </div>

      {hotelStats.length === 0 ? (
        <EmptyState
          icon={Building2}
          title={lang === "ar" ? "لا يوجد فنادق مطابقة" : "Aucun hôtel trouvé"}
        />
      ) : (
        <div className="space-y-3">
          {hotelStats.map((item) => {
            const h = item.hotel;
            const isExpanded = expandedHotelId === h.id;

            return (
              <div
                key={h.id}
                className="rounded-2xl border border-border/80 bg-background/50 p-3.5 space-y-3 transition-colors hover:border-primary/30"
              >
                {/* Header Row */}
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 font-bold border border-amber-500/20">
                      <Building2 className="h-5 w-5" />
                    </div>
                    <div className="min-w-0">
                      <h4 className="text-xs font-extrabold text-foreground truncate">
                        {h.org_name || h.full_name}
                      </h4>
                      <p className="text-[11px] text-muted-foreground font-medium flex items-center gap-2">
                        <span>{h.wilaya ?? "Alger"}</span>
                        {h.phone && (
                          <span className="flex items-center gap-0.5 dir-ltr">
                            <Phone className="h-3 w-3 text-primary" />
                            {h.phone}
                          </span>
                        )}
                      </p>
                    </div>
                  </div>

                  {/* Status Badge */}
                  <div>
                    {item.totalRecette === 0 ? (
                      <span className="rounded-full bg-muted px-2.5 py-1 text-[10px] font-bold text-muted-foreground">
                        {lang === "ar" ? "لا توجد مبيعات" : "Aucune vente"}
                      </span>
                    ) : item.pendingVol === 0 ? (
                      <span className="rounded-full bg-emerald-500/10 px-2.5 py-1 text-[10px] font-extrabold text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 flex items-center gap-1">
                        <CheckCircle2 className="h-3 w-3" />
                        {lang === "ar" ? "تم التحصيل بالكامل بالخزينة" : "Totalement encassé"}
                      </span>
                    ) : item.receivedVol > 0 ? (
                      <span className="rounded-full bg-blue-500/10 px-2.5 py-1 text-[10px] font-extrabold text-blue-600 dark:text-blue-400 border border-blue-500/20 flex items-center gap-1">
                        <Clock3 className="h-3 w-3" />
                        {lang === "ar" ? "تحصيل جزئي بالخزينة" : "Encaissement partiel"}
                      </span>
                    ) : (
                      <span className="rounded-full bg-amber-500/10 px-2.5 py-1 text-[10px] font-extrabold text-amber-600 dark:text-amber-400 border border-amber-500/20 flex items-center gap-1">
                        <Clock3 className="h-3 w-3" />
                        {lang === "ar" ? "في انتظار التسليم للخزينة" : "En attente de caisse"}
                      </span>
                    )}
                  </div>
                </div>

                {/* Financial Summary Grid for this Hotel */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center text-xs">
                  <div className="rounded-xl bg-card p-2 border border-border">
                    <p className="text-[10px] text-muted-foreground font-semibold">
                      {lang === "ar" ? "إجمالي المبيعات" : "Recette Totale"}
                    </p>
                    <p className="font-extrabold text-foreground mt-0.5">
                      {item.totalRecette.toLocaleString()} DZD
                    </p>
                  </div>
                  <div className="rounded-xl bg-amber-500/10 p-2 border border-amber-500/20">
                    <p className="text-[10px] text-amber-700 dark:text-amber-400 font-bold">
                      {lang === "ar" ? "العمولة (15%)" : "Comm. (15%)"}
                    </p>
                    <p className="font-extrabold text-amber-600 dark:text-amber-400 mt-0.5">
                      {item.commission.toLocaleString()} DZD
                    </p>
                  </div>
                  <div className="rounded-xl bg-emerald-500/10 p-2 border border-emerald-500/20">
                    <p className="text-[10px] text-emerald-700 dark:text-emerald-400 font-bold">
                      {lang === "ar" ? "العمولة التي استلمتها المنصة" : "Comm. reçue"}
                    </p>
                    <p className="font-extrabold text-emerald-600 dark:text-emerald-400 mt-0.5">
                      {Math.round(item.receivedVol * 0.15).toLocaleString()} DZD
                    </p>
                  </div>
                  <div className="rounded-xl bg-amber-500/10 p-2 border border-amber-500/20">
                    <p className="text-[10px] text-amber-700 dark:text-amber-400 font-bold">
                      {lang === "ar" ? "العمولة التي لم تستلمها المنصة" : "Comm. non reçue"}
                    </p>
                    <p className="font-extrabold text-amber-600 dark:text-amber-400 mt-0.5">
                      {Math.round(item.pendingVol * 0.15).toLocaleString()} DZD
                    </p>
                  </div>
                </div>

                {/* Admin Actions Bar for Hotel */}
                <div className="flex flex-wrap items-center justify-between gap-2 border-t border-border/60 pt-2.5">
                  <button
                    type="button"
                    onClick={() => setExpandedHotelId(isExpanded ? null : h.id)}
                    className="press text-xs font-bold text-primary flex items-center gap-1 hover:underline"
                  >
                    <span>
                      {lang === "ar"
                        ? `عرض المبيعات (${item.requests.length + item.directListings.length})`
                        : `Détails ventes (${item.requests.length + item.directListings.length})`}
                    </span>
                    {isExpanded ? (
                      <ChevronUp className="h-3.5 w-3.5" />
                    ) : (
                      <ChevronDown className="h-3.5 w-3.5" />
                    )}
                  </button>

                  <div className="flex items-center gap-2">
                    {item.pendingVol > 0 ? (
                      <button
                        type="button"
                        disabled={settleHotelMutation.isPending}
                        onClick={() =>
                          settleHotelMutation.mutate({
                            hotelId: h.id,
                            caisseStatus: "received",
                          })
                        }
                        className="press rounded-xl bg-emerald-600 px-3 py-1.5 text-xs font-extrabold text-white hover:bg-emerald-700 disabled:opacity-50 flex items-center gap-1.5 shadow-sm"
                      >
                        {settleHotelMutation.isPending ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                          <CheckCircle2 className="h-3.5 w-3.5" />
                        )}
                        <span>
                          {lang === "ar" ? "تأكيد استلام كامل الخزينة" : "Valider tout en caisse"}
                        </span>
                      </button>
                    ) : item.totalRecette > 0 ? (
                      <button
                        type="button"
                        disabled={settleHotelMutation.isPending}
                        onClick={() =>
                          settleHotelMutation.mutate({
                            hotelId: h.id,
                            caisseStatus: "pending",
                          })
                        }
                        className="press rounded-xl border border-amber-500/30 bg-amber-500/10 px-2.5 py-1 text-[11px] font-bold text-amber-600 dark:text-amber-400 hover:bg-amber-500/20 disabled:opacity-50"
                      >
                        {lang === "ar"
                          ? "إلغاء التأكيد (إرجاع للانتظار)"
                          : "Annuler l'encaissement"}
                      </button>
                    ) : null}
                  </div>
                </div>

                {/* Expanded Transactions List */}
                {isExpanded && (
                  <div className="border-t border-border pt-3 mt-2 space-y-2 bg-muted/30 p-3 rounded-xl">
                    <h5 className="text-[11px] font-extrabold text-muted-foreground">
                      {lang === "ar"
                        ? "قائمة المبيعات والطلبات للفندق:"
                        : "Liste des transactions de cet hôtel :"}
                    </h5>

                    {item.requests.length === 0 && item.directListings.length === 0 ? (
                      <p className="text-xs text-muted-foreground italic">
                        {lang === "ar" ? "لا توجد معاملات بعد." : "Aucune transaction enregistrée."}
                      </p>
                    ) : (
                      <ul className="space-y-2">
                        {item.requests.map((r) => {
                          const pDzd = getRequestPrice(r);
                          const comm = Math.round(pDzd * 0.15);
                          const isReceived = r.caisse_status === "received";

                          return (
                            <li
                              key={r.id}
                              className="surface-card flex flex-wrap items-center justify-between gap-2 p-2.5 rounded-xl border border-border text-xs"
                            >
                              <div className="min-w-0 flex-1">
                                <div className="flex items-center gap-2">
                                  <Link
                                    to="/requests/$requestId"
                                    params={{ requestId: r.id }}
                                    className="font-extrabold text-foreground hover:underline truncate"
                                  >
                                    {r.listings?.title || "طلب فائض"}
                                  </Link>
                                  <PaymentMethodDisplay
                                    methodId={r.payment_method}
                                    variant="pill"
                                  />
                                </div>
                                <p className="text-[11px] text-muted-foreground mt-0.5">
                                  {lang === "ar" ? "المشتري:" : "Client:"}{" "}
                                  <span className="font-semibold text-foreground">
                                    {r.charity?.org_name || r.charity?.full_name || "جمعية"}
                                  </span>
                                </p>
                              </div>

                              <div className="flex items-center gap-3 shrink-0">
                                <div className="text-end">
                                  <p className="font-extrabold text-foreground">
                                    {pDzd.toLocaleString()} DZD
                                  </p>
                                  <p className="text-[10px] text-amber-600 dark:text-amber-400 font-semibold">
                                    {lang === "ar"
                                      ? `العمولة: ${comm.toLocaleString()} DZD`
                                      : `Comm: ${comm.toLocaleString()} DZD`}
                                  </p>
                                </div>

                                <button
                                  type="button"
                                  disabled={settleSingleRequestMutation.isPending}
                                  onClick={() =>
                                    settleSingleRequestMutation.mutate({
                                      requestId: r.id,
                                      caisseStatus: isReceived ? "pending" : "received",
                                    })
                                  }
                                  className={cn(
                                    "press rounded-lg px-2.5 py-1 text-[11px] font-extrabold flex items-center gap-1 transition-colors",
                                    isReceived
                                      ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 hover:bg-amber-500/20 hover:text-amber-600"
                                      : "bg-emerald-600 text-white hover:bg-emerald-700",
                                  )}
                                >
                                  {isReceived ? (
                                    <>
                                      <Check className="h-3 w-3" />
                                      {lang === "ar" ? "بالخزينة" : "En caisse"}
                                    </>
                                  ) : (
                                    <>
                                      <Coins className="h-3 w-3" />
                                      {lang === "ar" ? "تأكيد الاستلام" : "Valider"}
                                    </>
                                  )}
                                </button>
                              </div>
                            </li>
                          );
                        })}

                        {item.directListings.map((l) => (
                          <li
                            key={l.id}
                            className="surface-card flex flex-wrap items-center justify-between gap-2 p-2.5 rounded-xl border border-border text-xs"
                          >
                            <div className="min-w-0 flex-1">
                              <span className="font-extrabold text-foreground truncate block">
                                {l.title}
                              </span>
                              <span className="text-[10px] text-muted-foreground font-semibold">
                                {lang === "ar" ? "عرض محجوز مباشرة" : "Offre réservée"}
                              </span>
                            </div>
                            <div className="text-end">
                              <p className="font-extrabold text-foreground">
                                {(l.price_dzd ?? 0).toLocaleString()} DZD
                              </p>
                              <p className="text-[10px] text-amber-600 dark:text-amber-400 font-semibold">
                                {lang === "ar"
                                  ? `العمولة: ${Math.round((l.price_dzd ?? 0) * 0.15).toLocaleString()} DZD`
                                  : `Comm: ${Math.round((l.price_dzd ?? 0) * 0.15).toLocaleString()} DZD`}
                              </p>
                            </div>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}
