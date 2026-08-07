import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { Inbox, QrCode, XCircle, X } from "lucide-react";
import { toast } from "sonner";
import { AppShell } from "@/components/layout/app-shell";
import { EmptyState } from "@/components/common/empty-state";
import { StatusPill } from "@/components/common/status-pill";
import { PaymentMethodDisplay } from "@/components/common/payment-method";
import { ListSkeleton } from "@/components/common/skeletons";
import { PullToRefresh } from "@/components/common/pull-to-refresh";
import { QrCard } from "@/components/common/qr-system";
import { useAuth } from "@/hooks/use-auth";
import { useI18n } from "@/lib/i18n";
import { allRequestsQuery, hotelRequestsQuery, myRequestsQuery, notify } from "@/lib/data";
import {
  REQUEST_STATUS_KEY,
  WILAYAS,
  calculateCommission,
  getRequestPrice,
  isRequestCancellableByCharity,
  type RequestStatus,
} from "@/lib/domain";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";

type RequestsSearch = {
  filter?: RequestStatus | "all";
  wilaya?: string;
};

export const Route = createFileRoute("/_authenticated/requests/")({
  validateSearch: (search: Record<string, unknown>): RequestsSearch => {
    return {
      filter: (search.filter as RequestStatus | "all") || undefined,
      wilaya: (search.wilaya as string) || undefined,
    };
  },
  head: () => ({
    meta: [
      { title: "Lefto — الطلبات | Demandes" },
      {
        name: "description",
        content: "Suivez les demandes de collecte entre hôtels et associations.",
      },
      { property: "og:title", content: "Lefto — Demandes" },
      { property: "og:description", content: "Acceptez, refusez et finalisez les collectes." },
    ],
  }),
  component: Requests,
});

const FILTERS: (RequestStatus | "all")[] = ["all", "pending", "accepted", "completed", "rejected"];

function Requests() {
  const { t, lang } = useI18n();
  const { user, role, profile } = useAuth();
  const searchParams = Route.useSearch();
  const qc = useQueryClient();
  const id = user?.id ?? "";

  const [filter, setFilter] = useState<RequestStatus | "all">(searchParams.filter ?? "all");
  const [selectedWilaya, setSelectedWilaya] = useState<string>(
    searchParams.wilaya ?? (role === "admin" ? (profile?.wilaya ?? "all") : "all"),
  );
  const [activeQrRequestId, setActiveQrRequestId] = useState<string | null>(null);

  useEffect(() => {
    if (searchParams.filter !== undefined) setFilter(searchParams.filter);
    if (searchParams.wilaya !== undefined) setSelectedWilaya(searchParams.wilaya);
  }, [searchParams.filter, searchParams.wilaya]);

  const query =
    role === "hotel"
      ? hotelRequestsQuery(id)
      : role === "admin"
        ? allRequestsQuery()
        : myRequestsQuery(id);
  const q = useQuery({ ...query, enabled: !!id });

  const cancelRequest = useMutation({
    mutationFn: async (req: { id: string; hotelId: string; title?: string }) => {
      const { error } = await supabase
        .from("food_requests")
        .update({ status: "cancelled" })
        .eq("id", req.id);

      if (error) throw new Error(error.message);

      await notify({
        user_id: req.hotelId,
        title:
          lang === "ar" ? "تم إلغاء الطلب من قِبل الجمعية" : "Demande annulée par l'association",
        body: req.title || "",
        kind: "warning",
        link: "/requests",
      });
    },
    onSuccess: () => {
      toast.success(lang === "ar" ? "تم إلغاء الطلب بنجاح" : "Demande annulée");
      qc.invalidateQueries({ queryKey: ["requests"] });
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const rows = (q.data ?? [])
    .filter((r) => (filter === "all" ? true : r.status === filter))
    .filter((r) =>
      selectedWilaya === "all"
        ? true
        : r.hotel?.wilaya === selectedWilaya || r.listings?.wilaya === selectedWilaya,
    );

  return (
    <AppShell title={t("requests")}>
      <PullToRefresh onRefresh={() => q.refetch()}>
        <div className="mb-4 space-y-2">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1">
              {FILTERS.map((f) => (
                <button
                  key={f}
                  type="button"
                  onClick={() => setFilter(f)}
                  className={cn(
                    "press shrink-0 rounded-full border px-3.5 py-1.5 text-xs font-semibold",
                    filter === f
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-border bg-card text-muted-foreground",
                  )}
                >
                  {f === "all" ? t("all") : t(REQUEST_STATUS_KEY[f])}
                </button>
              ))}
            </div>

            {role === "admin" && (
              <div className="flex items-center gap-1.5 px-4 sm:px-0">
                <select
                  value={selectedWilaya}
                  onChange={(e) => setSelectedWilaya(e.target.value)}
                  className="rounded-xl border border-input bg-card px-3 py-1.5 text-xs font-semibold outline-none focus:border-primary"
                >
                  <option value="all">
                    {lang === "ar" ? "كل الولايات" : "Toutes les wilayas"}
                  </option>
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
                    className="press flex items-center gap-1 rounded-full bg-primary/10 px-2 py-1 text-xs font-bold text-primary"
                  >
                    <span>{selectedWilaya}</span>
                    <X className="h-3 w-3" />
                  </button>
                )}
              </div>
            )}
          </div>
        </div>

        {q.isLoading ? (
          <ListSkeleton count={3} />
        ) : rows.length === 0 ? (
          <EmptyState icon={Inbox} title={t("emptyRequests")} />
        ) : (
          <ul className="space-y-3">
            {rows.map((r) => {
              const price = getRequestPrice(r);
              const financial = calculateCommission(price);
              const showQr = activeQrRequestId === r.id;

              return (
                <li key={r.id} className="surface-card space-y-3 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <Link
                        to="/requests/$requestId"
                        params={{ requestId: r.id }}
                        className="line-clamp-1 text-sm font-bold text-foreground hover:text-primary transition-colors"
                      >
                        {r.listings?.title ?? "—"}
                      </Link>
                      <p className="line-clamp-1 text-xs text-muted-foreground">
                        {role === "hotel"
                          ? r.charity?.org_name || r.charity?.full_name
                          : r.hotel?.org_name || r.hotel?.full_name}
                      </p>
                      <p className="mt-1 text-[11px] text-muted-foreground">
                        {new Date(r.created_at).toLocaleDateString(
                          lang === "ar" ? "ar-DZ" : "fr-FR",
                        )}
                      </p>
                    </div>
                    <div className="flex flex-col items-end gap-1.5 shrink-0">
                      <StatusPill status={r.status} kind="request" />
                      <PaymentMethodDisplay methodId={r.payment_method} variant="pill" />
                      {role !== "charity" && (
                        <span
                          className={cn(
                            "rounded-full px-2 py-0.5 text-[10px] font-extrabold flex items-center gap-1",
                            r.caisse_status === "received"
                              ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                              : "bg-amber-500/10 text-amber-600 dark:text-amber-400",
                          )}
                        >
                          {r.caisse_status === "received"
                            ? lang === "ar"
                              ? "في الخزينة"
                              : "En caisse"
                            : lang === "ar"
                              ? "لم تصل الخزينة"
                              : "Non encassé"}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Financial Breakdown (Hidden from Charity) */}
                  {price > 0 && (
                    <div className="rounded-xl bg-muted/50 p-2.5 text-xs space-y-1">
                      <div className="flex justify-between font-semibold">
                        <span>{lang === "ar" ? "ثمن البيع:" : "Prix de vente :"}</span>
                        <span>{price.toLocaleString()} DZD</span>
                      </div>
                      {role !== "charity" && (
                        <div className="flex justify-between text-[11px] text-amber-600 dark:text-amber-400">
                          <span>
                            {lang === "ar" ? "عمولة لفتو (15%):" : "Comm. Lefto (15%) :"} -
                            {financial.commission.toLocaleString()} DZD
                          </span>
                          <span className="font-bold text-emerald-600">
                            {lang === "ar" ? "صافي الفندق (85%):" : "Net Hôtel (85%) :"}{" "}
                            {financial.hotelNet.toLocaleString()} DZD
                          </span>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Controls / QR Toggle / Cancel */}
                  <div className="flex flex-wrap items-center justify-between gap-2 border-t border-border pt-2 text-xs">
                    <Link
                      to="/requests/$requestId"
                      params={{ requestId: r.id }}
                      className="press font-bold text-primary hover:underline"
                    >
                      {lang === "ar" ? "تفاصيل الطلب ←" : "Voir détail →"}
                    </Link>

                    {role === "charity" && isRequestCancellableByCharity(r.status) && (
                      <button
                        type="button"
                        disabled={cancelRequest.isPending}
                        onClick={() =>
                          cancelRequest.mutate({
                            id: r.id,
                            hotelId: r.hotel_id,
                            title: r.listings?.title,
                          })
                        }
                        className="press ms-auto flex items-center gap-1 font-semibold text-destructive hover:underline"
                      >
                        <XCircle className="h-4 w-4" />
                        <span>{lang === "ar" ? "إلغاء الطلب" : "Annuler"}</span>
                      </button>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </PullToRefresh>
    </AppShell>
  );
}
