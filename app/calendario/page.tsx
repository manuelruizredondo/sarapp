"use client";
import { useEffect, useMemo, useState } from "react";
import PageHeader from "@/components/PageHeader";
import { listAusenciasRango, listFestivosRango, listTrabajadores } from "@/lib/data";
import {
  Ausencia,
  COLOR_DEFAULT,
  Festivo,
  TIPO_DOT,
  TIPO_LABEL,
  Trabajador,
} from "@/lib/types";
import { diasDelMes, fmt, incluyeFecha, nombreMes, toISO } from "@/lib/dates";
import { startOfWeek, getDay, endOfMonth, startOfMonth } from "date-fns";

// Devuelve un color de texto legible (negro o blanco) sobre el fondo dado
function textoSobre(hex: string): string {
  const h = (hex || "#3b82f6").replace("#", "");
  const r = parseInt(h.substring(0, 2), 16);
  const g = parseInt(h.substring(2, 4), 16);
  const b = parseInt(h.substring(4, 6), 16);
  // YIQ
  const yiq = (r * 299 + g * 587 + b * 114) / 1000;
  return yiq >= 160 ? "#0f172a" : "#ffffff";
}

export default function CalendarioPage() {
  const today = new Date();
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth()); // 0-based

  const [trabajadores, setTrabajadores] = useState<Trabajador[]>([]);
  const [ausencias, setAusencias] = useState<Ausencia[]>([]);
  const [festivos, setFestivos] = useState<Festivo[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      setLoading(true);
      const first = startOfMonth(new Date(year, month, 1));
      const last = endOfMonth(first);
      const [t, a, f] = await Promise.all([
        listTrabajadores(),
        listAusenciasRango(toISO(first), toISO(last)),
        listFestivosRango(toISO(first), toISO(last)),
      ]);
      setTrabajadores(t);
      setAusencias(a);
      setFestivos(f);
      setLoading(false);
    })();
  }, [year, month]);

  const festivosPorFecha = useMemo(
    () => Object.fromEntries(festivos.map((f) => [f.fecha, f])),
    [festivos]
  );

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

      {/* Leyenda: trabajadores con su color */}
      <div className="card p-3 mb-3 flex flex-wrap gap-x-4 gap-y-2 items-center text-xs">
        <span className="text-slate-500 uppercase tracking-wide font-semibold">Equipo:</span>
        {trabajadores.filter((t) => t.activo).map((t) => (
          <div key={t.id} className="flex items-center gap-1.5">
            <span
              className="inline-block h-3 w-3 rounded-full border border-slate-200"
              style={{ backgroundColor: t.color || COLOR_DEFAULT }}
            />
            <span className="text-slate-700">{t.nombre}</span>
          </div>
        ))}
      </div>
      <div className="card p-3 mb-4 flex flex-wrap gap-3 items-center text-xs">
        <span className="uppercase tracking-wide font-semibold" style={{ color: "#7B8794" }}>Tipo (punto):</span>
        {(["vacaciones","baja_medica","permiso","asuntos_propios","formacion","otro"] as const).map((t) => (
          <div key={t} className="flex items-center gap-1.5">
            <span className={"h-2.5 w-2.5 rounded-full " + TIPO_DOT[t]} />
            <span style={{ color: "#1F2937" }}>{TIPO_LABEL[t]}</span>
          </div>
        ))}
        <span className="mx-2" style={{ color: "#E5EAF2" }}>|</span>
        <div className="flex items-center gap-1.5">
          <span>🚩</span><span style={{ color: "#1F2937" }}>Validada</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span
            className="h-3 w-6 rounded"
            style={{
              border: "1px dashed #7B8794",
              backgroundImage: "repeating-linear-gradient(45deg, transparent 0 3px, rgba(125,135,148,0.35) 3px 6px)",
            }}
          />
          <span style={{ color: "#1F2937" }}>Pendiente</span>
        </div>
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
              const festivo = festivosPorFecha[iso];
              return (
                <div
                  key={iso}
                  className={
                    "min-h-[110px] border-b border-r border-slate-100 p-1.5 " +
                    (festivo ? "bg-amber-50/70 " : finde ? "bg-slate-50/50 " : "bg-white ") +
                    (esHoy ? "ring-2 ring-inset ring-brand-500" : "")
                  }
                >
                  <div className="flex items-start justify-between mb-1">
                    <div className={"text-xs font-semibold " + (esHoy ? "text-brand-700" : festivo ? "text-amber-700" : "text-slate-700")}>
                      {d.getDate()}
                    </div>
                    {festivo && (
                      <span className="text-[10px]" title={festivo.nombre}>🎉</span>
                    )}
                  </div>
                  {festivo && (
                    <div className="text-[10px] text-amber-700 mb-1 truncate" title={festivo.nombre}>
                      {festivo.nombre}
                    </div>
                  )}
                  <div className="space-y-0.5">
                    {aus.slice(0, 3).map((a) => {
                      const t = tById[a.trabajador_id];
                      const bg = t?.color || COLOR_DEFAULT;
                      const fg = textoSobre(bg);
                      const pendiente = !a.aprobado;
                      return (
                        <div
                          key={a.id}
                          className="flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[11px] font-medium truncate"
                          style={{
                            backgroundColor: bg,
                            color: fg,
                            opacity: pendiente ? 0.55 : 1,
                            backgroundImage: pendiente
                              ? `repeating-linear-gradient(45deg, transparent 0 4px, rgba(255,255,255,0.35) 4px 8px)`
                              : undefined,
                            border: pendiente ? `1px dashed ${fg}` : undefined,
                          }}
                          title={`${t?.nombre ?? ""} · ${TIPO_LABEL[a.tipo]}${pendiente ? " · Pendiente de validar" : " · Validada"}`}
                        >
                          <span
                            className={"h-1.5 w-1.5 rounded-full shrink-0 " + TIPO_DOT[a.tipo]}
                            style={{ outline: `1px solid ${fg}` }}
                          />
                          <span className="truncate">{t?.nombre ?? "—"}</span>
                          {!pendiente && <span className="ml-auto">🚩</span>}
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
