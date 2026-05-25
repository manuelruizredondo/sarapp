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

/** Devuelve el user_id del token o null si inválido. */
async function userIdFromToken(authHeader: string | null): Promise<string | null> {
  if (!authHeader?.startsWith("Bearer ")) return null;
  const token = authHeader.slice(7);
  const admin = getSupabaseAdmin();
  const { data, error } = await admin.auth.getUser(token);
  if (error || !data.user) return null;
  return data.user.id;
}

/**
 * Verifica que el caller sea superadmin de plataforma.
 * Devuelve el user_id o null.
 */
export async function requireSuperadmin(authHeader: string | null): Promise<string | null> {
  const userId = await userIdFromToken(authHeader);
  if (!userId) return null;
  const admin = getSupabaseAdmin();
  const { data } = await admin
    .from("plataforma_admins")
    .select("id")
    .eq("user_id", userId)
    .maybeSingle();
  return data ? userId : null;
}

/**
 * Verifica que el caller sea admin (de empresa) O superadmin de plataforma.
 * Devuelve { userId, empresaId, esSuperadmin } o null si no autorizado.
 *
 * - Superadmin: empresaId = null (no tiene empresa propia).
 * - Admin de empresa: empresaId = empresa_id de su ficha.
 */
export async function requireAdminOrSuperadmin(
  authHeader: string | null
): Promise<{ userId: string; empresaId: string | null; esSuperadmin: boolean } | null> {
  const userId = await userIdFromToken(authHeader);
  if (!userId) return null;
  const admin = getSupabaseAdmin();

  // ¿Superadmin?
  const { data: sa } = await admin
    .from("plataforma_admins")
    .select("id")
    .eq("user_id", userId)
    .maybeSingle();
  if (sa) return { userId, empresaId: null, esSuperadmin: true };

  // ¿Admin de empresa?
  const { data: tr } = await admin
    .from("trabajadores")
    .select("rol, empresa_id")
    .eq("user_id", userId)
    .maybeSingle();
  if (tr?.rol === "admin" && tr.empresa_id) {
    return { userId, empresaId: tr.empresa_id, esSuperadmin: false };
  }
  return null;
}

/**
 * Compat: la API antigua. Devuelve user_id si es admin (de empresa o superadmin),
 * null en cualquier otro caso.
 */
export async function requireAdmin(authHeader: string | null): Promise<string | null> {
  const r = await requireAdminOrSuperadmin(authHeader);
  return r?.userId ?? null;
}
