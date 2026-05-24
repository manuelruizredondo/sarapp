"use client";
import { useEffect, useMemo, useState } from "react";
import PageHeader from "@/components/PageHeader";
import {
  createAusencia,
  deleteAusencia,
  listAusencias,
  listFestivos,
  listTrabajadores,
  updateAusencia,
} from "@/lib/data";
import {
  Ausencia,
  Festivo,
  TIPO_COLOR,
  TIPO_LABEL,
  TipoAusencia,
  Trabajador,
} from "@/lib/types";
import { diasEntre, diasLaborables, fmt, incluyeFecha, toISO } from "@/lib/dates";
import { useAuth } from "@/components/AuthProvider";

type Form = {
  id?: string;
  trabajador_id: string;
  tipo: TipoAusencia;
  fecha_inicio: string;
  fecha_fin: string;
  motivo: string;
};

const tipos: TipoAusencia[] = [
  "vacaciones",
  "baja_medica",
  "permiso",
  "asuntos_propios",
  "formacion",
  "otro",
];

export default function AusenciasPage() {
  const { perfil } = useAuth();
  const isAdmin = perfil?.rol === "admin";

  const [trabajadores, setTrabajadores] = useState<Trabajador[]>([]);
  const [ausencias, setAusencias] = useState<Ausencia[]>([]);
  const [festivos, setFestivos] = useState<Festivo[]>([]);
  const [loading, setLoading] = useState(true);
  const [openForm, setOpenForm] = useState(false);
  const [filtroTipo, setFiltroTipo] = useState<TipoAusencia | "todos">("todos");
  const [filtroTrabajador, setFiltroTrabajador] = useState<string>("todos");

  const today = toISO(new Date());
  const [form, setForm] = useState<Form>({
    trabajador_id: "",
    tipo: "vacaciones",
    fecha_inicio: today,
    fecha_fin: today,
    motivo: "",
  });

  async function reload() {
    setLoading(true);
    const [t, a, f] = await Promise.all([listTrabajadores(), listAusencias(), listFestivos()]);
    setTrabajadores(t);
    setAusencias(a);
    setFestivos(f);
    setLoading(false);
  }
  useEffect(() => { reload(); }, []);

  const festivosISO = useMemo(() => new Set(festivos.map((f) => f.fecha)), [festivos]);
  const tById = useMemo(() => Object.fromEntries(trabajadores.map((t) => [t.id, t])), [trabajadores]);

  const filtradas = useMemo(() => {
    return ausencias.filter((a) => {
      if (filtroTipo !== "todos" && a.tipo !== filtroTipo) return false;
      if (filtroTrabajador !== "todos" && a.trabajador_id !== filtroTrabajador) return false;
      return true;
    });
  }, [ausencias, filtroTipo, filtroTrabajador]);

  function detectarSolapamientos(): { trabajador: string; ausencia: Ausencia }[] {
    const out: { trabajador: string; ausencia: Ausencia }[] = [];
    if (!form.trabajador_id || !form.fecha_inicio || !form.fecha_fin) return out;
    for (const a of ausencias) {
      if (form.id && a.id === form.id) continue;
      if (a.trabajador_id !== form.trabajador_id) continue;
      if (a.fecha_inicio <= form.fecha_fin && a.fecha_fin >= form.fecha_inicio) {
        out.push({ trabajador: tById[a.trabajador_id]?.nombre ?? "", ausencia: a });
      }
    }
    return out;
  }

  function cuantosFuera(fecha: string, excludeId?: string): number {
    const set = new Set<string>();
    for (const a of ausencias) {
      if (excludeId && a.id === excludeId) continue;
      if (incluyeFecha(fecha, a.fecha_inicio, a.fecha_fin)) set.add(a.trabajador_id);
    }
    if (form.trabajador_id && incluyeFecha(fecha, form.fecha_inicio, form.fecha_fin)) {
      set.add(form.trabajador_id);
    }
    return set.size;
  }

  function pickoMaxSolape(): { fecha: string; total: number } | null {
    if (!form.fecha_inicio || !form.fecha_fin) return null;
    let max = { fecha: "", total: 0 };
    let cursor = new Date(form.fecha_inicio + "T00:00:00");
    const fin = new Date(form.fecha_fin + "T00:00:00");
    while (cursor <= fin) {
      const f = toISO(cursor);
      const t = cuantosFuera(f, form.id);
      if (t > max.total) max = { fecha: f, total: t };
      cursor.setDate(cursor.getDate() + 1);
    }
    return max.total > 0 ? max : null;
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.trabajador_id) return alert("Selecciona un trabajador");
    if (form.fecha_fin < form.fecha_inicio) return alert("La fecha fin no puede ser anterior a la fecha inicio");

    const solapes = detectarSolapamientos();
    if (solapes.length > 0) {
      const txt = solapes
        .map((s) => `· ${fmt(s.ausencia.fecha_inicio, "dd/MM")}–${fmt(s.ausencia.fecha_fin, "dd/MM")} (${TIPO_LABEL[s.ausencia.tipo]})`)
        .join("\n");
      if (!confirm(`⚠️ Esta persona ya tiene otras ausencias que solapan:\n\n${txt}\n\n¿Guardar de todos modos?`)) return;
    }

    const max = pickoMaxSolape();
    if (max && max.total >= 3) {
      if (!confirm(`⚠️ El ${fmt(max.fecha)} habrá ${max.total} personas fuera a la vez.\n¿Guardar de todos modos?`)) return;
    }

    try {
      if (form.id) {
        await updateAusencia(form.id, {
          trabajador_id: form.trabajador_id,
          tipo: form.tipo,
          fecha_inicio: form.fecha_inicio,
          fecha_fin: form.fecha_fin,
          motivo: form.motivo || null,
        });
      } else {
        await createAusencia({
          trabajador_id: form.trabajador_id,
          tipo: form.tipo,
          fecha_inicio: form.fecha_inicio,
          fecha_fin: form.fecha_fin,
          motivo: form.motivo || null,
          aprobado: true,
        });
      }
      setOpenForm(false);
      setForm({ trabajador_id: "", tipo: "vacaciones", fecha_inicio: today, fecha_fin: today, motivo: "" });
      await reload();
    } catch (err: any) {
      alert("Error: " + err.message);
    }
  }

  async function onDelete(id: string) {
    if (!confirm("¿Eliminar esta ausencia?")) return;
    await deleteAusencia(id);
    await reload();
  }

  function startEdit(a: Ausencia) {
    setForm({
      id: a.id,
      trabajador_id: a.trabajador_id,
      tipo: a.tipo,
      fecha_inicio: a.fecha_inicio,
      fecha_fin: a.fecha_fin,
      motivo: a.motivo ?? "",
    });
    setOpenForm(true);
  }

  function exportCSV() {
    const head = "Trabajador;Email;Tipo;Desde;Hasta;Dias_naturales;Dias_laborables;Motivo";
    const lines = filtradas.map((a) => {
      const t = tById[a.trabajador_id];
      return [
        `${t?.nombre ?? ""} ${t?.apellidos ?? ""}`.trim(),
        t?.email ?? "",
        TIPO_LABEL[a.tipo],
        a.fecha_inicio,
        a.fecha_fin,
        diasEntre(a.fecha_inicio, a.fecha_fin),
        diasLaborables(a.fecha_inicio, a.fecha_fin, festivosISO),
        (a.motivo ?? "").replace(/[;\n\r]/g, " "),
      ].join(";");
    });
    const csv = [head, ...lines].join("\n");
    const blob = new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `ausencias_${toISO(new Date())}.csv`;
    a.click();
  }

  return (
    <div>
      <PageHeader
        title="Ausencias"
        subtitle="Vacaciones, bajas médicas, permisos y formación"
        actions={
          <div className="flex gap-2">
            <button className="btn-ghost" onClick={exportCSV}>⬇ Exportar CSV</button>
            {isAdmin && (
              <button className="btn-primary" onClick={() => {
                setForm({ trabajador_id: "", tipo: "vacaciones", fecha_inicio: today, fecha_fin: today, motivo: "" });
                setOpenForm(true);
              }}>
                + Registrar ausencia
              </button>
            )}
          </div>
        }
      />

      {/* Filtros */}
      <div className="card p-4 mb-4 flex flex-wrap gap-3 items-end">
        <div>
          <label className="label">Tipo</label>
          <select className="input" value={filtroTipo} onChange={(e) => setFiltroTipo(e.target.value as any)}>
            <option value="todos">Todos</option>
            {tipos.map((t) => (
              <option key={t} value={t}>{TIPO_LABEL[t]}</option>
            ))}
          </select>
        </div>
        {isAdmin && (
          <div>
            <label className="label">Trabajador</label>
            <select className="input" value={filtroTrabajador} onChange={(e) => setFiltroTrabajador(e.target.value)}>
              <option value="todos">Todos</option>
              {trabajadores.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.nombre} {t.apellidos ?? ""}
                </option>
              ))}
            </select>
          </div>
        )}
        <div className="ml-auto text-sm text-slate-500">{filtradas.length} registros</div>
      </div>

      {/* Tabla */}
      <div className="card overflow-hidden">
        {loading ? (
          <p className="p-5 text-sm text-slate-500">Cargando…</p>
        ) : filtradas.length === 0 ? (
          <p className="p-5 text-sm text-slate-500">No hay ausencias con esos filtros.</p>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-slate-600 text-xs uppercase">
              <tr>
                <th className="text-left px-4 py-3">Trabajador</th>
                <th className="text-left px-4 py-3">Tipo</th>
                <th className="text-left px-4 py-3">Desde</th>
                <th className="text-left px-4 py-3">Hasta</th>
                <th className="text-right px-4 py-3">Naturales</th>
                <th className="text-right px-4 py-3">Laborables</th>
                <th className="text-left px-4 py-3">Motivo</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtradas.map((a) => {
                const t = tById[a.trabajador_id];
                return (
                  <tr key={a.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3 font-medium">
                      {t ? `${t.nombre} ${t.apellidos ?? ""}` : "—"}
                    </td>
                    <td className="px-4 py-3">
                      <span className={"badge " + TIPO_COLOR[a.tipo]}>{TIPO_LABEL[a.tipo]}</span>
                    </td>
                    <td className="px-4 py-3">{fmt(a.fecha_inicio)}</td>
                    <td className="px-4 py-3">{fmt(a.fecha_fin)}</td>
                    <td className="px-4 py-3 text-right">{diasEntre(a.fecha_inicio, a.fecha_fin)}</td>
                    <td className="px-4 py-3 text-right font-semibold">
                      {diasLaborables(a.fecha_inicio, a.fecha_fin, festivosISO)}
                    </td>
                    <td className="px-4 py-3 text-slate-600 truncate max-w-[240px]">{a.motivo ?? "—"}</td>
                    <td className="px-4 py-3 text-right whitespace-nowrap">
                      {isAdmin && (
                        <>
                          <button className="btn-ghost mr-1" onClick={() => startEdit(a)}>Editar</button>
                          <button className="btn-ghost text-rose-600 hover:bg-rose-50" onClick={() => onDelete(a.id)}>Borrar</button>
                        </>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Modal */}
      {openForm && isAdmin && (
        <div className="fixed inset-0 bg-slate-900/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-2xl shadow-xl">
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200">
              <h3 className="font-semibold">{form.id ? "Editar ausencia" : "Registrar ausencia"}</h3>
              <button onClick={() => setOpenForm(false)} className="text-slate-500 hover:text-slate-800">✕</button>
            </div>
            <form onSubmit={onSubmit} className="p-5 grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className="label">Trabajador *</label>
                <select className="input" required value={form.trabajador_id} onChange={(e) => setForm({ ...form, trabajador_id: e.target.value })}>
                  <option value="">— Selecciona —</option>
                  {trabajadores.map((t) => (
                    <option key={t.id} value={t.id}>{t.nombre} {t.apellidos ?? ""}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="label">Tipo *</label>
                <select className="input" value={form.tipo} onChange={(e) => setForm({ ...form, tipo: e.target.value as TipoAusencia })}>
                  {tipos.map((t) => (<option key={t} value={t}>{TIPO_LABEL[t]}</option>))}
                </select>
              </div>
              <div />
              <div>
                <label className="label">Fecha inicio *</label>
                <input type="date" className="input" required value={form.fecha_inicio} onChange={(e) => setForm({ ...form, fecha_inicio: e.target.value })} />
              </div>
              <div>
                <label className="label">Fecha fin *</label>
                <input type="date" className="input" required value={form.fecha_fin} onChange={(e) => setForm({ ...form, fecha_fin: e.target.value })} />
              </div>
              <div className="md:col-span-2">
                <label className="label">Motivo / notas</label>
                <textarea className="input min-h-[80px]" value={form.motivo} onChange={(e) => setForm({ ...form, motivo: e.target.value })} />
              </div>
              <div className="md:col-span-2 flex items-center justify-between pt-2">
                <div className="text-sm text-slate-500">
                  {form.fecha_inicio && form.fecha_fin && form.fecha_fin >= form.fecha_inicio ? (
                    <>
                      <span>{diasEntre(form.fecha_inicio, form.fecha_fin)}d naturales</span>
                      <span className="mx-2">·</span>
                      <span className="font-semibold">{diasLaborables(form.fecha_inicio, form.fecha_fin, festivosISO)}d laborables</span>
                    </>
                  ) : ""}
                </div>
                <div className="flex gap-2">
                  <button type="button" className="btn-ghost" onClick={() => setOpenForm(false)}>Cancelar</button>
                  <button type="submit" className="btn-primary">{form.id ? "Actualizar" : "Guardar"}</button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
