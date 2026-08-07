import { useEffect } from "react";
import { Link, useRouter } from "@tanstack/react-router";
import { Bell, ChevronLeft, ChevronRight, Globe, Moon, Sun } from "lucide-react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useI18n } from "@/lib/i18n";
import { useAuth } from "@/hooks/use-auth";
import { notificationsQuery } from "@/lib/data";
import { useTheme } from "@/hooks/use-theme";
import { cn } from "@/lib/utils";

export function AppHeader({
  title,
  subtitle,
  back,
  action,
}: {
  title: string;
  subtitle?: string;
  back?: boolean;
  action?: React.ReactNode;
}) {
  const { t, lang, setLang, dir } = useI18n();
  const { user, role } = useAuth();
  const { theme, toggle } = useTheme();
  const router = useRouter();
  const qc = useQueryClient();

  const { data: notifications } = useQuery({
    ...notificationsQuery(user?.id ?? ""),
    enabled: !!user,
  });

  useEffect(() => {
    if (!user?.id) return;
    const channel = supabase
      .channel(`user-notifications-${user.id}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "notifications",
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          const newNotif = payload.new as { title?: string; body?: string; kind?: string };
          if (
            role !== "admin" &&
            (newNotif.kind === "profile_update_request" ||
              newNotif.title?.includes("طلب تعديل بيانات") ||
              newNotif.title?.includes("Demande de modification"))
          ) {
            return;
          }
          toast.info(newNotif.title || "إشعار جديد", {
            description: newNotif.body,
          });
          qc.invalidateQueries({ queryKey: ["notifications", user.id] });
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id, role, qc]);

  const filteredNotifs = (notifications ?? []).filter((n) => {
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
  const unread = filteredNotifs.filter((n) => !n.is_read).length;
  const BackIcon = dir === "rtl" ? ChevronRight : ChevronLeft;

  return (
    <header className="sticky top-0 z-30 border-b border-border/70 bg-background/80 backdrop-blur-xl">
      <div className="mx-auto flex max-w-lg items-center gap-2 px-4 py-3">
        {back && (
          <button
            type="button"
            onClick={() => router.history.back()}
            aria-label={t("backToSignIn")}
            className="press -ms-2 flex h-9 w-9 items-center justify-center rounded-full text-foreground hover:bg-muted"
          >
            <BackIcon className="h-5 w-5" />
          </button>
        )}
        <div className="min-w-0 flex-1">
          <h1 className="truncate text-lg font-bold leading-tight">{title}</h1>
          {subtitle && <p className="truncate text-xs text-muted-foreground">{subtitle}</p>}
        </div>
        {action}
        <button
          type="button"
          onClick={() => setLang(lang === "ar" ? "fr" : "ar")}
          aria-label={t("language")}
          className="press flex h-9 items-center gap-1 rounded-full px-2 text-xs font-semibold text-muted-foreground hover:bg-muted"
        >
          <Globe className="h-4 w-4" />
          {lang === "ar" ? "FR" : "ع"}
        </button>
        <button
          type="button"
          onClick={toggle}
          aria-label={t("theme")}
          className="press flex h-9 w-9 items-center justify-center rounded-full text-muted-foreground hover:bg-muted"
        >
          {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
        </button>
        <Link
          to="/notifications"
          aria-label={t("notifications")}
          className="press relative flex h-9 w-9 items-center justify-center rounded-full text-muted-foreground hover:bg-muted"
        >
          <Bell className="h-4 w-4" />
          {unread > 0 && (
            <span
              className={cn(
                "absolute top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-destructive px-1 text-[9px] font-bold text-destructive-foreground",
                dir === "rtl" ? "start-1.5" : "end-1.5",
              )}
            >
              {unread > 9 ? "9+" : unread}
            </span>
          )}
        </Link>
      </div>
    </header>
  );
}
