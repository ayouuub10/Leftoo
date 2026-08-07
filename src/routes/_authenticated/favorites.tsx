import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Heart } from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";
import { EmptyState } from "@/components/common/empty-state";
import { ListingCard } from "@/components/common/listing-card";
import { ListSkeleton } from "@/components/common/skeletons";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { useI18n } from "@/lib/i18n";
import { availableListingsQuery, favoritesQuery } from "@/lib/data";

export const Route = createFileRoute("/_authenticated/favorites")({
  head: () => ({
    meta: [
      { title: "Lefto — المفضلة | Favoris" },
      {
        name: "description",
        content: "Retrouvez les surplus alimentaires que vous avez enregistrés.",
      },
      { property: "og:title", content: "Lefto — Favoris" },
      { property: "og:description", content: "Vos offres enregistrées, prêtes à être demandées." },
    ],
  }),
  component: Favorites,
});

function Favorites() {
  const { t } = useI18n();
  const { user } = useAuth();
  const qc = useQueryClient();
  const favorites = useQuery({ ...favoritesQuery(user?.id ?? ""), enabled: !!user });
  const listings = useQuery(availableListingsQuery());

  const ids = new Set((favorites.data ?? []).map((f) => f.listing_id));
  const rows = (listings.data ?? []).filter((l) => ids.has(l.id));

  const remove = useMutation({
    mutationFn: async (listingId: string) => {
      const existing = (favorites.data ?? []).find((f) => f.listing_id === listingId);
      if (existing) await supabase.from("favorites").delete().eq("id", existing.id);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["favorites"] }),
  });

  return (
    <AppShell title={t("favorites")}>
      {favorites.isLoading || listings.isLoading ? (
        <ListSkeleton count={2} />
      ) : rows.length === 0 ? (
        <EmptyState icon={Heart} title={t("emptyFavorites")} body={t("emptyBrowseBody")} />
      ) : (
        <div className="space-y-3">
          {rows.map((l) => (
            <ListingCard
              key={l.id}
              listing={l}
              favorite
              onToggleFavorite={() => remove.mutate(l.id)}
            />
          ))}
        </div>
      )}
    </AppShell>
  );
}
