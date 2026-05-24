"use client";
import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
} from "react";
import { useRouter, usePathname } from "next/navigation";
import { supabase, supabaseReady } from "@/lib/supabase";
import type { Session, User } from "@supabase/supabase-js";
import { meTrabajador } from "@/lib/data";
import type { Trabajador } from "@/lib/types";

type Ctx = {
  user: User | null;
  session: Session | null;
  perfil: Trabajador | null;
  loading: boolean;
  signOut: () => Promise<void>;
  reloadPerfil: () => Promise<void>;
};

const AuthCtx = createContext<Ctx>({
  user: null,
  session: null,
  perfil: null,
  loading: true,
  signOut: async () => {},
  reloadPerfil: async () => {},
});

export const useAuth = () => useContext(AuthCtx);

const PUBLIC_ROUTES = ["/login"];

export default function AuthProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const path = usePathname();
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [perfil, setPerfil] = useState<Trabajador | null>(null);
  const [loading, setLoading] = useState(true);

  const reloadPerfil = useCallback(async () => {
    const p = await meTrabajador();
    setPerfil(p);
  }, []);

  useEffect(() => {
    if (!supabase) {
      setLoading(false);
      return;
    }
    let mounted = true;

    supabase.auth.getSession().then(async ({ data }) => {
      if (!mounted) return;
      setSession(data.session ?? null);
      setUser(data.session?.user ?? null);
      if (data.session?.user) await reloadPerfil();
      setLoading(false);
    });

    const { data: sub } = supabase.auth.onAuthStateChange(async (_event, s) => {
      setSession(s ?? null);
      setUser(s?.user ?? null);
      if (s?.user) await reloadPerfil();
      else setPerfil(null);
    });
    return () => {
      mounted = false;
      sub.subscription.unsubscribe();
    };
  }, [reloadPerfil]);

  // Redirige según estado de sesión
  useEffect(() => {
    if (loading) return;
    if (!supabaseReady) return;
    const isPublic = PUBLIC_ROUTES.includes(path ?? "");
    if (!user && !isPublic) router.replace("/login");
    if (user && isPublic) router.replace("/");
  }, [user, loading, path, router]);

  const signOut = async () => {
    if (!supabase) return;
    await supabase.auth.signOut();
    router.replace("/login");
  };

  return (
    <AuthCtx.Provider value={{ user, session, perfil, loading, signOut, reloadPerfil }}>
      {children}
    </AuthCtx.Provider>
  );
}
