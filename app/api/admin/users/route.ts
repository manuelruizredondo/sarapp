import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin, requireAdmin } from "@/lib/supabaseAdmin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// POST → crea usuario en Auth y registro en trabajadores
export async function POST(req: NextRequest) {
  const adminUserId = await requireAdmin(req.headers.get("authorization"));
  if (!adminUserId) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  let body: any;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "JSON inválido" }, { status: 400 });
  }

  const {
    email,
    password,
    nombre,
    apellidos,
    puesto,
    departamento,
    dias_vacaciones_anuales = 22,
    color = "#062E73",
    rol = "trabajador",
    activo = true,
  } = body ?? {};

  if (!email || !password || !nombre) {
    return NextResponse.json(
      { error: "Faltan campos: email, password y nombre son obligatorios" },
      { status: 400 }
    );
  }
  if (rol !== "trabajador" && rol !== "admin") {
    return NextResponse.json({ error: "Rol inválido" }, { status: 400 });
  }
  if (String(password).length < 6) {
    return NextResponse.json(
      { error: "La contraseña debe tener al menos 6 caracteres" },
      { status: 400 }
    );
  }

  const admin = getSupabaseAdmin();

  // 1. crea el usuario en Supabase Auth (autoconfirmado)
  const { data: created, error: createErr } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });
  if (createErr || !created.user) {
    return NextResponse.json(
      { error: createErr?.message ?? "No se pudo crear el usuario" },
      { status: 400 }
    );
  }

  // 2. inserta o actualiza el registro en trabajadores
  const { data: tr, error: trErr } = await admin
    .from("trabajadores")
    .insert({
      nombre,
      apellidos: apellidos || null,
      email,
      puesto: puesto || null,
      departamento: departamento || null,
      dias_vacaciones_anuales: Number(dias_vacaciones_anuales) || 22,
      color,
      rol,
      activo,
      user_id: created.user.id,
    })
    .select()
    .single();

  if (trErr) {
    // Si falla el insert en trabajadores, intenta borrar el auth user para no dejar huérfano
    await admin.auth.admin.deleteUser(created.user.id);
    return NextResponse.json({ error: trErr.message }, { status: 400 });
  }

  return NextResponse.json({ ok: true, trabajador: tr });
}

// DELETE → borra el usuario de Auth y el trabajador.
// Espera ?trabajador_id=... en la URL.
export async function DELETE(req: NextRequest) {
  const adminUserId = await requireAdmin(req.headers.get("authorization"));
  if (!adminUserId) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const url = new URL(req.url);
  const trabajadorId = url.searchParams.get("trabajador_id");
  if (!trabajadorId) {
    return NextResponse.json({ error: "Falta trabajador_id" }, { status: 400 });
  }

  const admin = getSupabaseAdmin();

  const { data: tr } = await admin
    .from("trabajadores")
    .select("id, user_id")
    .eq("id", trabajadorId)
    .maybeSingle();

  if (tr?.user_id) {
    await admin.auth.admin.deleteUser(tr.user_id);
  }
  const { error } = await admin.from("trabajadores").delete().eq("id", trabajadorId);
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });

  return NextResponse.json({ ok: true });
}

// PATCH → cambia la contraseña de un usuario.
// Body: { user_id, password }
export async function PATCH(req: NextRequest) {
  const adminUserId = await requireAdmin(req.headers.get("authorization"));
  if (!adminUserId) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  let body: any;
  try { body = await req.json(); } catch { return NextResponse.json({ error: "JSON inválido" }, { status: 400 }); }
  const { user_id, password } = body ?? {};
  if (!user_id || !password || String(password).length < 6) {
    return NextResponse.json({ error: "user_id y password (mín 6) obligatorios" }, { status: 400 });
  }

  const admin = getSupabaseAdmin();
  const { error } = await admin.auth.admin.updateUserById(user_id, { password });
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });

  return NextResponse.json({ ok: true });
}
