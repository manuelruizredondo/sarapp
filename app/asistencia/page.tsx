"use client";
import { useEffect, useMemo, useState } from "react";
import PageHeader from "@/components/PageHeader";
import {
  listAsistenciasFecha,
  listAusenciasRango,
  listTrabajadores,
  upsertAsistencia,
} from "@/lib/data";
import {
  Asistencia,
  Ausencia,
  ESTADO_COLOR,
  ESTADO_LABEL,
  EstadoAsistencia,
  TIPO_LABEL,
  Trabajador,
} from "@/lib/types";
import { fmt, incluyeFecha, toISO } from "@/lib/dates";

const estados: EstadoAsistencia[] = ["presente", "ausente", "teletrabajo", "retraso"];

export default function AsistenciaPage() {
  const today = new Date();
  const [fecha, setFecha] = useState(toISO(today));
  const [trabajadores, setTrabajadores] = useState<Trabajador[]>([]);
  const [asistencias, setAsistencias] = useState<Asistencia[]>([]);
  const [ausencias, setAusencias] = useState<Ausencia[]>([]);
  const [loading, setLoading] = useState(true);

  async function reload(f: string) {
    setLoading(true);
    const [t, a, aus] = await Promise.all([
      listTrabajadores(),
      listAsistenciasFecha(f),
      listAusenciasRango(f, f),
    ]);
    setTrabajadores(t.filter((x) => x.activo));
    setAsistencias(a);
    setAusencias(aus);
    setLoading(false);
  }

  useEffect(() => {
    reload(fecha);
  }, [fecha]);

  const asistById = useMemo(
    () => Object.fromEntries(asistencias.map((a) => [a.trabajador_id, a])),
    [asistencias]
  );

  const ausPorTrabajador = useMemo(() => {
    const m: Record<string, Ausencia | undefined> = {};
    for (const a of ausencias) {
      if (incluyeFecha(fecha, a.fecha_inicio, a.fecha_fin)) {
        m[a.trabajador_id] = a;
      }
    }
    return m;
  }, [ausencias, fecha]);

  async function setEstado(trabajadorId: string, estado: EstadoAsistencia) {
    try {
      const existente = asistById[trabajadorId];
      await upsertAsistencia({
        id: existente?.id,
        trabajador_id: trabajadorId,
        fecha,
        estado,
      });
      await reload(fecha);
    } catch (err: any) {
      alert("Error: " + err.message);
    }
  }

  const presentes = asistencias.filter((a) => a.estado === "presente").length;
  const teletrabajo = asistencias.filter((a) => a.estado === "teletrabajo").length;
  const ausentes = asistencias.filter((a) => a.estado === "ausente").length;
  const retraso = asistencias.filter((a) => a.estado === "retraso").length;

  return (
    <div>
      <PageHeader
        title="Asistencia diaria"
        subtitle="Registro de fichaje día a día"
        actions={
          <input
            type="date"
            className="input w-44"
            value={fecha}
            onChange={(e) => setFecha(e.target.value)}
          />
        }
      />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <Mini label="Presentes" value={presentes} color="text-emerald-600" />
        <Mini label="Teletrabajo" value={teletrabajo} color="text-sky-600" />
        <Mini label="Retraso" value={retraso} color="text-amber-600" />
        <Mini label="Ausentes" value={ausentes} color="text-rose-600" />
      </div>

      <div className="card overflow-hidden">
        <div className="px-5 py-3 border-b border-slate-200 flex items-center justify-between bg-slate-50/50">
          <h2 className="font-semibold">
            {fmt(fecha, "EEEE d 'de' MMMM yyyy")}
          </h2>
          <div className="text-xs text-slate-500">
            {trabajadores.length} trabajadores activos
          </div>
        </div>

        {loading ? (
          <p className="p-5 text-sm text-slate-500">Cargando…</p>
        ) : trabajadores.length === 0 ? (
          <p className="p-5 text-sm text-slate-500">
            No hay trabajadores activos. Da de alta a alguien primero.
          </p>
        ) : (
          <ul className="divide-y divide-slate-100">
            {trabajadores.map((t) => {
              const a = asistById[t.id];
              const aus = ausPorTrabajador[t.id];
              return (
                <li key={t.id} className="px-5 py-3 flex flex-wrap items-center justify-between gap-3">
                  <div className="min-w-0">
                    <div className="font-medium text-sm truncate">
                      {t.nombre} {t.apellidos ?? ""}
                    </div>
                    <div className="text-xs text-slate-500 truncate">
                      {t.puesto ?? ""}{t.departamento ? ` · ${t.departamento}` : ""}
                    </div>
                  </div>
                  {aus ? (
                    <div className="text-xs text-slate-600">
                      Hoy de <strong>{TIPO_LABEL[aus.tipo].toLowerCase()}</strong>
                    </div>
                  ) : (
                    <div className="flex flex-wrap gap-1">
                      {estados.map((e) => {
                        const active = a?.estado === e;
                        return (
                          <button
                            key={e}
                            onClick={() => setEstado(t.id, e)}
                            className={
                              "px-2.5 py-1 rounded-md text-xs border transition-colors " +
                              (active
                                ? ESTADO_COLOR[e] + " font-semibold"
                                : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50")
                            }
                          >
                            {ESTADO_LABEL[e]}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}

function Mini({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="card p-3">
      <div className="text-xs text-slate-500">{label}</div>
      <div className={"text-2xl font-bold " + color}>{value}</div>
    </div>
  );
}
