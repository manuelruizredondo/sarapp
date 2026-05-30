"use client";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import Sidebar from "./Sidebar";
import MobileNav from "./MobileNav";
import SupabaseBanner from "./SupabaseBanner";
import { useAuth } from "./AuthProvider";
import { LogoMark } from "./Logo";
import Spinner from "./Spinner";

// Pantalla de carga a pantalla completa (logo + bolas orbitando).
function LoaderScreen() {
  return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: "#F7F9FC" }}>
      <div className="flex flex-col items-center gap-4">
        <LogoMark size={56} />
        <Spinner size={44} />
        <div className="text-sm" style={{ color: "#7B8794" }}>
          Cargando aplicación…
        </div>
      </div>
    </div>
  );
}

export default function AppShell({ children }: { children: React.ReactNode }) {
  const path = usePathname();
  const router = useRouter();
  const {
    loading,
    user,
    perfil,
    esSuperadmin,
    signOut,
    reloadPerfil,
  } = useAuth();

  const isLogin = path === "/login";

  // Tras el login hay un instante en que la sesión ya existe pero el perfil
  // todavía se está cargando. Antes eso provocaba un parpadeo de la pantalla
  // "Sin acceso asignado". Reintentamos la carga una vez (mostrando el loader)
  // y solo mostramos el bloqueo si de verdad no hay perfil.
  const [retrying, setRetrying] = useState(false);
  const retriedRef = useRef(false);

  // Si eres superadmin sin trabajador y estás en "/", manda a /superadmin.
  useEffect(() => {
    if (!loading && esSuperadmin && !perfil && (path === "/" || path === "")) {
      router.replace("/superadmin");
    }
  }, [loading, esSuperadmin, perfil, path, router]);

  // Auto-reintento de carga de perfil para evitar el flash de "Sin acceso".
  useEffect(() => {
    if (perfil || esSuperadmin || !user) {
      retriedRef.current = false; // reset para un futuro login
      return;
    }
    if (!loading && !retriedRef.current) {
      retriedRef.current = true;
      setRetrying(true);
      reloadPerfil().finally(() => setRetrying(false));
    }
  }, [loading, user, perfil, esSuperadmin, reloadPerfil]);

  if (isLogin) return <>{children}</>;

  // Pantalla única de carga mientras se inicializa todo o se reintenta el perfil.
  if (loading || retrying) return <LoaderScreen />;

  // Sin sesión → AuthProvider redirige a /login
  if (!user) return null;

  // Superadmin sin ficha de trabajador (lo normal): shell completo.
  if (esSuperadmin && !perfil) {
    return (
      <div className="flex min-h-screen flex-col md:flex-row">
        <Sidebar />
        <MobileNav />
        <main className="flex-1 p-4 md:p-8 max-w-7xl mx-auto w-full">
          <SupabaseBanner />
          {children}
        </main>
      </div>
    );
  }

  // Autenticado pero sin trabajador y sin ser superadmin → bloqueo definitivo.
  if (!perfil) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <div className="card max-w-md p-6 text-center">
          <div className="text-2xl mb-2">🚫</div>
          <h2 className="font-semibold mb-1" style={{ color: "#062E73" }}>Sin acceso asignado</h2>
          <p className="text-sm mb-4" style={{ color: "#7B8794" }}>
            Tu usuario <strong>{user.email}</strong> está autenticado pero no está vinculado a ninguna
            empresa todavía. Pide al administrador de tu empresa que te dé de alta como trabajador con
            este mismo email.
          </p>
          <div className="flex gap-2 justify-center">
            <button onClick={() => reloadPerfil()} className="btn-primary">Reintentar</button>
            <button onClick={signOut} className="btn-ghost">Cerrar sesión</button>
          </div>
        </div>
      </div>
    );
  }

  // Caso normal
  return (
    <div className="flex min-h-screen flex-col md:flex-row">
      <Sidebar />
      <MobileNav />
      <main className="flex-1 p-4 md:p-8 max-w-7xl mx-auto w-full">
        <SupabaseBanner />
        {children}
      </main>
    </div>
  );
}
