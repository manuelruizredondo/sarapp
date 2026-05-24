"use client";
import { useEffect, useState } from "react";
import PageHeader from "@/components/PageHeader";
import { deleteFestivo, listFestivos, upsertFestivo } from "@/lib/data";
import { Festivo } from "@/lib/types";
import { fmt } from "@/lib/dates";
import { useAuth } from "@/components/AuthProvider";

const FESTIVOS_ES_2026: { fecha: string; nombre: string }[] = [
  { fecha: "2026-01-01", nombre: "Año Nuevo" },
  { fecha: "2026-01-06", nombre: "Epifanía del Señor" },
  { fecha: "2026-04-03", nombre: "Viernes Santo" },
  { fecha: "2026-05-01", nombre: "Fiesta del Trabajo" },
  { fecha: "2026-08-15", nombre: "Asunción de la Virgen" },
  { fecha: "2026-10-12", nombre: "Fiesta Nacional de España" },
  { fecha: "2026-11-02", nombre: "Día de Todos los Santos" },
  { fecha: "2026-12-07", nombre: "Día de la Constitución" },
  { fecha: "2026-12-08", nombre: "Inmaculada Concepción" },
  { fecha: "2026-12-25", nombre: "Natividad del Señor" },
];

export default function FestivosPage() {
  const { perfil } = useAuth();
  const [items, setItems] = useState<Festivo[]>([]);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [form, setForm] = useState({ fecha: "", nombre: "", ambito: "nacional" as Festivo["ambito"] });

  async function reload() {
    setLoading(true);
    setItems(await listFestivos());
    setLoading(false);
  }
  useEffect(() => { reload(); }, []);

  async function onAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!form.fecha || !form.nombre) return;
    try {
      await upsertFestivo(form);
      setForm({ fecha: "", nombre: "", ambito: "nacional" });
      setAdding(false);
      await reload();
    } catch (err: any) {
      alert("Error: " + err.message);
    }
  }

  async function onDelete(id: string) {
    if (!confirm("¿Eliminar este festivo?")) return;
    await deleteFestivo(id);
    await reload();
  }

  async function cargarNacionales2026() {
    if (!confirm("¿Añadir los 10 festivos nacionales de España 2026?")) return;
    for (const f of FESTIVOS_ES_2026) {
      try {
        await upsertFestivo({ ...f, ambito: "nacional" });
      } catch (e) { /* ignora duplicados */ }
    }
    await reload();
  }

  if (perfil && perfil.rol !== "admin") {
    return (
      <div>
        <PageHeader title="Festivos" subtitle="Solo el administrador puede gestionar festivos." />
      </div>
    );
  }

  const porAnio = items.reduce<Record<number, Festivo[]>>((acc, f) => {
    const y = new Date(f.fecha).getFullYear();
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
            <button className="btn-ghost" onClick={cargarNacionales2026}>
              + Festivos España 2026
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
          Aún no hay festivos. Pulsa "+ Festivos España 2026" para precargar los nacionales.
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
    </div>
  );
}
