import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * POST → Enlaza el user autenticado con su ficha en plataforma_admins o
 * trabajadores. NO crea trabajadores nuevos automáticamente: los empleados se
 * dan de alta desde la UI (admin de empresa o superadmin) con empresa_id explícito.
 *
 * Comportamientos posibles:
 *  - El email está en plataforma_admins sin user_id → lo enlaza (superadmin).
 *  - Existe una fila en trabajadores con ese email y sin user_id → la enlaza
 *    (caso normal: el admin acaba de crear al trabajador y este se loguea por
 *    primera vez). Pero esto YA no debería ocurrir porque /api/admin/users
 *    crea el auth_user; queda como red de seguridad para imports antiguos.
 *  - Ya tiene ficha → la devuelve.
 *  - Ningún match → devuelve 200 con `trabajador: null`. El cliente debe
 *    mostrar "tu cuenta no está vinculada a ninguna empresa".
 */
export async function POST(req: NextRequest) {
  const auth = req.headers.get("authorization");
  if (!auth?.startsWith("Bearer ")) {
    return NextResponse.json({ error: "Sin token" }, { status: 401 });
  }
  const token = auth.slice(7);
  const admin = getSupabaseAdmin();

  const { data: userRes, error: uErr } = await admin.auth.getUser(token);
  if (uErr || !userRes.user) {
    return NextResponse.json({ error: "Token inválido" }, { status: 401 });
  }
  const user = userRes.user;

  // 1) ¿Existe fila en plataforma_admins por email pendiente de enlazar?
  if (user.email) {
    const { data: saPending } = await admin
      .from("plataforma_admins")
      .select("*")
      .eq("email", user.email)
      .is("user_id", null)
      .maybeSingle();
    if (saPending) {
      await admin
        .from("plataforma_admins")
        .update({ user_id: user.id })
        .eq("id", saPending.id);
    }

    // Si está ya enlazada o se acaba de enlazar → es superadmin
    const { data: sa } = await admin
      .from("plataforma_admins")
      .select("*")
      .eq("user_id", user.id)
      .maybeSingle();
    if (sa) {
      return NextResponse.json({ ok: true, superadmin: sa, trabajador: null });
    }
  }

  // 2) ¿Ya tiene ficha de trabajador?
  const { data: existing } = await admin
    .from("trabajadores")
    .select("*")
    .eq("user_id", user.id)
    .maybeSingle();
  if (existing) {
    return NextResponse.json({ ok: true, trabajador: existing, created: false });
  }

  // 3) ¿Hay una ficha huérfana con su mismo email? La enlazamos.
  if (user.email) {
    const { data: orphan } = await admin
      .from("trabajadores")
      .select("*")
      .eq("email", user.email)
      .is("user_id", null)
      .maybeSingle();
    if (orphan) {
      const { data: linked, error } = await admin
        .from("trabajadores")
        .update({ user_id: user.id })
        .eq("id", orphan.id)
        .select()
        .single();
      if (error) return NextResponse.json({ error: error.message }, { status: 400 });
      return NextResponse.json({ ok: true, trabajador: linked, created: false, linked: true });
    }
  }

  // 4) No es superadmin y no tiene trabajador → cuenta sin asignar.
  // El cliente debe mostrar un mensaje al usuario.
  return NextResponse.json({
    ok: true,
    trabajador: null,
    error_amigable:
      "Tu cuenta existe en Auth pero no está vinculada a ninguna empresa. Pide a tu administrador que te dé de alta.",
  });
}
