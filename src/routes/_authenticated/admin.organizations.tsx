import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import {
  BadgeCheck,
  Building2,
  HeartHandshake,
  Search,
  ShieldCheck,
  Users,
  Ban,
  Edit,
  Trash2,
  CheckCircle2,
  Phone,
  MapPin,
  Clock,
  UtensilsCrossed,
  Boxes,
  QrCode,
  X,
  ChevronRight,
  Filter as FilterIcon,
  Navigation,
  Compass,
  ArrowRight,
} from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";
import { EmptyState } from "@/components/common/empty-state";
import { ListSkeleton } from "@/components/common/skeletons";
import { StatusPill } from "@/components/common/status-pill";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { useI18n } from "@/lib/i18n";
import {
  allProfilesQuery,
  allListingsQuery,
  allRequestsQuery,
  availableListingsQuery,
} from "@/lib/data";
import {
  calculateCommission,
  getRequestPrice,
  WILAYAS,
  distanceKm,
  resolveEntityCoords,
  type Profile,
  type Listing,
  type RequestWithRelations,
} from "@/lib/domain";
import { cn } from "@/lib/utils";

type Filter = "all" | "hotel" | "charity";

type OrganizationsSearch = {
  filter?: Filter;
  wilaya?: string;
};

export const Route = createFileRoute("/_authenticated/admin/organizations")({
  validateSearch: (search: Record<string, unknown>): OrganizationsSearch => {
    return {
      filter: (search.filter as Filter) || undefined,
      wilaya: (search.wilaya as string) || undefined,
    };
  },
  head: () => ({
    meta: [
      { title: "Lefto — الشركاء | Partenaires" },
      {
        name: "description",
        content: "Consultez la liste des hôtels et associations partenaires de Lefto.",
      },
      { property: "og:title", content: "Lefto — Organisations" },
      { property: "og:description", content: "Liste et supervision des organisations." },
    ],
  }),
  component: AdminOrganizations,
});

function AdminOrganizations() {
  const { t, lang } = useI18n();
  const { role, profile } = useAuth();
  const searchParams = Route.useSearch();
  const navigate = useNavigate();
  const qc = useQueryClient();

  const q = useQuery(allProfilesQuery());
  const listingsQ = useQuery({ ...allListingsQuery(), enabled: role === "admin" });
  const requestsQ = useQuery({ ...allRequestsQuery(), enabled: role === "admin" });
  const availableQ = useQuery(availableListingsQuery());

  const [filter, setFilter] = useState<Filter>(searchParams.filter ?? "all");
  const [selectedWilaya, setSelectedWilaya] = useState<string>(
    searchParams.wilaya ?? (role === "admin" ? (profile?.wilaya ?? "all") : "all"),
  );
  const [term, setTerm] = useState("");
  const [editingProfile, setEditingProfile] = useState<Profile | null>(null);
  const [selectedProfile, setSelectedProfile] = useState<Profile | null>(null);

  // Automatically resolve current user coordinates from profile or registered Wilaya
  const myCoords = useMemo(() => resolveEntityCoords(profile), [profile]);

  useEffect(() => {
    if (searchParams.filter) {
      setFilter(searchParams.filter);
    }
    if (searchParams.wilaya !== undefined) {
      setSelectedWilaya(searchParams.wilaya);
    }
  }, [searchParams.filter, searchParams.wilaya]);

  const setVerified = useMutation({
    mutationFn: async ({ id, value }: { id: string; value: boolean }) => {
      const { error } = await supabase.from("profiles").update({ is_verified: value }).eq("id", id);
      if (error) throw new Error(error.message);
    },
    onSuccess: () => {
      toast.success(t("saved"));
      qc.invalidateQueries({ queryKey: ["profiles"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const setSuspended = useMutation({
    mutationFn: async ({ id, value }: { id: string; value: boolean }) => {
      const { error } = await supabase
        .from("profiles")
        .update({ is_suspended: value })
        .eq("id", id);
      if (error) throw new Error(error.message);
    },
    onSuccess: (_, vars) => {
      toast.success(
        vars.value
          ? lang === "ar"
            ? "تم تعليق الحساب"
            : "Compte suspendu"
          : lang === "ar"
            ? "تم استعادة الحساب"
            : "Compte réactivé",
      );
      qc.invalidateQueries({ queryKey: ["profiles"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const updateProfile = useMutation({
    mutationFn: async (updated: Partial<Profile> & { id: string }) => {
      const selectedWilaya = updated.wilaya;
      if (!selectedWilaya || !WILAYAS.includes(selectedWilaya)) {
        throw new Error(
          lang === "ar"
            ? "يرجى اختيار ولاية صالحة من القائمة"
            : "Veuillez sélectionner une wilaya valide dans la liste",
        );
      }
      const { error } = await supabase
        .from("profiles")
        .update({
          org_name: updated.org_name,
          full_name: updated.full_name,
          phone: updated.phone,
          wilaya: selectedWilaya,
          address: updated.address,
        })
        .eq("id", updated.id);
      if (error) throw new Error(error.message);
    },
    onSuccess: () => {
      toast.success(
        lang === "ar"
          ? "تم تحديث تفاصيل الحساب والولاية بنجاح"
          : "Détails du compte et wilaya mis à jour avec succès",
      );
      setEditingProfile(null);
      qc.invalidateQueries({ queryKey: ["profiles"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const effectiveFilter: Filter =
    role === "hotel" ? "charity" : role === "charity" ? "hotel" : filter;
  const effectiveWilaya = role === "admin" ? selectedWilaya : "all";

  const search = term.trim().toLowerCase();
  const rawRows = (q.data ?? [])
    .filter((p) => {
      if (profile?.id && p.id === profile.id) return false;
      if (effectiveFilter === "all") return true;
      if (effectiveFilter === "hotel") {
        return p.role === "hotel" || p.role !== "charity";
      }
      if (effectiveFilter === "charity") {
        return p.role === "charity" || p.role !== "hotel";
      }
      return true;
    })
    .filter((p) => (effectiveWilaya === "all" ? true : p.wilaya === effectiveWilaya))
    .filter((p) => {
      if (!search) return true;
      return (
        (p.org_name ?? "").toLowerCase().includes(search) ||
        (p.full_name ?? "").toLowerCase().includes(search) ||
        (p.wilaya ?? "").toLowerCase().includes(search) ||
        (p.address ?? "").toLowerCase().includes(search)
      );
    });

  const myWilaya = profile?.wilaya || "";

  // Count available listings per hotel
  const hotelActiveListingsCount = useMemo(() => {
    const map: Record<string, number> = {};
    (availableQ.data ?? []).forEach((l) => {
      if (l.hotel_id) {
        map[l.hotel_id] = (map[l.hotel_id] || 0) + 1;
      }
    });
    return map;
  }, [availableQ.data]);

  // Sort rows: Use resolved Wilaya coordinates to automatically sort by proximity!
  const rows = [...rawRows].sort((a, b) => {
    const coordsA = resolveEntityCoords(a);
    const coordsB = resolveEntityCoords(b);
    const distA = myCoords && coordsA ? distanceKm(myCoords, coordsA) : null;
    const distB = myCoords && coordsB ? distanceKm(myCoords, coordsB) : null;

    if (distA != null && distB != null) return distA - distB;
    if (distA != null) return -1;
    if (distB != null) return 1;

    const aSame = Boolean(a.wilaya && myWilaya && a.wilaya.slice(0, 5) === myWilaya.slice(0, 5));
    const bSame = Boolean(b.wilaya && myWilaya && b.wilaya.slice(0, 5) === myWilaya.slice(0, 5));

    if (aSame && !bSame) return -1;
    if (!aSame && bSame) return 1;

    return (a.org_name || a.full_name || "").localeCompare(b.org_name || b.full_name || "");
  });

  const sameWilayaCount = rows.filter(
    (p) => p.wilaya && myWilaya && p.wilaya.slice(0, 5) === myWilaya.slice(0, 5),
  ).length;

  const allListings = listingsQ.data ?? [];
  const allRequests = requestsQ.data ?? [];

  const pageTitle =
    role === "hotel"
      ? lang === "ar"
        ? "الجمعيات الخيريّة الشريكة"
        : "Associations partenaires"
      : role === "charity"
        ? lang === "ar"
          ? "الفنادق"
          : "Hôtels"
        : t("organizations");

  return (
    <AppShell title={pageTitle}>
      {/* Wilaya Location Status Bar */}
      <div className="surface-card p-3 mb-3 flex items-center justify-between text-xs rounded-2xl border-primary/20 bg-primary/5">
        <div className="flex items-center gap-2.5 min-w-0">
          <MapPin className="h-4 w-4 text-primary shrink-0" />
          <span className="font-bold text-foreground truncate">
            {myWilaya
              ? lang === "ar"
                ? `الولاية المسجلة: ${myWilaya} — حساب المسافات وترتيب الأقرب تلقائياً`
                : `Wilaya du profil : ${myWilaya} — Calcul automatique`
              : lang === "ar"
                ? "يرجى تحديد ولايتك في الملف الشخصي"
                : "Veuillez préciser votre wilaya dans votre profil"}
          </span>
        </div>
      </div>

      {/* Search Input */}
      <div className="relative mb-3">
        <Search className="pointer-events-none absolute inset-y-0 start-4 my-auto h-4 w-4 text-muted-foreground" />
        <input
          value={term}
          onChange={(e) => setTerm(e.target.value)}
          maxLength={80}
          placeholder={
            role === "admin"
              ? filter === "hotel"
                ? lang === "ar"
                  ? "البحث باسم الفندق..."
                  : "Rechercher par nom d'hôtel..."
                : filter === "charity"
                  ? lang === "ar"
                    ? "البحث باسم الجمعية..."
                    : "Rechercher par nom d'association..."
                  : lang === "ar"
                    ? "البحث باسم الفندق، الجمعية..."
                    : "Rechercher par nom d'hôtel, association..."
              : role === "hotel"
                ? lang === "ar"
                  ? "البحث باسم الجمعية..."
                  : "Rechercher par nom d'association..."
                : lang === "ar"
                  ? "البحث باسم الفندق..."
                  : "Rechercher par nom d'hôtel..."
          }
          className="w-full rounded-2xl border border-input bg-card py-3.5 pe-4 ps-11 text-sm outline-none focus:border-primary focus:ring-4 focus:ring-primary/12"
        />
      </div>

      {/* Role & Wilaya Filters (Admin Only) */}
      {role === "admin" && (
        <div className="mb-4 space-y-2">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex gap-1.5 overflow-x-auto pb-1">
              {(["all", "hotel", "charity"] as Filter[]).map((f) => (
                <button
                  key={f}
                  type="button"
                  onClick={() => setFilter(f)}
                  className={cn(
                    "press rounded-full border px-3.5 py-1.5 text-xs font-semibold shrink-0 transition-colors",
                    filter === f
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-border bg-card text-muted-foreground",
                  )}
                >
                  {f === "all" ? t("all") : f === "hotel" ? t("hotel") : t("charity")}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-1.5">
              <select
                value={selectedWilaya}
                onChange={(e) => setSelectedWilaya(e.target.value)}
                className="rounded-xl border border-input bg-card px-3 py-1.5 text-xs font-semibold outline-none focus:border-primary"
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
                  className="press flex items-center gap-1 rounded-full bg-primary/10 px-2.5 py-1 text-xs font-bold text-primary"
                  title={lang === "ar" ? "إلغاء تصفية الولاية" : "Effacer filtre wilaya"}
                >
                  <span>{selectedWilaya}</span>
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {q.isLoading ? (
        <ListSkeleton count={4} />
      ) : rows.length === 0 ? (
        <EmptyState
          icon={Users}
          title={
            role === "charity"
              ? lang === "ar"
                ? "لم يتم العثور على فنادق"
                : "Aucun hôtel trouvé"
              : role === "hotel"
                ? lang === "ar"
                  ? "لم يتم العثور على جمعيات شريكة"
                  : "Aucune association partenaire trouvée"
                : t("organizations")
          }
        />
      ) : (
        <ul className="space-y-3.5">
          {rows.map((p) => {
            const isHotel = p.role === "hotel" || (p.role !== "charity" && role === "charity");
            const Icon = isHotel ? Building2 : HeartHandshake;
            const isSuspended = p.is_suspended;
            const activeCount = hotelActiveListingsCount[p.id] ?? 0;
            const pCoords = resolveEntityCoords(p);
            const distance = myCoords && pCoords ? distanceKm(myCoords, pCoords) : null;

            return (
              <li
                key={p.id}
                className={cn(
                  "surface-card overflow-hidden p-4 transition-all hover:border-primary/50 space-y-3",
                  isSuspended && "border-destructive/40 bg-destructive/5",
                )}
              >
                {/* Top Hotel Header */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3 min-w-0">
                    <span className="brand-gradient flex h-11 w-11 items-center justify-center rounded-2xl text-white shrink-0 shadow-sm">
                      <Icon className="h-5 w-5" />
                    </span>

                    <div className="min-w-0">
                      <p className="flex items-center gap-1.5 text-base font-extrabold text-foreground leading-snug">
                        <span className="line-clamp-1">{p.org_name || p.full_name}</span>
                        {p.is_verified && (
                          <BadgeCheck
                            className="h-4.5 w-4.5 shrink-0 text-primary"
                            title={lang === "ar" ? "فندق معتمد وموثق" : "Hôtel vérifié"}
                          />
                        )}
                        {isSuspended && (
                          <span className="rounded-md bg-destructive/10 px-1.5 py-0.5 text-[10px] font-bold text-destructive">
                            {lang === "ar" ? "معلّق" : "Suspendu"}
                          </span>
                        )}
                      </p>

                      <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                        <span className="font-bold text-foreground">📍 {p.wilaya ?? "—"}</span>
                        {p.address && (
                          <>
                            <span>·</span>
                            <span className="line-clamp-1 opacity-90">{p.address}</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Distance Pill */}
                  {distance != null && (
                    <span className="shrink-0 rounded-full bg-emerald-500/10 px-2.5 py-1 text-[11px] font-extrabold text-emerald-600 dark:text-emerald-400">
                      📍 {distance} {t("km")}
                    </span>
                  )}
                </div>

                {/* Available Offers Status & Action Row */}
                <div className="flex items-center justify-between gap-3 pt-2 border-t border-border/60">
                  <div className="flex items-center gap-2">
                    <span
                      className={cn(
                        "flex items-center gap-1.5 rounded-xl px-2.5 py-1 text-xs font-bold",
                        activeCount > 0
                          ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/20"
                          : "bg-muted text-muted-foreground",
                      )}
                    >
                      <UtensilsCrossed className="h-3.5 w-3.5" />
                      <span>
                        {activeCount > 0
                          ? lang === "ar"
                            ? `${activeCount} عروض متاحة حالياً`
                            : `${activeCount} offre(s) disponible(s)`
                          : lang === "ar"
                            ? "لا توجد عروض حالياً"
                            : "Aucune offre active"}
                      </span>
                    </span>
                  </div>

                  {/* Action Button: View Offers */}
                  {isHotel && (
                    <button
                      type="button"
                      onClick={() =>
                        navigate({
                          to: "/admin/offers",
                          search: {
                            hotelId: p.id,
                          },
                        })
                      }
                      className="press brand-gradient flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-xs font-bold text-white shadow-sm hover:opacity-95"
                    >
                      <span>{lang === "ar" ? "عرض إدارة العروض" : "Gérer les offres"}</span>
                      <ArrowRight className="h-3.5 w-3.5 rtl:rotate-180" />
                    </button>
                  )}
                </div>

                {/* Admin Supervision Controls */}
                {role === "admin" && (
                  <div className="grid grid-cols-3 gap-2 border-t border-border pt-3 mt-2">
                    <button
                      type="button"
                      onClick={() => setVerified.mutate({ id: p.id, value: !p.is_verified })}
                      className={cn(
                        "press rounded-xl py-2 text-xs font-bold",
                        p.is_verified
                          ? "border border-border text-muted-foreground"
                          : "bg-primary text-primary-foreground",
                      )}
                    >
                      {p.is_verified ? t("unverified") : t("approve")}
                    </button>

                    <button
                      type="button"
                      onClick={() => setSuspended.mutate({ id: p.id, value: !isSuspended })}
                      className={cn(
                        "press rounded-xl py-2 text-xs font-bold flex items-center justify-center gap-1",
                        isSuspended
                          ? "bg-emerald-600 text-white"
                          : "border border-destructive/30 text-destructive hover:bg-destructive/10",
                      )}
                    >
                      <Ban className="h-3.5 w-3.5" />
                      <span>
                        {isSuspended
                          ? lang === "ar"
                            ? "إلغاء التعليق"
                            : "Activer"
                          : lang === "ar"
                            ? "تعليق"
                            : "Suspendre"}
                      </span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setSelectedProfile(p as Profile)}
                      className="press rounded-xl border border-border py-2 text-xs font-bold text-foreground flex items-center justify-center gap-1"
                    >
                      <span>{lang === "ar" ? "التفاصيل" : "Détails"}</span>
                    </button>
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      )}

      {/* Profile Detail Drawer / Modal */}
      {selectedProfile && (
        <OrgDetailModal
          profile={selectedProfile}
          listings={allListings.filter((l) => l.hotel_id === selectedProfile.id)}
          requests={allRequests.filter(
            (r) => r.hotel_id === selectedProfile.id || r.charity_id === selectedProfile.id,
          )}
          onClose={() => setSelectedProfile(null)}
          onEdit={() => {
            setEditingProfile(selectedProfile);
            setSelectedProfile(null);
          }}
          onToggleVerify={(val) => {
            setVerified.mutate({ id: selectedProfile.id, value: val });
            setSelectedProfile({ ...selectedProfile, is_verified: val });
          }}
          onToggleSuspend={(val) => {
            setSuspended.mutate({ id: selectedProfile.id, value: val });
            setSelectedProfile({ ...selectedProfile, is_suspended: val });
          }}
        />
      )}

      {/* Edit Profile Modal */}
      {editingProfile && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-2xl bg-card p-5 space-y-4 shadow-xl border border-border">
            <h3 className="text-base font-bold">
              {lang === "ar" ? "تعديل تفاصيل الحساب" : "Modifier l'organisation"}
            </h3>
            <div className="space-y-3 text-xs">
              <div>
                <label className="text-muted-foreground font-semibold">اسم المنظمة / الفندق:</label>
                <input
                  type="text"
                  value={editingProfile.org_name || ""}
                  onChange={(e) =>
                    setEditingProfile({ ...editingProfile, org_name: e.target.value })
                  }
                  className="mt-1 w-full rounded-xl border border-input bg-card p-2.5 outline-none focus:border-primary"
                />
              </div>
              <div>
                <label className="text-muted-foreground font-semibold">اسم المسؤول:</label>
                <input
                  type="text"
                  value={editingProfile.full_name || ""}
                  onChange={(e) =>
                    setEditingProfile({ ...editingProfile, full_name: e.target.value })
                  }
                  className="mt-1 w-full rounded-xl border border-input bg-card p-2.5 outline-none focus:border-primary"
                />
              </div>
              <div>
                <label className="text-muted-foreground font-semibold">رقم الهاتف:</label>
                <input
                  type="text"
                  value={editingProfile.phone || ""}
                  onChange={(e) => setEditingProfile({ ...editingProfile, phone: e.target.value })}
                  className="mt-1 w-full rounded-xl border border-input bg-card p-2.5 outline-none focus:border-primary"
                />
              </div>
              <div>
                <label className="text-muted-foreground font-semibold">
                  {lang === "ar"
                    ? `الولاية (${WILAYAS.length} ولاية):`
                    : `Wilaya (${WILAYAS.length} wilayas) :`}
                </label>
                <select
                  value={editingProfile.wilaya || WILAYAS[15]}
                  onChange={(e) => setEditingProfile({ ...editingProfile, wilaya: e.target.value })}
                  className="mt-1 w-full rounded-xl border border-input bg-card p-2.5 font-semibold outline-none focus:border-primary"
                >
                  {WILAYAS.map((w) => (
                    <option key={w} value={w}>
                      {w}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-muted-foreground font-semibold">
                  {lang === "ar" ? "العنوان:" : "Adresse :"}
                </label>
                <input
                  type="text"
                  value={editingProfile.address || ""}
                  onChange={(e) =>
                    setEditingProfile({ ...editingProfile, address: e.target.value })
                  }
                  className="mt-1 w-full rounded-xl border border-input bg-card p-2.5 outline-none focus:border-primary"
                />
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => updateProfile.mutate(editingProfile)}
                className="press flex-1 rounded-xl bg-primary py-2.5 text-xs font-bold text-primary-foreground"
              >
                {t("saved")}
              </button>
              <button
                type="button"
                onClick={() => setEditingProfile(null)}
                className="press flex-1 rounded-xl border border-border py-2.5 text-xs font-bold"
              >
                {t("cancel")}
              </button>
            </div>
          </div>
        </div>
      )}
    </AppShell>
  );
}

function OrgDetailModal({
  profile,
  listings,
  requests,
  onClose,
  onEdit,
  onToggleVerify,
  onToggleSuspend,
}: {
  profile: Profile & { role?: string | null };
  listings: Listing[];
  requests: RequestWithRelations[];
  onClose: () => void;
  onEdit: () => void;
  onToggleVerify: (val: boolean) => void;
  onToggleSuspend: (val: boolean) => void;
}) {
  const { lang, t } = useI18n();
  const isHotel = profile.role === "hotel";

  // Hotel statistics
  const activeOrders = requests.filter((r) => r.status === "pending");
  const completedOrders = requests.filter(
    (r) => r.status === "completed" || r.status === "accepted",
  );
  const totalSales = completedOrders.reduce((sum, r) => sum + getRequestPrice(r), 0);
  const financial = calculateCommission(totalSales);

  // Charity statistics
  const pendingReqs = requests.filter((r) => r.status === "pending");
  const acceptedReqs = requests.filter((r) => r.status === "accepted");
  const completedReqs = requests.filter((r) => r.status === "completed");
  const qrScans = completedReqs.filter((r) => !!r.qr_used_at || r.status === "completed");

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
      <div className="w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-3xl bg-card p-5 space-y-5 shadow-2xl border border-border">
        {/* Header */}
        <div className="flex items-start justify-between border-b border-border pb-3">
          <div className="flex items-center gap-3">
            <span className="bg-primary/10 p-2.5 rounded-2xl text-primary">
              {isHotel ? <Building2 className="h-6 w-6" /> : <HeartHandshake className="h-6 w-6" />}
            </span>
            <div>
              <h2 className="text-base font-extrabold flex items-center gap-1.5">
                <span>{profile.org_name || profile.full_name}</span>
                {profile.is_verified && <BadgeCheck className="h-4 w-4 text-primary" />}
              </h2>
              <p className="text-xs text-muted-foreground font-semibold">
                {isHotel
                  ? lang === "ar"
                    ? "حساب فندق"
                    : "Compte Hôtel"
                  : lang === "ar"
                    ? "حساب جمعية"
                    : "Compte Association"}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="press rounded-full p-2 text-muted-foreground hover:bg-muted"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Contact Info */}
        <div className="space-y-2 rounded-2xl bg-muted/40 p-3.5 text-xs">
          <div className="flex justify-between">
            <span className="text-muted-foreground font-semibold">المسؤول:</span>
            <span className="font-bold">{profile.full_name || "—"}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground font-semibold">رقم الهاتف:</span>
            <span className="font-bold">{profile.phone || "—"}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground font-semibold">الولاية والعنوان:</span>
            <span className="font-bold">
              {profile.wilaya} — {profile.address || "العنوان غير محدد"}
            </span>
          </div>
        </div>

        {/* HOTEL SPECIFIC STATS */}
        {isHotel ? (
          <div className="space-y-4">
            <h3 className="text-xs font-bold text-muted-foreground uppercase">
              {lang === "ar" ? "الأداء المالي والعروض" : "Finances & Offres"}
            </h3>

            <div className="grid grid-cols-3 gap-2 text-center text-xs">
              <div className="rounded-2xl bg-muted/60 p-2.5">
                <p className="text-[10px] text-muted-foreground">العروض المنشورة</p>
                <p className="text-sm font-extrabold mt-0.5">{listings.length}</p>
              </div>
              <div className="rounded-2xl bg-amber-500/10 p-2.5">
                <p className="text-[10px] text-amber-700 font-semibold">طلبات نشطة</p>
                <p className="text-sm font-extrabold text-amber-600 mt-0.5">
                  {activeOrders.length}
                </p>
              </div>
              <div className="rounded-2xl bg-emerald-500/10 p-2.5">
                <p className="text-[10px] text-emerald-700 font-semibold">طلبات مكتملة</p>
                <p className="text-sm font-extrabold text-emerald-600 mt-0.5">
                  {completedOrders.length}
                </p>
              </div>
            </div>

            {/* Financial Revenue Breakdown */}
            <div className="rounded-2xl border border-primary/20 bg-card p-4 space-y-2 text-xs">
              <div className="flex justify-between font-bold">
                <span>إجمالي المبيعات (Sales):</span>
                <span>{totalSales.toLocaleString()} DZD</span>
              </div>
              <div className="flex justify-between text-amber-600 font-semibold">
                <span>عمولة المنصة Lefto (15%):</span>
                <span>-{financial.commission.toLocaleString()} DZD</span>
              </div>
              <div className="flex justify-between font-extrabold text-emerald-600 border-t border-border pt-2 text-sm">
                <span>صافي أرباح الفندق (85%):</span>
                <span>{financial.hotelNet.toLocaleString()} DZD</span>
              </div>
            </div>

            {/* Offers List */}
            <div className="space-y-2">
              <p className="text-xs font-bold text-muted-foreground">
                العروض المنشورة ({listings.length})
              </p>
              {listings.length === 0 ? (
                <p className="text-xs text-muted-foreground italic">لم يتم نشر أي عرض بعد</p>
              ) : (
                <ul className="space-y-2 max-h-40 overflow-y-auto">
                  {listings.map((l) => (
                    <li
                      key={l.id}
                      className="flex items-center justify-between rounded-xl bg-muted/30 p-2.5 text-xs"
                    >
                      <span className="font-bold line-clamp-1">{l.title}</span>
                      <StatusPill status={l.status} />
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        ) : (
          /* CHARITY SPECIFIC STATS */
          <div className="space-y-4">
            <h3 className="text-xs font-bold text-muted-foreground uppercase">
              {lang === "ar" ? "نشاط الطلبات والتوثيق" : "Demandes & Vérification QR"}
            </h3>

            <div className="grid grid-cols-3 gap-2 text-center text-xs">
              <div className="rounded-2xl bg-amber-500/10 p-2.5">
                <p className="text-[10px] text-amber-700 font-semibold">معلقة (Pending)</p>
                <p className="text-sm font-extrabold text-amber-600 mt-0.5">{pendingReqs.length}</p>
              </div>
              <div className="rounded-2xl bg-blue-500/10 p-2.5">
                <p className="text-[10px] text-blue-700 font-semibold">مقبولة (Accepted)</p>
                <p className="text-sm font-extrabold text-blue-600 mt-0.5">{acceptedReqs.length}</p>
              </div>
              <div className="rounded-2xl bg-emerald-500/10 p-2.5">
                <p className="text-[10px] text-emerald-700 font-semibold">مكتملة (Completed)</p>
                <p className="text-sm font-extrabold text-emerald-600 mt-0.5">
                  {completedReqs.length}
                </p>
              </div>
            </div>

            {/* QR Verification History */}
            <div className="space-y-2">
              <p className="text-xs font-bold text-muted-foreground flex items-center gap-1">
                <QrCode className="h-4 w-4 text-primary" />
                <span>سجل التوثيق عبر QR ({qrScans.length})</span>
              </p>
              {qrScans.length === 0 ? (
                <p className="text-xs text-muted-foreground italic">
                  لا يوجد سجل عمليات استلام موثقة بعد
                </p>
              ) : (
                <ul className="space-y-2 max-h-40 overflow-y-auto">
                  {qrScans.map((r) => (
                    <li
                      key={r.id}
                      className="flex items-center justify-between rounded-xl bg-emerald-500/10 p-2.5 text-xs"
                    >
                      <div>
                        <Link
                          to="/requests/$requestId"
                          params={{ requestId: r.id }}
                          className="font-bold line-clamp-1 text-foreground hover:text-primary transition-colors"
                        >
                          {r.listings?.title ?? "وجبة طعام"}
                        </Link>
                        <p className="text-[10px] text-muted-foreground">
                          {r.hotel?.org_name || "فندق"}
                        </p>
                      </div>
                      <span className="text-[10px] font-bold text-emerald-700 flex items-center gap-1">
                        <CheckCircle2 className="h-3 w-3" />
                        {r.qr_used_at
                          ? new Date(r.qr_used_at).toLocaleDateString("ar-DZ")
                          : "تم المسح"}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-2 pt-2 border-t border-border">
          <button
            type="button"
            onClick={onEdit}
            className="press flex-1 rounded-2xl border border-border py-3 text-xs font-bold text-foreground"
          >
            {lang === "ar" ? "تعديل البيانات" : "Modifier"}
          </button>
          <button
            type="button"
            onClick={() => onToggleVerify(!profile.is_verified)}
            className={cn(
              "press flex-1 rounded-2xl py-3 text-xs font-bold text-white",
              profile.is_verified ? "bg-slate-700" : "bg-primary",
            )}
          >
            {profile.is_verified
              ? lang === "ar"
                ? "إلغاء التوثيق"
                : "Dévérifier"
              : lang === "ar"
                ? "توثيق الحساب"
                : "Vérifier"}
          </button>
        </div>
      </div>
    </div>
  );
}
