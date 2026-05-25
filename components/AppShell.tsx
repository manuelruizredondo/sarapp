"use client";
import { usePathname, useRouter } from "next/navigation";
import Sidebar from "./Sidebar";
import MobileNav from "./MobileNav";
import SupabaseBanner from "./SupabaseBanner";
import { useAuth } from "./AuthProvider";

export default function AppShell({ children }: { children: React.ReactNode }) {
  const path = usePathname();
  const router = useRouter();
  const { loading, user, perfil, esSuperadmin, signOut, reloadPerfil } = useAuth();

  const isLogin = path === "/login";

  if (isLogin) return <>{children}</>;

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-sm" style={{ color: "#7B8794" }}>
        Cargando…
      </div>
    );
  }

  if (!user) {
    // El AuthProvider está redirigiendo a /login
    return null;
  }

  // Superadmin sin trabajador: es lo NORMAL (vive en plataforma_admins).
  // Se le muestra el shell normal; el sidebar le mostrará el menú "Empresas".
  // Si está en "/" sin trabajador propio, lo mandamos directamente a /superadmin.
  if (esSuperadmin && !perfil) {
    if (path === "/" || path === "") {
      // Lazy redirect a /superadmin
      if (typeof window !== "undefined") {
        router.replace("/superadmin");
      }
    }
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

  // Usuario logueado pero sin ficha y sin ser superadmin → bloqueo.
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
