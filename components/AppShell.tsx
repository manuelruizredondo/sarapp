"use client";
import { usePathname } from "next/navigation";
import Sidebar from "./Sidebar";
import SupabaseBanner from "./SupabaseBanner";
import { useAuth } from "./AuthProvider";

export default function AppShell({ children }: { children: React.ReactNode }) {
  const path = usePathname();
  const { loading, user, perfil, signOut } = useAuth();

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

  // Usuario logueado pero sin ficha en `trabajadores`
  if (!perfil) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <div className="card max-w-md p-6 text-center">
          <div className="text-2xl mb-2">🚫</div>
          <h2 className="font-semibold mb-1" style={{ color: "#062E73" }}>Sin ficha de trabajador</h2>
          <p className="text-sm mb-4" style={{ color: "#7B8794" }}>
            Tu usuario <strong>{user.email}</strong> está autenticado pero no está enlazado a ningún registro
            de trabajador. Pide al administrador que te enlace, o si eres el admin, ejecuta el SQL
            de enlace en Supabase.
          </p>
          <button onClick={signOut} className="btn-ghost">Cerrar sesión</button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <main className="flex-1 p-6 md:p-8 max-w-7xl mx-auto w-full">
        <SupabaseBanner />
        {children}
      </main>
    </div>
  );
}
