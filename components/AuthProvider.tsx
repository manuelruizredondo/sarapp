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
  loading: boolean;
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
  const [empresa, setEmpresa] = useState<Empresa | null>(null);
  const [superadmin, setSuperadmin] = useState<PlataformaAdmin | null>(null);
  const [loading, setLoading] = useState(true);

  const reloadPerfil = useCallback(async () => {
    try {
      // 1) ¿Es superadmin (plataforma_admins)?
      const sa = await Promise.race<Promise<PlataformaAdmin | null>>([
        meSuperadmin(),
        new Promise<PlataformaAdmin | null>((resolve) =>
          setTimeout(() => resolve(null), 5000)
        ),
      ]);
      setSuperadmin(sa);

      // 2) Ficha de trabajador (puede no existir si solo eres superadmin)
      let p = await Promise.race<Promise<Trabajador | null>>([
        meTrabajador(),
        new Promise<Trabajador | null>((resolve) =>
          setTimeout(() => resolve(null), 5000)
        ),
      ]);

      // 3) Si no es superadmin y no tiene ficha → intentamos bootstrap (enlazar
      //    a una ficha pre-creada con el mismo email, p.ej. el primer admin
      //    de una empresa que ha sido dada de alta por el superadmin).
      if (!sa && !p) {
        p = await Promise.race<Promise<Trabajador | null>>([
          bootstrapMiTrabajador(),
          new Promise<Trabajador | null>((resolve) =>
            setTimeout(() => resolve(null), 7000)
          ),
        ]);
      }

      setPerfil(p);

      // 4) Cargar la empresa del trabajador (si tiene)
      if (p?.empresa_id) {
        const e = await getEmpresa(p.empresa_id);
        setEmpresa(e);
      } else {
        setEmpresa(null);
      }
    } catch (e) {
      console.error("Error cargando perfil:", e);
      setPerfil(null);
      setEmpresa(null);
      setSuperadmin(null);
    }
  }, []);

  useEffect(() => {
    if (!supabase) {
      setLoading(false);
      return;
    }
    let mounted = true;

    const killSwitch = setTimeout(() => {
      if (mounted) {
        console.warn("AuthProvider killSwitch: forzando salir de loading");
        setLoading(false);
      }
    }, 8000);

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
      if (s?.user) {
        await reloadPerfil();
      } else {
        setPerfil(null);
        setEmpresa(null);
        setSuperadmin(null);
      }
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
        signOut,
        reloadPerfil,
      }}
    >
      {children}
    </AuthCtx.Provider>
  );
}
