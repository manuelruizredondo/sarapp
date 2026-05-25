"use client";
import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";
import Sidebar from "./Sidebar";
import MobileNav from "./MobileNav";
import SupabaseBanner from "./SupabaseBanner";
import { useAuth } from "./AuthProvider";
import { LogoMark } from "./Logo";

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

  // Si eres superadmin sin trabajador y estás en "/", manda a /superadmin.
  useEffect(() => {
    if (!loading && esSuperadmin && !perfil && (path === "/" || path === "")) {
      router.replace("/superadmin");
    }
  }, [loading, esSuperadmin, perfil, path, router]);

  if (isLogin) return <>{children}</>;

  // Pantalla única de "Cargando aplicación…" mientras se inicializa todo.
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center"
        style={{ background: "#F7F9FC" }}>
        <div className="flex flex-col items-center gap-3">
          <LogoMark size={56} />
          <div className="flex items-center gap-2 text-sm" style={{ color: "#7B8794" }}>
            <span
              className="inline-block h-3 w-3 rounded-full animate-pulse"
              style={{ background: "#17C7C8" }}
            />
            Cargando aplicación…
          </div>
        </div>
      </div>
    );
  }

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
