import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin, requireAdminOrSuperadmin } from "@/lib/supabaseAdmin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// POST → crea usuario en Auth y registro en trabajadores (dentro de una empresa)
export async function POST(req: NextRequest) {
  const caller = await requireAdminOrSuperadmin(req.headers.get("authorization"));
  if (!caller) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

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
    empresa_id: empresaIdRaw,
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

  // Determinar empresa destino:
  //   - admin de empresa: solo puede crear en SU empresa, ignorando el body
  //   - superadmin: debe indicar empresa_id explícito en el body
  let empresaId: string | null;
  if (caller.esSuperadmin) {
    empresaId = (empresaIdRaw ?? null) as string | null;
    if (!empresaId) {
      return NextResponse.json(
        { error: "Superadmin debe indicar empresa_id" },
        { status: 400 }
      );
    }
  } else {
    empresaId = caller.empresaId;
    if (!empresaId) {
      return NextResponse.json(
        { error: "Tu usuario no tiene empresa asignada" },
        { status: 400 }
      );
    }
  }

  const admin = getSupabaseAdmin();

  // Verificar que la empresa existe y está activa
  const { data: emp } = await admin
    .from("empresas")
    .select("id, activo")
    .eq("id", empresaId)
    .maybeSingle();
  if (!emp) {
    return NextResponse.json({ error: "Empresa no encontrada" }, { status: 404 });
  }
  if (!emp.activo) {
    return NextResponse.json({ error: "Empresa desactivada" }, { status: 400 });
  }

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
      empresa_id: empresaId,
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
    // Si falla el insert en trabajadores, borra el auth user para no dejar huérfano
    await admin.auth.admin.deleteUser(created.user.id);
    return NextResponse.json({ error: trErr.message }, { status: 400 });
  }

  return NextResponse.json({ ok: true, trabajador: tr });
}

// DELETE → borra el usuario de Auth y el trabajador.
// Espera ?trabajador_id=... en la URL.
export async function DELETE(req: NextRequest) {
  const caller = await requireAdminOrSuperadmin(req.headers.get("authorization"));
  if (!caller) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const url = new URL(req.url);
  const trabajadorId = url.searchParams.get("trabajador_id");
  if (!trabajadorId) {
    return NextResponse.json({ error: "Falta trabajador_id" }, { status: 400 });
  }

  const admin = getSupabaseAdmin();

  const { data: tr } = await admin
    .from("trabajadores")
    .select("id, user_id, empresa_id")
    .eq("id", trabajadorId)
    .maybeSingle();

  if (!tr) {
    return NextResponse.json({ error: "Trabajador no encontrado" }, { status: 404 });
  }

  // Admin de empresa: solo puede borrar de su empresa
  if (!caller.esSuperadmin && tr.empresa_id !== caller.empresaId) {
    return NextResponse.json({ error: "No autorizado para esa empresa" }, { status: 403 });
  }

  if (tr.user_id) {
    await admin.auth.admin.deleteUser(tr.user_id);
  }
  const { error } = await admin.from("trabajadores").delete().eq("id", trabajadorId);
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });

  return NextResponse.json({ ok: true });
}

// PATCH → cambia la contraseña de un usuario.
// Body: { user_id, password }
export async function PATCH(req: NextRequest) {
  const caller = await requireAdminOrSuperadmin(req.headers.get("authorization"));
  if (!caller) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  let body: any;
  try { body = await req.json(); } catch { return NextResponse.json({ error: "JSON inválido" }, { status: 400 }); }
  const { user_id, password } = body ?? {};
  if (!user_id || !password || String(password).length < 6) {
    return NextResponse.json({ error: "user_id y password (mín 6) obligatorios" }, { status: 400 });
  }

  const admin = getSupabaseAdmin();

  // Admin de empresa: solo puede cambiar password de trabajadores de su empresa
  if (!caller.esSuperadmin) {
    const { data: tr } = await admin
      .from("trabajadores")
      .select("empresa_id")
      .eq("user_id", user_id)
      .maybeSingle();
    if (!tr || tr.empresa_id !== caller.empresaId) {
      return NextResponse.json({ error: "No autorizado para ese usuario" }, { status: 403 });
    }
  }

  const { error } = await admin.auth.admin.updateUserById(user_id, { password });
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });

  return NextResponse.json({ ok: true });
}
