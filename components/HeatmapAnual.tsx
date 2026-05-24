"use client";
import { useMemo } from "react";
import { Ausencia, TIPO_DOT, TIPO_LABEL } from "@/lib/types";
import { incluyeFecha, toISO } from "@/lib/dates";
import { format } from "date-fns";
import { es } from "date-fns/locale";

export default function HeatmapAnual({
  year,
  ausencias,
  festivosISO,
  color,
}: {
  year: number;
  ausencias: Ausencia[];
  festivosISO: Set<string>;
  color: string;
}) {
  const months = useMemo(() => Array.from({ length: 12 }, (_, i) => i), []);

  function tipoEnDia(iso: string): string | null {
    for (const a of ausencias) {
      if (incluyeFecha(iso, a.fecha_inicio, a.fecha_fin)) return a.tipo;
    }
    return null;
  }

  return (
    <div className="overflow-x-auto">
      <div className="flex gap-3 min-w-fit">
        {months.map((m) => {
          const last = new Date(year, m + 1, 0).getDate();
          const cells = Array.from({ length: last }, (_, i) => i + 1);
          return (
            <div key={m} className="text-center">
              <div className="text-[11px] uppercase font-semibold text-slate-500 mb-1">
                {format(new Date(year, m, 1), "MMM", { locale: es })}
              </div>
              <div className="grid grid-cols-7 gap-[2px]">
                {cells.map((dn) => {
                  const d = new Date(year, m, dn);
                  const iso = toISO(d);
                  const tipo = tipoEnDia(iso);
                  const dia = d.getDay();
                  const finde = dia === 0 || dia === 6;
                  const fest = festivosISO.has(iso);
                  let bg = "#f1f5f9"; // slate-100
                  if (fest) bg = "#fef3c7"; // amber-100
                  else if (finde) bg = "#e2e8f0"; // slate-200
                  if (tipo) bg = color;
                  const title = `${iso}${tipo ? ` · ${TIPO_LABEL[tipo as keyof typeof TIPO_LABEL]}` : ""}${fest ? " · festivo" : ""}`;
                  return (
                    <div
                      key={dn}
                      className="h-3 w-3 rounded-sm border border-white"
                      style={{ backgroundColor: bg }}
                      title={title}
                    />
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
      <div className="mt-3 flex items-center gap-3 text-[11px] text-slate-500">
        <div className="flex items-center gap-1"><span className="h-2.5 w-2.5 rounded-sm" style={{ backgroundColor: color }} /> Ausencia</div>
        <div className="flex items-center gap-1"><span className="h-2.5 w-2.5 rounded-sm bg-amber-100" /> Festivo</div>
        <div className="flex items-center gap-1"><span className="h-2.5 w-2.5 rounded-sm bg-slate-200" /> Fin de semana</div>
        <div className="flex items-center gap-1"><span className="h-2.5 w-2.5 rounded-sm bg-slate-100" /> Día laborable</div>
      </div>
    </div>
  );
}
