import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import {
  ArrowLeft,
  BadgeCheck,
  Building2,
  Calendar,
  CheckCircle2,
  Clock,
  HeartHandshake,
  MapPin,
  Navigation,
  Phone,
  QrCode,
  UtensilsCrossed,
  XCircle,
  Loader2,
  FileText,
  AlertCircle,
  Coins,
} from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";
import { EmptyState } from "@/components/common/empty-state";
import { StatusPill } from "@/components/common/status-pill";
import { QrCard } from "@/components/common/qr-system";
import { PaymentMethodDisplay } from "@/components/common/payment-method";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { useI18n } from "@/lib/i18n";
import { notify } from "@/lib/data";
import {
  calculateCommission,
  getRequestPrice,
  distanceKm,
  isRequestCancellableByCharity,
  type RequestWithRelations,
} from "@/lib/domain";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/requests/$requestId")({
  head: () => ({
    meta: [
      { title: "Lefto — تفاصيل الطلب | Détail de la demande" },
      {
        name: "description",
        content: "Suivez le statut de la collecte, les horaires et le code QR.",
      },
      { property: "og:title", content: "Lefto — Détail de la demande" },
      { property: "og:description", content: "Statut, horaires de retrait et vérification QR." },
    ],
  }),
  component: RequestDetailPage,
});

function RequestDetailPage() {
  const { requestId } = Route.useParams();
  const { t, lang } = useI18n();
  const { user, role, profile: myProfile } = useAuth();
  const qc = useQueryClient();
  const navigate = useNavigate();

  const reqQuery = useQuery({
    queryKey: ["request", requestId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("food_requests")
        .select("*, listings(*), hotel:hotel_id(*), charity:charity_id(*)")
        .eq("id", requestId)
        .maybeSingle();

      if (error) throw new Error(error.message);
      return data as RequestWithRelations | null;
    },
    enabled: !!requestId,
  });

  const request = reqQuery.data;

  const cancelRequest = useMutation({
    mutationFn: async () => {
      if (!request) return;
      const { error } = await supabase
        .from("food_requests")
        .update({ status: "cancelled" })
        .eq("id", request.id);

      if (error) throw new Error(error.message);

      if (request.listing_id) {
        const reqQty = (request as unknown as { quantity?: number }).quantity || 1;
        const currentMeals = request.listings?.meals_count ?? 0;
        await supabase
          .from("listings")
          .update({ meals_count: currentMeals + reqQty, status: "available" })
          .eq("id", request.listing_id);
      }

      await notify({
        user_id: request.hotel_id,
        title:
          lang === "ar" ? "تم إلغاء الطلب من قِبل الجمعية" : "Demande annulée par l'association",
        body: request.listings?.title || "",
        kind: "warning",
        link: `/requests/${request.id}`,
      });
    },
    onSuccess: () => {
      toast.success(lang === "ar" ? "تم إلغاء الطلب بنجاح" : "Demande annulée");
      qc.invalidateQueries({ queryKey: ["requests"] });
      qc.invalidateQueries({ queryKey: ["request", requestId] });
      qc.invalidateQueries({ queryKey: ["listings"] });
      if (request?.listing_id) {
        qc.invalidateQueries({ queryKey: ["listing", request.listing_id] });
      }
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const decideRequest = useMutation({
    mutationFn: async (newStatus: "accepted" | "rejected" | "completed") => {
      if (!request) return;
      const payload: Record<string, unknown> = { status: newStatus };

      if (newStatus === "accepted") {
        payload.qr_token = crypto.randomUUID();
        payload.qr_expires_at = new Date(Date.now() + 7 * 24 * 3600_000).toISOString();
      }

      const { error } = await supabase.from("food_requests").update(payload).eq("id", request.id);

      if (error) throw new Error(error.message);

      if (newStatus === "accepted" && request.listing_id) {
        if ((request.listings?.meals_count ?? 0) <= 0) {
          await supabase
            .from("listings")
            .update({ status: "reserved" })
            .eq("id", request.listing_id);
        }
      }

      if (newStatus === "rejected" && request.listing_id) {
        const reqQty = (request as unknown as { quantity?: number }).quantity || 1;
        const currentMeals = request.listings?.meals_count ?? 0;
        await supabase
          .from("listings")
          .update({ meals_count: currentMeals + reqQty, status: "available" })
          .eq("id", request.listing_id);
      }

      if (newStatus === "completed" && request.listing_id) {
        await supabase
          .from("listings")
          .update({ status: "collected" })
          .eq("id", request.listing_id);
      }

      await notify({
        user_id: request.charity_id,
        title: newStatus === "accepted" ? t("statusAccepted") : t("statusRejected"),
        body: request.listings?.title,
        kind: "request",
        link: `/requests/${request.id}`,
      });
    },
    onSuccess: () => {
      toast.success(t("saved"));
      qc.invalidateQueries({ queryKey: ["requests"] });
      qc.invalidateQueries({ queryKey: ["request", requestId] });
      qc.invalidateQueries({ queryKey: ["listings"] });
      if (request?.listing_id) {
        qc.invalidateQueries({ queryKey: ["listing", request.listing_id] });
      }
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const updateCaisseStatus = useMutation({
    mutationFn: async (newCaisseStatus: "received" | "pending") => {
      const { error } = await supabase
        .from("food_requests")
        .update({ caisse_status: newCaisseStatus })
        .eq("id", requestId);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success(
        lang === "ar"
          ? "تم تحديث حالة التحصيل في الخزينة بنجاح"
          : "Statut de caisse mis à jour avec succès",
      );
      qc.invalidateQueries({ queryKey: ["requests"] });
      qc.invalidateQueries({ queryKey: ["request", requestId] });
    },
    onError: (err: Error) => toast.error(err.message),
  });

  if (reqQuery.isLoading) {
    return (
      <AppShell title={t("requests")} back>
        <div className="space-y-4">
          <Skeleton className="h-32 w-full rounded-2xl" />
          <Skeleton className="h-48 w-full rounded-2xl" />
          <Skeleton className="h-24 w-full rounded-2xl" />
        </div>
      </AppShell>
    );
  }

  if (!request) {
    return (
      <AppShell title={t("requests")} back>
        <EmptyState
          icon={AlertCircle}
          title={lang === "ar" ? "الطلب غير موجود" : "Demande introuvable"}
          body={
            lang === "ar"
              ? "عذراً، لم نتمكن من العثور على تفاصيل هذا الطلب."
              : "Désolé, nous n'avons pas pu trouver cette demande."
          }
        >
          <button
            type="button"
            onClick={() => navigate({ to: "/requests" })}
            className="press brand-gradient mt-4 rounded-xl px-4 py-2 text-xs font-bold text-white"
          >
            {lang === "ar" ? "العودة للطلبات" : "Retour aux demandes"}
          </button>
        </EmptyState>
      </AppShell>
    );
  }

  const isAuthorized =
    role === "admin" || request.hotel_id === user?.id || request.charity_id === user?.id;

  if (!isAuthorized) {
    return (
      <AppShell title={t("requests")} back>
        <EmptyState
          icon={AlertCircle}
          title={lang === "ar" ? "وصول غير مصرح" : "Accès non autorisé"}
          body={
            lang === "ar"
              ? "عذراً، لا تفوز بصلاحية استعراض تفاصيل هذا الطلب لأنه يخص طرفاً آخر."
              : "Désolé, vous n'avez pas accès à cette demande d'une autre organisation."
          }
        >
          <button
            type="button"
            onClick={() => navigate({ to: "/requests" })}
            className="press brand-gradient mt-4 rounded-xl px-4 py-2 text-xs font-bold text-white"
          >
            {lang === "ar" ? "العودة لقائمة الطلبات" : "Retour aux demandes"}
          </button>
        </EmptyState>
      </AppShell>
    );
  }

  const price = getRequestPrice(request);
  const financial = calculateCommission(price);
  const hotel = request.hotel;
  const charity = request.charity;
  const listing = request.listings;

  // Calculate distance between charity and hotel
  const dist = distanceKm(
    { lat: charity?.lat, lng: charity?.lng },
    { lat: hotel?.lat ?? listing?.lat, lng: hotel?.lng ?? listing?.lng },
  );

  const fmtDate = (iso?: string) =>
    iso
      ? new Date(iso).toLocaleString(lang === "ar" ? "ar-DZ" : "fr-FR", {
          day: "2-digit",
          month: "short",
          year: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        })
      : "—";

  return (
    <AppShell title={lang === "ar" ? "تفاصيل الطلب" : "Détail de la demande"} back>
      <div className="space-y-5">
        {/* Header Status & Price Banner */}
        <div className="surface-card p-5 space-y-3">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-xs text-muted-foreground font-semibold">
                {lang === "ar" ? "معرّف الطلب:" : "ID Demande:"} #{request.id.slice(0, 8)}
              </p>
              <h1 className="text-lg font-extrabold mt-0.5">{listing?.title ?? "—"}</h1>
            </div>
            <StatusPill status={request.status} kind="request" />
          </div>

          <div className="flex flex-wrap items-center gap-4 border-t border-border pt-3 text-xs text-muted-foreground">
            <span className="flex items-center gap-1 font-semibold text-foreground">
              <Calendar className="h-4 w-4 text-primary" />
              {fmtDate(request.created_at)}
            </span>
            {dist != null && (
              <span className="flex items-center gap-1 font-semibold text-foreground">
                <MapPin className="h-4 w-4 text-emerald-600" />
                {dist} {t("km")}
              </span>
            )}
          </div>
        </div>

        {/* Timeline Component */}
        <div className="surface-card p-5 space-y-3">
          <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
            {lang === "ar" ? "مراحل الطلب" : "Chronologie de la demande"}
          </h3>
          <Timeline
            status={request.status}
            createdIso={request.created_at}
            qrUsedIso={request.qr_used_at}
          />
        </div>

        {/* Selected Payment Method (Read-only display for Charity, Hotel, Admin) */}
        <PaymentMethodDisplay methodId={request.payment_method} variant="card" />

        {/* Hotel Information (Shown ONLY for Charity & Admin) */}
        {hotel && (role === "charity" || role === "admin") && (
          <div className="surface-card p-4 space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold text-muted-foreground flex items-center gap-1">
                <Building2 className="h-4 w-4 text-primary" />
                {t("hotelInfo")}
              </p>
              {hotel.is_verified && (
                <span className="flex items-center gap-1 text-[11px] font-bold text-primary">
                  <BadgeCheck className="h-3.5 w-3.5" />
                  {t("verified")}
                </span>
              )}
            </div>

            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-bold">{hotel.org_name || hotel.full_name}</p>
                <p className="text-xs text-muted-foreground">
                  {hotel.wilaya ?? listing?.wilaya ?? "—"}
                </p>
                {(hotel.address || listing?.address) && (
                  <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                    <MapPin className="h-3.5 w-3.5 shrink-0" />
                    {hotel.address || listing?.address}
                  </p>
                )}
              </div>

              {hotel.phone && (
                <a
                  href={`tel:${hotel.phone}`}
                  className="press shrink-0 flex items-center gap-1.5 rounded-xl bg-primary/10 px-3 py-2 text-xs font-bold text-primary"
                >
                  <Phone className="h-3.5 w-3.5" />
                  {lang === "ar" ? "اتصال" : "Appeler"}
                </a>
              )}
            </div>

            {(listing?.lat != null || hotel.lat != null) && (
              <a
                href={`https://www.google.com/maps/search/?api=1&query=${listing?.lat ?? hotel.lat},${listing?.lng ?? hotel.lng}`}
                target="_blank"
                rel="noreferrer noopener"
                className="press flex items-center justify-center gap-2 rounded-xl border border-border bg-card py-2.5 text-xs font-bold text-foreground"
              >
                <Navigation className="h-3.5 w-3.5 text-primary" />
                {t("openInMaps")}
              </a>
            )}
          </div>
        )}

        {/* Charity Information (Shown ONLY for Hotel & Admin) */}
        {charity && (role === "hotel" || role === "admin") && (
          <div className="surface-card p-4 space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold text-muted-foreground flex items-center gap-1">
                <HeartHandshake className="h-4 w-4 text-emerald-600" />
                {lang === "ar" ? "معلومات الجمعية طالبة الفائض" : "Association demandeuse"}
              </p>
              {charity.is_verified && (
                <span className="flex items-center gap-1 text-[11px] font-bold text-primary">
                  <BadgeCheck className="h-3.5 w-3.5" />
                  {t("verified")}
                </span>
              )}
            </div>
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-bold">{charity.org_name || charity.full_name}</p>
                <p className="text-xs text-muted-foreground">{charity.wilaya ?? "—"}</p>
              </div>
              {charity.phone && (
                <a
                  href={`tel:${charity.phone}`}
                  className="press shrink-0 flex items-center gap-1.5 rounded-xl bg-primary/10 px-3 py-2 text-xs font-bold text-primary"
                >
                  <Phone className="h-3.5 w-3.5" />
                  {lang === "ar" ? "اتصال" : "Appeler"}
                </a>
              )}
            </div>
          </div>
        )}

        {/* Food Offer Details */}
        {listing && (
          <div className="surface-card p-4 space-y-3">
            <p className="text-xs font-semibold text-muted-foreground flex items-center gap-1">
              <UtensilsCrossed className="h-4 w-4 text-primary" />
              {lang === "ar" ? "تفاصيل الوجبات والمحتوى" : "Détails du surplus"}
            </p>

            {listing.description && (
              <p className="text-xs text-foreground bg-muted/30 p-2.5 rounded-xl">
                {listing.description}
              </p>
            )}

            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="rounded-xl bg-muted/60 p-3">
                <p className="text-[11px] text-muted-foreground">
                  {lang === "ar" ? "كمية الوجبات" : "Nombre de repas"}
                </p>
                <p className="text-sm font-extrabold text-foreground mt-0.5">
                  {(request as unknown as { quantity?: number }).quantity ||
                    listing.meals_count ||
                    0}{" "}
                  {lang === "ar" ? "وجبة" : "repas"}
                </p>
              </div>
              <div className="rounded-xl bg-muted/60 p-3">
                <p className="text-[11px] text-muted-foreground">
                  {lang === "ar" ? "نافذة الاستلام" : "Horaire de retrait"}
                </p>
                <p className="text-xs font-bold text-foreground mt-0.5">
                  {new Date(listing.pickup_from).toLocaleTimeString(
                    lang === "ar" ? "ar-DZ" : "fr-FR",
                    {
                      hour: "2-digit",
                      minute: "2-digit",
                    },
                  )}{" "}
                  —{" "}
                  {new Date(listing.pickup_to).toLocaleTimeString(
                    lang === "ar" ? "ar-DZ" : "fr-FR",
                    {
                      hour: "2-digit",
                      minute: "2-digit",
                    },
                  )}
                </p>
              </div>
            </div>

            {listing.notes && (
              <div className="rounded-xl bg-muted/40 p-3 text-xs space-y-1">
                <p className="font-semibold text-muted-foreground">
                  {lang === "ar" ? "ملاحظات الفندق:" : "Notes de l'hôtel :"}
                </p>
                <p className="text-foreground">{listing.notes}</p>
              </div>
            )}

            {request.message && (
              <div className="rounded-xl bg-muted/40 p-3 text-xs space-y-1">
                <p className="font-semibold text-muted-foreground flex items-center gap-1">
                  <FileText className="h-3.5 w-3.5 text-primary" />
                  {lang === "ar" ? "رسالة الجمعية:" : "Note de l'association :"}
                </p>
                <p className="text-foreground italic">{request.message}</p>
              </div>
            )}
          </div>
        )}

        {/* Financial Breakdown (Hotel & Admin View) */}
        {price > 0 && (role === "hotel" || role === "admin") && (
          <div className="surface-card p-4 space-y-3 border border-primary/20">
            <div className="flex items-center justify-between gap-2">
              <h3 className="text-xs font-bold text-muted-foreground">
                {lang === "ar" ? "تفاصيل المعاملة المالية والعمولة" : "Finances & Commission"}
              </h3>
              {/* Caisse Status Badge */}
              <span
                className={cn(
                  "rounded-full px-2.5 py-1 text-[11px] font-extrabold flex items-center gap-1 shrink-0",
                  request.caisse_status === "received"
                    ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                    : "bg-amber-500/10 text-amber-600 dark:text-amber-400",
                )}
              >
                <Coins className="h-3 w-3" />
                {request.caisse_status === "received"
                  ? lang === "ar"
                    ? "تم التحصيل في الخزينة"
                    : "Reçu en caisse"
                  : lang === "ar"
                    ? "في انتظار الوصول للخزينة"
                    : "En attente de caisse"}
              </span>
            </div>

            <div className="space-y-2 text-xs">
              <div className="flex justify-between font-bold text-sm">
                <span>{lang === "ar" ? "إجمالي المبلغ:" : "Montant Total :"}</span>
                <span className="text-primary">{price.toLocaleString()} DZD</span>
              </div>
              <div className="flex justify-between text-amber-600 dark:text-amber-400 font-medium">
                <span>{lang === "ar" ? "عمولة لفتو (15%):" : "Commission Lefto (15%) :"}</span>
                <span>-{financial.commission.toLocaleString()} DZD</span>
              </div>
              <div className="flex justify-between font-extrabold text-emerald-600 dark:text-emerald-400 border-t border-border pt-2 text-sm">
                <span>{lang === "ar" ? "صافي مستحقات الفندق (85%):" : "Net Hôtel (85%) :"}</span>
                <span>{financial.hotelNet.toLocaleString()} DZD</span>
              </div>
            </div>

            {/* Admin Controls for Caisse Settlement */}
            {role === "admin" && (
              <div className="border-t border-border pt-3 flex items-center justify-between gap-2">
                <span className="text-[11px] text-muted-foreground font-semibold">
                  {lang === "ar" ? "تأكيد صندوق الإدارة (la caisse):" : "Caisse Administration :"}
                </span>
                {request.caisse_status === "received" ? (
                  <button
                    type="button"
                    disabled={updateCaisseStatus.isPending}
                    onClick={() => updateCaisseStatus.mutate("pending")}
                    className="press rounded-xl border border-amber-500/30 bg-amber-500/10 px-3 py-1.5 text-xs font-bold text-amber-600 dark:text-amber-400 hover:bg-amber-500/20 disabled:opacity-50"
                  >
                    {updateCaisseStatus.isPending ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : lang === "ar" ? (
                      "إلغاء الاستلام (إرجاع للانتظار)"
                    ) : (
                      "Marquer non-reçu"
                    )}
                  </button>
                ) : (
                  <button
                    type="button"
                    disabled={updateCaisseStatus.isPending}
                    onClick={() => updateCaisseStatus.mutate("received")}
                    className="press rounded-xl bg-emerald-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-emerald-700 disabled:opacity-50"
                  >
                    {updateCaisseStatus.isPending ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : lang === "ar" ? (
                      "تأكيد الاستلام بالخزينة"
                    ) : (
                      "Valider le reçu en caisse"
                    )}
                  </button>
                )}
              </div>
            )}
          </div>
        )}

        {/* QR Verification Section */}
        {(request.status === "accepted" || request.status === "completed") && (
          <div className="space-y-2">
            <h3 className="text-sm font-bold">
              {lang === "ar" ? "رمز التوثيق الرقمي QR" : "Code QR de vérification"}
            </h3>
            <QrCard
              request={request}
              onVerified={() => {
                reqQuery.refetch();
                qc.invalidateQueries({ queryKey: ["requests"] });
              }}
            />
          </div>
        )}

        {/* Action Controls */}
        <div className="pt-2 space-y-3">
          {role === "hotel" && request.status === "pending" && (
            <div className="flex gap-2">
              <button
                type="button"
                disabled={decideRequest.isPending}
                onClick={() => decideRequest.mutate("accepted")}
                className="press flex-1 rounded-2xl bg-primary py-3.5 text-sm font-bold text-primary-foreground disabled:opacity-60"
              >
                {decideRequest.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin mx-auto" />
                ) : (
                  t("accept")
                )}
              </button>
              <button
                type="button"
                disabled={decideRequest.isPending}
                onClick={() => decideRequest.mutate("rejected")}
                className="press flex-1 rounded-2xl border border-border py-3.5 text-sm font-bold text-foreground disabled:opacity-60"
              >
                {t("reject")}
              </button>
            </div>
          )}

          {role === "charity" && isRequestCancellableByCharity(request.status) && (
            <button
              type="button"
              disabled={cancelRequest.isPending}
              onClick={() => cancelRequest.mutate()}
              className="press flex w-full items-center justify-center gap-2 rounded-2xl border border-destructive/30 py-3.5 text-sm font-bold text-destructive hover:bg-destructive/10 disabled:opacity-60"
            >
              <XCircle className="h-4 w-4" />
              <span>{lang === "ar" ? "إلغاء الطلب" : "Annuler la demande"}</span>
            </button>
          )}
        </div>
      </div>
    </AppShell>
  );
}

function Timeline({
  status,
  createdIso,
  qrUsedIso,
}: {
  status: string;
  createdIso?: string;
  qrUsedIso?: string;
}) {
  const { lang } = useI18n();
  const isPending = status === "pending";
  const isAccepted = status === "accepted" || status === "completed";
  const isCompleted = status === "completed";
  const isCancelledOrRejected = status === "rejected" || status === "cancelled";

  if (isCancelledOrRejected) {
    return (
      <div className="rounded-xl bg-destructive/10 p-3.5 text-xs font-bold text-destructive flex items-center gap-2">
        <XCircle className="h-4 w-4 shrink-0" />
        <span>
          {status === "rejected"
            ? lang === "ar"
              ? "تم رفض الطلب من قِبل الفندق."
              : "Demande refusée par l'hôtel."
            : lang === "ar"
              ? "تم إلغاء الطلب."
              : "Demande annulée."}
        </span>
      </div>
    );
  }

  const steps = [
    {
      title: lang === "ar" ? "إرسال الطلب" : "Demande envoyée",
      done: true,
      time: createdIso
        ? new Date(createdIso).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
        : null,
    },
    {
      title: lang === "ar" ? "قبول الفندق" : "Acceptation Hôtel",
      done: isAccepted,
      time: null,
    },
    {
      title: lang === "ar" ? "الاستلام والتأكيد عبر QR" : "Collecte & Validation QR",
      done: isCompleted,
      time: qrUsedIso
        ? new Date(qrUsedIso).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
        : null,
    },
  ];

  return (
    <div className="space-y-3">
      <div className="relative flex items-center justify-between">
        {steps.map((step, idx) => (
          <div key={idx} className="flex flex-col items-center flex-1 text-center z-10">
            <div
              className={cn(
                "flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold transition-all",
                step.done
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "bg-muted text-muted-foreground border border-border",
              )}
            >
              {step.done ? <CheckCircle2 className="h-4 w-4" /> : idx + 1}
            </div>
            <p className="mt-1.5 text-[11px] font-bold text-foreground leading-tight px-1">
              {step.title}
            </p>
            {step.time && <p className="text-[10px] text-muted-foreground mt-0.5">{step.time}</p>}
          </div>
        ))}
      </div>
    </div>
  );
}
