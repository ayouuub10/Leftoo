import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { Bell, CheckCheck, ExternalLink } from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";
import { EmptyState } from "@/components/common/empty-state";
import { ListSkeleton } from "@/components/common/skeletons";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { useI18n } from "@/lib/i18n";
import { notificationsQuery } from "@/lib/data";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/notifications")({
  head: () => ({
    meta: [
      { title: "Lefto — الإشعارات | Notifications" },
      {
        name: "description",
        content: "Recevez en temps réel les demandes, acceptations et collectes.",
      },
      { property: "og:title", content: "Lefto — Notifications" },
      { property: "og:description", content: "Toute votre activité Lefto en temps réel." },
    ],
  }),
  component: Notifications,
});

function Notifications() {
  const { t, lang } = useI18n();
  const { user, role } = useAuth();
  const qc = useQueryClient();
  const q = useQuery({ ...notificationsQuery(user?.id ?? ""), enabled: !!user });

  useEffect(() => {
    if (!user) return;
    const channel = supabase
      .channel("notifications-feed")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "notifications", filter: `user_id=eq.${user.id}` },
        () => qc.invalidateQueries({ queryKey: ["notifications"] }),
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, qc]);

  const markAll = useMutation({
    mutationFn: async () => {
      if (!user) return;
      await supabase
        .from("notifications")
        .update({ is_read: true })
        .eq("user_id", user.id)
        .eq("is_read", false);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["notifications"] }),
  });

  const rawRows = q.data ?? [];
  const rows = rawRows.filter((n) => {
    if (
      role !== "admin" &&
      (n.kind === "profile_update_request" ||
        n.title?.includes("طلب تعديل بيانات") ||
        n.title?.includes("Demande de modification"))
    ) {
      return false;
    }
    return true;
  });

  return (
    <AppShell
      title={t("notifications")}
      action={
        rows.some((n) => !n.is_read) ? (
          <button
            type="button"
            onClick={() => markAll.mutate()}
            aria-label={t("markAllRead")}
            className="press flex h-9 w-9 items-center justify-center rounded-full text-muted-foreground hover:bg-muted"
          >
            <CheckCheck className="h-4 w-4" />
          </button>
        ) : undefined
      }
    >
      {q.isLoading ? (
        <ListSkeleton count={3} />
      ) : rows.length === 0 ? (
        <EmptyState icon={Bell} title={t("emptyNotifications")} />
      ) : (
        <ul className="space-y-2">
          {rows.map((n) => {
            const content = (
              <>
                <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-card text-primary">
                  <Bell className="h-4 w-4" />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-sm font-bold">{n.title}</p>
                    {n.link && (
                      <ExternalLink className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                    )}
                  </div>
                  {n.body && (
                    <p className="mt-0.5 whitespace-pre-line text-xs text-muted-foreground">
                      {n.body}
                    </p>
                  )}
                  <p className="mt-1 text-[11px] text-muted-foreground">
                    {new Date(n.created_at).toLocaleString(lang === "ar" ? "ar-DZ" : "fr-FR")}
                  </p>
                </div>
              </>
            );

            const cardClasses = cn(
              "surface-card flex gap-3 p-4 transition-colors",
              !n.is_read && "border-primary/40 bg-primary-soft",
              n.link && "hover:border-primary/60 cursor-pointer",
            );

            return (
              <li key={n.id}>
                {n.link ? (
                  <Link to={n.link} className={cardClasses}>
                    {content}
                  </Link>
                ) : (
                  <div className={cardClasses}>{content}</div>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </AppShell>
  );
}
