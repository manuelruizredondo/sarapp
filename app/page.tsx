"use client";
import { useEffect, useMemo, useState } from "react";
import PageHeader from "@/components/PageHeader";
import {
  listAusenciasRango,
  listTrabajadores,
} from "@/lib/data";
import {
  Ausencia,
  Trabajador,
  TIPO_LABEL,
  TIPO_COLOR,
  TIPO_DOT,
  COLOR_DEFAULT,
} from "@/lib/types";
import { fmt, toISO, incluyeFecha, diasEntre } from "@/lib/dates";
import { addDays } from "date-fns";

export default function Dashboard() {
  const [trabajadores, setTrabajadores] = useState<Trabajador[]>([]);
  const [ausencias, setAusencias] = useState<Ausencia[]>([]);
  const [loading, setLoading] = useState(true);
  const hoy = useMemo(() => new Date(), []);
  const hoyISO = toISO(hoy);

  useEffect(() => {
    (async () => {
      setLoading(true);
      const desde = toISO(hoy);
      const hasta = toISO(addDays(hoy, 30));
      const [t, a] = await Promise.all([
        listTrabajadores(),
        listAusenciasRango(desde, hasta),
      ]);
      setTrabajadores(t);
      setAusencias(a);
      setLoading(false);
    })();
  }, [hoy]);

  const trabajadorPorId = useMemo(
    () => Object.fromEntries(trabajadores.map((t) => [t.id, t])),
    [trabajadores]
  );

  const hoyAusentes = useMemo(
    () => ausencias.filter((a) => incluyeFecha(hoyISO, a.fecha_inicio, a.fecha_fin)),
    [ausencias, hoyISO]
  );

  const proximosDias = useMemo(() => {
    const dias: { fecha: Date; ausencias: Ausencia[] }[] = [];
    for (let i = 1; i <= 7; i++) {
      const d = addDays(hoy, i);
      const fISO = toISO(d);
      dias.push({
        fecha: d,
        ausencias: ausencias.filter((a) =>
          incluyeFecha(fISO, a.fecha_inicio, a.fecha_fin)
        ),
      });
    }
    return dias;
  }, [ausencias, hoy]);

  const activos = trabajadores.filter((t) => t.activo);

  return (
    <div>
      <PageHeader
        title="Resumen de hoy"
        subtitle={fmt(hoy, "EEEE d 'de' MMMM yyyy")}
      />

      {/* Tarjetas resumen */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <Stat label="Equipo activo" value={activos.length} hint="trabajadores" />
        <Stat
          label="Hoy fuera"
          value={hoyAusentes.length}
          hint={`${activos.length ? Math.round((hoyAusentes.length / activos.length) * 100) : 0}% del equipo`}
          accent="rose"
        />
        <Stat
          label="De vacaciones"
          value={hoyAusentes.filter((a) => a.tipo === "vacaciones").length}
          accent="emerald"
        />
        <Stat
          label="De baja"
          value={hoyAusentes.filter((a) => a.tipo === "baja_medica").length}
          accent="rose"
        />
      </div>

      {/* Cobertura por departamento */}
      {(() => {
        const deps = new Map<string, { total: number; fuera: number }>();
        for (const t of activos) {
          const k = t.departamento || "Sin departamento";
          const dep = deps.get(k) ?? { total: 0, fuera: 0 };
          dep.total++;
          if (hoyAusentes.some((a) => a.trabajador_id === t.id)) dep.fuera++;
          deps.set(k, dep);
        }
        if (deps.size === 0) return null;
        return (
          <section className="card p-5 mb-8">
            <h2 className="font-semibold text-slate-800 mb-3">Cobertura por departamento</h2>
            <div className="space-y-2">
              {Array.from(deps.entries()).map(([dep, v]) => {
                const pct = (v.fuera / v.total) * 100;
                const danger = pct >= 50;
                return (
                  <div key={dep}>
                    <div className="flex items-center justify-between text-sm mb-1">
                      <span className="font-medium">{dep}</span>
                      <span className={"text-xs " + (danger ? "text-rose-600 font-semibold" : "text-slate-500")}>
                        {v.total - v.fuera}/{v.total} disponibles
                      </span>
                    </div>
                    <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className={"h-full " + (danger ? "bg-rose-500" : pct > 0 ? "bg-amber-400" : "bg-emerald-500")}
                        style={{ width: `${Math.max(5, 100 - pct)}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        );
      })()}

      {/* Lista de quién está fuera hoy */}
      <section className="card p-5 mb-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-slate-800">Quién está fuera hoy</h2>
          <span className="text-xs text-slate-500">{hoyAusentes.length} personas</span>
        </div>
        {loading ? (
          <p className="text-sm text-slate-500">Cargando…</p>
        ) : hoyAusentes.length === 0 ? (
          <p className="text-sm text-slate-500">Hoy nadie está ausente. ✨</p>
        ) : (
          <ul className="divide-y divide-slate-100">
            {hoyAusentes.map((a) => {
              const t = trabajadorPorId[a.trabajador_id];
              return (
                <li key={a.id} className="py-3 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <span
                      className="h-3 w-3 rounded-full border border-slate-200 shrink-0"
                      style={{ backgroundColor: t?.color || COLOR_DEFAULT }}
                    />
                    <span className={"h-2 w-2 rounded-full " + TIPO_DOT[a.tipo]} title={TIPO_LABEL[a.tipo]} />
                    <div className="min-w-0">
                      <div className="font-medium text-sm truncate">
                        {t ? `${t.nombre} ${t.apellidos ?? ""}`.trim() : "—"}
                      </div>
                      <div className="text-xs text-slate-500 truncate">
                        {t?.puesto ?? ""} {t?.departamento ? `· ${t.departamento}` : ""}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-xs">
                    <span className={"badge " + TIPO_COLOR[a.tipo]}>
                      {TIPO_LABEL[a.tipo]}
                    </span>
                    <span className="text-slate-500 whitespace-nowrap">
                      {fmt(a.fecha_inicio, "dd/MM")} – {fmt(a.fecha_fin, "dd/MM")}
                      {" · "}
                      {diasEntre(a.fecha_inicio, a.fecha_fin)}d
                    </span>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      {/* Próximos 7 días */}
      <section className="card p-5">
        <h2 className="font-semibold text-slate-800 mb-4">Próximos 7 días</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-7 gap-3">
          {proximosDias.map(({ fecha, ausencias }) => (
            <div key={fecha.toISOString()} className="rounded-lg border border-slate-200 p-3 bg-slate-50/50">
              <div className="text-xs uppercase tracking-wide text-slate-500">
                {fmt(fecha, "EEE")}
              </div>
              <div className="text-sm font-semibold">{fmt(fecha, "dd/MM")}</div>
              <div className="mt-2 space-y-1">
                {ausencias.length === 0 ? (
                  <div className="text-xs text-slate-400">—</div>
                ) : (
                  ausencias.slice(0, 4).map((a) => {
                    const t = trabajadorPorId[a.trabajador_id];
                    return (
                      <div key={a.id} className="flex items-center gap-1.5 text-xs">
                        <span
                          className="h-2 w-2 rounded-full border border-slate-200 shrink-0"
                          style={{ backgroundColor: t?.color || COLOR_DEFAULT }}
                        />
                        <span className="truncate">{t?.nombre ?? "—"}</span>
                      </div>
                    );
                  })
                )}
                {ausencias.length > 4 && (
                  <div className="text-[11px] text-slate-500">+{ausencias.length - 4} más</div>
                )}
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

function Stat({
  label,
  value,
  hint,
  accent = "slate",
}: {
  label: string;
  value: number;
  hint?: string;
  accent?: "slate" | "rose" | "emerald" | "amber" | "brand";
}) {
  const accents: Record<string, string> = {
    slate: "text-slate-900",
    rose: "text-rose-600",
    emerald: "text-emerald-600",
    amber: "text-amber-600",
    brand: "text-brand-600",
  };
  return (
    <div className="card p-4">
      <div className="text-xs uppercase tracking-wide text-slate-500">{label}</div>
      <div className={"text-3xl font-bold mt-1 " + accents[accent]}>{value}</div>
      {hint && <div className="text-xs text-slate-500 mt-1">{hint}</div>}
    </div>
  );
}
