import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";
import { useEffect, type ReactNode } from "react";

import appCss from "../styles.css?url";
import { I18nProvider } from "@/lib/i18n";
import { AuthProvider } from "@/hooks/use-auth";
import { Toaster } from "@/components/ui/sonner";

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-7xl font-bold text-foreground">404</h1>
        <h2 className="mt-4 text-xl font-semibold text-foreground">Page not found</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <div className="mt-6">
          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Go home
          </Link>
        </div>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  console.error(error);
  const router = useRouter();

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-xl font-semibold tracking-tight text-foreground">
          This page didn't load
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Something went wrong on our end. You can try refreshing or head back home.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <button
            onClick={() => {
              router.invalidate();
              reset();
            }}
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Try again
          </button>
          <a
            href="/"
            className="inline-flex items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent"
          >
            Go home
          </a>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1, viewport-fit=cover" },
      { name: "theme-color", content: "#10b981" },
      { name: "application-name", content: "Lefto" },
      { name: "apple-mobile-web-app-title", content: "Lefto" },
      { title: "Lefto — منصة إنقاذ فائض الطعام في الجزائر" },
      {
        name: "description",
        content:
          "منصة Lefto تربط الفنادق بالجمعيات لإعادة توزيع فائض الطعام والحد من الهدر في الجزائر.",
      },
      { property: "og:type", content: "website" },
      { property: "og:title", content: "Lefto — منصة إنقاذ فائض الطعام في الجزائر" },
      {
        property: "og:description",
        content: "توصيل الفنادق بالجمعيات لإعادة توزيع وجبات الطعام المتبقية والحد من الهدر.",
      },
      { property: "og:image", content: "/og-image.jpg?v=lefto1" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: "Lefto — منصة إنقاذ فائض الطعام في الجزائر" },
      {
        name: "twitter:description",
        content: "توصيل الفنادق بالجمعيات لإعادة توزيع وجبات الطعام المتبقية والحد من الهدر.",
      },
      { name: "twitter:image", content: "/og-image.jpg?v=lefto1" },
    ],
    links: [
      { rel: "stylesheet", href: appCss },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Cairo:wght@400;500;600;700;800;900&family=DM+Sans:wght@400;500;700&display=swap",
      },
      { rel: "icon", href: "/favicon.ico?v=lefto1", type: "image/x-icon" },
      { rel: "icon", type: "image/png", sizes: "32x32", href: "/favicon-32x32.png?v=lefto1" },
      { rel: "icon", type: "image/png", sizes: "16x16", href: "/favicon-16x16.png?v=lefto1" },
      { rel: "apple-touch-icon", sizes: "180x180", href: "/apple-touch-icon.png?v=lefto1" },
      { rel: "manifest", href: "/site.webmanifest?v=lefto1" },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: ReactNode }) {
  return (
    <html lang="ar" dir="rtl">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();

  return (
    <QueryClientProvider client={queryClient}>
      <I18nProvider>
        <AuthProvider>
          {/* Required: nested routes render here. Removing <Outlet /> breaks all child routes. */}
          <Outlet />
          <Toaster position="top-center" richColors />
        </AuthProvider>
      </I18nProvider>
    </QueryClientProvider>
  );
}
