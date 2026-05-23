"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

const items = [
  { href: "/",             label: "Hoy",         icon: "🏠" },
  { href: "/calendario",   label: "Calendario",  icon: "📅" },
  { href: "/resumen",      label: "Semanas",     icon: "🗓️" },
  { href: "/ausencias",    label: "Ausencias",   icon: "🏖️" },
  { href: "/asistencia",   label: "Asistencia",  icon: "✅" },
  { href: "/trabajadores", label: "Trabajadores",icon: "👥" },
];

export default function Sidebar() {
  const path = usePathname();
  return (
    <aside className="hidden md:flex w-60 shrink-0 flex-col border-r border-slate-200 bg-white">
      <div className="px-5 py-6 border-b border-slate-200">
        <div className="text-lg font-bold tracking-tight">Sarapp</div>
        <div className="text-xs text-slate-500">Control de ausencias</div>
      </div>
      <nav className="flex-1 p-3 space-y-1">
        {items.map((it) => {
          const active = path === it.href || (it.href !== "/" && path?.startsWith(it.href));
          return (
            <Link
              key={it.href}
              href={it.href}
              className={
                "flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors " +
                (active
                  ? "bg-brand-50 text-brand-700 font-semibold"
                  : "text-slate-700 hover:bg-slate-100")
              }
            >
              <span aria-hidden>{it.icon}</span>
              {it.label}
            </Link>
          );
        })}
      </nav>
      <div className="p-3 text-[11px] text-slate-400 border-t border-slate-200">
        v0.1 · Next.js + Supabase
      </div>
    </aside>
  );
}
