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
import { diasDelMes, fmt, incluyeFecha, nombreMes, toISO } from "@/lib/dates";
import { startOfWeek, getDay, endOfMonth, startOfMonth } from "date-fns";

export default function CalendarioPage() {
  const today = new Date();
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth()); // 0-based

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

  const dias = useMemo(() => diasDelMes(year, month), [year, month]);

  // Padding del primer día (lunes = 0)
  const primerDia = startOfMonth(new Date(year, month, 1));
  const offset = (getDay(primerDia) + 6) % 7; // 0=Lun, 6=Dom

  function ausDeDia(d: Date): Ausencia[] {
    const iso = toISO(d);
    return ausencias.filter((a) => incluyeFecha(iso, a.fecha_inicio, a.fecha_fin));
  }

  function prevMonth() {
    if (month === 0) { setMonth(11); setYear(year - 1); }
    else setMonth(month - 1);
  }
  function nextMonth() {
    if (month === 11) { setMonth(0); setYear(year + 1); }
    else setMonth(month + 1);
  }

  const hoyISO = toISO(today);

  return (
    <div>
      <PageHeader
        title="Calendario"
        subtitle="Vista mensual de todas las ausencias"
        actions={
          <div className="flex items-center gap-2">
            <button className="btn-ghost" onClick={prevMonth}>‹</button>
            <div className="text-sm font-semibold w-40 text-center capitalize">
              {nombreMes(month, year)}
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

      {/* Leyenda */}
      <div className="card p-3 mb-4 flex flex-wrap gap-3 items-center text-xs">
        {(["vacaciones","baja_medica","permiso","asuntos_propios","formacion","otro"] as const).map((t) => (
          <div key={t} className="flex items-center gap-1.5">
            <span className={"h-2.5 w-2.5 rounded-full " + TIPO_DOT[t]} />
            <span className="text-slate-600">{TIPO_LABEL[t]}</span>
          </div>
        ))}
      </div>

      <div className="card overflow-hidden">
        {/* Cabecera de días */}
        <div className="grid grid-cols-7 bg-slate-50 text-[11px] uppercase tracking-wide text-slate-500">
          {["Lun","Mar","Mié","Jue","Vie","Sáb","Dom"].map((d) => (
            <div key={d} className="px-2 py-2 text-center font-semibold">{d}</div>
          ))}
        </div>

        {loading ? (
          <p className="p-5 text-sm text-slate-500">Cargando…</p>
        ) : (
          <div className="grid grid-cols-7 border-t border-slate-200">
            {Array.from({ length: offset }).map((_, i) => (
              <div key={"pad" + i} className="min-h-[110px] border-b border-r border-slate-100 bg-slate-50/30" />
            ))}
            {dias.map((d) => {
              const iso = toISO(d);
              const aus = ausDeDia(d);
              const esHoy = iso === hoyISO;
              const finde = [0, 6].includes(getDay(d));
              return (
                <div
                  key={iso}
                  className={
                    "min-h-[110px] border-b border-r border-slate-100 p-1.5 " +
                    (finde ? "bg-slate-50/50 " : "bg-white ") +
                    (esHoy ? "ring-2 ring-inset ring-brand-500" : "")
                  }
                >
                  <div className={"text-xs font-semibold mb-1 " + (esHoy ? "text-brand-700" : "text-slate-700")}>
                    {d.getDate()}
                  </div>
                  <div className="space-y-0.5">
                    {aus.slice(0, 3).map((a) => {
                      const t = tById[a.trabajador_id];
                      return (
                        <div
                          key={a.id}
                          className={"badge w-full justify-start truncate " + TIPO_COLOR[a.tipo]}
                          title={`${t?.nombre ?? ""} · ${TIPO_LABEL[a.tipo]}`}
                        >
                          <span className="truncate">{t?.nombre ?? "—"}</span>
                        </div>
                      );
                    })}
                    {aus.length > 3 && (
                      <div className="text-[10px] text-slate-500 pl-1">+{aus.length - 3} más</div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
