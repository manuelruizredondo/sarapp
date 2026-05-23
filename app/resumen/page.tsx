"use client";
import { useEffect, useMemo, useState } from "react";
import PageHeader from "@/components/PageHeader";
import { listAusenciasRango, listTrabajadores } from "@/lib/data";
import {
  Ausencia,
  TIPO_COLOR,
  TIPO_DOT,
  TIPO_LABEL,
  Trabajador,
} from "@/lib/types";
import { fmt, incluyeFecha, semanasDelMes, toISO } from "@/lib/dates";
import { startOfMonth, endOfMonth, eachDayOfInterval, format } from "date-fns";
import { es } from "date-fns/locale";

export default function ResumenPage() {
  const today = new Date();
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth());

  const [trabajadores, setTrabajadores] = useState<Trabajador[]>([]);
  const [ausencias, setAusencias] = useState<Ausencia[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      setLoading(true);
      const first = startOfMonth(new Date(year, month, 1));
      const last = endOfMonth(first);
      const [t, a] = await Promise.all([
        listTrabajadores(),
        listAusenciasRango(toISO(first), toISO(last)),
      ]);
      setTrabajadores(t);
      setAusencias(a);
      setLoading(false);
    })();
  }, [year, month]);

  const tById = useMemo(
    () => Object.fromEntries(trabajadores.map((t) => [t.id, t])),
    [trabajadores]
  );

  const semanas = useMemo(() => semanasDelMes(year, month), [year, month]);

  function ausDeSemana(inicio: Date, fin: Date): { ausencia: Ausencia; dias: number }[] {
    const dias = eachDayOfInterval({ start: inicio, end: fin });
    const map = new Map<string, number>();
    for (const d of dias) {
      const iso = toISO(d);
      for (const a of ausencias) {
        if (incluyeFecha(iso, a.fecha_inicio, a.fecha_fin)) {
          map.set(a.id, (map.get(a.id) ?? 0) + 1);
        }
      }
    }
    return Array.from(map.entries())
      .map(([id, dias]) => ({
        ausencia: ausencias.find((a) => a.id === id)!,
        dias,
      }))
      .sort((a, b) => b.dias - a.dias);
  }

  function prevMonth() {
    if (month === 0) { setMonth(11); setYear(year - 1); }
    else setMonth(month - 1);
  }
  function nextMonth() {
    if (month === 11) { setMonth(0); setYear(year + 1); }
    else setMonth(month + 1);
  }

  return (
    <div>
      <PageHeader
        title="Resumen por semanas"
        subtitle="Quién está fuera cada semana del mes"
        actions={
          <div className="flex items-center gap-2">
            <button className="btn-ghost" onClick={prevMonth}>‹</button>
            <div className="text-sm font-semibold w-40 text-center capitalize">
              {format(new Date(year, month, 1), "LLLL yyyy", { locale: es })}
            </div>
            <button className="btn-ghost" onClick={nextMonth}>›</button>
            <button
              className="btn-ghost ml-2 text-xs"
              onClick={() => { setMonth(today.getMonth()); setYear(today.getFullYear()); }}
            >
              Hoy
            </button>
          </div>
        }
      />

      {loading ? (
        <p className="text-sm text-slate-500">Cargando…</p>
      ) : (
        <div className="space-y-4">
          {semanas.map((s, idx) => {
            const lista = ausDeSemana(s.inicio, s.fin);
            const personasUnicas = new Set(lista.map((x) => x.ausencia.trabajador_id)).size;
            return (
              <section key={idx} className="card overflow-hidden">
                <header className="px-5 py-3 border-b border-slate-200 flex items-center justify-between bg-slate-50/50">
                  <div>
                    <div className="text-xs uppercase tracking-wide text-slate-500">Semana {idx + 1}</div>
                    <div className="font-semibold">
                      {fmt(s.inicio, "EEE d 'de' MMM")} – {fmt(s.fin, "EEE d 'de' MMM")}
                    </div>
                  </div>
                  <div className="text-right text-xs text-slate-500">
                    <div className="font-semibold text-slate-800 text-sm">
                      {personasUnicas} persona{personasUnicas === 1 ? "" : "s"}
                    </div>
                    {lista.length} registro{lista.length === 1 ? "" : "s"}
                  </div>
                </header>

                {lista.length === 0 ? (
                  <div className="px-5 py-6 text-sm text-slate-500">
                    Nadie fuera esta semana. ✨
                  </div>
                ) : (
                  <ul className="divide-y divide-slate-100">
                    {lista.map(({ ausencia: a, dias }) => {
                      const t = tById[a.trabajador_id];
                      return (
                        <li key={a.id} className="px-5 py-3 flex items-center justify-between gap-3">
                          <div className="flex items-center gap-3 min-w-0">
                            <span className={"h-2.5 w-2.5 rounded-full " + TIPO_DOT[a.tipo]} />
                            <div className="min-w-0">
                              <div className="font-medium text-sm truncate">
                                {t ? `${t.nombre} ${t.apellidos ?? ""}` : "—"}
                              </div>
                              <div className="text-xs text-slate-500 truncate">
                                {fmt(a.fecha_inicio, "dd/MM")} – {fmt(a.fecha_fin, "dd/MM")}
                                {a.motivo ? ` · ${a.motivo}` : ""}
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 text-xs">
                            <span className={"badge " + TIPO_COLOR[a.tipo]}>
                              {TIPO_LABEL[a.tipo]}
                            </span>
                            <span className="text-slate-500 whitespace-nowrap">
                              {dias}d en semana
                            </span>
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </section>
            );
          })}
        </div>
      )}
    </div>
  );
}
