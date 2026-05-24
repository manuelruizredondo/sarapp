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
