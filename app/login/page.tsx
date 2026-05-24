"use client";
import { useState } from "react";
import { supabase, supabaseReady } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import { LogoHorizontal } from "@/components/Logo";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!supabase) return;
    setError(null);
    setLoading(true);

    // CINTURÓN DE SEGURIDAD: ocurra lo que ocurra, en 12s salimos de loading
    const safety = setTimeout(() => {
      console.warn("[login] safety timeout: forzando salir de loading");
      setLoading(false);
    }, 12000);

    try {
      console.log("[login] enviando signInWithPassword…");
      const t0 = Date.now();
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      console.log(`[login] respuesta en ${Date.now() - t0}ms`, { hasData: !!data?.session, error });

      if (error) {
        setError(error.message);
        return;
      }
      router.replace("/");
    } catch (err: any) {
      console.error("[login] excepción:", err);
      setError(err?.message || "Error de conexión");
    } finally {
      clearTimeout(safety);
      setLoading(false);
    }
  }

  // Si el usuario teclea, asumimos que está corrigiendo el error anterior
  function clearOnType(setter: (v: string) => void) {
    return (e: React.ChangeEvent<HTMLInputElement>) => {
      if (error) setError(null);
      setter(e.target.value);
    };
  }

  return (
    <div
      className="min-h-screen flex items-center justify-center p-4"
      style={{
        background:
          "linear-gradient(135deg, #062E73 0%, #041B45 60%, #17C7C8 130%)",
      }}
    >
      <div className="card w-full max-w-sm p-6 shadow-soft">
        <div className="mb-6 flex items-center justify-center">
          <LogoHorizontal className="h-12" />
        </div>
        <div className="mb-6 text-center">
          <h1 className="text-lg font-bold" style={{ color: "#062E73" }}>
            Bienvenido
          </h1>
          <p className="text-sm" style={{ color: "#7B8794" }}>
            Accede a tu calendario de ausencias
          </p>
        </div>

        {!supabaseReady && (
          <div className="mb-4 rounded-lg border border-amber-300 bg-amber-50 px-3 py-2 text-xs text-amber-900">
            Supabase no está configurado. Define las variables de entorno.
          </div>
        )}

        <form onSubmit={onSubmit} className="space-y-3">
          <div>
            <label className="label">Email</label>
            <input
              className="input"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={clearOnType(setEmail)}
              disabled={loading}
            />
          </div>
          <div>
            <label className="label">Contraseña</label>
            <input
              className="input"
              type="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={clearOnType(setPassword)}
              disabled={loading}
            />
          </div>
          {/* Solo mostramos el error cuando NO estamos cargando, para evitar el flicker */}
          {error && !loading && (
            <div className="rounded-lg border border-rose-300 bg-rose-50 px-3 py-2 text-xs text-rose-900">
              {error === "Invalid login credentials"
                ? "Email o contraseña incorrectos."
                : error}
            </div>
          )}
          <button type="submit" disabled={loading} className="btn-primary w-full">
            {loading ? "Entrando…" : "Entrar"}
          </button>
        </form>

        <p className="mt-4 text-xs text-center" style={{ color: "#7B8794" }}>
          Si no tienes acceso, pide a tu administrador que cree tu usuario.
        </p>
      </div>
    </div>
  );
}
