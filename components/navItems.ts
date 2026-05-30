import {
  Building2,
  Calendar,
  CalendarDays,
  ClipboardCheck,
  Home,
  PartyPopper,
  Plane,
  User,
  Users,
  type LucideIcon,
} from "lucide-react";

export type NavItem = {
  href: string;
  label: string;
  Icon: LucideIcon;
  adminOnly?: boolean;
  superadminOnly?: boolean;
};

// Fuente única de la navegación (la usan Sidebar y MobileNav).
export const NAV_ITEMS: NavItem[] = [
  { href: "/superadmin",   label: "Empresas",              Icon: Building2, superadminOnly: true },
  { href: "/",             label: "Hoy",                   Icon: Home },
  { href: "/calendario",   label: "Calendario",            Icon: Calendar, adminOnly: true },
  { href: "/resumen",      label: "Semanas",               Icon: CalendarDays, adminOnly: true },
  { href: "/ausencias",    label: "Registro de ausencias", Icon: Plane },
  { href: "/asistencia",   label: "Asistencia",            Icon: ClipboardCheck, adminOnly: true },
  { href: "/trabajadores", label: "Trabajadores",          Icon: Users, adminOnly: true },
  { href: "/festivos",     label: "Festivos",              Icon: PartyPopper, adminOnly: true },
  { href: "/mi-cuenta",    label: "Mi cuenta",             Icon: User },
];
