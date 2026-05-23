"use client";
import { supabaseReady } from "@/lib/supabase";

export default function SupabaseBanner() {
  if (supabaseReady) return null;
  return (
    <div className="mb-6 rounded-xl border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-900">
      <strong>Supabase no está configurado.</strong>{" "}
      Copia <code className="font-mono">.env.local.example</code> a{" "}
      <code className="font-mono">.env.local</code> y rellena las claves de tu
      proyecto Supabase. Mientras tanto la app funciona con datos vacíos.
    </div>
  );
}
