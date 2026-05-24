// SERVIDOR ÚNICAMENTE — NO importar este archivo desde componentes "use client".
import { createClient, SupabaseClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

export function getSupabaseAdmin(): SupabaseClient {
  if (!url || !serviceKey) {
    throw new Error(
      "Faltan variables: NEXT_PUBLIC_SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY"
    );
  }
  return createClient(url, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

/**
 * Comprueba el token JWT del request y verifica que el usuario sea admin.
 * Devuelve el user_id del autenticado o null si no.
 */
export async function requireAdmin(authHeader: string | null): Promise<string | null> {
  if (!authHeader?.startsWith("Bearer ")) return null;
  const token = authHeader.slice(7);
  const admin = getSupabaseAdmin();

  const { data: userRes, error } = await admin.auth.getUser(token);
  if (error || !userRes.user) return null;

  const { data: tr } = await admin
    .from("trabajadores")
    .select("rol")
    .eq("user_id", userRes.user.id)
    .maybeSingle();

  if (tr?.rol !== "admin") return null;
  return userRes.user.id;
}
