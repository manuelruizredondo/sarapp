"use client";
import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  useRef,
} from "react";
import { useRouter, usePathname } from "next/navigation";
import { supabase, supabaseReady } from "@/lib/supabase";
import type { Session, User } from "@supabase/supabase-js";
import {
  bootstrapMiTrabajador,
  getEmpresa,
  meSuperadmin,
  meTrabajador,
} from "@/lib/data";
import type {
  Empresa,
  PlataformaAdmin,
  RolEfectivo,
  Trabajador,
} from "@/lib/types";

type Ctx = {
  user: User | null;
  session: Session | null;
  perfil: Trabajador | null;
  empresa: Empresa | null;
  superadmin: PlataformaAdmin | null;
  esSuperadmin: boolean;
  rolEfectivo: RolEfectivo | null;
  /** True mientras se verifica la sesión inicial (~1s). */
  loading: boolean;
  /** True mientras se carga superadmin/trabajador/empresa tras un login. */
  perfilLoading: boolean;
  signOut: () => Promise<void>;
  reloadPerfil: () => Promise<void>;
};

const AuthCtx = createContext<Ctx>({
  user: null,
  session: null,
  perfil: null,
  empresa: null,
  superadmin: null,
  esSuperadmin: false,
  rolEfectivo: null,
  loading: true,
  perfilLoading: false,
  signOut: async () => {},
  reloadPerfil: async () => {},
});

export const useAuth = () => useContext(AuthCtx);

const PUBLIC_ROUTES = ["/login"];

// Helper: ejecuta una promesa con timeout devolviendo valor por defecto si se agota.
function withTimeout<T>(p: Promise<T>, ms: number, fallback: T): Promise<T> {
  return Promise.race<T>([
    p,
    new Promise<T>((resolve) => setTimeout(() => resolve(fallback), ms)),
  ]);
}

export default function AuthProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const path = usePathname();
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [perfil, setPerfil] = useState<Trabajador | null>(null);
  const [empresa, setEmpresa] = useState<Empresa | null>(null);
  const [superadmin, setSuperadmin] = useState<PlataformaAdmin | null>(null);
  const [loading, setLoading] = useState(true);
  const [perfilLoading, setPerfilLoading] = useState(false);

  // Lock para evitar concurrent reloadPerfil. Si una llamada está en vuelo,
  // las siguientes esperan a que termine en vez de duplicar el trabajo.
  const inFlightRef = useRef<Promise<void> | null>(null);

  const _doReload = useCallback(async () => {
    setPerfilLoading(true);
    try {
      // 1) Intento rápido: leer en paralelo plataforma_admins y trabajadores.
      let [sa, p] = await Promise.all([
        withTimeout(meSuperadmin(), 4000, null),
        withTimeout(meTrabajador(), 4000, null),
      ]);

      // 2) Si nada en ninguna, bootstrap (idempotente) + re-lectura.
      if (!sa && !p) {
        await withTimeout(bootstrapMiTrabajador(), 6000, null);
        [sa, p] = await Promise.all([
          withTimeout(meSuperadmin(), 4000, null),
          withTimeout(meTrabajador(), 4000, null),
        ]);
      }

      setSuperadmin(sa);
      setPerfil(p);

      // 3) Cargar empresa del trabajador (si tiene)
      if (p?.empresa_id) {
        const e = await withTimeout(getEmpresa(p.empresa_id), 4000, null);
        setEmpresa(e);
      } else {
        setEmpresa(null);
      }
    } catch (e) {
      console.error("Error cargando perfil:", e);
      setPerfil(null);
      setEmpresa(null);
      setSuperadmin(null);
    } finally {
      setPerfilLoading(false);
    }
  }, []);

  // Coalesce: si ya hay una recarga en marcha, devolvemos la misma promesa.
  const reloadPerfil = useCallback(async () => {
    if (inFlightRef.current) {
      return inFlightRef.current;
    }
    const p = _doReload().finally(() => {
      inFlightRef.current = null;
    });
    inFlightRef.current = p;
    return p;
  }, [_doReload]);

  // ÚNICO punto de entrada: onAuthStateChange. Supabase emite INITIAL_SESSION
  // al suscribirse, así que no hace falta un getSession manual.
  useEffect(() => {
    if (!supabase) {
      setLoading(false);
      return;
    }
    let mounted = true;

    // Salvavidas: si INITIAL_SESSION no llega en 4s, salir de loading igualmente.
    const killSwitch = setTimeout(() => {
      if (mounted) setLoading(false);
    }, 4000);

    const { data: sub } = supabase.auth.onAuthStateChange(async (event, s) => {
      if (!mounted) return;

      setSession(s ?? null);
      setUser(s?.user ?? null);

      // INITIAL_SESSION marca el fin del "loading inicial" de la app.
      if (event === "INITIAL_SESSION") {
        clearTimeout(killSwitch);
        setLoading(false);
      }

      // Eventos que requieren cargar el perfil
      const debeCargarPerfil =
        s?.user &&
        (event === "INITIAL_SESSION" ||
          event === "SIGNED_IN" ||
          event === "USER_UPDATED");

      if (debeCargarPerfil) {
        await reloadPerfil();
      } else if (event === "SIGNED_OUT") {
        setPerfil(null);
        setEmpresa(null);
        setSuperadmin(null);
      }
    });

    return () => {
      mounted = false;
      clearTimeout(killSwitch);
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

  const esSuperadmin = !!superadmin;
  const rolEfectivo: RolEfectivo | null = esSuperadmin
    ? "superadmin"
    : perfil?.rol ?? null;

  return (
    <AuthCtx.Provider
      value={{
        user,
        session,
        perfil,
        empresa,
        superadmin,
        esSuperadmin,
        rolEfectivo,
        loading,
        perfilLoading,
        signOut,
        reloadPerfil,
      }}
    >
      {children}
    </AuthCtx.Provider>
  );
}
