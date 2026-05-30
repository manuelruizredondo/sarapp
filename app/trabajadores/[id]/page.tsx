"use client";
import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import PageHeader from "@/components/PageHeader";
import { listAusencias, listFestivos, listTrabajadores } from "@/lib/data";
import {
  Ausencia,
  COLOR_DEFAULT,
  Festivo,
  TIPO_COLOR,
  TIPO_DOT,
  TIPO_LABEL,
  Trabajador,
} from "@/lib/types";
import { diasEntre, diasLaborables, fmt, toISO } from "@/lib/dates";
import HeatmapAnual from "@/components/HeatmapAnual";

export default function TrabajadorDetalle() {
  const { id } = useParams<{ id: string }>();
  const [trabajador, setTrabajador] = useState<Trabajador | null>(null);
  const [ausencias, setAusencias] = useState<Ausencia[]>([]);
  const [festivos, setFestivos] = useState<Festivo[]>([]);
  const [loading, setLoading] = useState(true);
  const [year, setYear] = useState(new Date().getFullYear());

  useEffect(() => {
    (async () => {
      setLoading(true);
      const [todos, all, fes] = await Promise.all([
        listTrabajadores(), listAusencias(), listFestivos(),
      ]);
      setTrabajador(todos.find((t) => t.id === id) ?? null);
      setAusencias(all.filter((a) => a.trabajador_id === id));
      setFestivos(fes);
      setLoading(false);
    })();
  }, [id]);

  const festivosISO = useMemo(() => new Set(festivos.map((f) => f.fecha)), [festivos]);

  const ausenciasAnio = useMemo(
    // Comparamos el prefijo "YYYY" de la fecha para no depender de la zona horaria
    // (new Date("YYYY-MM-DD") parsea en UTC y desplaza el 1 de enero / 31 de diciembre).
    () => ausencias.filter((a) => a.fecha_inicio.slice(0, 4) === String(year)),
    [ausencias, year]
  );

  const stats = useMemo(() => {
    const por: Record<string, number> = {};
    for (const a of ausenciasAnio) {
      por[a.tipo] = (por[a.tipo] ?? 0) + diasLaborables(a.fecha_inicio, a.fecha_fin, festivosISO);
    }
    return por;
  }, [ausenciasAnio, festivosISO]);

  if (loading) return <p className="text-sm text-slate-500">Cargando…</p>;
  if (!trabajador) return (
    <div>
      <PageHeader title="Trabajador no encontrado" />
      <Link href="/trabajadores" className="text-sm text-brand-600">← Volver</Link>
    </div>
  );

  const vacacionesUsadas = stats["vacaciones"] ?? 0;
  const restantes = trabajador.dias_vacaciones_anuales - vacacionesUsadas;
  const pctUsado = Math.min(100, (vacacionesUsadas / trabajador.dias_vacaciones_anuales) * 100);

  return (
    <div>
      <div className="mb-4">
        <Link href="/trabajadores" className="text-xs text-slate-500 hover:text-brand-600">← Volver a trabajadores</Link>
      </div>
      <PageHeader
        title={`${trabajador.nombre} ${trabajador.apellidos ?? ""}`}
        subtitle={`${trabajador.puesto ?? ""}${trabajador.departamento ? ` · ${trabajador.departamento}` : ""}`}
        actions={
          <div className="flex items-center gap-2">
            <button className="btn-ghost" onClick={() => setYear(year - 1)}>‹</button>
            <span className="text-sm font-semibold w-16 text-center">{year}</span>
            <button className="btn-ghost" onClick={() => setYear(year + 1)}>›</button>
          </div>
        }
      />

      {/* Cabecera con avatar + datos */}
      <div className="card p-5 mb-6 flex flex-wrap items-center gap-4">
        <span
          className="h-16 w-16 rounded-full border-2 border-white shadow-md flex items-center justify-center text-white text-2xl font-bold"
          style={{ backgroundColor: trabajador.color || COLOR_DEFAULT }}
        >
          {trabajador.nombre.charAt(0).toUpperCase()}
        </span>
        <div className="min-w-0">
          <div className="text-sm text-slate-500">{trabajador.email ?? "—"}</div>
          <div className="text-xs text-slate-400 mt-0.5">
            Alta: {trabajador.fecha_alta ? fmt(trabajador.fecha_alta) : "—"} · Rol: {trabajador.rol}
          </div>
        </div>
        <div className="ml-auto text-right">
          <div className="text-xs uppercase tracking-wide text-slate-500">Vacaciones {year}</div>
          <div className="text-3xl font-bold">{restantes}d <span className="text-base font-normal text-slate-500">/ {trabajador.dias_vacaciones_anuales}</span></div>
          <div className="text-xs text-slate-500">{vacacionesUsadas} consumidos · laborables</div>
        </div>
      </div>

      {/* Barra de progreso */}
      <div className="card p-4 mb-6">
        <div className="flex items-center justify-between text-xs mb-2">
          <span className="text-slate-600">Días de vacaciones consumidos</span>
          <span className="font-semibold">{vacacionesUsadas} / {trabajador.dias_vacaciones_anuales}</span>
        </div>
        <div className="h-3 w-full bg-slate-100 rounded-full overflow-hidden">
          <div
            className="h-full rounded-full"
            style={{ width: `${pctUsado}%`, backgroundColor: trabajador.color || COLOR_DEFAULT }}
          />
        </div>
      </div>

      {/* Stats por tipo */}
      <div className="grid grid-cols-2 md:grid-cols-6 gap-3 mb-6">
        {(["vacaciones","baja_medica","permiso","asuntos_propios","formacion","otro"] as const).map((t) => (
          <div key={t} className="card p-3">
            <div className="flex items-center gap-1.5 text-[11px] text-slate-500 uppercase tracking-wide">
              <span className={"h-2 w-2 rounded-full " + TIPO_DOT[t]} />
              {TIPO_LABEL[t]}
            </div>
            <div className="text-xl font-bold mt-1">{stats[t] ?? 0}d</div>
          </div>
        ))}
      </div>

      {/* Heatmap anual */}
      <section className="card p-5 mb-6">
        <h2 className="font-semibold mb-4">Vista anual {year}</h2>
        <HeatmapAnual
          year={year}
          ausencias={ausenciasAnio}
          festivosISO={festivosISO}
          color={trabajador.color || COLOR_DEFAULT}
        />
      </section>

      {/* Histórico */}
      <section className="card overflow-hidden">
        <header className="px-5 py-3 border-b border-slate-200 bg-slate-50/50 font-semibold">
          Histórico {year} · {ausenciasAnio.length} registros
        </header>
        {ausenciasAnio.length === 0 ? (
          <div className="px-5 py-6 text-sm text-slate-500">Sin ausencias este año.</div>
        ) : (
          <ul className="divide-y divide-slate-100">
            {ausenciasAnio.sort((a, b) => a.fecha_inicio.localeCompare(b.fecha_inicio)).map((a) => (
              <li key={a.id} className="px-5 py-3 flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <span className={"h-2.5 w-2.5 rounded-full " + TIPO_DOT[a.tipo]} />
                  <div>
                    <div className="font-medium text-sm">
                      {fmt(a.fecha_inicio)} – {fmt(a.fecha_fin)}
                    </div>
                    <div className="text-xs text-slate-500">{a.motivo ?? ""}</div>
                  </div>
                </div>
                <div className="flex items-center gap-2 text-xs">
                  <span className={"badge " + TIPO_COLOR[a.tipo]}>{TIPO_LABEL[a.tipo]}</span>
                  <span className="text-slate-500 whitespace-nowrap">
                    {diasLaborables(a.fecha_inicio, a.fecha_fin, festivosISO)}d lab / {diasEntre(a.fecha_inicio, a.fecha_fin)}d nat
                  </span>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
