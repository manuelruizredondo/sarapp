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
    try {
      // Timeout para que un fallo de Supabase no congele la app
      const p = await Promise.race<Promise<Trabajador | null>>([
        meTrabajador(),
        new Promise<Trabajador | null>((resolve) => setTimeout(() => resolve(null), 5000)),
      ]);
      setPerfil(p);
    } catch (e) {
      console.error("Error cargando perfil:", e);
      setPerfil(null);
    }
  }, []);

  useEffect(() => {
    if (!supabase) {
      setLoading(false);
      return;
    }
    let mounted = true;

    // Salvavidas: si nada termina en 7s, sal del estado de carga igualmente
    const killSwitch = setTimeout(() => {
      if (mounted) {
        console.warn("AuthProvider killSwitch: forzando salir de loading");
        setLoading(false);
      }
    }, 7000);

    (async () => {
      try {
        const sessionPromise = supabase.auth.getSession();
        const timeout = new Promise<{ data: { session: Session | null } }>((resolve) =>
          setTimeout(() => resolve({ data: { session: null } }), 5000)
        );
        const { data } = await Promise.race([sessionPromise, timeout]);
        if (!mounted) return;
        setSession(data.session ?? null);
        setUser(data.session?.user ?? null);
        if (data.session?.user) {
          await reloadPerfil();
        }
      } catch (e) {
        console.error("Error obteniendo sesión:", e);
      } finally {
        clearTimeout(killSwitch);
        if (mounted) setLoading(false);
      }
    })();

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
