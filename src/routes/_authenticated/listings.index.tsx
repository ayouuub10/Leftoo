import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Boxes, PlusCircle } from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";
import { ListingCard } from "@/components/common/listing-card";
import { ListSkeleton } from "@/components/common/skeletons";
import { EmptyState } from "@/components/common/empty-state";
import { PullToRefresh } from "@/components/common/pull-to-refresh";
import { useAuth } from "@/hooks/use-auth";
import { useI18n } from "@/lib/i18n";
import { hotelListingsQuery } from "@/lib/data";
import { LISTING_STATUS_KEY, type ListingStatus } from "@/lib/domain";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/listings/")({
  head: () => ({
    meta: [
      { title: "Lefto — منشوراتي | Mes annonces" },
      { name: "description", content: "Gérez les surplus alimentaires publiés par votre hôtel." },
      { property: "og:title", content: "Lefto — Mes annonces" },
      { property: "og:description", content: "Publiez, modifiez et suivez vos surplus." },
    ],
  }),
  component: MyListings,
});

const FILTERS: (ListingStatus | "all")[] = ["all", "available", "reserved", "collected", "expired"];

function MyListings() {
  const { t } = useI18n();
  const { user } = useAuth();
  const [filter, setFilter] = useState<ListingStatus | "all">("all");
  const q = useQuery({ ...hotelListingsQuery(user?.id ?? ""), enabled: !!user });

  const rows = (q.data ?? []).filter((l) => filter === "all" || l.status === filter);

  return (
    <AppShell title={t("myListings")}>
      <PullToRefresh onRefresh={() => q.refetch()}>
        <div className="-mx-4 mb-4 flex gap-2 overflow-x-auto px-4 pb-1">
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
              {f === "all" ? t("all") : t(LISTING_STATUS_KEY[f])}
            </button>
          ))}
        </div>

        {q.isLoading ? (
          <ListSkeleton />
        ) : rows.length === 0 ? (
          <EmptyState
            icon={Boxes}
            title={t("emptyListings")}
            body={t("emptyListingsBody")}
            action={
              <Link
                to="/listings/new"
                className="press brand-gradient inline-flex items-center gap-2 rounded-2xl px-5 py-3 text-sm font-bold text-primary-foreground"
              >
                <PlusCircle className="h-4 w-4" />
                {t("newSurplus")}
              </Link>
            }
          />
        ) : (
          <div className="space-y-3">
            {rows.map((l) => (
              <ListingCard key={l.id} listing={{ ...l, profiles: null }} />
            ))}
          </div>
        )}
      </PullToRefresh>
    </AppShell>
  );
}
