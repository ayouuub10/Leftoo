import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { z } from "zod";
import { toast } from "sonner";
import { Building2, HeartHandshake, Loader2, Globe } from "lucide-react";
import { BrandMark } from "@/components/landing/brand-mark";
import { supabase } from "@/integrations/supabase/client";
import { useI18n } from "@/lib/i18n";
import { useAuth } from "@/hooks/use-auth";
import { WILAYAS } from "@/lib/domain";
import { cn } from "@/lib/utils";

const searchSchema = z.object({
  mode: z.enum(["signin", "signup", "forgot"]).catch("signin"),
});

export const Route = createFileRoute("/auth")({
  validateSearch: searchSchema,
  head: () => ({
    meta: [
      { title: "Lefto — تسجيل الدخول | Connexion" },
      {
        name: "description",
        content: "Connectez-vous à Lefto en tant qu'hôtel ou association pour partager des repas.",
      },
      { property: "og:title", content: "Lefto — Connexion" },
      { property: "og:description", content: "Hôtels et associations, rejoignez Lefto." },
    ],
  }),
  component: AuthPage,
});

const credentials = z.object({
  email: z.string().trim().email().max(255),
  password: z.string().min(8).max(72),
});

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-semibold text-muted-foreground">{label}</span>
      {children}
    </label>
  );
}

const inputClass =
  "w-full rounded-2xl border border-input bg-card px-4 py-3.5 text-[15px] outline-none transition-shadow placeholder:text-muted-foreground/70 focus:border-primary focus:ring-4 focus:ring-primary/12";

function AuthPage() {
  const { mode } = Route.useSearch();
  const navigate = useNavigate();
  const { t, lang, setLang } = useI18n();
  const { user, loading: authLoading } = useAuth();

  const [role, setRole] = useState<"hotel" | "charity">("hotel");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [orgName, setOrgName] = useState("");
  const [phone, setPhone] = useState("");
  const [wilaya, setWilaya] = useState(WILAYAS[15]); // 16 - Alger
  const [address, setAddress] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!authLoading && user) navigate({ to: "/dashboard", replace: true });
  }, [authLoading, user, navigate]);

  async function handleSignIn(e: React.FormEvent) {
    e.preventDefault();
    const parsed = credentials.safeParse({ email, password });
    if (!parsed.success) return toast.error(t("required"));
    setBusy(true);
    const { error } = await supabase.auth.signInWithPassword(parsed.data);
    setBusy(false);
    if (error) {
      let msg = error.message;
      if (msg.includes("Invalid login credentials")) {
        msg =
          lang === "ar"
            ? "بيانات الدخول غير صحيحة. يرجى التأكد من البريد وكلمة المرور، أو اضغط على 'إنشاء حساب' إذا لم تسجل بعد."
            : "Identifiants incorrects. Vérifiez votre email et mot de passe ou créez un compte.";
      } else if (msg.includes("Email not confirmed")) {
        msg =
          lang === "ar"
            ? "يرجى تأكيد بريدك الإلكتروني عبر الرابط المبعوث لك قبل تسجيل الدخول."
            : "Veuillez confirmer votre email avant de vous connecter.";
      }
      return toast.error(msg);
    }
    navigate({ to: "/dashboard", replace: true });
  }

  async function handleSignUp(e: React.FormEvent) {
    e.preventDefault();
    const parsed = credentials.safeParse({ email, password });
    if (
      !parsed.success ||
      !firstName.trim() ||
      !lastName.trim() ||
      !orgName.trim() ||
      !phone.trim() ||
      !address.trim() ||
      !wilaya.trim()
    ) {
      return toast.error(
        lang === "ar"
          ? "جميع الحقول (الاسم، اللقب، اسم المؤسسة، الهاتف، الولاية، العنوان، البريد، كلمة المرور) إجبارية!"
          : "Tous les champs (Prénom, Nom, Organisation, Téléphone, Wilaya, Adresse, Email, Mot de passe) sont obligatoires !",
      );
    }

    const compiledFullName = `${firstName.trim()} ${lastName.trim()}`;

    setBusy(true);
    const { data, error } = await supabase.auth.signUp({
      ...parsed.data,
      options: {
        emailRedirectTo: window.location.origin,
        data: {
          role,
          first_name: firstName.trim().slice(0, 80),
          last_name: lastName.trim().slice(0, 80),
          full_name: compiledFullName.slice(0, 160),
          org_name: orgName.trim().slice(0, 160),
          phone: phone.trim().slice(0, 40),
          wilaya,
          address: address.trim().slice(0, 240),
        },
      },
    });
    setBusy(false);
    if (error) return toast.error(error.message);
    if (data.session) {
      toast.success(lang === "ar" ? "تم إنشاء الحساب بنجاح!" : "Compte créé avec succès !");
      navigate({ to: "/dashboard", replace: true });
    } else {
      toast.info(
        lang === "ar"
          ? "تم إنشاء الحساب! إذا طلبت المنصة تأكيد البريد، تحقق من صندوق الوارد الخاص بك ثم سجل الدخول."
          : "Compte créé ! Veuillez vérifier votre boîte mail si la confirmation est requise.",
      );
      navigate({ to: "/auth", search: { mode: "signin" }, replace: true });
    }
  }

  async function handleForgot(e: React.FormEvent) {
    e.preventDefault();
    const parsed = z.string().trim().email().safeParse(email);
    if (!parsed.success) return toast.error(t("required"));
    setBusy(true);
    const { error } = await supabase.auth.resetPasswordForEmail(parsed.data, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    setBusy(false);
    if (error) return toast.error(error.message);
    toast.success(t("sendResetLink"));
  }

  return (
    <main className="soft-gradient min-h-screen">
      <div className="mx-auto w-full max-w-lg px-6 pb-16 pt-8">
        <div className="mb-8 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <span className="flex h-9 w-9 overflow-hidden rounded-2xl border border-border bg-card">
              <BrandMark className="h-full w-full" priority />
            </span>
            <span className="text-lg font-extrabold tracking-tight">Lefto</span>
          </Link>
          <button
            type="button"
            onClick={() => setLang(lang === "ar" ? "fr" : "ar")}
            className="press flex items-center gap-1.5 rounded-full border border-border bg-card px-3 py-1.5 text-xs font-semibold"
          >
            <Globe className="h-3.5 w-3.5" />
            {lang === "ar" ? "Français" : "العربية"}
          </button>
        </div>

        {mode === "forgot" ? (
          <form onSubmit={handleForgot} className="rise-in space-y-5">
            <div>
              <h1 className="text-2xl font-extrabold">{t("resetPassword")}</h1>
              <p className="mt-1 text-sm text-muted-foreground">{t("tagline")}</p>
            </div>
            <Field label={t("email")}>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={inputClass}
                autoComplete="email"
                required
              />
            </Field>
            <SubmitButton busy={busy} label={t("sendResetLink")} />
            <Link
              to="/auth"
              search={{ mode: "signin" }}
              className="block text-center text-sm font-semibold text-primary"
            >
              {t("backToSignIn")}
            </Link>
          </form>
        ) : mode === "signup" ? (
          <form onSubmit={handleSignUp} className="rise-in space-y-5">
            <div>
              <h1 className="text-2xl font-extrabold">{t("signUp")}</h1>
              <p className="mt-1 text-sm text-muted-foreground">{t("chooseRole")}</p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <RoleCard
                active={role === "hotel"}
                icon={Building2}
                title={t("hotel")}
                desc={t("hotelRoleDesc")}
                onClick={() => setRole("hotel")}
              />
              <RoleCard
                active={role === "charity"}
                icon={HeartHandshake}
                title={t("charity")}
                desc={t("charityRoleDesc")}
                onClick={() => setRole("charity")}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <Field label={t("firstName")}>
                <input
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  className={inputClass}
                  maxLength={80}
                  required
                />
              </Field>
              <Field label={t("lastName")}>
                <input
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  className={inputClass}
                  maxLength={80}
                  required
                />
              </Field>
            </div>

            <Field label={t("orgName")}>
              <input
                value={orgName}
                onChange={(e) => setOrgName(e.target.value)}
                className={inputClass}
                maxLength={160}
                required
              />
            </Field>

            <div className="grid grid-cols-2 gap-3">
              <Field label={t("phone")}>
                <input
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className={inputClass}
                  inputMode="tel"
                  maxLength={40}
                  required
                />
              </Field>
              <Field label={t("wilaya")}>
                <select
                  value={wilaya}
                  onChange={(e) => setWilaya(e.target.value)}
                  className={inputClass}
                  required
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
                className={inputClass}
                maxLength={240}
                placeholder={
                  lang === "ar" ? "العنوان الكامل (إجباري)" : "Adresse complète (Obligatoire)"
                }
                required
              />
            </Field>
            <Field label={t("email")}>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={inputClass}
                autoComplete="email"
                required
              />
            </Field>
            <Field label={t("password")}>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className={inputClass}
                autoComplete="new-password"
                minLength={8}
                required
              />
            </Field>

            <SubmitButton busy={busy} label={t("signUp")} />
            <p className="text-center text-sm text-muted-foreground">
              {t("alreadyHaveAccount")}{" "}
              <Link to="/auth" search={{ mode: "signin" }} className="font-semibold text-primary">
                {t("signIn")}
              </Link>
            </p>
          </form>
        ) : (
          <form onSubmit={handleSignIn} className="rise-in space-y-5">
            <div>
              <h1 className="text-2xl font-extrabold">{t("signIn")}</h1>
              <p className="mt-1 text-sm text-muted-foreground">{t("tagline")}</p>
            </div>
            <Field label={t("email")}>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={inputClass}
                autoComplete="email"
                required
              />
            </Field>
            <Field label={t("password")}>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className={inputClass}
                autoComplete="current-password"
                required
              />
            </Field>
            <div className="flex justify-end">
              <Link
                to="/auth"
                search={{ mode: "forgot" }}
                className="text-sm font-semibold text-primary"
              >
                {t("forgotPassword")}
              </Link>
            </div>
            <SubmitButton busy={busy} label={t("signIn")} />
            <p className="text-center text-sm text-muted-foreground">
              {t("noAccount")}{" "}
              <Link to="/auth" search={{ mode: "signup" }} className="font-semibold text-primary">
                {t("signUp")}
              </Link>
            </p>
          </form>
        )}
      </div>
    </main>
  );
}

function SubmitButton({ busy, label }: { busy: boolean; label: string }) {
  return (
    <button
      type="submit"
      disabled={busy}
      className="press brand-gradient shadow-raised flex w-full items-center justify-center gap-2 rounded-2xl py-4 text-[15px] font-bold text-primary-foreground disabled:opacity-60"
    >
      {busy && <Loader2 className="h-4 w-4 animate-spin" />}
      {label}
    </button>
  );
}

function RoleCard({
  active,
  icon: Icon,
  title,
  desc,
  onClick,
}: {
  active: boolean;
  icon: typeof Building2;
  title: string;
  desc: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "press rounded-2xl border p-4 text-start transition-colors",
        active ? "border-primary bg-primary-soft" : "border-border bg-card hover:border-primary/40",
      )}
    >
      <Icon className={cn("mb-2 h-6 w-6", active ? "text-primary" : "text-muted-foreground")} />
      <p className="text-sm font-bold">{title}</p>
      <p className="mt-0.5 text-[11px] leading-snug text-muted-foreground">{desc}</p>
    </button>
  );
}
