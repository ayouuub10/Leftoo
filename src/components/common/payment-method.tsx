import { Banknote, CreditCard, Wallet, Info, Lock } from "lucide-react";
import { toast } from "sonner";
import { useI18n } from "@/lib/i18n";
import { PAYMENT_METHODS, getPaymentMethodMeta, type PaymentMethodId } from "@/lib/domain";
import { cn } from "@/lib/utils";

interface PaymentMethodSelectorProps {
  value: PaymentMethodId;
  onChange: (method: PaymentMethodId) => void;
  disabled?: boolean;
}

export function PaymentMethodSelector({
  value,
  onChange,
  disabled = false,
}: PaymentMethodSelectorProps) {
  const { lang } = useI18n();

  const handleDisabledClick = (methodName: string) => {
    toast.info(
      lang === "ar"
        ? `طريقة الدفع (${methodName}) غير متاحة حالياً. ستكون متوفرة في التحديث القادم!`
        : `Le mode de paiement (${methodName}) n'est pas encore disponible. Il arrive dans la prochaine mise à jour !`,
    );
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <label className="text-xs font-bold text-foreground flex items-center gap-1.5">
          <Banknote className="h-4 w-4 text-primary" />
          <span>{lang === "ar" ? "اختيار طريقة الدفع:" : "Mode de paiement :"}</span>
        </label>
        <span className="text-[11px] text-muted-foreground font-semibold">
          {lang === "ar" ? "(للمشتري — الجمعية)" : "(Acheteur — Association)"}
        </span>
      </div>

      <div className="grid grid-cols-1 gap-2.5">
        {PAYMENT_METHODS.map((m) => {
          const isSelected = value === m.id;
          const isAvailable = m.available;
          const icon =
            m.id === "espece" ? (
              <Banknote className="h-5 w-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
            ) : m.id === "edahabia" ? (
              <CreditCard className="h-5 w-5 text-amber-600 dark:text-amber-400 shrink-0" />
            ) : (
              <Wallet className="h-5 w-5 text-blue-600 dark:text-blue-400 shrink-0" />
            );

          return (
            <button
              key={m.id}
              type="button"
              disabled={disabled || !isAvailable}
              onClick={() => {
                if (!isAvailable) {
                  handleDisabledClick(lang === "ar" ? m.shortAr : m.shortFr);
                  return;
                }
                onChange(m.id);
              }}
              className={cn(
                "relative flex items-start gap-3 rounded-2xl border p-3.5 text-right transition-all outline-none",
                lang === "fr" && "text-left",
                isAvailable
                  ? isSelected
                    ? "border-primary bg-primary/5 ring-2 ring-primary/20 shadow-sm"
                    : "border-border bg-card hover:border-primary/50 press"
                  : "border-border/60 bg-muted/30 opacity-75 cursor-not-allowed",
              )}
            >
              <div className="mt-0.5">{icon}</div>

              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-extrabold text-foreground flex items-center gap-1">
                    {lang === "ar" ? m.nameAr : m.nameFr}
                  </span>

                  {!isAvailable && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/15 px-2.5 py-0.5 text-[10px] font-extrabold text-amber-700 dark:text-amber-300 border border-amber-500/30 shrink-0">
                      <Lock className="h-2.5 w-2.5" />
                      {lang === "ar" ? m.badgeAr : m.badgeFr}
                    </span>
                  )}
                  {isAvailable && isSelected && (
                    <span className="inline-flex items-center rounded-full bg-primary/15 px-2 py-0.5 text-[10px] font-extrabold text-primary">
                      ✓ {lang === "ar" ? "مُحدد" : "Sélectionné"}
                    </span>
                  )}
                </div>

                <p className="mt-1 text-[11px] font-medium text-muted-foreground leading-relaxed">
                  {lang === "ar" ? m.descAr : m.descFr}
                </p>
              </div>
            </button>
          );
        })}
      </div>

      <div className="flex items-start gap-2 rounded-2xl bg-muted/40 p-3 text-xs text-muted-foreground border border-border/50">
        <Info className="h-4 w-4 text-primary shrink-0 mt-0.5" />
        <p className="text-[11px] leading-relaxed">
          {lang === "ar"
            ? "وسائط الدفع الإلكتروني (البطاقة الذهبية ورصيد لفتو) ستتوفر قريباً في التحديث القادم. حالياً يتم الدفع نقداً عند الاستلام في مقر الفندق."
            : "Les modes de paiement électroniques (Carte Edahabia et Lefto Cash) seront disponibles lors d'une prochaine mise à jour. Actuellement, le paiement s'effectue en espèces au retrait."}
        </p>
      </div>
    </div>
  );
}

interface PaymentMethodDisplayProps {
  methodId?: string | null;
  variant?: "card" | "pill" | "inline";
  className?: string;
}

export function PaymentMethodDisplay({
  methodId,
  variant = "card",
  className,
}: PaymentMethodDisplayProps) {
  const { lang } = useI18n();
  const meta = getPaymentMethodMeta(methodId);

  const icon =
    meta.id === "espece" ? (
      <Banknote className="h-4 w-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
    ) : meta.id === "edahabia" ? (
      <CreditCard className="h-4 w-4 text-amber-600 dark:text-amber-400 shrink-0" />
    ) : (
      <Wallet className="h-4 w-4 text-blue-600 dark:text-blue-400 shrink-0" />
    );

  if (variant === "pill") {
    return (
      <span
        className={cn(
          "inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-2.5 py-1 text-xs font-bold text-emerald-700 dark:text-emerald-300 border border-emerald-500/20",
          className,
        )}
      >
        {icon}
        <span>{lang === "ar" ? meta.shortAr : meta.shortFr}</span>
      </span>
    );
  }

  if (variant === "inline") {
    return (
      <span className={cn("inline-flex items-center gap-1.5 font-bold text-foreground", className)}>
        {icon}
        <span>{lang === "ar" ? meta.nameAr : meta.nameFr}</span>
      </span>
    );
  }

  return (
    <div className={cn("rounded-2xl border border-border bg-card p-4 space-y-2", className)}>
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold text-muted-foreground">
          {lang === "ar" ? "طريقة الدفع المحددة:" : "Mode de paiement :"}
        </span>
      </div>

      <div className="flex items-center gap-2.5 font-extrabold text-sm text-foreground pt-0.5">
        <div className="rounded-xl bg-emerald-500/10 p-2 border border-emerald-500/20">{icon}</div>
        <div>
          <p className="text-sm font-bold text-foreground">
            {lang === "ar" ? meta.nameAr : meta.nameFr}
          </p>
          <p className="text-[11px] font-normal text-muted-foreground">
            {lang === "ar" ? meta.descAr : meta.descFr}
          </p>
        </div>
      </div>
    </div>
  );
}
