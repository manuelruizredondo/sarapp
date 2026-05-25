"use client";
import { supabase } from "./supabase";
import type {
  Ausencia,
  Asistencia,
  Empresa,
  Festivo,
  PlataformaAdmin,
  Trabajador,
} from "./types";

// ---------- TRABAJADORES ----------
export async function listTrabajadores(): Promise<Trabajador[]> {
  if (!supabase) return [];
  const { data, error } = await supabase
    .from("trabajadores")
    .select("*")
    .order("nombre", { ascending: true });
  if (error) {
    console.error(error);
    return [];
  }
  return (data || []) as Trabajador[];
}

export async function upsertTrabajador(t: Partial<Trabajador>) {
  if (!supabase) throw new Error("Supabase no configurado");
  const { data, error } = await supabase
    .from("trabajadores")
    .upsert(t)
    .select()
    .single();
  if (error) throw error;
  return data as Trabajador;
}

export async function deleteTrabajador(id: string) {
  if (!supabase) throw new Error("Supabase no configurado");
  const { error } = await supabase.from("trabajadores").delete().eq("id", id);
  if (error) throw error;
}

// ---------- AUSENCIAS ----------
export async function listAusencias(): Promise<Ausencia[]> {
  if (!supabase) return [];
  const { data, error } = await supabase
    .from("ausencias")
    .select("*")
    .order("fecha_inicio", { ascending: false });
  if (error) {
    console.error(error);
    return [];
  }
  return (data || []) as Ausencia[];
}

export async function listAusenciasRango(desde: string, hasta: string): Promise<Ausencia[]> {
  if (!supabase) return [];
  // ausencias que solapan con el rango pedido
  const { data, error } = await supabase
    .from("ausencias")
    .select("*")
    .lte("fecha_inicio", hasta)
    .gte("fecha_fin", desde);
  if (error) {
    console.error(error);
    return [];
  }
  return (data || []) as Ausencia[];
}

// empresa_id se rellena vía trigger SQL desde trabajador_id; no hace falta pasarlo.
export async function createAusencia(a: Omit<Ausencia, "id" | "empresa_id">) {
  if (!supabase) throw new Error("Supabase no configurado");
  const { data, error } = await supabase
    .from("ausencias")
    .insert(a)
    .select()
    .single();
  if (error) throw error;
  return data as Ausencia;
}

export async function updateAusencia(id: string, patch: Partial<Ausencia>) {
  if (!supabase) throw new Error("Supabase no configurado");

  // Cinturón cliente: si la ausencia ya está aprobada y el patch intenta
  // cambiar algo que NO sea desvalidarla, lo bloqueamos aquí.
  const { data: actual, error: e1 } = await supabase
    .from("ausencias")
    .select("aprobado")
    .eq("id", id)
    .single();
  if (e1) throw e1;

  if (actual?.aprobado) {
    const camposCambiados = Object.keys(patch).filter((k) => k !== "aprobado");
    if (camposCambiados.length > 0 && patch.aprobado !== false) {
      throw new Error(
        "Esta ausencia está validada. Quita la validación 🚩 antes de modificar cualquier campo."
      );
    }
  }

  const { data, error } = await supabase
    .from("ausencias")
    .update(patch)
    .eq("id", id)
    .select()
    .single();
  if (error) throw error;
  return data as Ausencia;
}

export async function deleteAusencia(id: string) {
  if (!supabase) throw new Error("Supabase no configurado");

  // Cinturón cliente: no permitimos borrar ausencias validadas
  const { data: actual, error: e1 } = await supabase
    .from("ausencias")
    .select("aprobado")
    .eq("id", id)
    .single();
  if (e1) throw e1;
  if (actual?.aprobado) {
    throw new Error(
      "Esta ausencia está validada. Quita la validación 🚩 antes de borrarla."
    );
  }

  const { error } = await supabase.from("ausencias").delete().eq("id", id);
  if (error) throw error;
}

// ---------- FESTIVOS ----------
export async function listFestivos(): Promise<Festivo[]> {
  if (!supabase) return [];
  const { data, error } = await supabase
    .from("festivos")
    .select("*")
    .order("fecha", { ascending: true });
  if (error) {
    console.error(error);
    return [];
  }
  return (data || []) as Festivo[];
}

export async function listFestivosRango(desde: string, hasta: string): Promise<Festivo[]> {
  if (!supabase) return [];
  const { data, error } = await supabase
    .from("festivos")
    .select("*")
    .gte("fecha", desde)
    .lte("fecha", hasta);
  if (error) {
    console.error(error);
    return [];
  }
  return (data || []) as Festivo[];
}

export async function upsertFestivo(f: Partial<Festivo>) {
  if (!supabase) throw new Error("Supabase no configurado");
  const { data, error } = await supabase
    .from("festivos")
    .upsert(f)
    .select()
    .single();
  if (error) throw error;
  return data as Festivo;
}

export async function deleteFestivo(id: string) {
  if (!supabase) throw new Error("Supabase no configurado");
  const { error } = await supabase.from("festivos").delete().eq("id", id);
  if (error) throw error;
}

// ---------- ADMIN API (server side via /api/admin/users) ----------
async function getAuthHeader(): Promise<HeadersInit> {
  if (!supabase) return {};
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export async function adminCrearUsuario(payload: {
  email: string;
  password: string;
  nombre: string;
  apellidos?: string;
  puesto?: string;
  departamento?: string;
  dias_vacaciones_anuales?: number;
  color?: string;
  rol?: "admin" | "trabajador";
  activo?: boolean;
}) {
  const headers = { "Content-Type": "application/json", ...(await getAuthHeader()) };
  const r = await fetch("/api/admin/users", {
    method: "POST",
    headers,
    body: JSON.stringify(payload),
  });
  const json = await r.json();
  if (!r.ok) throw new Error(json.error ?? "Error creando usuario");
  return json.trabajador as Trabajador;
}

export async function adminBorrarUsuario(trabajadorId: string) {
  const headers = await getAuthHeader();
  const r = await fetch(`/api/admin/users?trabajador_id=${trabajadorId}`, {
    method: "DELETE",
    headers,
  });
  const json = await r.json();
  if (!r.ok) throw new Error(json.error ?? "Error borrando usuario");
}

export async function adminCambiarPassword(userId: string, password: string) {
  const headers = { "Content-Type": "application/json", ...(await getAuthHeader()) };
  const r = await fetch("/api/admin/users", {
    method: "PATCH",
    headers,
    body: JSON.stringify({ user_id: userId, password }),
  });
  const json = await r.json();
  if (!r.ok) throw new Error(json.error ?? "Error cambiando contraseña");
}

// ---------- BOOTSTRAP (auto-crea ficha al primer login) ----------
export async function bootstrapMiTrabajador(): Promise<Trabajador | null> {
  const headers = await getAuthHeader();
  if (!Object.keys(headers).length) return null;
  const r = await fetch("/api/auth/bootstrap", { method: "POST", headers });
  if (!r.ok) {
    console.error("Bootstrap falló:", await r.text());
    return null;
  }
  const json = await r.json();
  return (json.trabajador as Trabajador) ?? null;
}

// ---------- MI PERFIL (sesión actual) ----------
export async function meTrabajador(): Promise<Trabajador | null> {
  if (!supabase) return null;
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const { data, error } = await supabase
    .from("trabajadores")
    .select("*")
    .eq("user_id", user.id)
    .maybeSingle();
  if (error) {
    console.error(error);
    return null;
  }
  return (data as Trabajador) ?? null;
}

// ---------- SUPERADMIN ----------
// Devuelve la fila de plataforma_admins del usuario logueado, o null.
export async function meSuperadmin(): Promise<PlataformaAdmin | null> {
  if (!supabase) return null;
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const { data, error } = await supabase
    .from("plataforma_admins")
    .select("*")
    .eq("user_id", user.id)
    .maybeSingle();
  if (error) {
    // Si RLS bloquea la lectura es que no es superadmin → silencioso
    return null;
  }
  return (data as PlataformaAdmin) ?? null;
}

// ---------- EMPRESAS ----------
export async function listEmpresas(): Promise<Empresa[]> {
  if (!supabase) return [];
  const { data, error } = await supabase
    .from("empresas")
    .select("*")
    .order("nombre", { ascending: true });
  if (error) {
    console.error(error);
    return [];
  }
  return (data || []) as Empresa[];
}

export async function getEmpresa(id: string): Promise<Empresa | null> {
  if (!supabase) return null;
  const { data, error } = await supabase
    .from("empresas")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (error) {
    console.error(error);
    return null;
  }
  return (data as Empresa) ?? null;
}

export async function superadminCrearEmpresa(payload: {
  nombre: string;
  slug: string;
  color?: string;
  plan?: "free" | "basic" | "pro" | "enterprise";
  admin_email: string;
  admin_password: string;
  admin_nombre: string;
}) {
  const headers = { "Content-Type": "application/json", ...(await getAuthHeader()) };
  const r = await fetch("/api/superadmin/empresas", {
    method: "POST",
    headers,
    body: JSON.stringify(payload),
  });
  const json = await r.json();
  if (!r.ok) throw new Error(json.error ?? "Error creando empresa");
  return json as { empresa: Empresa; admin: Trabajador };
}

export async function superadminEditarEmpresa(
  id: string,
  patch: Partial<Pick<Empresa, "nombre" | "slug" | "color" | "plan" | "activo" | "notas">>
) {
  const headers = { "Content-Type": "application/json", ...(await getAuthHeader()) };
  const r = await fetch(`/api/superadmin/empresas?id=${id}`, {
    method: "PATCH",
    headers,
    body: JSON.stringify(patch),
  });
  const json = await r.json();
  if (!r.ok) throw new Error(json.error ?? "Error editando empresa");
  return json.empresa as Empresa;
}

// ---------- ASISTENCIAS ----------
export async function listAsistenciasFecha(fecha: string): Promise<Asistencia[]> {
  if (!supabase) return [];
  const { data, error } = await supabase
    .from("asistencias")
    .select("*")
    .eq("fecha", fecha);
  if (error) {
    console.error(error);
    return [];
  }
  return (data || []) as Asistencia[];
}

export async function upsertAsistencia(a: Partial<Asistencia>) {
  if (!supabase) throw new Error("Supabase no configurado");
  const { data, error } = await supabase
    .from("asistencias")
    .upsert(a, { onConflict: "trabajador_id,fecha" })
    .select()
    .single();
  if (error) throw error;
  return data as Asistencia;
}
