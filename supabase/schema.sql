-- ============================================================
-- ESQUEMA: Control de vacaciones, bajas, asistencias y permisos
-- ============================================================
-- Ejecuta este SQL en el SQL Editor de Supabase (una sola vez).
-- ============================================================

-- Tabla de trabajadores
create table if not exists public.trabajadores (
  id uuid primary key default gen_random_uuid(),
  nombre text not null,
  apellidos text,
  email text,
  puesto text,
  departamento text,
  fecha_alta date default current_date,
  dias_vacaciones_anuales int not null default 22,
  activo boolean not null default true,
  notas text,
  color text not null default '#3b82f6',
  created_at timestamptz default now()
);

-- Si la tabla ya existía sin color, lo añadimos:
alter table public.trabajadores
  add column if not exists color text not null default '#3b82f6';

-- Tipos de ausencia: vacaciones, baja_medica, permiso, asuntos_propios, formacion, otro
create table if not exists public.ausencias (
  id uuid primary key default gen_random_uuid(),
  trabajador_id uuid not null references public.trabajadores(id) on delete cascade,
  tipo text not null check (tipo in ('vacaciones','baja_medica','permiso','asuntos_propios','formacion','otro')),
  fecha_inicio date not null,
  fecha_fin date not null,
  motivo text,
  aprobado boolean default true,
  created_at timestamptz default now(),
  check (fecha_fin >= fecha_inicio)
);

create index if not exists idx_ausencias_trabajador on public.ausencias(trabajador_id);
create index if not exists idx_ausencias_fechas on public.ausencias(fecha_inicio, fecha_fin);
create index if not exists idx_ausencias_tipo on public.ausencias(tipo);

-- Registro de asistencia diaria
-- estado: presente, ausente, teletrabajo, retraso
create table if not exists public.asistencias (
  id uuid primary key default gen_random_uuid(),
  trabajador_id uuid not null references public.trabajadores(id) on delete cascade,
  fecha date not null,
  estado text not null check (estado in ('presente','ausente','teletrabajo','retraso')),
  hora_entrada time,
  hora_salida time,
  notas text,
  created_at timestamptz default now(),
  unique (trabajador_id, fecha)
);

create index if not exists idx_asistencias_fecha on public.asistencias(fecha);
create index if not exists idx_asistencias_trabajador on public.asistencias(trabajador_id);

-- Vista: días de vacaciones consumidos por trabajador en el año actual
create or replace view public.vista_dias_vacaciones as
select
  t.id as trabajador_id,
  t.nombre,
  t.apellidos,
  t.dias_vacaciones_anuales,
  coalesce(sum(
    case
      when a.tipo = 'vacaciones'
        and extract(year from a.fecha_inicio) = extract(year from current_date)
      then (a.fecha_fin - a.fecha_inicio + 1)
      else 0
    end
  ), 0)::int as dias_consumidos,
  (t.dias_vacaciones_anuales - coalesce(sum(
    case
      when a.tipo = 'vacaciones'
        and extract(year from a.fecha_inicio) = extract(year from current_date)
      then (a.fecha_fin - a.fecha_inicio + 1)
      else 0
    end
  ), 0))::int as dias_restantes
from public.trabajadores t
left join public.ausencias a on a.trabajador_id = t.id
where t.activo = true
group by t.id, t.nombre, t.apellidos, t.dias_vacaciones_anuales;

-- ============================================================
-- POLÍTICAS DE ACCESO (RLS)
-- ============================================================
-- Para uso simple solo-admin, deshabilitamos RLS.
-- Si más adelante quieres añadir login, activa RLS y crea políticas.
-- ============================================================
alter table public.trabajadores disable row level security;
alter table public.ausencias    disable row level security;
alter table public.asistencias  disable row level security;

-- ============================================================
-- DATOS DE EJEMPLO (opcional, descomenta si quieres probar)
-- ============================================================
-- insert into public.trabajadores (nombre, apellidos, email, puesto, departamento, dias_vacaciones_anuales) values
--   ('Ana',   'García López',    'ana@empresa.com',   'Diseñadora',     'Producto', 22),
--   ('Luis',  'Martínez Pérez',  'luis@empresa.com',  'Desarrollador',  'Tech',     22),
--   ('María', 'Sánchez Ruiz',    'maria@empresa.com', 'Marketing',      'Marketing',22),
--   ('Carlos','Fernández Gómez', 'carlos@empresa.com','Comercial',      'Ventas',   22);
