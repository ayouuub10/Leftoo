import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import type { AppRole, Profile } from "@/lib/domain";

type AuthValue = {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  role: AppRole | null;
  loading: boolean;
  refresh: () => Promise<void>;
};

const AuthContext = createContext<AuthValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [role, setRole] = useState<AppRole | null>(null);
  const [loading, setLoading] = useState(true);

  async function loadIdentity(userId: string | undefined) {
    if (!userId) {
      setProfile(null);
      setRole(null);
      return;
    }
    const [{ data: p }, { data: r }] = await Promise.all([
      supabase.from("profiles").select("*").eq("id", userId).maybeSingle(),
      supabase.from("user_roles").select("role").eq("user_id", userId),
    ]);
    setProfile(p ?? null);
    const roles = (r ?? []).map((x) => x.role as AppRole);
    setRole(roles.includes("admin") ? "admin" : (roles[0] ?? null));
  }

  useEffect(() => {
    let active = true;

    const { data: sub } = supabase.auth.onAuthStateChange((event, next) => {
      if (!active) return;
      setSession(next);
      if (event === "SIGNED_OUT") {
        setProfile(null);
        setRole(null);
        return;
      }
      if (next?.user) setTimeout(() => void loadIdentity(next.user.id), 0);
    });

    void (async () => {
      const { data } = await supabase.auth.getSession();
      if (!active) return;
      setSession(data.session);
      await loadIdentity(data.session?.user.id);
      setLoading(false);
    })();

    return () => {
      active = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  const value: AuthValue = {
    user: session?.user ?? null,
    session,
    profile,
    role,
    loading,
    refresh: () => loadIdentity(session?.user.id),
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}
