"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/AuthProvider";

export default function MiCuentaPage() {
  const { perfil, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && perfil?.id) {
      router.replace(`/trabajadores/${perfil.id}`);
    }
  }, [loading, perfil, router]);

  if (loading) return <p className="text-sm text-slate-500">Cargando…</p>;
  if (!perfil) return (
    <div className="card p-5 text-sm text-slate-600">
      Tu usuario no está enlazado a ningún registro de trabajador. Pide al administrador que te enlace.
    </div>
  );
  return <p className="text-sm text-slate-500">Redirigiendo…</p>;
}
