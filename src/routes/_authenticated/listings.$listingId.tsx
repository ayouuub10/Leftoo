import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import {
  BadgeCheck,
  Clock,
  MapPin,
  Phone,
  Trash2,
  UtensilsCrossed,
  Loader2,
  Navigation,
} from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";
import { StatusPill } from "@/components/common/status-pill";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { useI18n } from "@/lib/i18n";
import { listingQuery, listingRequestsQuery, notify } from "@/lib/data";
import { QrCard } from "@/components/common/qr-system";
import { PaymentMethodSelector, PaymentMethodDisplay } from "@/components/common/payment-method";
import { calculateCommission, isListingLockedForHotel, type PaymentMethodId } from "@/lib/domain";

export const Route = createFileRoute("/_authenticated/listings/$listingId")({
  head: () => ({
    meta: [
      { title: "Lefto — تفاصيل الفائض | Détail du surplus" },
      {
        name: "description",
        content: "Détails du surplus alimentaire, horaires de retrait et contact.",
      },
      { property: "og:title", content: "Lefto — Détail du surplus" },
      { property: "og:description", content: "Horaires de retrait, quantité et localisation." },
    ],
  }),
  component: ListingDetail,
});

function ListingDetail() {
  const { listingId } = Route.useParams();
  const { t, lang } = useI18n();
  const { user, role } = useAuth();
  const qc = useQueryClient();
  const navigate = useNavigate();
  const [message, setMessage] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethodId>("espece");
  const [requestedQty, setRequestedQty] = useState<number>(5);

  const listing = useQuery(listingQuery(listingId));
  const requests = useQuery({
    ...listingRequestsQuery(listingId),
    enabled: role === "hotel" || role === "admin",
  });

  const existingCharityRequest = useQuery({
    queryKey: ["requests", "my_listing_request", listingId, user?.id],
    queryFn: async () => {
      if (!user || role !== "charity") return null;
      const { data, error } = await supabase
        .from("food_requests")
        .select("*")
        .eq("listing_id", listingId)
        .eq("charity_id", user.id)
        .maybeSingle();
      if (error) return null;
      return data;
    },
    enabled: !!user && role === "charity" && !!listingId,
  });

  const data = listing.data;
  const isOwner = !!data && data.hotel_id === user?.id;

  const availableMeals = data?.meals_count ?? 0;
  // Calculate unit price per meal = Total Price / Remaining Meals
  const unitPrice =
    data && availableMeals > 0 && data.price_dzd != null
      ? Math.round(data.price_dzd / availableMeals)
      : 0;

  const isLessThanTen = availableMeals > 0 && availableMeals < 10;
  // Minimum order quantity is 5 when >=10 remaining; if <10 remaining, must order all remaining meals
  const minQty = isLessThanTen ? availableMeals : Math.min(5, availableMeals);
  const maxQty = availableMeals;

  // Sync initial requestedQty when data finishes loading or count changes
  useEffect(() => {
    if (data?.meals_count != null) {
      const count = data.meals_count;
      if (count < 10) {
        setRequestedQty(count);
      } else {
        setRequestedQty(5);
      }
    }
  }, [data?.meals_count]);

  const requestFood = useMutation({
    mutationFn: async () => {
      if (!user || !data) return;

      if (availableMeals <= 0) {
        throw new Error(lang === "ar" ? "هذا العرض نفذت كميته بالكامل." : "Ce surplus est épuisé.");
      }

      if (isLessThanTen && requestedQty !== availableMeals) {
        throw new Error(
          lang === "ar"
            ? "هذا العرض يحتوي على أقل من 10 وجبات، لذلك يجب استلام الكمية المتبقية بالكامل."
            : "Cette offre contient moins de 10 repas, la totalité du reste doit donc être réservée.",
        );
      }

      if (requestedQty < minQty) {
        throw new Error(
          lang === "ar"
            ? "الحد الأدنى للطلب هو 5 وجبات."
            : "Le minimum de commande est de 5 repas.",
        );
      }

      if (requestedQty > maxQty) {
        throw new Error(
          lang === "ar"
            ? `لا يمكنك طلب كمية أكبر من المتوفر (${availableMeals} وجبة).`
            : `Vous ne pouvez pas demander plus que la quantité disponible (${availableMeals} repas).`,
        );
      }

      const reqTotalPrice = requestedQty * unitPrice;

      const payload: Record<string, unknown> = {
        listing_id: data.id,
        charity_id: user.id,
        hotel_id: data.hotel_id,
        message: message.trim().slice(0, 500) || null,
        payment_method: paymentMethod,
        quantity: requestedQty,
        price_dzd: reqTotalPrice,
        status: "pending",
      };

      let { error } = await supabase
        .from("food_requests")
        .insert(payload as unknown as Database["public"]["Tables"]["food_requests"]["Insert"]);

      if (
        error &&
        (error.message?.includes("quantity") ||
          error.message?.includes("payment_method") ||
          error.code === "PGRST204")
      ) {
        delete payload.quantity;
        delete payload.payment_method;
        const retry = await supabase
          .from("food_requests")
          .insert(payload as unknown as Database["public"]["Tables"]["food_requests"]["Insert"]);
        error = retry.error;
      }

      if (error) {
        if (
          error.code === "23505" ||
          error.message?.includes("unique constraint") ||
          error.message?.includes("duplicate key")
        ) {
          throw new Error(
            lang === "ar"
              ? "لقد قمت بتقديم طلب لهذه الوجبة من قبل."
              : "Vous avez déjà soumis une demande pour ce surplus.",
          );
        }
        throw new Error(error.message);
      }

      // Decrement listing available meals and update remaining listing price
      const remaining = Math.max(0, availableMeals - requestedQty);
      const newListingPrice = remaining * unitPrice;
      const newStatus = remaining === 0 ? "reserved" : "available";

      await supabase
        .from("listings")
        .update({
          meals_count: remaining,
          price_dzd: newListingPrice,
          status: newStatus,
        })
        .eq("id", data.id);

      await notify({
        user_id: data.hotel_id,
        title: t("requestSent"),
        body: `${data.title} (${requestedQty} ${lang === "ar" ? "وجبة" : "repas"} - ${reqTotalPrice.toLocaleString()} ${lang === "ar" ? "دج" : "DZD"})`,
        kind: "request",
        link: `/listings/${data.id}`,
      });
    },
    onSuccess: () => {
      toast.success(t("requestSent"));
      setMessage("");
      qc.invalidateQueries({ queryKey: ["requests"] });
      qc.invalidateQueries({ queryKey: ["listings"] });
      qc.invalidateQueries({ queryKey: ["listing", listingId] });
      qc.invalidateQueries({ queryKey: ["requests", "my_listing_request", listingId, user?.id] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const decide = useMutation({
    mutationFn: async ({
      id,
      status,
      charityId,
      reqQty = 1,
    }: {
      id: string;
      status: "accepted" | "rejected" | "completed";
      charityId: string;
      reqQty?: number;
    }) => {
      const payload: Record<string, unknown> = { status };

      if (status === "accepted") {
        const token = crypto.randomUUID();
        const expiresAt = new Date(Date.now() + 7 * 24 * 3600_000).toISOString();
        payload.qr_token = token;
        payload.qr_expires_at = expiresAt;
      }

      const { error } = await supabase.from("food_requests").update(payload).eq("id", id);
      if (error) throw new Error(error.message);

      if (status === "accepted" && data) {
        if ((data.meals_count ?? 0) <= 0) {
          await supabase.from("listings").update({ status: "reserved" }).eq("id", data.id);
        }
      }

      // If rejected, restore quantity back to listing
      if (status === "rejected" && data) {
        const restoredCount = (data.meals_count ?? 0) + reqQty;
        await supabase
          .from("listings")
          .update({ meals_count: restoredCount, status: "available" })
          .eq("id", data.id);
      }

      if (status === "completed" && data) {
        await supabase.from("listings").update({ status: "collected" }).eq("id", data.id);
      }

      await notify({
        user_id: charityId,
        title: status === "accepted" ? t("statusAccepted") : t("statusRejected"),
        body: data?.title,
        kind: "request",
        link: `/listings/${listingId}`,
      });
    },
    onSuccess: () => {
      toast.success(t("saved"));
      qc.invalidateQueries({ queryKey: ["requests"] });
      qc.invalidateQueries({ queryKey: ["listing", listingId] });
      qc.invalidateQueries({ queryKey: ["listings"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const remove = useMutation({
    mutationFn: async () => {
      await supabase.from("food_requests").delete().eq("listing_id", listingId);
      const { error } = await supabase.from("listings").delete().eq("id", listingId);
      if (error) throw new Error(error.message);
    },
    onSuccess: () => {
      toast.success(t("deleted"));
      qc.invalidateQueries({ queryKey: ["listings"] });
      if (role === "admin") {
        navigate({ to: "/admin/offers" });
      } else {
        navigate({ to: "/listings" });
      }
    },
    onError: (e: Error) => toast.error(e.message),
  });

  if (listing.isLoading || !data) {
    return (
      <AppShell title={t("details")} back>
        <div className="space-y-3">
          <Skeleton className="h-48 w-full rounded-2xl" />
          <Skeleton className="h-5 w-2/3" />
          <Skeleton className="h-4 w-1/2" />
        </div>
      </AppShell>
    );
  }

  const fmt = (iso: string) =>
    new Date(iso).toLocaleString(lang === "ar" ? "ar-DZ" : "fr-FR", {
      day: "2-digit",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    });

  return (
    <AppShell title={t("details")} back>
      <div className="space-y-5">
        <div className="surface-card overflow-hidden">
          <div className="soft-gradient h-48 w-full">
            {data.photo_url ? (
              <img src={data.photo_url} alt={data.title} className="h-full w-full object-cover" />
            ) : (
              <div className="flex h-full items-center justify-center">
                <UtensilsCrossed className="h-12 w-12 text-primary/40" strokeWidth={1.3} />
              </div>
            )}
          </div>
          <div className="space-y-3 p-4">
            <div className="flex items-start justify-between gap-3">
              <h1 className="text-xl font-extrabold leading-tight">{data.title}</h1>
              <StatusPill status={data.status} />
            </div>
            {data.description && (
              <p className="text-sm leading-relaxed text-muted-foreground">{data.description}</p>
            )}
            <div className="grid grid-cols-2 gap-3 pt-1">
              <Info
                label={lang === "ar" ? "الوجبات المتبقية" : "Repas restants"}
                value={
                  lang === "ar"
                    ? `المتبقي: ${data.meals_count ?? 0} وجبة`
                    : `Reste: ${data.meals_count ?? 0} repas`
                }
              />
              <Info label={t("wilaya")} value={data.wilaya ?? "—"} />
            </div>

            {/* Price & Commission Information */}
            {data.price_dzd != null && data.price_dzd > 0 && (
              <div className="space-y-2 rounded-2xl border border-primary/20 bg-muted/40 p-4">
                <div className="flex justify-between text-sm font-bold">
                  <span>{lang === "ar" ? "سعر الوجبة الواحدة:" : "Prix par repas :"}</span>
                  <span className="text-primary font-extrabold">
                    {unitPrice > 0
                      ? `${unitPrice.toLocaleString()} ${lang === "ar" ? "دج" : "DZD"}`
                      : "—"}
                  </span>
                </div>
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>{lang === "ar" ? "إجمالي العرض المتبقي:" : "Total du surplus :"}</span>
                  <span className="font-bold text-foreground">
                    {data.price_dzd.toLocaleString()} {lang === "ar" ? "دج" : "DZD"}
                  </span>
                </div>

                {/* Hotel & Admin View: 15% Lefto Commission Breakdown */}
                {(role === "hotel" || role === "admin") && (
                  <div className="space-y-1.5 border-t border-border pt-2 text-xs">
                    <div className="flex justify-between text-amber-600 dark:text-amber-400">
                      <span>
                        {lang === "ar" ? "عمولة منصة لفتو (15%):" : "Commission Lefto (15%) :"}
                      </span>
                      <span className="font-bold">
                        -{calculateCommission(data.price_dzd).commission.toLocaleString()}{" "}
                        {lang === "ar" ? "دج" : "DZD"}
                      </span>
                    </div>
                    <div className="flex justify-between font-bold text-emerald-600 dark:text-emerald-400">
                      <span>
                        {lang === "ar" ? "صافي مستحقات الفندق (85%):" : "Net Hôtel (85%) :"}
                      </span>
                      <span>
                        {calculateCommission(data.price_dzd).hotelNet.toLocaleString()}{" "}
                        {lang === "ar" ? "دج" : "DZD"}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            )}
            <div className="space-y-1.5 border-t border-border pt-3 text-sm">
              <p className="flex items-center gap-2 text-muted-foreground">
                <Clock className="h-4 w-4" />
                {fmt(data.pickup_from)} — {fmt(data.pickup_to)}
              </p>
              {data.address && (
                <p className="flex items-center gap-2 text-muted-foreground">
                  <MapPin className="h-4 w-4" />
                  {data.address}
                </p>
              )}
            </div>
            {data.lat != null && data.lng != null && (
              <a
                href={`https://www.google.com/maps/search/?api=1&query=${data.lat},${data.lng}`}
                target="_blank"
                rel="noreferrer noopener"
                className="press flex items-center justify-center gap-2 rounded-2xl border border-border bg-card py-3 text-sm font-bold"
              >
                <Navigation className="h-4 w-4 text-primary" />
                {t("openInMaps")}
              </a>
            )}
          </div>
        </div>

        {data.profiles && (
          <div className="surface-card p-4">
            <p className="mb-2 text-xs font-semibold text-muted-foreground">{t("hotelInfo")}</p>
            <p className="flex items-center gap-1.5 text-sm font-bold">
              {data.profiles.org_name || data.profiles.full_name}
              {data.profiles.is_verified && <BadgeCheck className="h-4 w-4 text-primary" />}
            </p>
            {data.profiles.phone && (
              <a
                href={`tel:${data.profiles.phone}`}
                className="mt-2 flex items-center gap-2 text-sm text-primary"
              >
                <Phone className="h-4 w-4" />
                {data.profiles.phone}
              </a>
            )}
          </div>
        )}

        {role === "charity" &&
          (existingCharityRequest.data ? (
            <div className="surface-card border-primary/30 bg-primary/5 space-y-3 border p-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-bold">
                  {lang === "ar" ? "لقد أرسلت طلباً لهذه الوجبة سابقاً" : "Demande déjà envoyée"}
                </span>
                <StatusPill status={existingCharityRequest.data.status} kind="request" />
              </div>
              <p className="text-muted-foreground text-xs">
                {lang === "ar"
                  ? "يمكنك متابعة حالة الطلب والتواصل مع الفندق من صفحة تفاصيل الطلب."
                  : "Vous pouvez suivre l'état de votre demande dans les détails de la commande."}
              </p>
              <Link
                to="/requests/$requestId"
                params={{ requestId: existingCharityRequest.data.id }}
                className="press brand-gradient text-primary-foreground flex w-full items-center justify-center gap-2 rounded-2xl py-3 text-sm font-bold"
              >
                {lang === "ar" ? "عرض تفاصيل الطلب ←" : "Voir ma demande →"}
              </Link>
            </div>
          ) : data.status === "available" && (data.meals_count ?? 0) > 0 ? (
            <div className="surface-card space-y-4 p-5 border border-primary/20 bg-card shadow-xs rounded-2xl">
              <div className="border-b border-border pb-2.5">
                <h3 className="text-base font-extrabold text-foreground">
                  {lang === "ar" ? "تقديم طلب الوجبات" : "Demander des repas"}
                </h3>
              </div>

              <div className="space-y-3">
                {/* 1. سعر الوجبة */}
                <div className="flex items-center justify-between rounded-xl bg-muted/50 p-3">
                  <span className="text-xs font-semibold text-muted-foreground">
                    {lang === "ar" ? "سعر الوجبة:" : "Prix du repas :"}
                  </span>
                  <span className="text-sm font-extrabold text-foreground">
                    {unitPrice > 0
                      ? `${unitPrice.toLocaleString()} ${lang === "ar" ? "دج" : "DZD"}`
                      : lang === "ar"
                        ? "مجاني"
                        : "Gratuit"}
                  </span>
                </div>

                {/* 2. المتبقي */}
                <div className="flex items-center justify-between rounded-xl bg-muted/50 p-3">
                  <span className="text-xs font-semibold text-muted-foreground">
                    {lang === "ar" ? "المتبقي:" : "Quantité restante :"}
                  </span>
                  <span className="text-sm font-extrabold text-primary">
                    {lang === "ar"
                      ? `المتبقي ${availableMeals} وجبة`
                      : `Reste ${availableMeals} repas`}
                  </span>
                </div>

                {/* 3. الكمية المطلوبة */}
                {isLessThanTen ? (
                  /* Notification when remaining < 10: Hide counter, force full quantity */
                  <div className="space-y-2.5 rounded-xl bg-amber-500/10 p-3.5 border border-amber-500/25">
                    <div className="flex items-start gap-2 text-amber-800 dark:text-amber-300">
                      <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
                      <p className="text-xs font-bold leading-relaxed">
                        {lang === "ar"
                          ? "هذا العرض يحتوي على أقل من 10 وجبات، لذلك يجب استلام الكمية المتبقية بالكامل."
                          : "Cette offre contient moins de 10 repas, la totalité du reste doit donc être réservée."}
                      </p>
                    </div>
                    <div className="flex items-center justify-between pt-1 border-t border-amber-500/20 text-xs">
                      <span className="font-semibold text-muted-foreground">
                        {lang === "ar" ? "الكمية المحددة للطلب:" : "Quantité réservée :"}
                      </span>
                      <span className="font-extrabold text-foreground bg-background/80 px-2.5 py-1 rounded-lg border border-border">
                        {availableMeals} {lang === "ar" ? "وجبة بالكامل" : "repas (totalité)"}
                      </span>
                    </div>
                  </div>
                ) : (
                  /* Counter when remaining >= 10: Min 5 meals */
                  <div className="space-y-2 rounded-xl bg-primary/5 p-3.5 border border-primary/15">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-foreground">
                        {lang === "ar" ? "الكمية المطلوبة:" : "Quantité demandée :"}
                      </span>
                      <span className="text-[11px] text-muted-foreground font-semibold">
                        {lang === "ar" ? "(الحد الأدنى 5 وجبات)" : "(Min. 5 repas)"}
                      </span>
                    </div>

                    <div className="flex items-center gap-3 pt-1">
                      <button
                        type="button"
                        onClick={() => setRequestedQty((q) => Math.max(minQty, q - 1))}
                        disabled={requestedQty <= minQty}
                        className="flex h-11 w-11 items-center justify-center rounded-xl border border-border bg-card font-bold text-xl text-foreground disabled:opacity-30 shadow-xs press"
                        aria-label="Decrease quantity"
                      >
                        -
                      </button>

                      <input
                        type="number"
                        min={minQty}
                        max={maxQty}
                        value={requestedQty}
                        onChange={(e) => {
                          const val = parseInt(e.target.value);
                          if (!isNaN(val)) {
                            setRequestedQty(val);
                          }
                        }}
                        className="flex-1 text-center rounded-xl border border-input bg-card py-2.5 text-base font-extrabold outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                      />

                      <button
                        type="button"
                        onClick={() => setRequestedQty((q) => Math.min(maxQty, q + 1))}
                        disabled={requestedQty >= maxQty}
                        className="flex h-11 w-11 items-center justify-center rounded-xl border border-border bg-card font-bold text-xl text-foreground disabled:opacity-30 shadow-xs press"
                        aria-label="Increase quantity"
                      >
                        +
                      </button>
                    </div>

                    {/* Validation warnings */}
                    {requestedQty < minQty && (
                      <p className="text-[11px] font-bold text-destructive mt-1">
                        {lang === "ar"
                          ? "الحد الأدنى للطلب هو 5 وجبات."
                          : "Le minimum de commande est de 5 repas."}
                      </p>
                    )}

                    {requestedQty > maxQty && (
                      <p className="text-[11px] font-bold text-destructive mt-1">
                        {lang === "ar"
                          ? `عذراً، الوجبات المتوفرة حالياً هي ${availableMeals} فقط.`
                          : `Désolé, il n'y a que ${availableMeals} repas disponibles.`}
                      </p>
                    )}
                  </div>
                )}

                {/* 4. المبلغ الإجمالي (يتحديث تلقائياً) */}
                <div className="flex items-center justify-between rounded-xl bg-emerald-500/10 p-3.5 border border-emerald-500/20">
                  <span className="text-xs font-bold text-emerald-800 dark:text-emerald-300">
                    {lang === "ar" ? "المبلغ الإجمالي:" : "Montant total :"}
                  </span>
                  <span className="text-base font-extrabold text-emerald-600 dark:text-emerald-400">
                    {(requestedQty * unitPrice).toLocaleString()} {lang === "ar" ? "دج" : "DZD"}
                  </span>
                </div>
              </div>

              <PaymentMethodSelector value={paymentMethod} onChange={setPaymentMethod} />

              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                rows={3}
                maxLength={500}
                placeholder={`${t("message")} · ${t("optional")}`}
                className="border-input bg-card focus:border-primary focus:ring-primary/12 w-full resize-none rounded-2xl border px-4 py-3 text-sm outline-none focus:ring-4"
              />
              <button
                type="button"
                disabled={
                  requestFood.isPending ||
                  requestedQty < minQty ||
                  requestedQty > maxQty ||
                  availableMeals <= 0
                }
                onClick={() => requestFood.mutate()}
                className="press brand-gradient text-primary-foreground flex w-full items-center justify-center gap-2 rounded-2xl py-4 text-[15px] font-bold disabled:opacity-60 shadow-xs"
              >
                {requestFood.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
                {t("requestFood")} ({requestedQty} {lang === "ar" ? "وجبة" : "repas"} —{" "}
                {(requestedQty * unitPrice).toLocaleString()} {lang === "ar" ? "دج" : "DZD"})
              </button>
            </div>
          ) : (
            <div className="surface-card border-amber-500/30 bg-amber-50/50 dark:bg-amber-950/20 p-4 text-center space-y-1">
              <p className="text-sm font-bold text-amber-700 dark:text-amber-400">
                {lang === "ar"
                  ? "هذا العرض نفذت كميته بالكامل"
                  : "Ce surplus est actuellement épuisé"}
              </p>
              <p className="text-xs text-muted-foreground">
                {lang === "ar"
                  ? "تم طلب جميع الوجبات المتوفرة لهذا العرض."
                  : "Toutes les portions ont été réservées."}
              </p>
            </div>
          ))}

        {(isOwner || role === "admin") && (
          <section className="space-y-3">
            <h2 className="text-base font-bold">{t("requests")}</h2>
            {(requests.data ?? []).length === 0 ? (
              <p className="text-sm text-muted-foreground">{t("emptyRequests")}</p>
            ) : (
              <ul className="space-y-2">
                {(requests.data ?? []).map((r) => (
                  <li key={r.id} className="surface-card space-y-3 p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <Link
                          to="/requests/$requestId"
                          params={{ requestId: r.id }}
                          className="line-clamp-1 text-sm font-bold text-foreground hover:text-primary transition-colors"
                        >
                          {r.charity?.org_name || r.charity?.full_name || "—"}
                        </Link>
                        {r.message && (
                          <p className="line-clamp-2 text-xs text-muted-foreground">{r.message}</p>
                        )}
                        <div className="mt-2 flex flex-wrap items-center gap-2">
                          <PaymentMethodDisplay methodId={r.payment_method} variant="pill" />
                          <Link
                            to="/requests/$requestId"
                            params={{ requestId: r.id }}
                            className="press inline-block font-bold text-xs text-primary hover:underline"
                          >
                            {lang === "ar" ? "تفاصيل الطلب ←" : "Voir détail →"}
                          </Link>
                        </div>
                      </div>
                      <StatusPill status={r.status} kind="request" />
                    </div>
                    {isOwner && r.status === "pending" && (
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() =>
                            decide.mutate({ id: r.id, status: "accepted", charityId: r.charity_id })
                          }
                          className="press flex-1 rounded-xl bg-primary py-2.5 text-xs font-bold text-primary-foreground"
                        >
                          {t("accept")}
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            decide.mutate({ id: r.id, status: "rejected", charityId: r.charity_id })
                          }
                          className="press flex-1 rounded-xl border border-border py-2.5 text-xs font-bold"
                        >
                          {t("reject")}
                        </button>
                      </div>
                    )}
                    {isOwner && r.status === "accepted" && (
                      <button
                        type="button"
                        onClick={() =>
                          decide.mutate({ id: r.id, status: "completed", charityId: r.charity_id })
                        }
                        className="press w-full rounded-xl bg-success py-2.5 text-xs font-bold text-primary-foreground"
                      >
                        {t("markCollected")}
                      </button>
                    )}

                    {/* QR Code system view */}
                    {(r.status === "accepted" || r.status === "completed") && (
                      <QrCard
                        request={{ ...r, listings: data }}
                        onVerified={() => {
                          qc.invalidateQueries({ queryKey: ["requests"] });
                          qc.invalidateQueries({ queryKey: ["listing", listingId] });
                        }}
                      />
                    )}
                  </li>
                ))}
              </ul>
            )}
          </section>
        )}

        {(isOwner || role === "admin") && (
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
                remove.mutate();
              }
            }}
            disabled={remove.isPending}
            className="press flex w-full items-center justify-center gap-2 rounded-2xl border border-destructive/30 py-3.5 text-sm font-bold text-destructive hover:bg-destructive/10 transition-colors"
          >
            <Trash2 className="h-4 w-4" />
            {t("delete")}
          </button>
        )}
      </div>
    </AppShell>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-muted/60 p-3">
      <p className="text-[11px] text-muted-foreground">{label}</p>
      <p className="mt-0.5 text-sm font-bold">{value}</p>
    </div>
  );
}
