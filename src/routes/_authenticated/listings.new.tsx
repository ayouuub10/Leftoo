import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { z } from "zod";
import { Camera, Loader2, MapPin } from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { useI18n } from "@/lib/i18n";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/listings/new")({
  head: () => ({
    meta: [
      { title: "Lefto — نشر فائض جديد | Nouveau surplus" },
      {
        name: "description",
        content: "Publiez un surplus alimentaire disponible pour les associations.",
      },
      { property: "og:title", content: "Lefto — Nouveau surplus" },
      { property: "og:description", content: "Quelques secondes pour sauver des repas." },
    ],
  }),
  component: NewListing,
});

const inputClass =
  "w-full rounded-2xl border border-input bg-card px-4 py-3.5 text-[15px] outline-none focus:border-primary focus:ring-4 focus:ring-primary/12";

const schema = z.object({
  title: z.string().trim().min(3).max(120),
  description: z.string().trim().max(1000).optional(),
  meals_count: z.number().int().min(1),
  price_dzd: z.number().min(0).max(10000000),
  pickup_from: z.string().min(1),
  pickup_to: z.string().min(1),
  address: z.string().trim().max(240).optional(),
});

function localNow(offsetHours = 0) {
  const d = new Date(Date.now() + offsetHours * 3600_000);
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
  return d.toISOString().slice(0, 16);
}

function fileToDataUrl(f: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(f);
  });
}

async function uploadListingPhoto(userId: string, file: File): Promise<string | null> {
  const bucketName = "listing-photos";
  const path = `${userId}/${crypto.randomUUID()}-${file.name.slice(-40)}`;

  try {
    let { error: upErr } = await supabase.storage
      .from(bucketName)
      .upload(path, file, { upsert: true, contentType: file.type });

    const isBucketNotFound =
      upErr &&
      (upErr.message?.toLowerCase().includes("not found") ||
        upErr.message?.toLowerCase().includes("bucket"));

    if (isBucketNotFound) {
      try {
        await supabase.storage.createBucket(bucketName, { public: true });
        const retry = await supabase.storage
          .from(bucketName)
          .upload(path, file, { upsert: true, contentType: file.type });
        upErr = retry.error;
      } catch {
        // ignore bucket creation error
      }
    }

    if (!upErr) {
      const { data: pubData } = supabase.storage.from(bucketName).getPublicUrl(path);
      if (pubData?.publicUrl) return pubData.publicUrl;

      const { data: signed } = await supabase.storage
        .from(bucketName)
        .createSignedUrl(path, 60 * 60 * 24 * 30);
      if (signed?.signedUrl) return signed.signedUrl;
    }
  } catch {
    // catch any unexpected storage exception
  }

  try {
    return await fileToDataUrl(file);
  } catch {
    return null;
  }
}

function NewListing() {
  const { t, lang } = useI18n();
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const qc = useQueryClient();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [meals, setMeals] = useState("20");
  const [priceDzd, setPriceDzd] = useState("5000");
  const [from, setFrom] = useState(localNow(1));
  const [to, setTo] = useState(localNow(5));
  const [address, setAddress] = useState(profile?.address ?? "");
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  function pickPhoto(f: File | null) {
    setFile(f);
    setPreview(f ? URL.createObjectURL(f) : null);
  }

  function locate() {
    if (!navigator.geolocation) return toast.error(t("errorTitle"));
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        toast.success(t("saved"));
      },
      () => toast.error(t("errorTitle")),
    );
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!user) return;
    const mealsNum = Number(meals);
    if (!mealsNum || mealsNum <= 0) {
      return toast.error(
        lang === "ar"
          ? "عدد الوجبات إجباري ويجب أن يكون أكبر من 0"
          : "Le nombre de repas est obligatoire.",
      );
    }

    const parsed = schema.safeParse({
      title,
      description,
      meals_count: mealsNum,
      price_dzd: Number(priceDzd),
      pickup_from: from,
      pickup_to: to,
      address,
    });
    if (!parsed.success) return toast.error(t("required"));
    if (new Date(to) <= new Date(from)) return toast.error(t("required"));

    setBusy(true);
    try {
      let photo_url: string | null = null;
      if (file) {
        photo_url = await uploadListingPhoto(user.id, file);
      }

      const { error } = await supabase.from("listings").insert({
        hotel_id: user.id,
        title: parsed.data.title,
        description: parsed.data.description || null,
        meals_count: parsed.data.meals_count,
        price_dzd: parsed.data.price_dzd,
        pickup_from: new Date(from).toISOString(),
        pickup_to: new Date(to).toISOString(),
        address: parsed.data.address || null,
        wilaya: profile?.wilaya ?? null,
        lat: coords?.lat ?? null,
        lng: coords?.lng ?? null,
        photo_url,
        status: "available",
      });
      if (error) throw new Error(error.message);

      // Notify charities in the same Wilaya about the new listing
      try {
        const hotelWilaya = profile?.wilaya || "Alger";
        const { data: charityUsers } = await supabase
          .from("profiles")
          .select("id")
          .eq("wilaya", hotelWilaya);

        if (charityUsers && charityUsers.length > 0) {
          const notifs = charityUsers.map((c) => ({
            user_id: c.id,
            title:
              lang === "ar"
                ? `عرض فائض طعام جديد بـ ${hotelWilaya}`
                : `Nouveau surplus disponible à ${hotelWilaya}`,
            body: `${parsed.data.title} (${parsed.data.price_dzd} DZD)`,
            kind: "info",
            link: "/browse",
          }));
          await supabase.from("notifications").insert(notifs);
        }
      } catch {
        // non-blocking
      }

      await qc.invalidateQueries({ queryKey: ["listings"] });
      toast.success(t("saved"));
      navigate({ to: "/listings" });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t("errorTitle"));
    } finally {
      setBusy(false);
    }
  }

  const mealsLabel = lang === "ar" ? "عدد الوجبات (إجباري)" : "Nombre de repas (Obligatoire)";

  return (
    <AppShell title={t("newSurplus")} back>
      <form onSubmit={submit} className="space-y-5">
        <label className="surface-card press flex h-40 cursor-pointer items-center justify-center overflow-hidden">
          {preview ? (
            <img src={preview} alt={t("photo")} className="h-full w-full object-cover" />
          ) : (
            <span className="flex flex-col items-center gap-2 text-muted-foreground">
              <Camera className="h-7 w-7" strokeWidth={1.6} />
              <span className="text-xs font-semibold">{t("photo")}</span>
            </span>
          )}
          <input
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => pickPhoto(e.target.files?.[0] ?? null)}
          />
        </label>

        <FormField label={t("title")}>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            maxLength={120}
            required
            className={inputClass}
          />
        </FormField>

        <FormField label={`${t("description")} · ${t("optional")}`}>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            maxLength={1000}
            rows={3}
            className={cn(inputClass, "resize-none")}
          />
        </FormField>

        {/* Meals Count (Required) */}
        <FormField label={mealsLabel}>
          <input
            type="number"
            min={1}
            value={meals}
            onChange={(e) => setMeals(e.target.value)}
            placeholder="20"
            required
            className={inputClass}
          />
        </FormField>

        {/* Selling Price & Lefto 15% Commission Calculation */}
        <div className="space-y-3 rounded-2xl border border-primary/20 bg-card p-4">
          <FormField
            label={
              profile?.role === "hotel"
                ? "السعر الإجمالي للعرض (دج)"
                : "Prix total de l'offre (DZD)"
            }
          >
            <input
              type="number"
              min={0}
              step="100"
              value={priceDzd}
              onChange={(e) => setPriceDzd(e.target.value)}
              className={inputClass}
              placeholder="5000"
              required
            />
          </FormField>

          {Number(priceDzd) > 0 && (
            <div className="space-y-1.5 rounded-xl bg-muted/70 p-3 text-xs">
              {Number(meals) > 0 && (
                <div className="flex justify-between font-bold text-primary pb-1.5 border-b border-border/60 text-xs">
                  <span>سعر الوجبة الواحدة (السعر الإجمالي ÷ عدد الوجبات):</span>
                  <span className="text-sm font-extrabold">
                    {Math.round(Number(priceDzd) / Number(meals)).toLocaleString()} دج / وجبة
                  </span>
                </div>
              )}
              <div className="flex justify-between text-muted-foreground pt-1">
                <span>السعر الإجمالي للعرض:</span>
                <span className="font-bold text-foreground">
                  {Number(priceDzd).toLocaleString()} دج
                </span>
              </div>
              <div className="flex justify-between text-amber-600 dark:text-amber-400">
                <span>عمولة منصة لفتو (15%):</span>
                <span className="font-bold">
                  -{Math.round(Number(priceDzd) * 0.15).toLocaleString()} دج
                </span>
              </div>
              <div className="flex justify-between border-t border-border pt-1 font-bold text-emerald-600 dark:text-emerald-400">
                <span>صافي المستحقات التي يتلقاها الفندق (85%):</span>
                <span>
                  {(Number(priceDzd) - Math.round(Number(priceDzd) * 0.15)).toLocaleString()} دج
                </span>
              </div>
            </div>
          )}
        </div>

        <div className="grid grid-cols-2 gap-3">
          <FormField label={t("pickupFrom")}>
            <input
              type="datetime-local"
              value={from}
              onChange={(e) => setFrom(e.target.value)}
              className={inputClass}
              required
            />
          </FormField>
          <FormField label={t("pickupTo")}>
            <input
              type="datetime-local"
              value={to}
              onChange={(e) => setTo(e.target.value)}
              className={inputClass}
              required
            />
          </FormField>
        </div>

        <FormField label={t("address")}>
          <input
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            maxLength={240}
            className={inputClass}
          />
        </FormField>

        <button
          type="button"
          onClick={locate}
          className="press flex w-full items-center justify-center gap-2 rounded-2xl border border-border bg-card py-3.5 text-sm font-bold"
        >
          <MapPin className="h-4 w-4 text-primary" />
          {coords ? `${coords.lat.toFixed(4)}, ${coords.lng.toFixed(4)}` : t("useMyLocation")}
        </button>

        <button
          type="submit"
          disabled={busy}
          className="press brand-gradient shadow-raised flex w-full items-center justify-center gap-2 rounded-2xl py-4 text-[15px] font-bold text-primary-foreground disabled:opacity-60"
        >
          {busy && <Loader2 className="h-4 w-4 animate-spin" />}
          {t("publish")}
        </button>
      </form>
    </AppShell>
  );
}

function FormField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-semibold text-muted-foreground">{label}</span>
      {children}
    </label>
  );
}
