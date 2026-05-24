"use client";
import { usePathname } from "next/navigation";
import Sidebar from "./Sidebar";
import SupabaseBanner from "./SupabaseBanner";
import { useAuth } from "./AuthProvider";

export default function AppShell({ children }: { children: React.ReactNode }) {
  const path = usePathname();
  const { loading, user } = useAuth();

  const isLogin = path === "/login";

  if (isLogin) {
    return <>{children}</>;
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-sm text-slate-500">
        Cargando…
      </div>
    );
  }

  if (!user) {
    // El AuthProvider está redirigiendo a /login
    return null;
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
