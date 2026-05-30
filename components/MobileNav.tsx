"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { useAuth } from "./AuthProvider";
import { LogoMark } from "./Logo";

type Item = { href: string; label: string; icon: string; adminOnly?: boolean; superadminOnly?: boolean };

const ITEMS: Item[] = [
  { href: "/superadmin",   label: "Empresas",    icon: "🏢", superadminOnly: true },
  { href: "/",             label: "Hoy",         icon: "🏠" },
  { href: "/calendario",   label: "Calendario",  icon: "📅", adminOnly: true },
  { href: "/resumen",      label: "Semanas",     icon: "🗓️", adminOnly: true },
  { href: "/ausencias",    label: "Registro de ausencias", icon: "🏖️" },
  { href: "/asistencia",   label: "Asistencia",  icon: "✅", adminOnly: true },
  { href: "/trabajadores", label: "Trabajadores",icon: "👥", adminOnly: true },
  { href: "/festivos",     label: "Festivos",    icon: "🎉", adminOnly: true },
  { href: "/mi-cuenta",    label: "Mi cuenta",   icon: "👤" },
];

export default function MobileNav() {
  const path = usePathname();
  const { perfil, empresa, user, esSuperadmin, signOut } = useAuth();
  const [open, setOpen] = useState(false);
  const isAdmin = perfil?.rol === "admin";
  const items = ITEMS.filter((i) => {
    if (i.superadminOnly) return esSuperadmin;
    if (i.adminOnly) return isAdmin || esSuperadmin;
    return true;
  });
  const sub = empresa?.nombre ?? (esSuperadmin ? "Plataforma" : null);

  return (
    <>
      {/* Top bar */}
      <header
        className="md:hidden sticky top-0 z-30 bg-white border-b flex items-center justify-between px-4 py-3"
        style={{ borderColor: "#E5EAF2" }}
      >
        <Link href="/" className="flex items-center gap-2 min-w-0">
          <LogoMark size={28} />
          <div className="min-w-0">
            <div className="font-bold tracking-tight leading-tight" style={{ color: "#062E73" }}>vacantia</div>
            {sub && (
              <div className="text-[9px] uppercase tracking-wider truncate" style={{ color: "#17C7C8" }}>
                {sub}
              </div>
            )}
          </div>
        </Link>
        <button
          onClick={() => setOpen(true)}
          aria-label="Abrir menú"
          className="text-xl px-2 py-1 rounded-lg"
          style={{ color: "#062E73" }}
        >
          ☰
        </button>
      </header>

      {/* Drawer */}
      {open && (
        <div
          className="md:hidden fixed inset-0 z-40"
          style={{ background: "rgba(4, 27, 69, 0.55)" }}
          onClick={() => setOpen(false)}
        >
          <aside
            className="absolute right-0 top-0 h-full w-72 bg-white shadow-soft flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-4 py-4 border-b" style={{ borderColor: "#E5EAF2" }}>
              <div className="flex items-center gap-2">
                <LogoMark size={28} />
                <span className="font-bold" style={{ color: "#062E73" }}>vacantia</span>
              </div>
              <button onClick={() => setOpen(false)} aria-label="Cerrar" style={{ color: "#7B8794" }}>✕</button>
            </div>
            <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
              {items.map((it) => {
                const active = path === it.href || (it.href !== "/" && path?.startsWith(it.href));
                return (
                  <Link
                    key={it.href}
                    href={it.href}
                    onClick={() => setOpen(false)}
                    className={"flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm " + (active ? "font-semibold" : "")}
                    style={
                      active
                        ? { backgroundColor: "#E6FBFB", color: "#062E73" }
                        : { color: "#1F2937" }
                    }
                  >
                    <span aria-hidden>{it.icon}</span>
                    {it.label}
                  </Link>
                );
              })}
            </nav>
            <div className="p-3 border-t" style={{ borderColor: "#E5EAF2" }}>
              <div className="flex items-center gap-2 px-2 mb-2">
                {perfil && (
                  <span
                    className="h-7 w-7 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0"
                    style={{ backgroundColor: perfil.color }}
                  >
                    {(perfil.nombre || perfil.email || "?").charAt(0).toUpperCase()}
                  </span>
                )}
                <div className="min-w-0">
                  <div className="text-sm font-medium truncate">{perfil?.nombre ?? user?.email}</div>
                  <div className="text-[10px] uppercase" style={{ color: "#7B8794" }}>
                    {esSuperadmin ? "Superadmin" : isAdmin ? "Administrador" : "Trabajador"}
                  </div>
                </div>
              </div>
              <button onClick={() => signOut()} className="btn-ghost w-full text-xs" style={{ color: "#E5484D" }}>
                Cerrar sesión
              </button>
            </div>
          </aside>
        </div>
      )}
    </>
  );
}
