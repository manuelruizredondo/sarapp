"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import PageHeader from "@/components/PageHeader";
import Modal from "@/components/Modal";
import { useAuth } from "@/components/AuthProvider";
import {
  listEmpresas,
  superadminCrearEmpresa,
  superadminEditarEmpresa,
} from "@/lib/data";
import type { Empresa, PlanEmpresa } from "@/lib/types";
import { Plus } from "lucide-react";

type EmpresaConConteo = Empresa & { n_trabajadores?: number };

const PLAN_LABEL: Record<PlanEmpresa, string> = {
  free: "Free",
  basic: "Basic",
  pro: "Pro",
  enterprise: "Enterprise",
};

export default function SuperadminPage() {
  const router = useRouter();
  const { esSuperadmin, loading } = useAuth();
  const [items, setItems] = useState<EmpresaConConteo[]>([]);
  const [cargando, setCargando] = useState(true);
  const [adding, setAdding] = useState(false);
  const [editando, setEditando] = useState<Empresa | null>(null);

  useEffect(() => {
    if (loading) return;
    if (!esSuperadmin) {
      router.replace("/");
    }
  }, [esSuperadmin, loading, router]);

  async function reload() {
    setCargando(true);
    try {
      // Pedimos al endpoint para incluir el conteo de trabajadores
      const r = await fetch("/api/superadmin/empresas", {
        headers: await authHeader(),
      });
      const j = await r.json();
      if (r.ok) {
        setItems(j.empresas ?? []);
      } else {
        // Fallback: sin conteos
        setItems(await listEmpresas());
      }
    } finally {
      setCargando(false);
    }
  }

  useEffect(() => {
    if (esSuperadmin) reload();
  }, [esSuperadmin]);

  async function toggleActivo(e: Empresa) {
    try {
      await superadminEditarEmpresa(e.id, { activo: !e.activo });
      await reload();
    } catch (err: any) {
      alert("Error: " + err.message);
    }
  }

  if (loading || !esSuperadmin) {
    return <p className="text-sm" style={{ color: "#7B8794" }}>Cargando…</p>;
  }

  return (
    <div>
      <PageHeader
        title="Empresas"
        subtitle="Panel de superadmin: alta y gestión de clientes del SaaS"
        actions={
          <button className="btn-primary inline-flex items-center gap-1.5" onClick={() => setAdding(true)}>
            <Plus size={16} strokeWidth={2} /> Nueva empresa
          </button>
        }
      />

      {cargando ? (
        <p className="text-sm" style={{ color: "#7B8794" }}>Cargando empresas…</p>
      ) : items.length === 0 ? (
        <div className="card p-5 text-sm" style={{ color: "#7B8794" }}>
          Todavía no hay empresas. Pulsa <strong>"+ Nueva empresa"</strong> para dar de alta tu primer cliente.
        </div>
      ) : (
        <div className="card overflow-hidden">
          <ul className="divide-y" style={{ borderColor: "#E5EAF2" }}>
            {items.map((e) => (
              <li
                key={e.id}
                className="px-4 md:px-5 py-3 flex flex-wrap items-center justify-between gap-3"
              >
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <span
                    className="h-9 w-9 rounded-lg flex items-center justify-center text-white font-bold shrink-0"
                    style={{ backgroundColor: e.color }}
                  >
                    {e.nombre.charAt(0).toUpperCase()}
                  </span>
                  <div className="min-w-0">
                    <div className="font-medium text-sm flex items-center gap-2">
                      <span className="truncate">{e.nombre}</span>
                      {!e.activo && (
                        <span className="text-[10px] uppercase font-semibold px-2 py-0.5 rounded-full"
                          style={{ background: "#FEE", color: "#E5484D" }}>
                          Desactivada
                        </span>
                      )}
                    </div>
                    <div className="text-xs truncate" style={{ color: "#7B8794" }}>
                      <code>{e.slug}</code> · {PLAN_LABEL[e.plan]} · {e.n_trabajadores ?? 0} trabajadores
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button className="btn-ghost" onClick={() => setEditando(e)}>
                    Editar
                  </button>
                  <button
                    className="btn-ghost"
                    style={{ color: e.activo ? "#E5484D" : "#16C784" }}
                    onClick={() => toggleActivo(e)}
                  >
                    {e.activo ? "Desactivar" : "Activar"}
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}

      {adding && (
        <NuevaEmpresaModal
          onClose={() => setAdding(false)}
          onCreated={async () => {
            setAdding(false);
            await reload();
          }}
        />
      )}

      {editando && (
        <EditarEmpresaModal
          empresa={editando}
          onClose={() => setEditando(null)}
          onSaved={async () => {
            setEditando(null);
            await reload();
          }}
        />
      )}
    </div>
  );
}

// ---------- Modal: Nueva empresa + primer admin ----------
function NuevaEmpresaModal({
  onClose,
  onCreated,
}: {
  onClose: () => void;
  onCreated: () => void;
}) {
  const [form, setForm] = useState({
    nombre: "",
    slug: "",
    color: "#062E73",
    plan: "free" as PlanEmpresa,
    admin_email: "",
    admin_password: "",
    admin_nombre: "",
  });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      await superadminCrearEmpresa({
        nombre: form.nombre,
        slug: form.slug || form.nombre,
        color: form.color,
        plan: form.plan,
        admin_email: form.admin_email,
        admin_password: form.admin_password,
        admin_nombre: form.admin_nombre,
      });
      onCreated();
    } catch (err: any) {
      setError(err.message ?? "Error desconocido");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Modal title="Nueva empresa" onClose={onClose}>
      <form onSubmit={onSubmit} className="space-y-4">
        <div>
          <h4 className="font-semibold mb-2" style={{ color: "#062E73" }}>Empresa</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="label">Nombre</label>
              <input
                className="input"
                required
                placeholder="Ej: Grupo Garantía"
                value={form.nombre}
                onChange={(e) => setForm({ ...form, nombre: e.target.value })}
              />
            </div>
            <div>
              <label className="label">Slug (URL-friendly)</label>
              <input
                className="input"
                placeholder="se genera del nombre"
                value={form.slug}
                onChange={(e) => setForm({ ...form, slug: e.target.value })}
              />
            </div>
            <div>
              <label className="label">Color principal</label>
              <input
                type="color"
                className="input h-10"
                value={form.color}
                onChange={(e) => setForm({ ...form, color: e.target.value })}
              />
            </div>
            <div>
              <label className="label">Plan</label>
              <select
                className="input"
                value={form.plan}
                onChange={(e) => setForm({ ...form, plan: e.target.value as PlanEmpresa })}
              >
                <option value="free">Free</option>
                <option value="basic">Basic</option>
                <option value="pro">Pro</option>
                <option value="enterprise">Enterprise</option>
              </select>
            </div>
          </div>
        </div>

        <div>
          <h4 className="font-semibold mb-2" style={{ color: "#062E73" }}>Primer admin de la empresa</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="label">Nombre del admin</label>
              <input
                className="input"
                required
                placeholder="Ej: Sara Vera"
                value={form.admin_nombre}
                onChange={(e) => setForm({ ...form, admin_nombre: e.target.value })}
              />
            </div>
            <div>
              <label className="label">Email</label>
              <input
                type="email"
                className="input"
                required
                value={form.admin_email}
                onChange={(e) => setForm({ ...form, admin_email: e.target.value })}
              />
            </div>
            <div className="md:col-span-2">
              <label className="label">Contraseña (mín. 6)</label>
              <input
                type="text"
                className="input"
                required
                minLength={6}
                value={form.admin_password}
                onChange={(e) => setForm({ ...form, admin_password: e.target.value })}
              />
              <p className="text-xs mt-1" style={{ color: "#7B8794" }}>
                Compártela con el admin. Podrá cambiarla después.
              </p>
            </div>
          </div>
        </div>

        {error && (
          <div className="text-sm p-3 rounded-lg" style={{ background: "#FEE", color: "#E5484D" }}>
            {error}
          </div>
        )}

        <div className="flex justify-end gap-2 pt-2">
          <button type="button" className="btn-ghost" onClick={onClose}>Cancelar</button>
          <button type="submit" className="btn-primary" disabled={busy}>
            {busy ? "Creando…" : "Crear empresa"}
          </button>
        </div>
      </form>
    </Modal>
  );
}

// ---------- Modal: Editar empresa ----------
function EditarEmpresaModal({
  empresa,
  onClose,
  onSaved,
}: {
  empresa: Empresa;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [form, setForm] = useState({
    nombre: empresa.nombre,
    slug: empresa.slug,
    color: empresa.color,
    plan: empresa.plan,
    activo: empresa.activo,
    notas: empresa.notas ?? "",
  });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      await superadminEditarEmpresa(empresa.id, {
        nombre: form.nombre,
        slug: form.slug,
        color: form.color,
        plan: form.plan,
        activo: form.activo,
        notas: form.notas || null,
      });
      onSaved();
    } catch (err: any) {
      setError(err.message ?? "Error desconocido");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Modal title={`Editar: ${empresa.nombre}`} onClose={onClose}>
      <form onSubmit={onSubmit} className="space-y-3">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div>
            <label className="label">Nombre</label>
            <input
              className="input"
              required
              value={form.nombre}
              onChange={(e) => setForm({ ...form, nombre: e.target.value })}
            />
          </div>
          <div>
            <label className="label">Slug</label>
            <input
              className="input"
              required
              value={form.slug}
              onChange={(e) => setForm({ ...form, slug: e.target.value })}
            />
          </div>
          <div>
            <label className="label">Color</label>
            <input
              type="color"
              className="input h-10"
              value={form.color}
              onChange={(e) => setForm({ ...form, color: e.target.value })}
            />
          </div>
          <div>
            <label className="label">Plan</label>
            <select
              className="input"
              value={form.plan}
              onChange={(e) => setForm({ ...form, plan: e.target.value as PlanEmpresa })}
            >
              <option value="free">Free</option>
              <option value="basic">Basic</option>
              <option value="pro">Pro</option>
              <option value="enterprise">Enterprise</option>
            </select>
          </div>
        </div>

        <div>
          <label className="label">Notas internas</label>
          <textarea
            className="input"
            rows={3}
            value={form.notas}
            onChange={(e) => setForm({ ...form, notas: e.target.value })}
            placeholder="Ej: contacto comercial, condiciones de plan, etc."
          />
        </div>

        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={form.activo}
            onChange={(e) => setForm({ ...form, activo: e.target.checked })}
          />
          Empresa activa
        </label>

        {error && (
          <div className="text-sm p-3 rounded-lg" style={{ background: "#FEE", color: "#E5484D" }}>
            {error}
          </div>
        )}

        <div className="flex justify-end gap-2 pt-2">
          <button type="button" className="btn-ghost" onClick={onClose}>Cancelar</button>
          <button type="submit" className="btn-primary" disabled={busy}>
            {busy ? "Guardando…" : "Guardar cambios"}
          </button>
        </div>
      </form>
    </Modal>
  );
}

// Helper local para el GET (que no está en lib/data porque devuelve conteos)
async function authHeader(): Promise<HeadersInit> {
  const { supabase } = await import("@/lib/supabase");
  if (!supabase) return {};
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;
  return token ? { Authorization: `Bearer ${token}` } : {};
}
