"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import PageHeader from "@/components/PageHeader";
import {
  adminBorrarUsuario,
  adminCambiarPassword,
  adminCrearUsuario,
  deleteTrabajador,
  listAusencias,
  listFestivos,
  listTrabajadores,
  upsertTrabajador,
} from "@/lib/data";
import { Ausencia, COLOR_DEFAULT, Festivo, Trabajador, colorPorIndice } from "@/lib/types";
import { diasLaborables } from "@/lib/dates";
import ColorPicker from "@/components/ColorPicker";
import Modal from "@/components/Modal";
import EmptyState from "@/components/EmptyState";

type Form = Partial<Trabajador> & { id?: string; password?: string };

export default function TrabajadoresPage() {
  const [items, setItems] = useState<Trabajador[]>([]);
  const [ausencias, setAusencias] = useState<Ausencia[]>([]);
  const [festivos, setFestivos] = useState<Festivo[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Form | null>(null);
  const [pwdFor, setPwdFor] = useState<Trabajador | null>(null);
  const [pwdNew, setPwdNew] = useState("");
  const [saving, setSaving] = useState(false);

  async function reload() {
    setLoading(true);
    const [t, a, f] = await Promise.all([listTrabajadores(), listAusencias(), listFestivos()]);
    setItems(t);
    setAusencias(a);
    setFestivos(f);
    setLoading(false);
  }
  useEffect(() => { reload(); }, []);

  const festivosISO = new Set(festivos.map((f) => f.fecha));

  function diasConsumidos(trabajadorId: string) {
    const year = new Date().getFullYear();
    return ausencias
      .filter((a) =>
        a.trabajador_id === trabajadorId &&
        a.tipo === "vacaciones" &&
        new Date(a.fecha_inicio).getFullYear() === year
      )
      .reduce((acc, a) => acc + diasLaborables(a.fecha_inicio, a.fecha_fin, festivosISO), 0);
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!editing) return;
    setSaving(true);
    try {
      if (!editing.id) {
        // NUEVO trabajador: la API crea usuario en Auth + registro
        await adminCrearUsuario({
          email: editing.email!,
          password: editing.password!,
          nombre: editing.nombre!,
          apellidos: editing.apellidos ?? "",
          puesto: editing.puesto ?? "",
          departamento: editing.departamento ?? "",
          dias_vacaciones_anuales: Number(editing.dias_vacaciones_anuales ?? 22),
          color: editing.color ?? COLOR_DEFAULT,
          rol: (editing.rol as any) ?? "trabajador",
          activo: editing.activo ?? true,
        });
      } else {
        // EDICIÓN: solo actualiza datos en la tabla (no toca Auth)
        const { password, ...patch } = editing;
        await upsertTrabajador({
          ...patch,
          dias_vacaciones_anuales: Number(patch.dias_vacaciones_anuales ?? 22),
          activo: patch.activo ?? true,
        });
      }
      setEditing(null);
      await reload();
    } catch (err: any) {
      alert("Error: " + err.message);
    } finally {
      setSaving(false);
    }
  }

  async function onDelete(t: Trabajador) {
    if (!confirm(`¿Eliminar a ${t.nombre}? También se borra su usuario de acceso y sus ausencias.`)) return;
    try {
      if (t.user_id) {
        await adminBorrarUsuario(t.id);
      } else {
        await deleteTrabajador(t.id);
      }
      await reload();
    } catch (err: any) {
      alert("Error: " + err.message);
    }
  }

  async function onChangePwd(e: React.FormEvent) {
    e.preventDefault();
    if (!pwdFor?.user_id) return;
    if (pwdNew.length < 6) { alert("Mínimo 6 caracteres"); return; }
    try {
      await adminCambiarPassword(pwdFor.user_id, pwdNew);
      setPwdFor(null);
      setPwdNew("");
      alert("Contraseña actualizada");
    } catch (err: any) {
      alert("Error: " + err.message);
    }
  }

  return (
    <div>
      <PageHeader
        title="Trabajadores"
        subtitle="Alta, edición y acceso a la app"
        actions={
          <button
            className="btn-primary"
            onClick={() =>
              setEditing({
                nombre: "",
                apellidos: "",
                email: "",
                password: "",
                puesto: "",
                departamento: "",
                dias_vacaciones_anuales: 22,
                activo: true,
                color: colorPorIndice(items.length),
                rol: "trabajador",
              })
            }
          >
            + Nuevo trabajador
          </button>
        }
      />

      <div className="card overflow-hidden">
        {loading ? (
          <p className="p-5 text-sm" style={{ color: "#7B8794" }}>Cargando…</p>
        ) : items.length === 0 ? (
          <div className="p-5">
            <EmptyState
              icon="👥"
              title="Aún no hay trabajadores"
              hint="Crea el primer trabajador con el botón de arriba. La app generará automáticamente sus credenciales de acceso."
            />
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead style={{ background: "#F7F9FC" }} className="text-xs uppercase">
              <tr>
                <th className="text-left px-4 py-3 w-8"></th>
                <th className="text-left px-4 py-3">Nombre</th>
                <th className="text-left px-4 py-3">Puesto</th>
                <th className="text-left px-4 py-3">Departamento</th>
                <th className="text-right px-4 py-3">Vacaciones</th>
                <th className="text-center px-4 py-3">Activo</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y" style={{ borderColor: "#E5EAF2" }}>
              {items.map((t) => {
                const usados = diasConsumidos(t.id);
                const restantes = t.dias_vacaciones_anuales - usados;
                return (
                  <tr key={t.id} className="hover:bg-[#F7F9FC]">
                    <td className="px-4 py-3">
                      <span
                        className="inline-block h-4 w-4 rounded-full"
                        style={{ backgroundColor: t.color || COLOR_DEFAULT, border: "1px solid #E5EAF2" }}
                      />
                    </td>
                    <td className="px-4 py-3">
                      <Link href={`/trabajadores/${t.id}`} className="font-medium hover:opacity-80" style={{ color: "#062E73" }}>
                        {t.nombre} {t.apellidos ?? ""}
                      </Link>
                      <div className="text-xs flex items-center gap-2 flex-wrap" style={{ color: "#7B8794" }}>
                        {t.email ?? ""}
                        {t.rol === "admin" && (
                          <span className="badge" style={{ background: "#062E73", color: "#fff", borderColor: "#062E73" }}>admin</span>
                        )}
                        {!t.user_id && (
                          <span className="badge" style={{ background: "#FFF8E1", color: "#7a5d00", borderColor: "#F5B700" }}>sin acceso</span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3">{t.puesto ?? "—"}</td>
                    <td className="px-4 py-3">{t.departamento ?? "—"}</td>
                    <td className="px-4 py-3 text-right">
                      <div className="font-semibold">{restantes} / {t.dias_vacaciones_anuales}d</div>
                      <div className="text-xs" style={{ color: "#7B8794" }}>{usados} consumidos</div>
                    </td>
                    <td className="px-4 py-3 text-center">
                      {t.activo ? (
                        <span className="badge" style={{ background: "#E6F9F1", color: "#0a7a4d", borderColor: "#16C784" }}>Sí</span>
                      ) : (
                        <span className="badge" style={{ background: "#F7F9FC", color: "#7B8794", borderColor: "#E5EAF2" }}>No</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right whitespace-nowrap">
                      <button className="btn-ghost mr-1" onClick={() => setEditing(t)}>Editar</button>
                      {t.user_id && (
                        <button className="btn-ghost mr-1" onClick={() => { setPwdFor(t); setPwdNew(""); }}>
                          Pwd
                        </button>
                      )}
                      <button className="btn-ghost" style={{ color: "#E5484D" }} onClick={() => onDelete(t)}>
                        Borrar
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Modal alta/edición */}
      {editing && (
        <Modal onClose={() => setEditing(null)} title={editing.id ? "Editar trabajador" : "Nuevo trabajador"}>
          <form onSubmit={onSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="label">Nombre *</label>
              <input
                className="input" required
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
              <label className="label">Email {!editing.id && "*"}</label>
              <input
                className="input" type="email" required={!editing.id}
                value={editing.email ?? ""}
                onChange={(e) => setEditing({ ...editing, email: e.target.value })}
                disabled={!!editing.id}
              />
              {editing.id && (
                <div className="text-[11px] mt-1" style={{ color: "#7B8794" }}>
                  El email del login no se puede cambiar desde aquí.
                </div>
              )}
            </div>
            {!editing.id && (
              <div>
                <label className="label">Contraseña inicial *</label>
                <input
                  className="input" type="text" required minLength={6}
                  placeholder="Mínimo 6 caracteres"
                  value={editing.password ?? ""}
                  onChange={(e) => setEditing({ ...editing, password: e.target.value })}
                />
                <div className="text-[11px] mt-1" style={{ color: "#7B8794" }}>
                  Compártela con el trabajador para su primer acceso.
                </div>
              </div>
            )}
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
                className="input" type="number" min={0} max={60}
                value={editing.dias_vacaciones_anuales ?? 22}
                onChange={(e) => setEditing({ ...editing, dias_vacaciones_anuales: Number(e.target.value) })}
              />
            </div>
            <div>
              <label className="label">Rol</label>
              <select
                className="input"
                value={editing.rol ?? "trabajador"}
                onChange={(e) => setEditing({ ...editing, rol: e.target.value as any })}
              >
                <option value="trabajador">Trabajador</option>
                <option value="admin">Administrador</option>
              </select>
            </div>
            <div className="md:col-span-2">
              <label className="label">Color en el calendario</label>
              <ColorPicker
                value={editing.color || COLOR_DEFAULT}
                onChange={(hex) => setEditing({ ...editing, color: hex })}
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
              <button type="submit" className="btn-primary" disabled={saving}>
                {saving ? "Guardando…" : (editing.id ? "Guardar" : "Crear acceso y guardar")}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Modal cambiar contraseña */}
      {pwdFor && (
        <Modal onClose={() => setPwdFor(null)} title={`Cambiar contraseña de ${pwdFor.nombre}`}>
          <form onSubmit={onChangePwd} className="space-y-3">
            <div>
              <label className="label">Nueva contraseña</label>
              <input
                className="input" type="text" minLength={6} required
                value={pwdNew}
                onChange={(e) => setPwdNew(e.target.value)}
                placeholder="Mínimo 6 caracteres"
              />
            </div>
            <div className="flex justify-end gap-2">
              <button type="button" className="btn-ghost" onClick={() => setPwdFor(null)}>Cancelar</button>
              <button type="submit" className="btn-primary">Cambiar</button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}

