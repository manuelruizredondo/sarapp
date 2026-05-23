"use client";
import { useEffect, useState } from "react";
import PageHeader from "@/components/PageHeader";
import {
  deleteTrabajador,
  listAusencias,
  listTrabajadores,
  upsertTrabajador,
} from "@/lib/data";
import { Ausencia, Trabajador } from "@/lib/types";
import { diasEntre } from "@/lib/dates";

type Form = Partial<Trabajador> & { id?: string };

export default function TrabajadoresPage() {
  const [items, setItems] = useState<Trabajador[]>([]);
  const [ausencias, setAusencias] = useState<Ausencia[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Form | null>(null);

  async function reload() {
    setLoading(true);
    const [t, a] = await Promise.all([listTrabajadores(), listAusencias()]);
    setItems(t);
    setAusencias(a);
    setLoading(false);
  }
  useEffect(() => {
    reload();
  }, []);

  function diasConsumidos(trabajadorId: string) {
    const year = new Date().getFullYear();
    return ausencias
      .filter(
        (a) =>
          a.trabajador_id === trabajadorId &&
          a.tipo === "vacaciones" &&
          new Date(a.fecha_inicio).getFullYear() === year
      )
      .reduce((acc, a) => acc + diasEntre(a.fecha_inicio, a.fecha_fin), 0);
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!editing) return;
    try {
      await upsertTrabajador({
        ...editing,
        dias_vacaciones_anuales: Number(editing.dias_vacaciones_anuales ?? 22),
        activo: editing.activo ?? true,
      });
      setEditing(null);
      await reload();
    } catch (err: any) {
      alert("Error: " + err.message);
    }
  }

  async function onDelete(id: string) {
    if (!confirm("¿Eliminar trabajador? También se borran sus ausencias.")) return;
    try {
      await deleteTrabajador(id);
      await reload();
    } catch (err: any) {
      alert("Error: " + err.message);
    }
  }

  return (
    <div>
      <PageHeader
        title="Trabajadores"
        subtitle="Alta, edición y días de vacaciones por año"
        actions={
          <button
            className="btn-primary"
            onClick={() =>
              setEditing({
                nombre: "",
                apellidos: "",
                email: "",
                puesto: "",
                departamento: "",
                dias_vacaciones_anuales: 22,
                activo: true,
              })
            }
          >
            + Nuevo trabajador
          </button>
        }
      />

      <div className="card overflow-hidden">
        {loading ? (
          <p className="p-5 text-sm text-slate-500">Cargando…</p>
        ) : items.length === 0 ? (
          <p className="p-5 text-sm text-slate-500">
            Aún no hay trabajadores. Crea el primero con el botón de arriba.
          </p>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-slate-600 text-xs uppercase">
              <tr>
                <th className="text-left px-4 py-3">Nombre</th>
                <th className="text-left px-4 py-3">Puesto</th>
                <th className="text-left px-4 py-3">Departamento</th>
                <th className="text-right px-4 py-3">Vacaciones</th>
                <th className="text-center px-4 py-3">Activo</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {items.map((t) => {
                const usados = diasConsumidos(t.id);
                const restantes = t.dias_vacaciones_anuales - usados;
                return (
                  <tr key={t.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3">
                      <div className="font-medium">{t.nombre} {t.apellidos ?? ""}</div>
                      <div className="text-xs text-slate-500">{t.email ?? ""}</div>
                    </td>
                    <td className="px-4 py-3 text-slate-700">{t.puesto ?? "—"}</td>
                    <td className="px-4 py-3 text-slate-700">{t.departamento ?? "—"}</td>
                    <td className="px-4 py-3 text-right">
                      <div className="font-semibold">{restantes} / {t.dias_vacaciones_anuales}d</div>
                      <div className="text-xs text-slate-500">{usados} consumidos</div>
                    </td>
                    <td className="px-4 py-3 text-center">
                      {t.activo ? (
                        <span className="badge bg-emerald-100 text-emerald-800 border-emerald-300">Sí</span>
                      ) : (
                        <span className="badge bg-slate-100 text-slate-600 border-slate-300">No</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right whitespace-nowrap">
                      <button className="btn-ghost mr-1" onClick={() => setEditing(t)}>Editar</button>
                      <button className="btn-ghost text-rose-600 hover:bg-rose-50" onClick={() => onDelete(t.id)}>Borrar</button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {editing && (
        <Modal onClose={() => setEditing(null)} title={editing.id ? "Editar trabajador" : "Nuevo trabajador"}>
          <form onSubmit={onSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-1">
              <label className="label">Nombre *</label>
              <input
                className="input"
                required
                value={editing.nombre ?? ""}
                onChange={(e) => setEditing({ ...editing, nombre: e.target.value })}
              />
            </div>
            <div>
              <label className="label">Apellidos</label>
              <input
                className="input"
                value={editing.apellidos ?? ""}
                onChange={(e) => setEditing({ ...editing, apellidos: e.target.value })}
              />
            </div>
            <div>
              <label className="label">Email</label>
              <input
                className="input"
                type="email"
                value={editing.email ?? ""}
                onChange={(e) => setEditing({ ...editing, email: e.target.value })}
              />
            </div>
            <div>
              <label className="label">Puesto</label>
              <input
                className="input"
                value={editing.puesto ?? ""}
                onChange={(e) => setEditing({ ...editing, puesto: e.target.value })}
              />
            </div>
            <div>
              <label className="label">Departamento</label>
              <input
                className="input"
                value={editing.departamento ?? ""}
                onChange={(e) => setEditing({ ...editing, departamento: e.target.value })}
              />
            </div>
            <div>
              <label className="label">Días de vacaciones anuales</label>
              <input
                className="input"
                type="number"
                min={0}
                max={60}
                value={editing.dias_vacaciones_anuales ?? 22}
                onChange={(e) => setEditing({ ...editing, dias_vacaciones_anuales: Number(e.target.value) })}
              />
            </div>
            <div className="flex items-center gap-2 md:col-span-2">
              <input
                id="activo"
                type="checkbox"
                checked={editing.activo ?? true}
                onChange={(e) => setEditing({ ...editing, activo: e.target.checked })}
              />
              <label htmlFor="activo" className="text-sm">Trabajador activo</label>
            </div>
            <div className="md:col-span-2 flex justify-end gap-2 pt-2">
              <button type="button" className="btn-ghost" onClick={() => setEditing(null)}>Cancelar</button>
              <button type="submit" className="btn-primary">Guardar</button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}

function Modal({
  title,
  children,
  onClose,
}: {
  title: string;
  children: React.ReactNode;
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 bg-slate-900/40 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-2xl shadow-xl">
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200">
          <h3 className="font-semibold">{title}</h3>
          <button onClick={onClose} className="text-slate-500 hover:text-slate-800">✕</button>
        </div>
        <div className="p-5">{children}</div>
      </div>
    </div>
  );
}
