"use client";
import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";
import Sidebar from "./Sidebar";
import MobileNav from "./MobileNav";
import SupabaseBanner from "./SupabaseBanner";
import { useAuth } from "./AuthProvider";

export default function AppShell({ children }: { children: React.ReactNode }) {
  const path = usePathname();
  const router = useRouter();
  const {
    loading,
    perfilLoading,
    user,
    perfil,
    esSuperadmin,
    signOut,
    reloadPerfil,
  } = useAuth();

  const isLogin = path === "/login";

  // Si eres superadmin sin trabajador y estás en "/", manda a /superadmin.
  useEffect(() => {
    if (!loading && !perfilLoading && esSuperadmin && !perfil && (path === "/" || path === "")) {
      router.replace("/superadmin");
    }
  }, [loading, perfilLoading, esSuperadmin, perfil, path, router]);

  if (isLogin) return <>{children}</>;

  // 1) Verificación de sesión inicial (debería ser <1s)
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-sm" style={{ color: "#7B8794" }}>
        Cargando…
      </div>
    );
  }

  // 2) Sin sesión → AuthProvider está redirigiendo a /login
  if (!user) return null;

  // 3) Estamos cargando el perfil tras un login → enseñamos el shell con loader
  //    inline en vez de "Sin acceso", para evitar parpadeos.
  if (perfilLoading) {
    return (
      <div className="flex min-h-screen flex-col md:flex-row">
        <div className="hidden md:flex w-60 shrink-0 border-r bg-white" style={{ borderColor: "#E5EAF2" }} />
        <main className="flex-1 p-4 md:p-8 max-w-7xl mx-auto w-full">
          <div className="min-h-[60vh] flex items-center justify-center text-sm" style={{ color: "#7B8794" }}>
            Cargando tu cuenta…
          </div>
        </main>
      </div>
    );
  }

  // 4) Superadmin sin ficha (lo normal): se muestra el shell completo;
  //    el sidebar le sirve el menú "Empresas".
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

  // 5) Autenticado pero sin trabajador y sin ser superadmin → bloqueo.
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

  // 6) Caso normal: usuario con ficha
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
