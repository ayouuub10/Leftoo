import {
  Bell,
  Building2,
  Check,
  CheckCircle2,
  Clock3,
  Heart,
  HeartHandshake,
  MapPin,
  QrCode,
  Search,
  ShieldCheck,
  Utensils,
} from "lucide-react";
import type { LandingCopy } from "./landing-content";
import { BrandMark } from "./brand-mark";

function AppTopBar({ title }: { title: string }) {
  return (
    <div className="flex items-center justify-between border-b border-border/70 bg-card px-4 py-3">
      <div className="flex items-center gap-2">
        <span className="flex h-6 w-6 shrink-0 overflow-hidden rounded-md border border-border/80 bg-background shadow-xs">
          <BrandMark className="h-full w-full" priority />
        </span>
        <span className="text-xs font-extrabold text-foreground">{title}</span>
      </div>
      <div className="flex items-center gap-2">
        <span className="flex h-2 w-2 rounded-full bg-success" />
        <Bell className="h-4 w-4 text-muted-foreground" />
      </div>
    </div>
  );
}

export function HeroPreview({ copy }: { copy: LandingCopy }) {
  return (
    <div aria-hidden="true" className="relative mx-auto w-full max-w-xs sm:max-w-sm">
      <div className="absolute -inset-x-8 bottom-4 top-10 rounded-[3rem] bg-primary/15 blur-3xl" />

      {/* SMARTPHONE FRAME CONTAINER */}
      <div className="relative mx-auto aspect-[9/18.5] w-full max-w-[300px] rounded-[3rem] border-[10px] border-slate-950 bg-slate-950 p-1 shadow-2xl ring-1 ring-slate-800">
        {/* Phone Speaker Notch */}
        <div className="absolute top-3 left-1/2 z-20 flex h-4 w-28 -translate-x-1/2 items-center justify-center rounded-full bg-foreground/90">
          <div className="h-1.5 w-10 rounded-full bg-background/30" />
        </div>

        {/* PHONE INNER SCREEN */}
        <div className="relative flex h-full w-full flex-col justify-between overflow-hidden rounded-[2.3rem] border border-border bg-gradient-to-b from-background via-card to-background pt-7 pb-4 shadow-inner">
          {/* Status Bar */}
          <div className="flex items-center justify-between px-6 py-1 text-[10px] font-bold text-muted-foreground">
            <span>09:41</span>
            <div className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-success" />
              <span>5G</span>
            </div>
          </div>

          {/* SCREEN CENTER CONTENT: LARGE LEFTO LOGO & SLOGAN */}
          <div className="flex flex-1 flex-col items-center justify-center p-6 text-center">
            {/* Large Logo Emblem Container */}
            <div className="relative flex h-32 w-32 items-center justify-center overflow-hidden rounded-3xl border border-primary/20 bg-background p-3.5 shadow-xl ring-4 ring-primary/10">
              <BrandMark className="h-full w-full object-contain" priority />
            </div>

            {/* Brand Title */}
            <h3 className="mt-5 text-3xl font-black tracking-tight text-foreground">Lefto</h3>

            {/* Slogan in Active Language (French / Arabic) */}
            <p className="mt-2 text-xs font-bold leading-relaxed text-primary max-w-[220px]">
              {copy.preview.slogan}
            </p>

            {/* App Status Indicator */}
            <div className="mt-6 flex items-center gap-2 rounded-full border border-primary/20 bg-primary-soft px-3.5 py-1.5">
              <span className="h-2 w-2 rounded-full bg-primary animate-pulse" />
              <span className="text-[10px] font-extrabold text-primary">
                {copy.preview.dashboard}
              </span>
            </div>
          </div>

          {/* Phone Home Bar */}
          <div className="flex justify-center">
            <div className="h-1 w-28 rounded-full bg-foreground/20" />
          </div>
        </div>
      </div>
    </div>
  );
}

const qrCells = Array.from({ length: 81 }, (_, index) => {
  const row = Math.floor(index / 9);
  const column = index % 9;
  const inFinder = (row < 3 && column < 3) || (row < 3 && column > 5) || (row > 5 && column < 3);
  return inFinder || ((row * 5 + column * 3 + row + column) % 4 !== 0 && (row + column) % 3 !== 0);
});

export function QrJourney({ copy }: { copy: LandingCopy }) {
  return (
    <div aria-hidden="true" className="relative mx-auto max-w-4xl">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="relative rounded-2xl border border-border/70 bg-card p-5 shadow-xs">
          <span className="text-xs font-extrabold tabular-nums text-primary">01</span>
          <span className="mt-2 flex h-10 w-10 items-center justify-center rounded-xl bg-primary-soft text-primary">
            <Building2 className="h-5 w-5" />
          </span>
          <p className="mt-3 text-xs font-bold text-foreground">{copy.qr.hotel}</p>
        </div>

        <div className="relative rounded-2xl border border-border/70 bg-card p-5 shadow-xs">
          <span className="text-xs font-extrabold tabular-nums text-primary">02</span>
          <span className="mt-2 flex h-10 w-10 items-center justify-center rounded-xl bg-success/12 text-success">
            <HeartHandshake className="h-5 w-5" />
          </span>
          <p className="mt-3 text-xs font-bold text-foreground">{copy.qr.charity}</p>
        </div>

        {/* SINGLE ACCURATE QR CODE VISUAL */}
        <div className="relative rounded-2xl border border-primary/40 bg-card p-5 shadow-md">
          <span className="text-xs font-extrabold tabular-nums text-primary">03</span>
          <div className="mt-2 flex items-center gap-3">
            <div className="grid h-12 w-12 shrink-0 grid-cols-9 gap-px rounded-lg bg-foreground p-1 shadow-xs">
              {qrCells.map((active, index) => (
                <span
                  key={index}
                  className={active ? "rounded-[0.5px] bg-card" : "rounded-[0.5px] bg-foreground"}
                />
              ))}
            </div>
            <div>
              <QrCode className="h-4 w-4 text-primary" />
              <p className="mt-1 text-xs font-extrabold text-foreground">{copy.qr.verification}</p>
            </div>
          </div>
        </div>

        <div className="relative rounded-2xl border border-border/70 bg-card p-5 shadow-xs">
          <span className="text-xs font-extrabold tabular-nums text-primary">04</span>
          <span className="mt-2 flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-primary-foreground">
            <Check className="h-5 w-5" />
          </span>
          <p className="mt-3 text-xs font-bold text-foreground">{copy.qr.confirmed}</p>
        </div>
      </div>
    </div>
  );
}

export function ProductShowcase({ copy }: { copy: LandingCopy }) {
  return (
    <div
      aria-hidden="true"
      className="landing-product-stage relative mx-auto max-w-5xl rounded-[2rem] border border-border/80 bg-card p-5 shadow-xl sm:rounded-[2.5rem] sm:p-8"
    >
      <div className="grid gap-6 md:grid-cols-2">
        {/* Hotel Screen Mockup */}
        <div className="overflow-hidden rounded-2xl border border-border bg-background shadow-md">
          <div className="border-b border-border bg-card px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-primary text-[10px] font-bold text-primary-foreground">
                <Building2 className="h-3.5 w-3.5" />
              </span>
              <span className="text-xs font-extrabold text-foreground">
                {copy.showcase.hotelTab}
              </span>
            </div>
            <span className="rounded-full bg-success/15 px-2.5 py-0.5 text-[11px] font-extrabold text-success">
              {copy.preview.published}
            </span>
          </div>
          <div className="p-4 space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-xl border border-border bg-card p-3">
                <p className="text-[11px] text-muted-foreground">{copy.preview.published}</p>
                <p className="mt-1 text-base font-extrabold text-foreground">03</p>
              </div>
              <div className="rounded-xl border border-border bg-card p-3">
                <p className="text-[11px] text-muted-foreground">{copy.preview.activeRequests}</p>
                <p className="mt-1 text-base font-extrabold text-foreground">02</p>
              </div>
            </div>

            <div className="rounded-xl border border-border bg-card p-3.5">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-foreground">{copy.preview.listingTitle}</span>
                <span className="text-muted-foreground font-semibold">45</span>
              </div>
              <p className="mt-1 text-[11px] text-muted-foreground">{copy.preview.listingMeta}</p>
            </div>
          </div>
        </div>

        {/* Charity Screen Mockup */}
        <div className="overflow-hidden rounded-2xl border border-border bg-background shadow-md">
          <div className="border-b border-border bg-card px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-primary-soft text-[10px] font-bold text-primary">
                <HeartHandshake className="h-3.5 w-3.5" />
              </span>
              <span className="text-xs font-extrabold text-foreground">
                {copy.showcase.charityTab}
              </span>
            </div>
            <span className="flex items-center gap-1 text-[11px] font-bold text-primary">
              <MapPin className="h-3.5 w-3.5" /> {copy.location}
            </span>
          </div>
          <div className="p-4 space-y-3">
            <div className="flex items-center gap-2 rounded-xl border border-border bg-card px-3 py-2 text-xs text-muted-foreground">
              <Search className="h-4 w-4" />
              <span>{copy.preview.browse}...</span>
            </div>

            <div className="rounded-xl border border-border bg-card p-3.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-foreground">
                  {copy.preview.listingTitle}
                </span>
                <Heart className="h-4 w-4 text-primary fill-primary/20" />
              </div>
              <p className="mt-1 text-[11px] text-muted-foreground">{copy.preview.hotelName}</p>
              <div className="mt-3 flex items-center justify-between text-xs">
                <span className="text-muted-foreground">2.4 كم</span>
                <span className="rounded-lg bg-primary px-3 py-1 font-bold text-primary-foreground text-[11px]">
                  {copy.preview.viewDetails}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
