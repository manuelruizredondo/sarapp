"use client";
import { supabase } from "./supabase";
import type { Ausencia, Asistencia, Trabajador } from "./types";

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

export async function deleteAusencia(id: string) {
  if (!supabase) throw new Error("Supabase no configurado");
  const { error } = await supabase.from("ausencias").delete().eq("id", id);
  if (error) throw error;
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
