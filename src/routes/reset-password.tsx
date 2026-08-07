import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { z } from "zod";
import { Loader2 } from "lucide-react";
import { BrandMark } from "@/components/landing/brand-mark";
import { supabase } from "@/integrations/supabase/client";
import { useI18n } from "@/lib/i18n";

export const Route = createFileRoute("/reset-password")({
  head: () => ({
    meta: [
      { title: "Lefto — تعيين كلمة مرور جديدة" },
      {
        name: "description",
        content: "Définissez un nouveau mot de passe pour votre compte Lefto.",
      },
      { property: "og:title", content: "Lefto — Nouveau mot de passe" },
      {
        property: "og:description",
        content: "Réinitialisez votre mot de passe Lefto en toute sécurité.",
      },
    ],
  }),
  component: ResetPassword,
});

function ResetPassword() {
  const { t } = useI18n();
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const parsed = z.string().min(8).max(72).safeParse(password);
    if (!parsed.success) return toast.error(t("required"));
    setBusy(true);
    const { error } = await supabase.auth.updateUser({ password: parsed.data });
    setBusy(false);
    if (error) return toast.error(error.message);
    toast.success(t("saved"));
    navigate({ to: "/dashboard", replace: true });
  }

  return (
    <main className="soft-gradient flex min-h-screen items-center justify-center px-6">
      <form onSubmit={submit} className="surface-card rise-in w-full max-w-sm space-y-5 p-6">
        <span className="flex h-11 w-11 overflow-hidden rounded-2xl border border-border bg-card">
          <BrandMark className="h-full w-full" priority />
        </span>
        <h1 className="text-xl font-extrabold">{t("newPassword")}</h1>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          minLength={8}
          required
          autoComplete="new-password"
          placeholder={t("newPassword")}
          className="w-full rounded-2xl border border-input bg-card px-4 py-3.5 text-[15px] outline-none focus:border-primary focus:ring-4 focus:ring-primary/12"
        />
        <button
          type="submit"
          disabled={busy}
          className="press brand-gradient flex w-full items-center justify-center gap-2 rounded-2xl py-4 text-[15px] font-bold text-primary-foreground disabled:opacity-60"
        >
          {busy && <Loader2 className="h-4 w-4 animate-spin" />}
          {t("save")}
        </button>
      </form>
    </main>
  );
}
