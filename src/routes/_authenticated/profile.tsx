import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { BadgeCheck, Globe, LogOut, Moon, Sun, Loader2, Send, X } from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { useI18n } from "@/lib/i18n";
import { useTheme } from "@/hooks/use-theme";
import { WILAYAS } from "@/lib/domain";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/profile")({
  head: () => ({
    meta: [
      { title: "Lefto — الملف الشخصي | Profil" },
      { name: "description", content: "Gérez les informations de votre organisation sur Lefto." },
      { property: "og:title", content: "Lefto — Profil" },
      { property: "og:description", content: "Coordonnées, wilaya, langue et thème." },
    ],
  }),
  component: ProfilePage,
});

const inputClass =
  "w-full rounded-2xl border border-input bg-card px-4 py-3.5 text-[15px] outline-none focus:border-primary focus:ring-4 focus:ring-primary/12";

function ProfilePage() {
  const { t, lang, setLang } = useI18n();
  const { theme, toggle } = useTheme();
  const { user, profile, role, refresh } = useAuth();
  const navigate = useNavigate();
  const qc = useQueryClient();

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [orgName, setOrgName] = useState("");
  const [phone, setPhone] = useState("");
  const [wilaya, setWilaya] = useState(WILAYAS[15]);
  const [address, setAddress] = useState("");
  const [busy, setBusy] = useState(false);

  // Profile modification request state
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [requestDetails, setRequestDetails] = useState("");
  const [isSubmittingRequest, setIsSubmittingRequest] = useState(false);

  useEffect(() => {
    if (!profile) return;
    setFirstName(profile.first_name ?? profile.full_name?.split(" ")[0] ?? "");
    setLastName(profile.last_name ?? profile.full_name?.split(" ").slice(1).join(" ") ?? "");
    setOrgName(profile.org_name ?? "");
    setPhone(profile.phone ?? "");
    setWilaya(profile.wilaya ?? WILAYAS[15]);
    setAddress(profile.address ?? "");
  }, [profile]);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    if (!user) return;

    if (!wilaya || !WILAYAS.includes(wilaya)) {
      return toast.error(
        lang === "ar"
          ? "يرجى اختيار ولاية صالحة من القائمة"
          : "Veuillez sélectionner une wilaya valide dans la liste",
      );
    }

    setBusy(true);
    const compiledFullName = `${firstName.trim()} ${lastName.trim()}`;
    const { error } = await supabase
      .from("profiles")
      .update({
        first_name: firstName.trim().slice(0, 80),
        last_name: lastName.trim().slice(0, 80),
        full_name: compiledFullName.slice(0, 160),
        org_name: orgName.trim().slice(0, 160),
        phone: phone.trim().slice(0, 40),
        wilaya,
        address: address.trim().slice(0, 240) || null,
      })
      .eq("id", user.id);
    setBusy(false);

    if (error) return toast.error(error.message);

    await refresh();
    await qc.invalidateQueries({ queryKey: ["profiles"] });
    toast.success(
      lang === "ar"
        ? "تم تحديث تفاصيل الحساب والولاية بنجاح"
        : "Coordonnées et wilaya mises à jour avec succès",
    );
  }

  async function signOut() {
    await qc.cancelQueries();
    qc.clear();
    await supabase.auth.signOut();
    navigate({ to: "/auth", search: { mode: "signin" as const }, replace: true });
  }

  const roleLabel = role === "hotel" ? t("hotel") : role === "admin" ? t("admin") : t("charity");
  const isReadOnly = role !== "admin";

  async function submitAdminUpdateRequest(e: React.FormEvent) {
    e.preventDefault();
    if (!user) return;

    const notes = requestDetails.trim();
    if (!notes) {
      return toast.error(
        lang === "ar"
          ? "يرجى تدوين التغييرات المطلوبة للإدارة"
          : "Veuillez préciser les modifications souhaitées.",
      );
    }

    setIsSubmittingRequest(true);
    try {
      // 1. Fetch admin user IDs strictly from user_roles
      const { data: adminRoles } = await supabase
        .from("user_roles")
        .select("user_id")
        .eq("role", "admin");

      const adminIds = Array.from(new Set((adminRoles ?? []).map((r) => r.user_id)));

      const senderName =
        orgName || `${firstName} ${lastName}`.trim() || profile?.full_name || "مستخدم";

      if (adminIds.length > 0) {
        const notifs = adminIds.map((adminId) => ({
          user_id: adminId,
          title:
            lang === "ar"
              ? `طلب تعديل بيانات: ${senderName}`
              : `Demande de modification : ${senderName}`,
          body:
            lang === "ar"
              ? `طلب جديد لتعديل بيانات الحساب (${senderName}):\n"${notes}"\n\nالهاتف الحالي: ${phone || "غير محدد"} | الولاية: ${wilaya}`
              : `Nouvelle demande pour (${senderName}) :\n"${notes}"\n\nTél: ${phone || "N/A"} | Wilaya: ${wilaya}`,
          kind: "profile_update_request",
          link: `/admin/organizations?search=${encodeURIComponent(senderName)}`,
        }));

        const { error: notifErr } = await supabase.from("notifications").insert(notifs);
        if (notifErr) throw notifErr;
      }

      toast.success(
        lang === "ar"
          ? "تم إرسال طلب تعديل البيانات للإدارة بنجاح. سيتم مراجعته والتواصل معك قريباً."
          : "Demande de modification envoyée avec succès à l'administration.",
      );
      setShowRequestModal(false);
      setRequestDetails("");
    } catch (err) {
      const msg = err instanceof Error ? err.message : null;
      toast.error(msg || (lang === "ar" ? "حدث خطأ أثناء إرسال الطلب" : "Erreur lors de l'envoi"));
    } finally {
      setIsSubmittingRequest(false);
    }
  }

  return (
    <AppShell title={t("profile")}>
      <div className="space-y-5">
        <div className="surface-card flex items-center gap-4 p-4">
          <span className="brand-gradient flex h-14 w-14 items-center justify-center rounded-2xl text-xl font-extrabold text-primary-foreground">
            {(orgName || firstName || "L").slice(0, 1).toUpperCase()}
          </span>
          <div className="min-w-0">
            <p className="flex items-center gap-1.5 text-base font-bold">
              <span className="line-clamp-1">{orgName || `${firstName} ${lastName}`}</span>
              {profile?.is_verified && <BadgeCheck className="h-4 w-4 shrink-0 text-primary" />}
            </p>
            <p className="text-xs text-muted-foreground">
              {roleLabel} · {profile?.is_verified ? t("verified") : t("unverified")}
            </p>
          </div>
        </div>

        {isReadOnly && (
          <div className="space-y-2 rounded-2xl border border-amber-500/30 bg-amber-500/10 p-4 text-xs font-semibold text-amber-800 dark:text-amber-300">
            <p>
              {lang === "ar"
                ? "بيانات الهوية (الاسم، اسم المؤسسة، الولاية، الهاتف، العنوان) للقراءة فقط ولا يمكن تعديلها. لتغيير أي معلومة، يرجى تقديم طلب للإدارة."
                : "Les données d'identité (Nom, Organisation, Wilaya, Téléphone, Adresse) sont en lecture seule. Pour toute modification, soumettez une demande à l'administration."}
            </p>
            <button
              type="button"
              onClick={() => setShowRequestModal(true)}
              className="press brand-gradient rounded-xl px-3.5 py-2 text-xs font-bold text-white shadow-sm"
            >
              {lang === "ar"
                ? "طلب تعديل البيانات للإدارة"
                : "Demander une modification à l'administration"}
            </button>
          </div>
        )}

        <form onSubmit={save} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <Field label={t("firstName")}>
              <input
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                maxLength={80}
                disabled={isReadOnly}
                className={cn(inputClass, isReadOnly && "opacity-75 cursor-not-allowed")}
              />
            </Field>
            <Field label={t("lastName")}>
              <input
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                maxLength={80}
                disabled={isReadOnly}
                className={cn(inputClass, isReadOnly && "opacity-75 cursor-not-allowed")}
              />
            </Field>
          </div>

          <Field label={t("orgName")}>
            <input
              value={orgName}
              onChange={(e) => setOrgName(e.target.value)}
              maxLength={160}
              disabled={isReadOnly}
              className={cn(inputClass, isReadOnly && "opacity-75 cursor-not-allowed")}
            />
          </Field>

          <div className="grid grid-cols-2 gap-3">
            <Field label={t("phone")}>
              <input
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                maxLength={40}
                inputMode="tel"
                disabled={isReadOnly}
                className={cn(inputClass, isReadOnly && "opacity-75 cursor-not-allowed")}
              />
            </Field>
            <Field label={t("wilaya")}>
              <select
                value={wilaya}
                onChange={(e) => setWilaya(e.target.value)}
                disabled={isReadOnly}
                className={cn(inputClass, isReadOnly && "opacity-75 cursor-not-allowed")}
              >
                {WILAYAS.map((w) => (
                  <option key={w} value={w}>
                    {w}
                  </option>
                ))}
              </select>
            </Field>
          </div>

          <Field label={t("address")}>
            <input
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              maxLength={240}
              disabled={isReadOnly}
              className={cn(inputClass, isReadOnly && "opacity-75 cursor-not-allowed")}
            />
          </Field>

          {!isReadOnly && (
            <button
              type="submit"
              disabled={busy}
              className="press brand-gradient flex w-full items-center justify-center gap-2 rounded-2xl py-4 text-[15px] font-bold text-primary-foreground disabled:opacity-60"
            >
              {busy && <Loader2 className="h-4 w-4 animate-spin" />}
              {t("save")}
            </button>
          )}
        </form>

        <div className="surface-card divide-y divide-border">
          <button
            type="button"
            onClick={() => setLang(lang === "ar" ? "fr" : "ar")}
            className="press flex w-full items-center gap-3 p-4 text-sm font-semibold"
          >
            <Globe className="h-4 w-4 text-primary" />
            <span className="flex-1 text-start">{t("language")}</span>
            <span className="text-xs text-muted-foreground">
              {lang === "ar" ? "العربية" : "Français"}
            </span>
          </button>
          <button
            type="button"
            onClick={toggle}
            className="press flex w-full items-center gap-3 p-4 text-sm font-semibold"
          >
            {theme === "dark" ? (
              <Moon className="h-4 w-4 text-primary" />
            ) : (
              <Sun className="h-4 w-4 text-primary" />
            )}
            <span className="flex-1 text-start">{t("theme")}</span>
            <span className="text-xs text-muted-foreground">
              {theme === "dark" ? t("dark") : t("light")}
            </span>
          </button>
        </div>

        <button
          type="button"
          onClick={signOut}
          className="press flex w-full items-center justify-center gap-2 rounded-2xl border border-destructive/30 py-3.5 text-sm font-bold text-destructive"
        >
          <LogOut className="h-4 w-4" />
          {t("signOut")}
        </button>
      </div>

      {/* Profile Modification Request Modal */}
      {showRequestModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md space-y-4 rounded-3xl bg-card p-5 shadow-2xl border border-border animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <h3 className="text-base font-bold text-foreground">
                {lang === "ar" ? "طلب تعديل البيانات للإدارة" : "Demande de modification du profil"}
              </h3>
              <button
                type="button"
                onClick={() => setShowRequestModal(false)}
                className="press rounded-full p-1 text-muted-foreground hover:bg-muted"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <p className="text-xs text-muted-foreground leading-relaxed">
              {lang === "ar"
                ? "يرجى تحديد البيانات المراد تعديلها (الاسم، اسم المؤسسة، الهاتف، الولاية، العنوان) والتفاصيل المطلوبة ليصل الطلب مباشرة إلى إشعار الإدارة."
                : "Précisez les modifications à apporter (Nom, Organisation, Téléphone, Wilaya, Adresse) afin qu'elles soient transmises à l'administration."}
            </p>

            <form onSubmit={submitAdminUpdateRequest} className="space-y-4">
              <div>
                <label className="mb-1.5 block text-xs font-semibold text-muted-foreground">
                  {lang === "ar" ? "تفاصيل التعديلات المطلوبة" : "Détails des modifications"}
                </label>
                <textarea
                  rows={4}
                  required
                  value={requestDetails}
                  onChange={(e) => setRequestDetails(e.target.value)}
                  placeholder={
                    role === "charity"
                      ? lang === "ar"
                        ? "مثال: تغيير اسم الجمعية إلى 'جمعية الأمل والخير'، وتحديث رقم الهاتف أو العنوان..."
                        : "Ex: Modifier le nom de l'association en 'Association Al-Amal', mettre à jour le téléphone..."
                      : role === "hotel"
                        ? lang === "ar"
                          ? "مثال: تغيير اسم الفندق إلى 'فندق السفير'، وتحديث رقم الهاتف إلى 0661234567..."
                          : "Ex: Modifier le nom de l'hôtel en 'Hôtel Le Saphir' et le numéro de téléphone..."
                        : lang === "ar"
                          ? "مثال: تغيير اسم المؤسسة، تحديث رقم الهاتف، أو تعديل العنوان..."
                          : "Ex: Modifier le nom de l'organisation, le numéro de téléphone ou l'adresse..."
                  }
                  className="w-full rounded-2xl border border-input bg-card p-3.5 text-xs outline-none focus:border-primary focus:ring-4 focus:ring-primary/12 resize-none"
                />
              </div>

              <div className="flex items-center gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowRequestModal(false)}
                  className="press flex-1 rounded-2xl border border-input py-3 text-xs font-bold text-muted-foreground hover:bg-muted"
                >
                  {lang === "ar" ? "إلغاء" : "Annuler"}
                </button>

                <button
                  type="submit"
                  disabled={isSubmittingRequest}
                  className="press brand-gradient flex-1 flex items-center justify-center gap-2 rounded-2xl py-3 text-xs font-bold text-white shadow-sm disabled:opacity-60"
                >
                  {isSubmittingRequest ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Send className="h-3.5 w-3.5" />
                  )}
                  <span>{lang === "ar" ? "إرسال الطلب للإدارة" : "Envoyer la demande"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AppShell>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-semibold text-muted-foreground">{label}</span>
      {children}
    </label>
  );
}
