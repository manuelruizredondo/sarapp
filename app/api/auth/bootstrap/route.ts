import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// POST → Si el usuario autenticado no tiene fila en `trabajadores`,
// se la crea. Si es el primer usuario del sistema, lo marca como admin.
export async function POST(req: NextRequest) {
  const auth = req.headers.get("authorization");
  if (!auth?.startsWith("Bearer ")) {
    return NextResponse.json({ error: "Sin token" }, { status: 401 });
  }
  const token = auth.slice(7);
  const admin = getSupabaseAdmin();

  // Validar token y obtener el user
  const { data: userRes, error: uErr } = await admin.auth.getUser(token);
  if (uErr || !userRes.user) {
    return NextResponse.json({ error: "Token inválido" }, { status: 401 });
  }
  const user = userRes.user;

  // ¿Ya tiene ficha?
  const { data: existing } = await admin
    .from("trabajadores")
    .select("*")
    .eq("user_id", user.id)
    .maybeSingle();
  if (existing) {
    return NextResponse.json({ ok: true, trabajador: existing, created: false });
  }

  // Si hay fila con el mismo email pero sin user_id (creada manualmente o por
  // import), la enlazamos en vez de crear duplicado.
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

  // ¿Hay algún admin en el sistema? Si no, este será el primero
  const { count: adminCount } = await admin
    .from("trabajadores")
    .select("*", { count: "exact", head: true })
    .eq("rol", "admin");

  const esPrimero = (adminCount ?? 0) === 0;
  const rol = esPrimero ? "admin" : "trabajador";

  // Calcular un color rotatorio según número total de trabajadores
  const { count: totalCount } = await admin
    .from("trabajadores")
    .select("*", { count: "exact", head: true });
  const paleta = [
    "#062E73", "#17C7C8", "#63E0DA", "#16C784", "#F5B700",
    "#E5484D", "#8b5cf6", "#ec4899", "#0ea5e9", "#f97316",
  ];
  const color = paleta[(totalCount ?? 0) % paleta.length];

  // Nombre por defecto a partir del email
  const local = (user.email ?? "").split("@")[0];
  const nombre = local
    ? local.charAt(0).toUpperCase() + local.slice(1).replace(/[\.\-_]+/g, " ")
    : "Usuario";

  const { data: created, error: insErr } = await admin
    .from("trabajadores")
    .insert({
      nombre,
      email: user.email,
      user_id: user.id,
      rol,
      dias_vacaciones_anuales: 22,
      color,
      activo: true,
    })
    .select()
    .single();

  if (insErr) {
    return NextResponse.json({ error: insErr.message }, { status: 400 });
  }

  return NextResponse.json({
    ok: true,
    trabajador: created,
    created: true,
    promotedToAdmin: esPrimero,
  });
}
