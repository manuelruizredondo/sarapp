"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "./AuthProvider";
import { LogoMark } from "./Logo";

type Item = { href: string; label: string; icon: string; adminOnly?: boolean };

const ITEMS: Item[] = [
  { href: "/",             label: "Hoy",         icon: "🏠" },
  { href: "/calendario",   label: "Calendario",  icon: "📅" },
  { href: "/resumen",      label: "Semanas",     icon: "🗓️" },
  { href: "/ausencias",    label: "Registro de ausencias", icon: "🏖️" },
  { href: "/asistencia",   label: "Asistencia",  icon: "✅", adminOnly: true },
  { href: "/trabajadores", label: "Trabajadores",icon: "👥", adminOnly: true },
  { href: "/festivos",     label: "Festivos",    icon: "🎉", adminOnly: true },
  { href: "/mi-cuenta",    label: "Mi cuenta",   icon: "👤" },
];

export default function Sidebar() {
  const path = usePathname();
  const { perfil, user, signOut } = useAuth();
  const isAdmin = perfil?.rol === "admin";

  const items = ITEMS.filter((i) => !i.adminOnly || isAdmin);

  return (
    <aside className="hidden md:flex w-60 shrink-0 flex-col border-r bg-white" style={{ borderColor: "#E5EAF2" }}>
      <div className="px-5 py-5 border-b flex items-center gap-3" style={{ borderColor: "#E5EAF2" }}>
        <LogoMark size={36} />
        <div>
          <div className="text-lg font-bold tracking-tight" style={{ color: "#062E73" }}>
            vacantia
          </div>
          <div className="text-[10px] uppercase tracking-wider" style={{ color: "#17C7C8" }}>
            by Grupo Garantía
          </div>
        </div>
      </div>

      <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
        {items.map((it) => {
          const active = path === it.href || (it.href !== "/" && path?.startsWith(it.href));
          return (
            <Link
              key={it.href}
              href={it.href}
              className={
                "flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors " +
                (active
                  ? "font-semibold"
                  : "hover:bg-[#EEF2F8]")
              }
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

      <div className="p-3 border-t space-y-2" style={{ borderColor: "#E5EAF2" }}>
        <div className="flex items-center gap-2 px-2">
          {perfil && (
            <span
              className="h-7 w-7 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0"
              style={{ backgroundColor: perfil.color }}
            >
              {(perfil.nombre || perfil.email || "?").charAt(0).toUpperCase()}
            </span>
          )}
          <div className="min-w-0">
            <div className="text-sm font-medium truncate" style={{ color: "#1F2937" }}>
              {perfil?.nombre ?? user?.email ?? "Usuario"}
            </div>
            <div className="text-[10px] uppercase tracking-wide" style={{ color: "#7B8794" }}>
              {isAdmin ? "Administrador" : "Trabajador"}
            </div>
          </div>
        </div>
        <button
          onClick={() => signOut()}
          className="w-full text-left text-xs px-3 py-2 rounded-lg hover:bg-[#EEF2F8] transition-colors"
          style={{ color: "#7B8794" }}
        >
          Cerrar sesión
        </button>
        <div className="text-[10px] text-left px-3 pt-1" style={{ color: "#7B8794" }}>v0.3</div>
      </div>
    </aside>
  );
}
