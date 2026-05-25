import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin, requireSuperadmin } from "@/lib/supabaseAdmin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Slug seguro: minúsculas, guiones, sin acentos
function normalizarSlug(input: string): string {
  return input
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
}

// GET → listado de empresas
export async function GET(req: NextRequest) {
  const userId = await requireSuperadmin(req.headers.get("authorization"));
  if (!userId) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const admin = getSupabaseAdmin();
  const { data: empresas, error } = await admin
    .from("empresas")
    .select("*")
    .order("nombre", { ascending: true });
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });

  // Conteo de trabajadores por empresa (en una sola query)
  const { data: counts } = await admin
    .from("trabajadores")
    .select("empresa_id")
    .eq("activo", true);
  const conteo: Record<string, number> = {};
  for (const row of counts ?? []) {
    if (row.empresa_id) conteo[row.empresa_id] = (conteo[row.empresa_id] ?? 0) + 1;
  }

  const empresasConConteo = (empresas ?? []).map((e: any) => ({
    ...e,
    n_trabajadores: conteo[e.id] ?? 0,
  }));

  return NextResponse.json({ ok: true, empresas: empresasConConteo });
}

// POST → crea una nueva empresa + su primer admin
// Body: { nombre, slug?, color?, plan?, admin_email, admin_password, admin_nombre }
export async function POST(req: NextRequest) {
  const userId = await requireSuperadmin(req.headers.get("authorization"));
  if (!userId) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  let body: any;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "JSON inválido" }, { status: 400 });
  }

  const {
    nombre,
    slug: slugRaw,
    color = "#062E73",
    plan = "free",
    admin_email,
    admin_password,
    admin_nombre,
  } = body ?? {};

  if (!nombre || !admin_email || !admin_password || !admin_nombre) {
    return NextResponse.json(
      { error: "Faltan campos: nombre, admin_email, admin_password, admin_nombre" },
      { status: 400 }
    );
  }
  if (String(admin_password).length < 6) {
    return NextResponse.json(
      { error: "La contraseña del admin debe tener al menos 6 caracteres" },
      { status: 400 }
    );
  }

  const slug = normalizarSlug(slugRaw || nombre);
  if (!slug) {
    return NextResponse.json({ error: "Slug inválido" }, { status: 400 });
  }

  const admin = getSupabaseAdmin();

  // 0) Si el email ya está en auth.users, reutilizamos ese user_id en vez
  //    de fallar. Si no, lo creamos. Buscamos por email vía listUsers
  //    (la API admin no expone getUserByEmail directamente).
  let authUserId: string | null = null;
  let authUserCreado = false;
  try {
    const { data: list, error: listErr } = await admin.auth.admin.listUsers({
      page: 1,
      perPage: 200,
    });
    if (!listErr && list?.users) {
      const existente = list.users.find(
        (u: any) => u.email?.toLowerCase() === String(admin_email).toLowerCase()
      );
      if (existente) {
        authUserId = existente.id;
        // Aseguramos password actualizada y email confirmado
        await admin.auth.admin.updateUserById(existente.id, {
          password: admin_password,
          email_confirm: true,
        });
      }
    }
  } catch (e) {
    // listUsers puede paginar; si falla seguimos al createUser
  }

  if (!authUserId) {
    const { data: created, error: userErr } = await admin.auth.admin.createUser({
      email: admin_email,
      password: admin_password,
      email_confirm: true,
    });
    if (userErr || !created.user) {
      return NextResponse.json(
        { error: userErr?.message ?? "No se pudo crear el usuario admin" },
        { status: 400 }
      );
    }
    authUserId = created.user.id;
    authUserCreado = true;
  }

  // 0b) Si ese auth user ya tiene una ficha de trabajador en OTRA empresa,
  //     no podemos usarlo como admin de una nueva empresa.
  const { data: existenteTr } = await admin
    .from("trabajadores")
    .select("id, empresa_id, empresas(nombre)")
    .eq("user_id", authUserId)
    .maybeSingle();
  if (existenteTr) {
    return NextResponse.json(
      {
        error: `El usuario ${admin_email} ya pertenece a otra empresa. Pide que use otro email o bórralo primero.`,
      },
      { status: 400 }
    );
  }

  // 1) Crear empresa
  const { data: empresa, error: empErr } = await admin
    .from("empresas")
    .insert({ nombre, slug, color, plan, activo: true })
    .select()
    .single();
  if (empErr) {
    // Si creamos el auth user en este request, lo borramos en el rollback
    if (authUserCreado) {
      await admin.auth.admin.deleteUser(authUserId).catch(() => {});
    }
    const msg =
      empErr.code === "23505"
        ? `Ya existe una empresa con slug "${slug}"`
        : empErr.message;
    return NextResponse.json({ error: msg }, { status: 400 });
  }

  // 2) Crear ficha de trabajador (admin de empresa)
  const { data: trabajador, error: trErr } = await admin
    .from("trabajadores")
    .insert({
      empresa_id: empresa.id,
      nombre: admin_nombre,
      email: admin_email,
      user_id: authUserId,
      rol: "admin",
      color,
      activo: true,
      dias_vacaciones_anuales: 22,
    })
    .select()
    .single();
  if (trErr) {
    // Rollback de empresa y, si creamos el auth user aquí, también del auth user
    await admin.from("empresas").delete().eq("id", empresa.id);
    if (authUserCreado) {
      await admin.auth.admin.deleteUser(authUserId).catch(() => {});
    }
    return NextResponse.json({ error: trErr.message }, { status: 400 });
  }

  return NextResponse.json({
    ok: true,
    empresa,
    admin: trabajador,
    auth_user_reused: !authUserCreado,
  });
}

// PATCH → editar empresa (nombre, slug, color, plan, activo, notas)
// Espera ?id=... en la URL
export async function PATCH(req: NextRequest) {
  const userId = await requireSuperadmin(req.headers.get("authorization"));
  if (!userId) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const url = new URL(req.url);
  const id = url.searchParams.get("id");
  if (!id) return NextResponse.json({ error: "Falta id" }, { status: 400 });

  let body: any;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "JSON inválido" }, { status: 400 });
  }

  const patch: Record<string, any> = {};
  if (typeof body.nombre === "string") patch.nombre = body.nombre;
  if (typeof body.slug === "string") patch.slug = normalizarSlug(body.slug);
  if (typeof body.color === "string") patch.color = body.color;
  if (typeof body.plan === "string") patch.plan = body.plan;
  if (typeof body.activo === "boolean") patch.activo = body.activo;
  if (typeof body.notas === "string" || body.notas === null) patch.notas = body.notas;

  if (Object.keys(patch).length === 0) {
    return NextResponse.json({ error: "Nada que actualizar" }, { status: 400 });
  }

  const admin = getSupabaseAdmin();
  const { data, error } = await admin
    .from("empresas")
    .update(patch)
    .eq("id", id)
    .select()
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });

  return NextResponse.json({ ok: true, empresa: data });
}

// DELETE → borra una empresa (en cascada: trabajadores, ausencias, asistencias, festivos locales)
// ⚠️ Acción destructiva. Espera ?id=...
export async function DELETE(req: NextRequest) {
  const userId = await requireSuperadmin(req.headers.get("authorization"));
  if (!userId) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const url = new URL(req.url);
  const id = url.searchParams.get("id");
  if (!id) return NextResponse.json({ error: "Falta id" }, { status: 400 });

  const admin = getSupabaseAdmin();

  // Antes de borrar la empresa, borrar los auth_users de sus trabajadores
  const { data: trabajadores } = await admin
    .from("trabajadores")
    .select("user_id")
    .eq("empresa_id", id);
  for (const t of trabajadores ?? []) {
    if (t.user_id) {
      await admin.auth.admin.deleteUser(t.user_id).catch(() => {});
    }
  }

  const { error } = await admin.from("empresas").delete().eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });

  return NextResponse.json({ ok: true });
}
