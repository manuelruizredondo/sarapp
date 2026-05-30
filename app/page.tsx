"use client";
import { useEffect, useMemo, useState } from "react";
import {
  listAusenciasRango,
  listTrabajadores,
} from "@/lib/data";
import Link from "next/link";
import {
  Ausencia,
  Trabajador,
  TIPO_LABEL,
  TIPO_COLOR,
  COLOR_DEFAULT,
} from "@/lib/types";
import { useAuth } from "@/components/AuthProvider";
import { fmt, toISO, incluyeFecha, diasEntre, esFinDeSemana } from "@/lib/dates";
import { addDays, parseISO, differenceInCalendarDays } from "date-fns";

// Categoría visual para el calendario del equipo
type EstadoDia = "disponible" | "vacaciones" | "baja" | "otros" | "weekend";

function categoriaAusencia(tipo: Ausencia["tipo"]): Exclude<EstadoDia, "disponible" | "weekend"> {
  if (tipo === "vacaciones") return "vacaciones";
  if (tipo === "baja_medica") return "baja";
  return "otros";
}

const COLORES_ESTADO: Record<EstadoDia, { fill: string; text: string; dash: string }> = {
  disponible: { fill: "#DCFCE7", text: "#166534", dash: "#16C784" },
  vacaciones: { fill: "#FEF3C7", text: "#854D0E", dash: "#F5B700" },
  baja:       { fill: "#FEE2E2", text: "#991B1B", dash: "#E5484D" },
  otros:      { fill: "#DBEAFE", text: "#1E3A8A", dash: "#3B82F6" },
  weekend:    { fill: "transparent", text: "#94A3B8", dash: "#CBD5E1" },
};

const LABEL_ESTADO: Record<EstadoDia, string> = {
  disponible: "",
  vacaciones: "vacaciones",
  baja: "baja",
  otros: "fuera",
  weekend: "",
};

export default function Dashboard() {
  const { perfil, esSuperadmin } = useAuth();
  const isAdmin = perfil?.rol === "admin" || esSuperadmin;

  const [trabajadores, setTrabajadores] = useState<Trabajador[]>([]);
  const [ausencias, setAusencias] = useState<Ausencia[]>([]);
  const [loading, setLoading] = useState(true);
  const hoy = useMemo(() => new Date(), []);
  const hoyISO = toISO(hoy);

  useEffect(() => {
    (async () => {
      setLoading(true);
      const desde = toISO(hoy);
      const hasta = toISO(addDays(hoy, 40));
      const [t, a] = await Promise.all([
        listTrabajadores(),
        listAusenciasRango(desde, hasta),
      ]);
      setTrabajadores(t);
      setAusencias(a);
      setLoading(false);
    })();
  }, [hoy]);

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center text-sm" style={{ color: "#7B8794" }}>
        Cargando…
      </div>
    );
  }

  if (!isAdmin) {
    return <TrabajadorDashboard ausencias={ausencias} hoy={hoy} />;
  }

  return <AdminDashboard trabajadores={trabajadores} ausencias={ausencias} hoy={hoy} />;
}

// ============================================================
// DASHBOARD ADMIN
// ============================================================
function AdminDashboard({
  trabajadores,
  ausencias,
  hoy,
}: {
  trabajadores: Trabajador[];
  ausencias: Ausencia[];
  hoy: Date;
}) {
  const hoyISO = toISO(hoy);
  const activos = trabajadores.filter((t) => t.activo);
  const trabPorId = useMemo(
    () => Object.fromEntries(trabajadores.map((t) => [t.id, t])),
    [trabajadores]
  );

  const ausenciasHoy = ausencias.filter((a) => incluyeFecha(hoyISO, a.fecha_inicio, a.fecha_fin));
  const fueraHoyIds = new Set(ausenciasHoy.map((a) => a.trabajador_id));
  const disponibles = activos.length - fueraHoyIds.size;

  const vacacionesHoy = ausenciasHoy.filter((a) => a.tipo === "vacaciones").length;
  const bajaHoy = ausenciasHoy.filter((a) => a.tipo === "baja_medica").length;
  const otrosHoy = ausenciasHoy.length - vacacionesHoy - bajaHoy;

  // Departamentos
  const depMap = new Map<string, { total: number; disponibles: number }>();
  for (const t of activos) {
    const k = t.departamento || "Sin departamento";
    const cur = depMap.get(k) ?? { total: 0, disponibles: 0 };
    cur.total++;
    if (!fueraHoyIds.has(t.id)) cur.disponibles++;
    depMap.set(k, cur);
  }
  const departamentos = Array.from(depMap.entries()).map(([nombre, v]) => ({ nombre, ...v }));
  const depCubiertos = departamentos.filter((d) => d.disponibles === d.total).length;

  // Próxima ausencia futura
  const proximaAusencia = useMemo(() => {
    const futuras = ausencias
      .filter((a) => parseISO(a.fecha_inicio) > hoy)
      .sort((a, b) => a.fecha_inicio.localeCompare(b.fecha_inicio));
    return futuras[0] ?? null;
  }, [ausencias, hoy]);

  // Pendientes de validar
  const pendientes = ausencias.filter((a) => !a.aprobado);

  return (
    <div>
      {/* Bandeja "pendientes de validar" */}
      {pendientes.length > 0 && (
        <section
          className="card p-4 mb-5 flex items-center justify-between gap-3"
          style={{ borderLeft: "4px solid #F5B700", background: "#FFFCEF" }}
        >
          <div className="flex items-center gap-3">
            <span className="text-2xl">⏳</span>
            <div>
              <div className="font-semibold" style={{ color: "#062E73" }}>
                {pendientes.length} ausencia{pendientes.length === 1 ? "" : "s"} pendiente{pendientes.length === 1 ? "" : "s"} de validar
              </div>
              <div className="text-xs" style={{ color: "#7B8794" }}>
                Revísalas y márcalas como validadas ✓ cuando estén aprobadas.
              </div>
            </div>
          </div>
          <Link href="/ausencias" className="btn-primary text-sm whitespace-nowrap">
            Revisar
          </Link>
        </section>
      )}

      <div className="grid lg:grid-cols-[320px_1fr] gap-4">
        {/* Columna izquierda */}
        <div className="space-y-4">
          <HoyCard
            hoy={hoy}
            activos={activos.length}
            disponibles={disponibles}
            fueraHoy={fueraHoyIds.size}
            vacacionesHoy={vacacionesHoy}
            bajaHoy={bajaHoy}
            otrosHoy={otrosHoy}
          />
          <DepartamentosCard departamentos={departamentos} cubiertos={depCubiertos} />
          <ProximaAusenciaCard ausencia={proximaAusencia} trabajador={proximaAusencia ? trabPorId[proximaAusencia.trabajador_id] : null} hoy={hoy} />
        </div>

        {/* Columna derecha */}
        <CalendarioEquipo
          trabajadores={activos}
          ausencias={ausencias}
          hoy={hoy}
        />
      </div>
    </div>
  );
}

// ---------- Tarjeta "Hoy" ----------
function HoyCard({
  hoy,
  activos,
  disponibles,
  fueraHoy,
  vacacionesHoy,
  bajaHoy,
  otrosHoy,
}: {
  hoy: Date;
  activos: number;
  disponibles: number;
  fueraHoy: number;
  vacacionesHoy: number;
  bajaHoy: number;
  otrosHoy: number;
}) {
  const pct = activos > 0 ? (disponibles / activos) * 100 : 0;
  const status =
    pct >= 100 ? { label: "al completo", color: "#16C784" }
    : pct >= 50 ? { label: "parcial", color: "#F5B700" }
    : { label: "crítico", color: "#E5484D" };

  return (
    <div className="card p-5">
      <div className="flex items-center justify-between text-xs" style={{ color: "#7B8794" }}>
        <span>Hoy · {fmt(hoy, "EEE d MMM")}</span>
        <span className="inline-flex items-center gap-1.5">
          <span
            className="h-1.5 w-1.5 rounded-full"
            style={{ background: status.color }}
          />
          {status.label}
        </span>
      </div>

      <div className="mt-3 flex items-baseline gap-1">
        <span className="text-5xl font-bold" style={{ color: "#062E73" }}>{disponibles}</span>
        <span className="text-xl" style={{ color: "#CBD5E1" }}>/{activos}</span>
        <span className="text-xs ml-2" style={{ color: "#7B8794" }}>personas<br/>disponibles</span>
      </div>

      <div className="mt-3 h-1.5 w-full rounded-full overflow-hidden" style={{ background: "#EEF2F8" }}>
        <div
          className="h-full transition-all"
          style={{ width: `${pct}%`, background: status.color }}
        />
      </div>

      <div className="mt-4 flex flex-wrap gap-x-4 gap-y-1 text-xs" style={{ color: "#7B8794" }}>
        <span className="inline-flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full" style={{ background: "#3B82F6" }} />
          <strong style={{ color: "#1F2937" }}>{otrosHoy}</strong> fuera
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full" style={{ background: "#F5B700" }} />
          <strong style={{ color: "#1F2937" }}>{vacacionesHoy}</strong> vacaciones
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full" style={{ background: "#E5484D" }} />
          <strong style={{ color: "#1F2937" }}>{bajaHoy}</strong> de baja
        </span>
      </div>
    </div>
  );
}

// ---------- Tarjeta Departamentos ----------
function DepartamentosCard({
  departamentos,
  cubiertos,
}: {
  departamentos: { nombre: string; total: number; disponibles: number }[];
  cubiertos: number;
}) {
  return (
    <div className="card p-5">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-semibold" style={{ color: "#062E73" }}>Departamentos</h3>
        <span className="text-xs" style={{ color: "#7B8794" }}>{cubiertos} cubierto{cubiertos === 1 ? "" : "s"}</span>
      </div>
      {departamentos.length === 0 ? (
        <p className="text-sm" style={{ color: "#7B8794" }}>Sin departamentos.</p>
      ) : (
        <ul className="space-y-2.5">
          {departamentos.map((d) => {
            const ok = d.disponibles === d.total;
            return (
              <li key={d.nombre} className="flex items-center justify-between text-sm">
                <span className="flex items-center gap-2 min-w-0">
                  <span
                    className="inline-flex items-center justify-center h-4 w-4 rounded-full shrink-0 text-[10px] text-white"
                    style={{ background: ok ? "#16C784" : "#F5B700" }}
                    aria-hidden
                  >
                    {ok ? "✓" : "!"}
                  </span>
                  <span className="truncate">{d.nombre}</span>
                </span>
                <span className="text-xs tabular-nums" style={{ color: "#7B8794" }}>
                  {d.disponibles}/{d.total}
                </span>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

// ---------- Tarjeta próxima ausencia ----------
function ProximaAusenciaCard({
  ausencia,
  trabajador,
  hoy,
}: {
  ausencia: Ausencia | null;
  trabajador: Trabajador | null | undefined;
  hoy: Date;
}) {
  if (!ausencia || !trabajador) {
    return (
      <div className="card p-5">
        <h3 className="font-semibold mb-2" style={{ color: "#062E73" }}>Próxima ausencia</h3>
        <p className="text-sm" style={{ color: "#7B8794" }}>No hay ausencias programadas en los próximos 40 días.</p>
      </div>
    );
  }
  const diasRestantes = differenceInCalendarDays(parseISO(ausencia.fecha_inicio), hoy);
  const cat = categoriaAusencia(ausencia.tipo);
  const colores = COLORES_ESTADO[cat];

  return (
    <div className="card p-5">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-semibold" style={{ color: "#062E73" }}>Próxima ausencia</h3>
        <span className="text-xs" style={{ color: "#7B8794" }}>
          {diasRestantes === 0 ? "hoy" : `en ${diasRestantes} día${diasRestantes === 1 ? "" : "s"}`}
        </span>
      </div>
      <div className="flex items-center gap-3">
        <span
          className="h-9 w-9 rounded-full flex items-center justify-center text-white text-sm font-bold shrink-0"
          style={{ backgroundColor: trabajador.color || COLOR_DEFAULT }}
        >
          {(trabajador.nombre || "?").charAt(0).toUpperCase()}{trabajador.apellidos?.charAt(0).toUpperCase() ?? ""}
        </span>
        <div className="min-w-0 flex-1">
          <div className="font-medium text-sm truncate">
            {trabajador.nombre} {trabajador.apellidos ?? ""}
          </div>
          <div className="flex items-center gap-2 mt-0.5 flex-wrap">
            <span
              className="badge text-[10px]"
              style={{ background: colores.fill, color: colores.text, borderColor: colores.fill }}
            >
              {TIPO_LABEL[ausencia.tipo].toLowerCase()}
            </span>
            <span className="text-xs" style={{ color: "#7B8794" }}>
              {fmt(ausencia.fecha_inicio, "EEE d MMM")} – {fmt(ausencia.fecha_fin, "EEE d MMM")}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================================
// CALENDARIO DEL EQUIPO (derecha)
// ============================================================
function CalendarioEquipo({
  trabajadores,
  ausencias,
  hoy,
}: {
  trabajadores: Trabajador[];
  ausencias: Ausencia[];
  hoy: Date;
}) {
  const [vista, setVista] = useState<"semana" | "mes">("semana");
  const [offset, setOffset] = useState(0);
  const dias = vista === "semana" ? 14 : 30;
  const start = useMemo(() => addDays(hoy, offset), [hoy, offset]);
  const dayList = useMemo(
    () => Array.from({ length: dias }, (_, i) => addDays(start, i)),
    [start, dias]
  );
  const hoyISO = toISO(hoy);

  // Anchura de la columna de persona y de cada día
  const personW = 180;
  const dayW = vista === "semana" ? 56 : 36;
  const totalW = personW + dayList.length * dayW;

  return (
    <div className="card overflow-hidden flex flex-col">
      {/* Header */}
      <div className="p-5 pb-3">
        <div className="flex items-start justify-between gap-3 flex-wrap">
          <div>
            <div className="text-[10px] uppercase tracking-wider" style={{ color: "#7B8794" }}>
              Próximos {dias} días
            </div>
            <h2 className="text-2xl font-bold tracking-tight" style={{ color: "#062E73" }}>
              Calendario del equipo
            </h2>
          </div>
          <div className="flex items-center gap-2">
            <div className="inline-flex rounded-full p-1" style={{ background: "#EEF2F8" }}>
              <button
                className="px-3 py-1 text-xs rounded-full font-medium transition-colors"
                style={
                  vista === "semana"
                    ? { background: "#062E73", color: "white" }
                    : { color: "#1F2937" }
                }
                onClick={() => setVista("semana")}
              >
                Semana
              </button>
              <button
                className="px-3 py-1 text-xs rounded-full font-medium transition-colors"
                style={
                  vista === "mes"
                    ? { background: "#062E73", color: "white" }
                    : { color: "#1F2937" }
                }
                onClick={() => setVista("mes")}
              >
                Mes
              </button>
            </div>
            <button
              className="h-7 w-7 rounded-full inline-flex items-center justify-center text-sm"
              style={{ background: "#EEF2F8", color: "#062E73" }}
              onClick={() => setOffset(offset - dias)}
              aria-label="Anterior"
            >
              ‹
            </button>
            <button
              className="h-7 w-7 rounded-full inline-flex items-center justify-center text-sm"
              style={{ background: "#EEF2F8", color: "#062E73" }}
              onClick={() => setOffset(offset + dias)}
              aria-label="Siguiente"
            >
              ›
            </button>
          </div>
        </div>
      </div>

      {/* Grid */}
      <div className="overflow-x-auto px-5">
        <div style={{ minWidth: totalW }}>
          {/* Header de días */}
          <div className="grid items-center text-[10px] uppercase tracking-wide pb-2 border-b"
            style={{
              gridTemplateColumns: `${personW}px repeat(${dias}, ${dayW}px)`,
              color: "#7B8794",
              borderColor: "#E5EAF2",
            }}
          >
            <div>Persona</div>
            {dayList.map((d) => {
              const isToday = toISO(d) === hoyISO;
              const weekend = esFinDeSemana(d);
              return (
                <div
                  key={d.toISOString()}
                  className="flex flex-col items-center justify-center py-1"
                  style={{
                    background: isToday ? "#062E73" : "transparent",
                    color: isToday ? "white" : weekend ? "#CBD5E1" : "#7B8794",
                    borderRadius: isToday ? 8 : 0,
                  }}
                >
                  <span>{fmt(d, "EEE").slice(0, 3)}</span>
                  <span className={"text-sm " + (isToday ? "font-bold" : "")}>
                    {fmt(d, "dd")}
                  </span>
                </div>
              );
            })}
          </div>

          {/* Filas de trabajadores */}
          {trabajadores.length === 0 ? (
            <div className="py-8 text-center text-sm" style={{ color: "#7B8794" }}>
              No hay trabajadores activos.
            </div>
          ) : (
            trabajadores.map((t) => (
              <FilaTrabajador
                key={t.id}
                trabajador={t}
                ausencias={ausencias.filter((a) => a.trabajador_id === t.id)}
                dayList={dayList}
                personW={personW}
                dayW={dayW}
                dias={dias}
                hoyISO={hoyISO}
              />
            ))
          )}
        </div>
      </div>

      {/* Leyenda */}
      <div className="p-5 pt-3 mt-2 flex flex-wrap items-center gap-x-5 gap-y-2 text-xs border-t"
        style={{ borderColor: "#E5EAF2" }}>
        <LegendDot color={COLORES_ESTADO.disponible.dash} label="Disponible" />
        <LegendDot color={COLORES_ESTADO.vacaciones.dash} label="Vacaciones" />
        <LegendDot color={COLORES_ESTADO.baja.dash} label="Baja médica" />
        <LegendDot color={COLORES_ESTADO.otros.dash} label="Otros" />
        <span style={{ color: "#7B8794" }} className="ml-auto">
          Hoy se muestra resaltado · Fines de semana atenuados
        </span>
      </div>
    </div>
  );
}

function LegendDot({ color, label }: { color: string; label: string }) {
  return (
    <span className="inline-flex items-center gap-1.5" style={{ color: "#7B8794" }}>
      <span className="h-2 w-2 rounded-full" style={{ background: color }} />
      {label}
    </span>
  );
}

function FilaTrabajador({
  trabajador,
  ausencias,
  dayList,
  personW,
  dayW,
  dias,
  hoyISO,
}: {
  trabajador: Trabajador;
  ausencias: Ausencia[];
  dayList: Date[];
  personW: number;
  dayW: number;
  dias: number;
  hoyISO: string;
}) {
  // Para cada día, calcula su estado
  const estados = dayList.map((d) => {
    const dISO = toISO(d);
    if (esFinDeSemana(d)) return { estado: "weekend" as EstadoDia, ausencia: null as Ausencia | null };
    const ausencia = ausencias.find((a) => incluyeFecha(dISO, a.fecha_inicio, a.fecha_fin)) ?? null;
    if (ausencia) {
      return { estado: categoriaAusencia(ausencia.tipo) as EstadoDia, ausencia };
    }
    return { estado: "disponible" as EstadoDia, ausencia: null };
  });

  // Marca primer día del segmento de cada ausencia (para mostrar el label)
  const primerosDelSegmento = new Set<number>();
  let prevAusenciaId: string | null = null;
  estados.forEach((s, i) => {
    if (s.ausencia && s.ausencia.id !== prevAusenciaId) {
      primerosDelSegmento.add(i);
    }
    prevAusenciaId = s.ausencia?.id ?? null;
  });

  return (
    <div
      className="grid items-center border-b"
      style={{
        gridTemplateColumns: `${personW}px repeat(${dias}, ${dayW}px)`,
        borderColor: "#F1F5F9",
      }}
    >
      <div className="py-3 pr-3 flex items-center gap-2 min-w-0">
        <span
          className="h-8 w-8 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0"
          style={{ backgroundColor: trabajador.color || COLOR_DEFAULT }}
        >
          {(trabajador.nombre || "?").charAt(0).toUpperCase()}
          {trabajador.apellidos?.charAt(0).toUpperCase() ?? ""}
        </span>
        <div className="min-w-0">
          <div className="text-sm font-medium truncate">{trabajador.nombre} {trabajador.apellidos ?? ""}</div>
          <div className="text-[11px] truncate" style={{ color: "#7B8794" }}>
            {trabajador.departamento || "Sin departamento"}
          </div>
        </div>
      </div>

      {estados.map((s, i) => {
        const isToday = toISO(dayList[i]) === hoyISO;
        const c = COLORES_ESTADO[s.estado];
        const esPrimero = primerosDelSegmento.has(i);
        const finDeSemana = s.estado === "weekend";

        return (
          <div
            key={i}
            className="relative flex items-center justify-center py-2.5"
            title={s.ausencia ? `${TIPO_LABEL[s.ausencia.tipo]} · ${fmt(s.ausencia.fecha_inicio, "dd/MM")} → ${fmt(s.ausencia.fecha_fin, "dd/MM")}` : ""}
          >
            {finDeSemana ? (
              <span className="text-[10px]" style={{ color: c.dash }}>···</span>
            ) : s.estado === "disponible" ? (
              <span
                className="h-1 rounded-full"
                style={{ background: c.dash, width: dayW - 16 }}
              />
            ) : (
              <span
                className="h-6 flex items-center justify-center text-[10px] font-medium px-2 rounded-full whitespace-nowrap"
                style={{
                  background: c.fill,
                  color: c.text,
                  width: esPrimero ? "auto" : "100%",
                  minWidth: 0,
                }}
              >
                {esPrimero ? LABEL_ESTADO[s.estado] : ""}
              </span>
            )}
          </div>
        );
      })}
    </div>
  );
}

// ============================================================
// DASHBOARD TRABAJADOR (vista simple)
// ============================================================
function TrabajadorDashboard({
  ausencias,
  hoy,
}: {
  ausencias: Ausencia[];
  hoy: Date;
}) {
  const { perfil } = useAuth();
  const hoyISO = toISO(hoy);
  const misAusencias = ausencias
    .filter((a) => a.trabajador_id === perfil?.id)
    .sort((a, b) => a.fecha_inicio.localeCompare(b.fecha_inicio));

  const ausenciasHoy = ausencias.filter((a) => incluyeFecha(hoyISO, a.fecha_inicio, a.fecha_fin));
  const proximos7 = Array.from({ length: 7 }, (_, i) => addDays(hoy, i));

  return (
    <div className="space-y-6">
      {/* Mi panel */}
      <section className="card p-5">
        <h2 className="font-semibold mb-3" style={{ color: "#062E73" }}>Tus próximas ausencias</h2>
        {misAusencias.length === 0 ? (
          <p className="text-sm" style={{ color: "#7B8794" }}>No tienes ausencias programadas.</p>
        ) : (
          <ul className="divide-y" style={{ borderColor: "#E5EAF2" }}>
            {misAusencias.slice(0, 5).map((a) => (
              <li key={a.id} className="py-2.5 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <span className={"badge " + TIPO_COLOR[a.tipo]}>{TIPO_LABEL[a.tipo]}</span>
                  <span className="text-sm">
                    {fmt(a.fecha_inicio, "dd/MM")} – {fmt(a.fecha_fin, "dd/MM")} ({diasEntre(a.fecha_inicio, a.fecha_fin)}d)
                  </span>
                </div>
                {a.aprobado ? <span className="text-xs font-semibold" title="Validada" style={{ color: "#16C784" }}>✓ Validada</span> : <span className="text-xs" style={{ color: "#F5B700" }}>Pendiente</span>}
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* Tu estado hoy */}
      <section className="card p-5">
        <h2 className="font-semibold mb-3" style={{ color: "#062E73" }}>Tu estado hoy</h2>
        {ausenciasHoy.length === 0 ? (
          <p className="text-sm" style={{ color: "#16C784" }}>Hoy estás disponible. ✨</p>
        ) : (
          <div className="flex items-center gap-2 flex-wrap">
            <span className={"badge " + TIPO_COLOR[ausenciasHoy[0].tipo]}>{TIPO_LABEL[ausenciasHoy[0].tipo]}</span>
            <span className="text-sm" style={{ color: "#7B8794" }}>
              {fmt(ausenciasHoy[0].fecha_inicio, "dd/MM")} – {fmt(ausenciasHoy[0].fecha_fin, "dd/MM")}
            </span>
            {!ausenciasHoy[0].aprobado && (
              <span className="text-xs" style={{ color: "#F5B700" }}>· pendiente de validar</span>
            )}
          </div>
        )}
      </section>

      {/* Tus próximos 7 días */}
      <section className="card p-5">
        <h2 className="font-semibold mb-3" style={{ color: "#062E73" }}>Tus próximos 7 días</h2>
        <div className="grid grid-cols-7 gap-2">
          {proximos7.map((d) => {
            const dISO = toISO(d);
            const a = ausencias.find((x) => incluyeFecha(dISO, x.fecha_inicio, x.fecha_fin));
            return (
              <div key={dISO} className="rounded-lg border p-2 text-center" style={{ borderColor: "#E5EAF2" }}>
                <div className="text-[10px] uppercase" style={{ color: "#7B8794" }}>{fmt(d, "EEE")}</div>
                <div className="text-sm font-bold">{fmt(d, "dd")}</div>
                <div className="mt-1 text-[10px] truncate" style={{ color: a ? "#E5484D" : "#16C784" }} title={a ? TIPO_LABEL[a.tipo] : ""}>
                  {a ? TIPO_LABEL[a.tipo].toLowerCase() : "—"}
                </div>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}
