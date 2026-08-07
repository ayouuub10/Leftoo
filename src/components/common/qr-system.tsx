import { useState, useEffect } from "react";
import { QRCodeSVG } from "qrcode.react";
import { CheckCircle2, QrCode, ShieldCheck, Loader2, Copy, Camera, X } from "lucide-react";
import { Html5Qrcode } from "html5-qrcode";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { useI18n } from "@/lib/i18n";
import { calculateCommission, getRequestPrice, type RequestWithRelations } from "@/lib/domain";

interface QrDisplayProps {
  request: RequestWithRelations;
  onVerified?: () => void;
}

export function QrCard({ request, onVerified }: QrDisplayProps) {
  const { role } = useAuth();
  const { lang } = useI18n();
  const qc = useQueryClient();
  const [verifying, setVerifying] = useState(false);
  const [manualToken, setManualToken] = useState("");
  const [showCameraModal, setShowCameraModal] = useState(false);

  const token = request.qr_token || request.id.slice(0, 8);
  const payload = JSON.stringify({
    transaction_id: request.id,
    token: token,
  });

  const isCompleted = request.status === "completed" || !!request.qr_used_at;
  const price = getRequestPrice(request);
  const financial = calculateCommission(price);

  async function handleVerify(providedToken?: string) {
    const inputToken = (providedToken || manualToken).trim();
    if (!inputToken) {
      toast.error(lang === "ar" ? "رمز التحقق غير صالح." : "Code de vérification non valide.");
      return;
    }

    if (isCompleted) {
      toast.error(lang === "ar" ? "تم استخدام رمز التحقق مسبقاً." : "Ce code a déjà été utilisé.");
      return;
    }

    if (request.status !== "accepted") {
      toast.error(
        lang === "ar"
          ? "رمز التحقق غير صالح (الطلب غير مقبول بعد)."
          : "Code non valide (demande non acceptée).",
      );
      return;
    }

    const validTokens = [
      request.qr_token,
      request.id,
      request.id.slice(0, 8),
      request.qr_code,
    ].filter((t): t is string => Boolean(t));

    const matches = validTokens.some((t) => t.toLowerCase() === inputToken.toLowerCase());

    if (!matches) {
      toast.error(lang === "ar" ? "رمز التحقق غير صالح." : "Code de vérification non valide.");
      return;
    }

    setVerifying(true);
    try {
      const { error: upErr } = await supabase
        .from("food_requests")
        .update({
          status: "completed",
          qr_used_at: new Date().toISOString(),
          commission_dzd: financial.commission,
          hotel_net_dzd: financial.hotelNet,
        })
        .eq("id", request.id);

      if (upErr) throw new Error(upErr.message);

      await supabase.from("listings").update({ status: "collected" }).eq("id", request.listing_id);

      qc.invalidateQueries({ queryKey: ["requests"] });
      qc.invalidateQueries({ queryKey: ["listings"] });
      qc.invalidateQueries({ queryKey: ["listing", request.listing_id] });

      toast.success(
        lang === "ar"
          ? "تمت عملية التحقق والاستلام بنجاح!"
          : "Vérification et collecte effectuées avec succès !",
      );
      setShowCameraModal(false);
      setManualToken("");
      if (onVerified) onVerified();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erreur de vérification QR");
    } finally {
      setVerifying(false);
    }
  }

  function copyToken() {
    navigator.clipboard.writeText(token);
    toast.success(lang === "ar" ? "تم نسخ الرمز التوثيقي" : "Jeton copié !");
  }

  if (isCompleted) {
    return (
      <div className="surface-card space-y-3 p-4 border border-emerald-500/30 bg-emerald-50/40 dark:bg-emerald-950/20 rounded-2xl">
        <div className="flex items-center gap-3 text-emerald-600 dark:text-emerald-400">
          <CheckCircle2 className="h-6 w-6 shrink-0" />
          <div>
            <h4 className="text-sm font-bold">
              {lang === "ar" ? "تم استلام الطلب وتوثيقه بنجاح" : "Collecte confirmée et archivée"}
            </h4>
            <p className="text-xs text-muted-foreground">
              {request.qr_used_at
                ? new Date(request.qr_used_at).toLocaleString()
                : lang === "ar"
                  ? "مكتمل بشكل دائم"
                  : "Terminé de façon permanente"}
            </p>
          </div>
        </div>

        {/* Financial Breakdown - Hidden strictly from Charity */}
        {role !== "charity" && price > 0 && (
          <div className="mt-2 space-y-1.5 rounded-xl border border-emerald-500/20 bg-card p-3 text-xs">
            <div className="flex justify-between text-muted-foreground">
              <span>{lang === "ar" ? "ثمن البيع الكلي:" : "Prix total :"}</span>
              <span className="font-semibold text-foreground">{price.toLocaleString()} DZD</span>
            </div>
            <div className="flex justify-between text-amber-600 dark:text-amber-400">
              <span>{lang === "ar" ? "عمولة منصة لفتو (15%):" : "Commission Lefto (15%) :"}</span>
              <span className="font-semibold">-{financial.commission.toLocaleString()} DZD</span>
            </div>
            <div className="flex justify-between border-t border-border pt-1 font-bold text-emerald-600 dark:text-emerald-400">
              <span>
                {lang === "ar" ? "صافي مستحقات الفندق (85%):" : "Net reçu par l'hôtel (85%) :"}
              </span>
              <span>{financial.hotelNet.toLocaleString()} DZD</span>
            </div>
          </div>
        )}
      </div>
    );
  }

  // CHARITY VIEW: Render the QR Code to show to Hotel
  if (role === "charity") {
    return (
      <div className="surface-card space-y-4 p-5 rounded-2xl border border-primary/20 bg-card">
        <div className="flex items-center justify-between border-b border-border pb-3">
          <div className="flex items-center gap-2">
            <QrCode className="h-5 w-5 text-primary" />
            <h3 className="text-sm font-bold">
              {lang === "ar" ? "رمز استلام الفائض (QR Code)" : "Code QR de retrait"}
            </h3>
          </div>
          <span className="rounded-full bg-amber-500/10 px-2.5 py-0.5 text-[11px] font-bold text-amber-600 dark:text-amber-400">
            {lang === "ar" ? "إبرازه للفندق عند الاستلام" : "À présenter à l'hôtel"}
          </span>
        </div>

        <div className="flex flex-col items-center justify-center space-y-3 py-2">
          <div className="rounded-2xl border-4 border-white bg-white p-3 shadow-md">
            <QRCodeSVG value={payload} size={180} level="H" />
          </div>

          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <ShieldCheck className="h-4 w-4 text-emerald-500" />
            <span>
              {lang === "ar"
                ? "إعرض هذا الرمز لمسح الكاميرا من طرف الفندق"
                : "Présentez ce QR code au responsable du hôtel"}
            </span>
          </div>

          <div className="flex items-center gap-2 rounded-xl bg-muted/70 px-3 py-1.5 text-xs font-mono">
            <span className="text-muted-foreground">TOKEN:</span>
            <span className="font-bold text-foreground">{token}</span>
            <button
              type="button"
              onClick={copyToken}
              className="ms-1 text-muted-foreground hover:text-foreground"
              title={lang === "ar" ? "نسخ الرمز" : "Copier"}
            >
              <Copy className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </div>
    );
  }

  // HOTEL & ADMIN VIEW: Camera QR Scanner UI (Does NOT show QR image to Hotel)
  return (
    <div className="surface-card space-y-4 p-5 rounded-2xl border border-primary/20 bg-card">
      <div className="flex items-center justify-between border-b border-border pb-3">
        <div className="flex items-center gap-2">
          <Camera className="h-5 w-5 text-primary" />
          <h3 className="text-sm font-bold">
            {lang === "ar" ? "التحقق من استلام الجمعية" : "Vérification de collecte"}
          </h3>
        </div>
        <span className="rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-[11px] font-bold text-emerald-600 dark:text-emerald-400">
          {lang === "ar" ? "مسح كود الجمعية" : "Scan du QR"}
        </span>
      </div>

      <div className="space-y-3 text-center">
        <p className="text-xs text-muted-foreground">
          {lang === "ar"
            ? "افتح كاميرا الهاتف لمسح رمز الـ QR الموجود لدى ممثل الجمعية لإتمام الاستلام وتوثيق العملية."
            : "Scannez le QR Code de l'association pour valider le retrait."}
        </p>

        <button
          type="button"
          onClick={() => setShowCameraModal(true)}
          className="press brand-gradient flex w-full items-center justify-center gap-2 rounded-xl py-3 text-xs font-bold text-primary-foreground shadow-md"
        >
          <Camera className="h-4 w-4" />
          <span>{lang === "ar" ? "فتح الكاميرا لمسح QR" : "Ouvrir la caméra pour scanner"}</span>
        </button>
      </div>

      <div className="space-y-2 border-t border-border pt-3">
        <p className="text-[11px] font-semibold text-muted-foreground">
          {lang === "ar" ? "أو إدخال كود التوثيق يدوياً:" : "Ou saisie manuelle du code :"}
        </p>
        <div className="flex gap-2">
          <input
            type="text"
            value={manualToken}
            onChange={(e) => setManualToken(e.target.value)}
            placeholder={lang === "ar" ? "أدخل الكود..." : "Code de vérification..."}
            className="flex-1 rounded-xl border border-input bg-card px-3 py-2 text-xs font-mono outline-none focus:border-primary"
          />
          <button
            type="button"
            disabled={verifying || !manualToken.trim()}
            onClick={() => handleVerify()}
            className="press rounded-xl bg-primary px-4 py-2 text-xs font-bold text-primary-foreground disabled:opacity-50"
          >
            {verifying ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : lang === "ar" ? (
              "تأكيد"
            ) : (
              "Valider"
            )}
          </button>
        </div>
      </div>

      {/* Camera Live Scanner Modal */}
      {showCameraModal && (
        <CameraScannerModal
          onScan={(scannedToken) => handleVerify(scannedToken)}
          onClose={() => setShowCameraModal(false)}
        />
      )}
    </div>
  );
}

function CameraScannerModal({
  onScan,
  onClose,
}: {
  onScan: (token: string) => void;
  onClose: () => void;
}) {
  const { lang } = useI18n();

  useEffect(() => {
    let html5Qrcode: Html5Qrcode | null = null;
    const scannerId = "qr-camera-scanner-view";

    async function startScanner() {
      try {
        html5Qrcode = new Html5Qrcode(scannerId);
        await html5Qrcode.start(
          { facingMode: "environment" },
          { fps: 10, qrbox: { width: 220, height: 220 } },
          (decodedText) => {
            try {
              const parsed = JSON.parse(decodedText);
              const extracted = parsed.token || decodedText;
              onScan(extracted);
            } catch {
              onScan(decodedText);
            }
          },
          () => {},
        );
      } catch (err) {
        console.error("Camera start error:", err);
        toast.error(
          lang === "ar"
            ? "تعذر تشغيل الكاميرا. يرجى التأكد من سماح المتصفح باستعمال الكاميرا."
            : "Impossible de lancer la caméra.",
        );
      }
    }

    startScanner();

    return () => {
      if (html5Qrcode && html5Qrcode.isScanning) {
        html5Qrcode.stop().catch(() => {});
      }
    };
  }, [onScan, lang]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4">
      <div className="relative w-full max-w-sm rounded-3xl bg-card p-5 space-y-4 shadow-2xl border border-border">
        <div className="flex items-center justify-between border-b border-border pb-3">
          <h3 className="text-sm font-bold flex items-center gap-2">
            <Camera className="h-4 w-4 text-primary" />
            {lang === "ar" ? "ماسح الكاميرا الحية" : "Scanner QR en direct"}
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full bg-muted p-1 text-muted-foreground hover:text-foreground"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="relative aspect-square w-full overflow-hidden rounded-2xl bg-black flex items-center justify-center">
          <div id="qr-camera-scanner-view" className="h-full w-full" />
        </div>

        <p className="text-center text-xs text-muted-foreground">
          {lang === "ar"
            ? "وجّه الكاميرا نحو كود QR الخاص بالجمعية"
            : "Pointez l'appareil vers le code QR"}
        </p>

        <button
          type="button"
          onClick={onClose}
          className="press w-full rounded-xl border border-border py-2.5 text-xs font-bold text-foreground"
        >
          {lang === "ar" ? "إلغاء" : "Annuler"}
        </button>
      </div>
    </div>
  );
}
