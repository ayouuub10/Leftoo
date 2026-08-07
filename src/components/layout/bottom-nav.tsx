import { Link, useLocation } from "@tanstack/react-router";
import { Home, Search, PlusCircle, Inbox, User, LayoutGrid, Building2, Boxes } from "lucide-react";
import { useI18n } from "@/lib/i18n";
import { useAuth } from "@/hooks/use-auth";
import { cn } from "@/lib/utils";
import type { TKey } from "@/lib/i18n";

type Item = { to: string; icon: typeof Home; key: TKey };

const HOTEL: Item[] = [
  { to: "/dashboard", icon: Home, key: "home" },
  { to: "/listings", icon: LayoutGrid, key: "myListings" },
  { to: "/listings/new", icon: PlusCircle, key: "newSurplus" },
  { to: "/requests", icon: Inbox, key: "requests" },
  { to: "/profile", icon: User, key: "profile" },
];

const CHARITY: Item[] = [
  { to: "/dashboard", icon: Home, key: "home" },
  { to: "/admin/organizations", icon: Building2, key: "partnerHotels" },
  { to: "/browse", icon: Search, key: "browse" },
  { to: "/requests", icon: Inbox, key: "requests" },
  { to: "/profile", icon: User, key: "profile" },
];

const ADMIN: Item[] = [
  { to: "/dashboard", icon: Home, key: "home" },
  { to: "/admin/organizations", icon: Building2, key: "organizations" },
  { to: "/admin/offers", icon: Boxes, key: "browse" },
  { to: "/requests", icon: Inbox, key: "requests" },
  { to: "/profile", icon: User, key: "profile" },
];

export function BottomNav() {
  const { role } = useAuth();
  const { t } = useI18n();
  const { pathname } = useLocation();
  const items = role === "hotel" ? HOTEL : role === "admin" ? ADMIN : CHARITY;

  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-card/85 backdrop-blur-xl">
      <ul className="mx-auto flex max-w-lg items-stretch justify-between px-2 pb-[max(0.5rem,env(safe-area-inset-bottom))] pt-2">
        {items.map((item) => {
          const active =
            pathname === item.to || (item.to !== "/dashboard" && pathname.startsWith(item.to));
          const Icon = item.icon;
          const isFab = item.to === "/listings/new";
          return (
            <li key={item.to} className="flex-1">
              <Link
                to={item.to as never}

                className={cn(
                  "press flex flex-col items-center gap-1 rounded-2xl px-1 py-1.5 text-[10px] font-medium",
                  active ? "text-primary" : "text-muted-foreground",
                )}
              >
                <span
                  className={cn(
                    "flex h-9 w-9 items-center justify-center rounded-2xl transition-colors",
                    isFab
                      ? "brand-gradient shadow-raised text-primary-foreground"
                      : active
                        ? "bg-primary-soft"
                        : "bg-transparent",
                  )}
                >
                  <Icon className="h-[18px] w-[18px]" strokeWidth={active || isFab ? 2.4 : 1.9} />
                </span>
                <span className="truncate">{t(item.key)}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
