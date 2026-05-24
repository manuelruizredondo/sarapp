"use client";
import { supabase } from "./supabase";
import type { Ausencia, Asistencia, Festivo, Trabajador } from "./types";

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

export async function createAusencia(a: Omit<Ausencia, "id">) {
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
