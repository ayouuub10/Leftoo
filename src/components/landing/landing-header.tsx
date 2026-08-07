import { Link } from "@tanstack/react-router";
import { Globe, LogIn } from "lucide-react";
import { BrandMark } from "./brand-mark";
import type { LandingCopy } from "./landing-content";

export function LandingHeader({
  copy,
  lang,
  onLanguageToggle,
}: {
  copy: LandingCopy;
  lang: "ar" | "fr";
  onLanguageToggle: () => void;
}) {
  return (
    <header className="sticky top-0 z-50 border-b border-border/60 bg-background/85 backdrop-blur-xl">
      <div className="mx-auto flex h-18 max-w-7xl items-center justify-between gap-3 px-4 sm:px-6 lg:px-8">
        <a href="#main-content" className="landing-skip-link">
          {lang === "ar" ? "الانتقال إلى المحتوى" : "Aller au contenu"}
        </a>
        <a href="#top" className="flex shrink-0 items-center gap-2.5" aria-label="Lefto">
          <span className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-xl border border-border bg-card shadow-sm">
            <BrandMark className="h-full w-full" priority />
          </span>
          <span className="text-lg font-extrabold tracking-[-0.04em] text-foreground">Lefto</span>
        </a>

        <nav
          aria-label={lang === "ar" ? "التنقل الرئيسي" : "Navigation principale"}
          className="hidden items-center gap-7 lg:flex"
        >
          <a href="#solution" className="landing-nav-link">
            {copy.nav.product}
          </a>
          <a href="#workflow" className="landing-nav-link">
            {copy.nav.workflow}
          </a>
          <a href="#showcase" className="landing-nav-link">
            {copy.nav.showcase}
          </a>
          <a href="#value" className="landing-nav-link">
            {copy.nav.value}
          </a>
          <a href="#faq" className="landing-nav-link">
            {copy.nav.faq}
          </a>
        </nav>

        <div className="flex items-center gap-1.5 sm:gap-2">
          <button
            type="button"
            onClick={onLanguageToggle}
            aria-label={lang === "ar" ? "Passer au français" : "التبديل إلى العربية"}
            className="landing-icon-button"
          >
            <Globe className="h-4 w-4" />
            <span className="text-xs font-bold sm:inline">{lang === "ar" ? "FR" : "العربية"}</span>
          </button>
          <Link
            to="/auth"
            search={{ mode: "signin" }}
            aria-label={copy.nav.signIn}
            className="landing-icon-button px-2.5 sm:w-auto sm:px-3.5"
          >
            <LogIn className="h-4 w-4" />
            <span className="hidden sm:inline">{copy.nav.signIn}</span>
          </Link>
          <Link
            to="/auth"
            search={{ mode: "signup" }}
            className="landing-primary-button px-3.5 py-2 text-xs sm:px-4 sm:text-sm"
          >
            {copy.actions.exploreLefto}
          </Link>
        </div>
      </div>
    </header>
  );
}
