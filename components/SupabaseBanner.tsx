"use client";
import { supabaseReady } from "@/lib/supabase";

export default function SupabaseBanner() {
  if (supabaseReady) return null;
  return (
    <div
      className="mb-6 rounded-xl border px-4 py-3 text-sm"
      style={{ borderColor: "#F5B700", background: "#FFF8E1", color: "#7a5d00" }}
    >
      <strong>Supabase no está configurado.</strong>{" "}
      Copia <code className="font-mono">.env.local.example</code> a{" "}
      <code className="font-mono">.env.local</code> y rellena las claves de tu
      proyecto Supabase.
    </div>
  );
}
