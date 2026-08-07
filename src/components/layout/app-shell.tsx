import type { ReactNode } from "react";
import { Ban } from "lucide-react";
import { AppHeader } from "./app-header";
import { BottomNav } from "./bottom-nav";
import { useAuth } from "@/hooks/use-auth";
import { useI18n } from "@/lib/i18n";
import { supabase } from "@/integrations/supabase/client";

export function AppShell({
  title,
  subtitle,
  back,
  action,
  children,
}: {
  title: string;
  subtitle?: string;
  back?: boolean;
  action?: ReactNode;
  children: ReactNode;
}) {
  const { profile, role } = useAuth();
  const { lang } = useI18n();

  if (role !== "admin" && profile?.is_suspended) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6 text-center">
        <div className="max-w-md w-full space-y-5 surface-card p-6 sm:p-8 rounded-3xl border border-destructive/30 shadow-xl">
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-destructive/10 text-destructive animate-pulse">
            <Ban className="h-10 w-10" />
          </div>
          <div className="space-y-2">
            <h2 className="text-xl font-black text-foreground">
              {lang === "ar" ? "حسابك معلق حالياً" : "Compte actuellement suspendu"}
            </h2>
            <p className="text-xs text-muted-foreground leading-relaxed">
              {lang === "ar"
                ? "تم تعليق حساب هذه المؤسسة من قبل إدارة المنصة بسبب عدم استيفاء الشروط أو بطلب إداري. تم إيقاف جميع صلاحيات النشر والطلبات والتفاعل."
                : "Ce compte a été suspendu par l'administration. Toutes les fonctionnalités de publication et de réservation sont temporairement désactivées."}
            </p>
          </div>
          <div className="rounded-2xl bg-muted/60 p-3.5 text-start text-xs space-y-1">
            <p className="font-bold text-foreground">
              {lang === "ar" ? "المؤسسة:" : "Organisation:"}{" "}
              {profile.org_name || profile.full_name || "—"}
            </p>
            <p className="text-muted-foreground">
              {lang === "ar" ? "الولاية:" : "Wilaya:"} {profile.wilaya || "—"}
            </p>
          </div>
          <button
            type="button"
            onClick={() => supabase.auth.signOut()}
            className="press w-full rounded-2xl bg-destructive py-3.5 text-xs font-bold text-destructive-foreground shadow-md hover:opacity-90"
          >
            {lang === "ar" ? "تسجيل الخروج" : "Se déconnecter"}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-24">
      <AppHeader title={title} subtitle={subtitle} back={back} action={action} />
      <main className="mx-auto w-full max-w-lg px-4 py-4">{children}</main>
      <BottomNav />
    </div>
  );
}
