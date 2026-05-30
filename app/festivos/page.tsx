"use client";
import { useEffect, useMemo, useState } from "react";
import PageHeader from "@/components/PageHeader";
import Modal from "@/components/Modal";
import {
  deleteFestivo,
  listFestivos,
  upsertFestivo,
} from "@/lib/data";
import { Festivo } from "@/lib/types";
import { fmt } from "@/lib/dates";
import { useAuth } from "@/components/AuthProvider";
import {
  ANIOS_DISPONIBLES,
  COMUNIDADES,
  FESTIVOS_NACIONALES,
  LOCALIDADES,
  type FestivoEntry,
} from "@/lib/festivosES";

export default function FestivosPage() {
  const { perfil, empresa, esSuperadmin } = useAuth();
  const [items, setItems] = useState<Festivo[]>([]);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [catalogoAbierto, setCatalogoAbierto] = useState(false);
  const [form, setForm] = useState({ fecha: "", nombre: "", ambito: "nacional" as Festivo["ambito"] });

  async function reload() {
    setLoading(true);
    setItems(await listFestivos());
    setLoading(false);
  }
  useEffect(() => { reload(); }, []);

  // Empresa por defecto al crear:
  //   - superadmin sin empresa concreta → global (empresa_id null)
  //   - admin de empresa → su empresa
  const empresaIdParaCrear = esSuperadmin ? null : empresa?.id ?? null;

  async function onAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!form.fecha || !form.nombre) return;
    try {
      await upsertFestivo({ ...form, empresa_id: empresaIdParaCrear });
      setForm({ fecha: "", nombre: "", ambito: "nacional" });
      setAdding(false);
      await reload();
    } catch (err: any) {
      alert("Error: " + err.message);
    }
  }

  async function onDelete(id: string) {
    if (!confirm("¿Eliminar este festivo?")) return;
    try {
      await deleteFestivo(id);
      await reload();
    } catch (err: any) {
      alert("Error: " + err.message);
    }
  }

  if (perfil && perfil.rol !== "admin" && !esSuperadmin) {
    return (
      <div>
        <PageHeader title="Festivos" subtitle="Solo el administrador puede gestionar festivos." />
      </div>
    );
  }

  const porAnio = items.reduce<Record<number, Festivo[]>>((acc, f) => {
    // "YYYY-MM-DD" → año sin pasar por new Date() (evita el desfase UTC).
    const y = Number(f.fecha.slice(0, 4));
    (acc[y] = acc[y] || []).push(f);
    return acc;
  }, {});

  return (
    <div>
      <PageHeader
        title="Festivos"
        subtitle="Los festivos no cuentan como días de vacaciones consumidos"
        actions={
          <div className="flex gap-2">
            <button className="btn-ghost" onClick={() => setCatalogoAbierto(true)}>
              + Catálogo España
            </button>
            <button className="btn-primary" onClick={() => setAdding(true)}>
              + Nuevo festivo
            </button>
          </div>
        }
      />

      {adding && (
        <div className="card p-4 mb-4">
          <form onSubmit={onAdd} className="grid grid-cols-1 md:grid-cols-4 gap-3 items-end">
            <div>
              <label className="label">Fecha</label>
              <input
                type="date" className="input" required
                value={form.fecha}
                onChange={(e) => setForm({ ...form, fecha: e.target.value })}
              />
            </div>
            <div className="md:col-span-2">
              <label className="label">Nombre</label>
              <input
                className="input" required placeholder="Ej: Día de la Comunidad"
                value={form.nombre}
                onChange={(e) => setForm({ ...form, nombre: e.target.value })}
              />
            </div>
            <div>
              <label className="label">Ámbito</label>
              <select
                className="input"
                value={form.ambito}
                onChange={(e) => setForm({ ...form, ambito: e.target.value as any })}
              >
                <option value="nacional">Nacional</option>
                <option value="autonomico">Autonómico</option>
                <option value="local">Local</option>
              </select>
            </div>
            <div className="md:col-span-4 flex justify-end gap-2">
              <button type="button" className="btn-ghost" onClick={() => setAdding(false)}>Cancelar</button>
              <button type="submit" className="btn-primary">Guardar</button>
            </div>
          </form>
        </div>
      )}

      {loading ? (
        <p className="text-sm text-slate-500">Cargando…</p>
      ) : items.length === 0 ? (
        <div className="card p-5 text-sm text-slate-500">
          Aún no hay festivos. Pulsa <strong>"+ Catálogo España"</strong> para elegir los que necesitas (nacionales, comunidad y localidad).
        </div>
      ) : (
        <div className="space-y-4">
          {Object.keys(porAnio).sort().map((y) => (
            <section key={y} className="card overflow-hidden">
              <header className="px-5 py-3 border-b border-slate-200 bg-slate-50/50 font-semibold">
                {y} · {porAnio[+y].length} festivos
              </header>
              <ul className="divide-y" style={{ borderColor: "#E5EAF2" }}>
                {porAnio[+y].sort((a, b) => a.fecha.localeCompare(b.fecha)).map((f) => (
                  <li key={f.id} className="px-4 md:px-5 py-3 flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <span className="text-xl md:text-2xl shrink-0">🎉</span>
                      <div className="min-w-0">
                        <div className="font-medium text-sm truncate">{f.nombre}</div>
                        <div className="text-xs truncate" style={{ color: "#7B8794" }}>{fmt(f.fecha, "EEEE d 'de' MMMM yyyy")}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="badge capitalize" style={{ background: "#F7F9FC", color: "#1F2937", borderColor: "#E5EAF2" }}>{f.ambito}</span>
                      <button className="btn-ghost" style={{ color: "#E5484D" }} onClick={() => onDelete(f.id)}>
                        Borrar
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      )}

      {catalogoAbierto && (
        <CatalogoFestivosModal
          empresaIdParaCrear={empresaIdParaCrear}
          fechasExistentes={new Set(items.map((f) => f.fecha))}
          onClose={() => setCatalogoAbierto(false)}
          onAdded={async () => {
            setCatalogoAbierto(false);
            await reload();
          }}
        />
      )}
    </div>
  );
}

// ============================================================
// CATÁLOGO MODAL — selección de festivos por año/CC.AA./localidad
// ============================================================
type Seleccion = Map<string, { fecha: string; nombre: string; ambito: Festivo["ambito"] }>;

function CatalogoFestivosModal({
  empresaIdParaCrear,
  fechasExistentes,
  onClose,
  onAdded,
}: {
  empresaIdParaCrear: string | null;
  fechasExistentes: Set<string>;
  onClose: () => void;
  onAdded: () => void;
}) {
  const [anio, setAnio] = useState<number>(ANIOS_DISPONIBLES[0]);
  const [comunidadCodigo, setComunidadCodigo] = useState<string>("AN");
  const [localidadSlug, setLocalidadSlug] = useState<string>("");
  const [seleccion, setSeleccion] = useState<Seleccion>(() => {
    // Precargar todos los nacionales del año inicial
    const m: Seleccion = new Map();
    for (const f of FESTIVOS_NACIONALES[ANIOS_DISPONIBLES[0]] ?? []) {
      m.set(f.fecha, { ...f, ambito: "nacional" });
    }
    return m;
  });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Listas derivadas
  const nacionales = FESTIVOS_NACIONALES[anio] ?? [];
  const comunidad = useMemo(
    () => COMUNIDADES.find((c) => c.codigo === comunidadCodigo),
    [comunidadCodigo]
  );
  const autonomicos = comunidad?.festivos[anio] ?? [];
  const localidadesDeLaCom = useMemo(
    () => LOCALIDADES.filter((l) => l.comunidad === comunidadCodigo),
    [comunidadCodigo]
  );
  const localidad = useMemo(
    () => LOCALIDADES.find((l) => l.slug === localidadSlug),
    [localidadSlug]
  );
  const locales = localidad?.festivos[anio] ?? [];

  // Cuando cambia de comunidad, resetear localidad
  useEffect(() => {
    setLocalidadSlug("");
  }, [comunidadCodigo]);

  function toggle(f: FestivoEntry, ambito: Festivo["ambito"]) {
    setSeleccion((prev) => {
      const next = new Map(prev);
      const key = f.fecha + "|" + f.nombre;
      if (next.has(key)) {
        next.delete(key);
      } else {
        next.set(key, { fecha: f.fecha, nombre: f.nombre, ambito });
      }
      return next;
    });
  }

  function isChecked(f: FestivoEntry) {
    return seleccion.has(f.fecha + "|" + f.nombre);
  }

  function marcarTodos(lista: FestivoEntry[], ambito: Festivo["ambito"]) {
    setSeleccion((prev) => {
      const next = new Map(prev);
      for (const f of lista) {
        next.set(f.fecha + "|" + f.nombre, { ...f, ambito });
      }
      return next;
    });
  }
  function desmarcarTodos(lista: FestivoEntry[]) {
    setSeleccion((prev) => {
      const next = new Map(prev);
      for (const f of lista) {
        next.delete(f.fecha + "|" + f.nombre);
      }
      return next;
    });
  }

  async function onGuardar() {
    if (seleccion.size === 0) return;
    setBusy(true);
    setError(null);

    // Los que ya existen en la BD los saltamos sin llamar a la API.
    const aInsertar = [...seleccion.values()].filter((f) => !fechasExistentes.has(f.fecha));
    let skip = seleccion.size - aInsertar.length;
    let ok = 0;
    let errores = 0;

    // Insertamos en paralelo en vez de uno a uno (antes era O(n) secuencial).
    const resultados = await Promise.allSettled(
      aInsertar.map((f) =>
        upsertFestivo({
          fecha: f.fecha,
          nombre: f.nombre,
          ambito: f.ambito,
          empresa_id: empresaIdParaCrear,
        })
      )
    );
    resultados.forEach((r, i) => {
      if (r.status === "fulfilled") {
        ok++;
      } else {
        const e: any = r.reason;
        // El más común: clave duplicada → la BD ya lo tenía
        if (e?.code === "23505" || /duplicate/i.test(e?.message ?? "")) {
          skip++;
        } else {
          errores++;
          console.error("Error añadiendo festivo", aInsertar[i], e);
        }
      }
    });
    setBusy(false);
    if (errores > 0) {
      setError(`Añadidos ${ok}, ya existían ${skip}, fallaron ${errores}. Revisa la consola.`);
    } else {
      onAdded();
    }
  }

  return (
    <Modal title="Catálogo de festivos en España" size="lg" onClose={onClose}>
      <div className="space-y-4">
        {/* Selector de año */}
        <div className="flex flex-wrap items-end gap-3">
          <div>
            <label className="label">Año</label>
            <select
              className="input"
              value={anio}
              onChange={(e) => setAnio(Number(e.target.value))}
            >
              {ANIOS_DISPONIBLES.map((y) => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
          </div>
          <div className="text-xs ml-auto" style={{ color: "#7B8794" }}>
            <strong>{seleccion.size}</strong> festivos seleccionados
          </div>
        </div>

        {/* Sección NACIONALES */}
        <SeccionFestivos
          titulo="🇪🇸 Nacionales"
          subtitulo="Calendario laboral estatal"
          lista={nacionales}
          ambito="nacional"
          isChecked={isChecked}
          onToggle={toggle}
          onMarcarTodos={() => marcarTodos(nacionales, "nacional")}
          onDesmarcarTodos={() => desmarcarTodos(nacionales)}
          fechasExistentes={fechasExistentes}
        />

        {/* Sección COMUNIDAD AUTÓNOMA */}
        <div className="card p-4 space-y-3">
          <div className="flex flex-wrap items-end gap-3">
            <div className="flex-1 min-w-[200px]">
              <label className="label">Comunidad autónoma</label>
              <select
                className="input"
                value={comunidadCodigo}
                onChange={(e) => setComunidadCodigo(e.target.value)}
              >
                {COMUNIDADES.map((c) => (
                  <option key={c.codigo} value={c.codigo}>{c.nombre}</option>
                ))}
              </select>
            </div>
            <div className="flex gap-2">
              <button type="button" className="btn-ghost text-xs"
                onClick={() => marcarTodos(autonomicos, "autonomico")}
              >Marcar todos</button>
              <button type="button" className="btn-ghost text-xs"
                onClick={() => desmarcarTodos(autonomicos)}
              >Desmarcar</button>
            </div>
          </div>
          {autonomicos.length === 0 ? (
            <p className="text-xs" style={{ color: "#7B8794" }}>
              Sin festivos autonómicos catalogados para {anio} en esta comunidad.
            </p>
          ) : (
            <ul className="divide-y" style={{ borderColor: "#E5EAF2" }}>
              {autonomicos.map((f) => (
                <FestivoRow
                  key={f.fecha + f.nombre}
                  festivo={f}
                  checked={isChecked(f)}
                  yaExiste={fechasExistentes.has(f.fecha)}
                  onToggle={() => toggle(f, "autonomico")}
                />
              ))}
            </ul>
          )}
        </div>

        {/* Sección LOCALIDAD */}
        <div className="card p-4 space-y-3">
          <div className="flex flex-wrap items-end gap-3">
            <div className="flex-1 min-w-[200px]">
              <label className="label">Localidad (opcional)</label>
              <select
                className="input"
                value={localidadSlug}
                onChange={(e) => setLocalidadSlug(e.target.value)}
              >
                <option value="">— Selecciona una localidad —</option>
                {localidadesDeLaCom.map((l) => (
                  <option key={l.slug} value={l.slug}>{l.nombre}</option>
                ))}
              </select>
            </div>
            {localidad && (
              <div className="flex gap-2">
                <button type="button" className="btn-ghost text-xs"
                  onClick={() => marcarTodos(locales, "local")}
                >Marcar todos</button>
                <button type="button" className="btn-ghost text-xs"
                  onClick={() => desmarcarTodos(locales)}
                >Desmarcar</button>
              </div>
            )}
          </div>
          {!localidad ? (
            <p className="text-xs" style={{ color: "#7B8794" }}>
              Elige una localidad para ver sus festivos. Si tu ciudad no está en el catálogo, añade los locales manualmente desde "+ Nuevo festivo".
            </p>
          ) : locales.length === 0 ? (
            <p className="text-xs" style={{ color: "#7B8794" }}>
              Sin festivos locales catalogados para {anio} en {localidad.nombre}.
            </p>
          ) : (
            <ul className="divide-y" style={{ borderColor: "#E5EAF2" }}>
              {locales.map((f) => (
                <FestivoRow
                  key={f.fecha + f.nombre}
                  festivo={f}
                  checked={isChecked(f)}
                  yaExiste={fechasExistentes.has(f.fecha)}
                  onToggle={() => toggle(f, "local")}
                />
              ))}
            </ul>
          )}
        </div>

        {error && (
          <div className="text-sm p-3 rounded-lg" style={{ background: "#FEE", color: "#E5484D" }}>
            {error}
          </div>
        )}

        <div className="flex justify-end gap-2 pt-2 border-t" style={{ borderColor: "#E5EAF2" }}>
          <button type="button" className="btn-ghost" onClick={onClose}>Cancelar</button>
          <button
            type="button"
            className="btn-primary"
            disabled={busy || seleccion.size === 0}
            onClick={onGuardar}
          >
            {busy ? "Añadiendo…" : `Añadir ${seleccion.size} seleccionados`}
          </button>
        </div>
      </div>
    </Modal>
  );
}

// ---------- Sección reutilizable ----------
function SeccionFestivos({
  titulo,
  subtitulo,
  lista,
  ambito,
  isChecked,
  onToggle,
  onMarcarTodos,
  onDesmarcarTodos,
  fechasExistentes,
}: {
  titulo: string;
  subtitulo: string;
  lista: FestivoEntry[];
  ambito: Festivo["ambito"];
  isChecked: (f: FestivoEntry) => boolean;
  onToggle: (f: FestivoEntry, ambito: Festivo["ambito"]) => void;
  onMarcarTodos: () => void;
  onDesmarcarTodos: () => void;
  fechasExistentes: Set<string>;
}) {
  return (
    <div className="card p-4 space-y-3">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h4 className="font-semibold" style={{ color: "#062E73" }}>{titulo}</h4>
          <p className="text-xs" style={{ color: "#7B8794" }}>{subtitulo}</p>
        </div>
        <div className="flex gap-2">
          <button type="button" className="btn-ghost text-xs" onClick={onMarcarTodos}>Marcar todos</button>
          <button type="button" className="btn-ghost text-xs" onClick={onDesmarcarTodos}>Desmarcar</button>
        </div>
      </div>
      {lista.length === 0 ? (
        <p className="text-xs" style={{ color: "#7B8794" }}>Sin entradas.</p>
      ) : (
        <ul className="divide-y" style={{ borderColor: "#E5EAF2" }}>
          {lista.map((f) => (
            <FestivoRow
              key={f.fecha + f.nombre}
              festivo={f}
              checked={isChecked(f)}
              yaExiste={fechasExistentes.has(f.fecha)}
              onToggle={() => onToggle(f, ambito)}
            />
          ))}
        </ul>
      )}
    </div>
  );
}

// ---------- Fila de festivo con checkbox ----------
function FestivoRow({
  festivo,
  checked,
  yaExiste,
  onToggle,
}: {
  festivo: FestivoEntry;
  checked: boolean;
  yaExiste: boolean;
  onToggle: () => void;
}) {
  return (
    <li className="py-2.5 flex items-center gap-3">
      <input
        type="checkbox"
        checked={checked}
        onChange={onToggle}
        className="h-4 w-4 cursor-pointer"
        style={{ accentColor: "#062E73" }}
      />
      <button
        type="button"
        onClick={onToggle}
        className="flex-1 text-left flex items-center justify-between gap-3 min-w-0"
      >
        <div className="min-w-0">
          <div className="text-sm truncate">{festivo.nombre}</div>
          <div className="text-xs" style={{ color: "#7B8794" }}>
            {fmt(festivo.fecha, "EEEE d 'de' MMMM yyyy")}
          </div>
        </div>
        {yaExiste && (
          <span className="badge shrink-0 text-[10px]"
            style={{ background: "#E6FBFB", color: "#062E73", borderColor: "#17C7C8" }}>
            ya añadido
          </span>
        )}
      </button>
    </li>
  );
}
