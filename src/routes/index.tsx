import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import {
  ArrowLeft,
  ArrowRight,
  BadgeCheck,
  Building2,
  Check,
  CircleCheckBig,
  ClipboardCheck,
  Clock3,
  Eye,
  Globe,
  HandHeart,
  HelpCircle,
  Info,
  LayoutDashboard,
  ListChecks,
  Mail,
  MapPin,
  MessageSquareMore,
  PackageCheck,
  QrCode,
  Search,
  ShieldCheck,
  TimerReset,
  Upload,
  UserCheck,
  Users,
  UtensilsCrossed,
  Waypoints,
  Zap,
  type LucideIcon,
} from "lucide-react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { BrandMark } from "@/components/landing/brand-mark";
import { HeroPreview, ProductShowcase, QrJourney } from "@/components/landing/application-mockups";
import { landingContent } from "@/components/landing/landing-content";
import { LandingHeader } from "@/components/landing/landing-header";
import {
  CheckedBenefit,
  LandingCard,
  SectionIntro,
  WorkflowCard,
} from "@/components/landing/landing-section";
import { useAuth } from "@/hooks/use-auth";
import { useI18n } from "@/lib/i18n";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Lefto | Gestion numérique des surplus alimentaires" },
      {
        name: "description",
        content:
          "Lefto est la plateforme SaaS qui connecte les hôtels et les associations caritatives pour gérer, réserver et vérifier la collecte des surplus alimentaires.",
      },
      { name: "robots", content: "index, follow" },
      { property: "og:title", content: "Lefto | Gestion numérique des surplus alimentaires" },
      {
        property: "og:description",
        content:
          "Un workflow digital structuré pour la gestion et la vérification des surplus alimentaires entre hôtels et associations.",
      },
    ],
  }),
  component: LandingPage,
});

type IconContent = { title: string; description: string; icon: LucideIcon };

function LandingPage() {
  const { lang, setLang, dir } = useI18n();
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const copy = landingContent[lang];
  const Arrow = dir === "rtl" ? ArrowLeft : ArrowRight;

  const [activeModal, setActiveModal] = useState<"privacy" | "terms" | "contact" | null>(null);

  useEffect(() => {
    if (!loading && user) navigate({ to: "/dashboard", replace: true });
  }, [loading, navigate, user]);

  const problemCards: IconContent[] = [
    { ...copy.problem.cards[0], icon: Clock3 },
    { ...copy.problem.cards[1], icon: MessageSquareMore },
    { ...copy.problem.cards[2], icon: Eye },
  ];
  const solutionCards: IconContent[] = [
    { ...copy.solution.benefits[0], icon: LayoutDashboard },
    { ...copy.solution.benefits[1], icon: Zap },
    { ...copy.solution.benefits[2], icon: QrCode },
    { ...copy.solution.benefits[3], icon: ClipboardCheck },
  ];
  const valueIcons: LucideIcon[] = [
    Upload,
    UserCheck,
    QrCode,
    MessageSquareMore,
    Globe,
    ShieldCheck,
  ];
  const valueCards: IconContent[] = copy.value.cards.map((card, index) => ({
    ...card,
    icon: valueIcons[index] ?? LayoutDashboard,
  }));
  const workflowIcons = [Upload, Search, ClipboardCheck, BadgeCheck, QrCode, CircleCheckBig];
  const metricIcons = [UtensilsCrossed, PackageCheck, Building2, Users, Search, Clock3];

  return (
    <div id="top" className="min-h-screen overflow-x-clip bg-background text-foreground">
      <LandingHeader
        copy={copy}
        lang={lang}
        onLanguageToggle={() => setLang(lang === "ar" ? "fr" : "ar")}
      />

      <main id="main-content" tabIndex={-1}>
        {/* HERO SECTION */}
        <section className="landing-grid relative isolate overflow-hidden border-b border-border/70">
          <div className="landing-orb absolute -start-32 top-8 h-90 w-90 rounded-full bg-primary/10 blur-3xl" />
          <div className="landing-orb absolute -end-36 top-36 h-100 w-100 rounded-full bg-success/10 blur-3xl [animation-delay:-4s]" />
          <div className="relative mx-auto grid max-w-7xl items-center gap-14 px-4 pb-20 pt-15 sm:px-6 sm:pb-24 sm:pt-20 lg:grid-cols-[0.93fr_1.07fr] lg:gap-16 lg:px-8 lg:pb-28 lg:pt-28">
            <div className="max-w-2xl">
              <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-card/85 px-3.5 py-1.5 text-xs font-bold text-primary shadow-sm backdrop-blur">
                <span className="flex h-5 w-5 shrink-0 overflow-hidden rounded-md border border-primary/20 bg-background">
                  <BrandMark className="h-full w-full" priority />
                </span>
                <span>{copy.hero.badge}</span>
              </div>
              <h1 className="mt-6 text-3xl font-extrabold tracking-normal text-foreground sm:text-4xl lg:text-5xl lg:leading-snug">
                {copy.hero.title}
              </h1>
              <p className="mt-6 max-w-xl text-base leading-8 text-muted-foreground sm:text-lg sm:leading-8">
                {copy.hero.description}
              </p>
              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <Link
                  to="/auth"
                  search={{ mode: "signup" }}
                  className="landing-primary-button min-h-13 px-6 text-base shadow-lg"
                >
                  {copy.actions.exploreLefto}
                  <Arrow className="h-4 w-4" />
                </Link>
                <button
                  type="button"
                  disabled
                  className="landing-secondary-button min-h-13 px-5 text-base opacity-90"
                  aria-describedby="apk-status"
                >
                  {copy.actions.downloadApk}
                  <span
                    id="apk-status"
                    className="rounded-full bg-muted px-2.5 py-0.5 text-[10px] font-extrabold text-muted-foreground"
                  >
                    {copy.actions.comingSoon}
                  </span>
                </button>
              </div>
              <p className="mt-5 text-sm font-medium text-muted-foreground">{copy.hero.note}</p>
            </div>
            <HeroPreview copy={copy} />
          </div>
        </section>

        {/* PROBLEM SECTION */}
        <section id="problem" className="landing-paper scroll-mt-24 py-20 sm:py-24 lg:py-30">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <SectionIntro {...copy.problem} className="max-w-2xl" />
            <div className="mt-12 grid gap-5 md:grid-cols-3">
              {problemCards.map((card, i) => (
                <LandingCard key={card.title} {...card} index={i} />
              ))}
            </div>
          </div>
        </section>

        {/* SOLUTION SECTION */}
        <section
          id="solution"
          className="landing-surface scroll-mt-24 border-y border-border/70 py-20 sm:py-24 lg:py-30"
        >
          <div className="mx-auto grid max-w-7xl items-center gap-12 px-4 sm:px-6 lg:grid-cols-[0.86fr_1.14fr] lg:gap-16 lg:px-8">
            <div>
              <SectionIntro {...copy.solution} />
              <ul className="mt-8 grid gap-3.5 sm:grid-cols-2">
                {copy.solution.benefits.map((benefit) => (
                  <CheckedBenefit key={benefit.title}>{benefit.title}</CheckedBenefit>
                ))}
              </ul>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              {solutionCards.map((card) => (
                <LandingCard key={card.title} {...card} />
              ))}
            </div>
          </div>
        </section>

        {/* 6-STEP WORKFLOW SECTION */}
        <section id="workflow" className="landing-workflow scroll-mt-24 py-20 sm:py-24 lg:py-30">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <SectionIntro
              {...copy.workflow}
              align="center"
              className="[&_h2]:text-primary-foreground [&_p:last-child]:text-primary-foreground/65 [&_p:first-child]:text-primary-glow"
            />
            <div className="relative mt-12 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {copy.workflow.steps.map((step, index) => (
                <WorkflowCard
                  key={step.title}
                  {...step}
                  icon={workflowIcons[index]}
                  step={index + 1}
                />
              ))}
            </div>
          </div>
        </section>

        {/* QR VERIFICATION SECTION */}
        <section
          id="verification"
          className="landing-qr scroll-mt-24 border-y border-border/70 py-20 sm:py-24 lg:py-30"
        >
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <SectionIntro {...copy.qr} align="center" />
            <div className="mt-12">
              <QrJourney copy={copy} />
            </div>
            <ol className="mx-auto mt-12 grid max-w-5xl gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {copy.qr.steps.map((step, index) => (
                <li
                  key={step.title}
                  className="rounded-2xl border border-border/70 bg-card/80 p-5 shadow-sm backdrop-blur"
                >
                  <p className="text-[11px] font-extrabold tabular-nums text-primary">
                    0{index + 1}
                  </p>
                  <h3 className="mt-3 text-sm font-bold text-foreground">{step.title}</h3>
                  <p className="mt-2 text-xs leading-5 text-muted-foreground">{step.description}</p>
                </li>
              ))}
            </ol>
          </div>
        </section>

        {/* VALUE / FEATURES SECTION */}
        <section
          id="value"
          className="landing-value-surface scroll-mt-24 border-y border-border/70 py-20 sm:py-24 lg:py-30"
        >
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <SectionIntro {...copy.value} align="center" />
            <div className="landing-value-grid mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {valueCards.map((card) => (
                <LandingCard key={card.title} {...card} />
              ))}
            </div>
          </div>
        </section>

        {/* OPERATIONAL METRICS SECTION (No CO2/ESG) */}
        <section id="impact" className="scroll-mt-24 py-20 sm:py-24 lg:py-30">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="landing-impact-shell overflow-hidden rounded-[2rem] px-6 py-10 text-primary-foreground shadow-[0_34px_90px_-48px_oklch(0.25_0.08_160/0.85)] sm:rounded-[2.5rem] sm:px-10 sm:py-14 lg:px-14 lg:py-16">
              <SectionIntro
                eyebrow={copy.impact.eyebrow}
                title={copy.impact.title}
                description={copy.impact.description}
                className="max-w-2xl [&_h2]:text-primary-foreground [&_p:last-child]:text-primary-foreground/70 [&_p:first-child]:text-primary-glow"
              />
              <div className="mt-12 grid grid-cols-2 gap-px overflow-hidden rounded-2xl border border-primary-foreground/10 bg-primary-foreground/10 sm:grid-cols-3 lg:grid-cols-5">
                {copy.impact.metrics.map((metric, index) => {
                  const Icon = metricIcons[index] ?? UtensilsCrossed;
                  return (
                    <div key={metric.label} className="bg-foreground/92 p-5 sm:p-6">
                      <Icon className="h-4 w-4 text-primary-glow" strokeWidth={1.8} />
                      <div className="mt-4 flex items-baseline gap-1.5">
                        <span className="text-xl font-extrabold text-primary-foreground">
                          {metric.value}
                        </span>
                      </div>
                      <p className="mt-2 text-xs font-medium leading-5 text-primary-foreground/70">
                        {metric.label}
                      </p>
                    </div>
                  );
                })}
              </div>
              <div className="mt-6 flex flex-wrap items-center gap-3 text-xs leading-6 text-primary-foreground/60">
                <span className="rounded-full border border-primary-foreground/20 bg-primary-foreground/10 px-3 py-1 font-bold text-primary-foreground/90">
                  {copy.impact.status}
                </span>
                <p>{copy.impact.note}</p>
              </div>
            </div>
          </div>
        </section>

        {/* SHOWCASE SECTION */}
        <section
          id="showcase"
          className="landing-showcase-surface scroll-mt-24 border-y border-border/70 py-20 sm:py-24 lg:py-30"
        >
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <SectionIntro {...copy.showcase} align="center" />
            <div className="mt-14">
              <ProductShowcase copy={copy} />
            </div>
          </div>
        </section>

        {/* FAQ SECTION */}
        <section id="faq" className="scroll-mt-24 py-20 sm:py-24 lg:py-30">
          <div className="mx-auto grid max-w-7xl gap-12 px-4 sm:px-6 lg:grid-cols-[0.8fr_1.2fr] lg:gap-20 lg:px-8">
            <SectionIntro {...copy.faq} />
            <Accordion
              type="single"
              collapsible
              className="rounded-[1.75rem] border border-border bg-card px-5 shadow-[0_20px_60px_-46px_oklch(0.25_0.06_160/0.7)] sm:px-7"
            >
              {copy.faq.entries.map((entry, index) => (
                <AccordionItem
                  key={entry.question}
                  value={`faq-${index}`}
                  className="last:border-b-0"
                >
                  <AccordionTrigger className="gap-5 py-5 text-start text-base font-bold no-underline hover:no-underline">
                    {entry.question}
                  </AccordionTrigger>
                  <AccordionContent className="max-w-2xl text-sm leading-7 text-muted-foreground">
                    {entry.answer}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>
        </section>

        {/* CLOSING BANNER */}
        <section className="landing-closing border-y border-border/70 py-16 sm:py-20">
          <div className="mx-auto max-w-5xl px-4 text-center sm:px-6">
            <div className="mx-auto flex h-12 w-12 items-center justify-center overflow-hidden rounded-2xl border border-primary-glow/30 bg-primary-soft shadow-md">
              <BrandMark className="h-full w-full" />
            </div>
            <h2 className="mx-auto mt-6 max-w-3xl text-3xl font-extrabold tracking-[-0.04em] text-primary-foreground sm:text-4xl">
              {copy.closing.title}
            </h2>
            <p className="mx-auto mt-5 max-w-2xl text-base leading-7 text-primary-foreground/75">
              {copy.closing.description}
            </p>
            <div className="mt-8 flex flex-col justify-center gap-3.5 sm:flex-row">
              <Link
                to="/auth"
                search={{ mode: "signup" }}
                className="landing-primary-button min-h-13 px-6 text-base shadow-xl"
              >
                {copy.actions.exploreLefto}
                <Arrow className="h-4 w-4" />
              </Link>
              <button
                type="button"
                disabled
                className="landing-secondary-button min-h-13 px-5 text-base"
              >
                {copy.actions.downloadApk}
                <span className="rounded-full bg-muted px-2.5 py-0.5 text-[10px] font-extrabold text-muted-foreground">
                  {copy.actions.comingSoon}
                </span>
              </button>
            </div>
          </div>
        </section>
      </main>

      {/* FOOTER */}
      <footer className="border-t border-border bg-card">
        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
            <div className="sm:col-span-2">
              <div className="flex items-center gap-3">
                <span className="flex h-10 w-10 overflow-hidden rounded-xl border border-border bg-background shadow-sm">
                  <BrandMark className="h-full w-full" />
                </span>
                <span className="text-xl font-extrabold tracking-[-0.03em] text-foreground">
                  Lefto
                </span>
              </div>
              <p className="mt-3 max-w-sm text-xs leading-6 text-muted-foreground">
                {copy.footer.description}
              </p>
            </div>

            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-foreground">
                Navigation
              </p>
              <ul className="mt-4 space-y-2.5 text-xs text-muted-foreground">
                <li>
                  <a href="#solution" className="hover:text-primary transition-colors">
                    {copy.nav.product}
                  </a>
                </li>
                <li>
                  <a href="#workflow" className="hover:text-primary transition-colors">
                    {copy.nav.workflow}
                  </a>
                </li>
                <li>
                  <a href="#showcase" className="hover:text-primary transition-colors">
                    {copy.nav.showcase}
                  </a>
                </li>
                <li>
                  <a href="#faq" className="hover:text-primary transition-colors">
                    {copy.nav.faq}
                  </a>
                </li>
              </ul>
            </div>

            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-foreground">
                Informations
              </p>
              <ul className="mt-4 space-y-2.5 text-xs text-muted-foreground">
                <li>
                  <button
                    type="button"
                    onClick={() => setActiveModal("privacy")}
                    className="hover:text-primary transition-colors text-start"
                  >
                    {copy.footer.privacy}
                  </button>
                </li>
                <li>
                  <button
                    type="button"
                    onClick={() => setActiveModal("terms")}
                    className="hover:text-primary transition-colors text-start"
                  >
                    {copy.footer.terms}
                  </button>
                </li>
                <li>
                  <button
                    type="button"
                    onClick={() => setActiveModal("contact")}
                    className="hover:text-primary transition-colors text-start"
                  >
                    {copy.footer.contact}
                  </button>
                </li>
              </ul>
            </div>
          </div>

          <div className="mt-10 flex flex-col items-center justify-between gap-4 border-t border-border/70 pt-6 sm:flex-row">
            <p className="text-xs text-muted-foreground">
              © {new Date().getFullYear()} Lefto. {copy.footer.rights}
            </p>
            <div className="flex items-center gap-4 text-muted-foreground">
              <span className="text-xs font-semibold">Lefto Platform</span>
            </div>
          </div>
        </div>
      </footer>

      {/* LEGAL & CONTACT MODALS */}
      <Dialog open={activeModal !== null} onOpenChange={(open) => !open && setActiveModal(null)}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-lg font-bold">
              {activeModal === "privacy" && <ShieldCheck className="h-5 w-5 text-primary" />}
              {activeModal === "terms" && <Info className="h-5 w-5 text-primary" />}
              {activeModal === "contact" && <Mail className="h-5 w-5 text-primary" />}
              <span>
                {activeModal === "privacy" && copy.footer.privacy}
                {activeModal === "terms" && copy.footer.terms}
                {activeModal === "contact" && copy.footer.contact}
              </span>
            </DialogTitle>
            <DialogDescription className="pt-3 text-sm leading-6 text-muted-foreground">
              {activeModal === "privacy" && (
                <div className="space-y-3">
                  <p>
                    Lefto s'engage à protéger la confidentialité des données transmises par les
                    hôtels et associations partenaires.
                  </p>
                  <p>
                    Toutes les informations relatives aux surplus alimentaires, demandes de collecte
                    et historiques de vérification sont chiffrées et strictement réservées à
                    l'exécution du service.
                  </p>
                </div>
              )}
              {activeModal === "terms" && (
                <div className="space-y-3">
                  <p>
                    L'utilisation de la plateforme Lefto est soumise à l'acceptation des conditions
                    d'utilisation professionnelles.
                  </p>
                  <p>
                    Les utilisateurs s'engagent à fournir des informations exactes concernant les
                    lots de nourriture disponibles et à respecter les créneaux horaires convenus
                    pour la collecte.
                  </p>
                </div>
              )}
              {activeModal === "contact" && (
                <div className="space-y-4">
                  <p>
                    Une question concernant l'intégration de Lefto pour votre hôtel ou votre
                    association ? Notre équipe est à votre disposition.
                  </p>
                  <div className="rounded-xl border border-border bg-muted/40 p-4 space-y-2">
                    <p className="font-semibold text-foreground text-xs">
                      Support Technique & Partenariats
                    </p>
                    <p className="text-xs text-primary font-mono">contact@lefto.app</p>
                  </div>
                </div>
              )}
            </DialogDescription>
          </DialogHeader>
        </DialogContent>
      </Dialog>
    </div>
  );
}
