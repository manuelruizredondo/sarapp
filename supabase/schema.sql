-- ============================================================
-- VACANTIA · Esquema completo de Supabase
-- ============================================================
-- Ejecuta este SQL una sola vez en SQL Editor → New query → Run.
-- Es idempotente: puedes volver a ejecutarlo sin riesgo de perder datos.
-- ============================================================

-- 1. TRABAJADORES ----------------------------------------------------------
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
  color text not null default '#062E73',
  user_id uuid references auth.users(id) on delete set null,
  rol text not null default 'trabajador' check (rol in ('admin','trabajador')),
  created_at timestamptz default now()
);
create unique index if not exists trabajadores_user_id_uniq
  on public.trabajadores(user_id) where user_id is not null;

-- 2. AUSENCIAS -------------------------------------------------------------
create table if not exists public.ausencias (
  id uuid primary key default gen_random_uuid(),
  trabajador_id uuid not null references public.trabajadores(id) on delete cascade,
  tipo text not null check (tipo in
    ('vacaciones','baja_medica','permiso','asuntos_propios','formacion','otro')),
  fecha_inicio date not null,
  fecha_fin date not null,
  motivo text,
  aprobado boolean default true,
  created_at timestamptz default now(),
  check (fecha_fin >= fecha_inicio)
);
create index if not exists idx_ausencias_trabajador on public.ausencias(trabajador_id);
create index if not exists idx_ausencias_fechas     on public.ausencias(fecha_inicio, fecha_fin);
create index if not exists idx_ausencias_tipo       on public.ausencias(tipo);

-- 3. ASISTENCIAS DIARIAS ---------------------------------------------------
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

-- 4. FESTIVOS --------------------------------------------------------------
create table if not exists public.festivos (
  id uuid primary key default gen_random_uuid(),
  fecha date not null unique,
  nombre text not null,
  ambito text not null default 'nacional' check (ambito in ('nacional','autonomico','local')),
  created_at timestamptz default now()
);
create index if not exists idx_festivos_fecha on public.festivos(fecha);

-- 5. FUNCIONES HELPER ------------------------------------------------------
create or replace function public.es_admin() returns boolean
language sql security definer set search_path = public as $$
  select exists (
    select 1 from public.trabajadores
    where user_id = auth.uid() and rol = 'admin'
  );
$$;

create or replace function public.mi_trabajador_id() returns uuid
language sql security definer set search_path = public as $$
  select id from public.trabajadores where user_id = auth.uid() limit 1;
$$;

create or replace function public.dias_laborables(d_inicio date, d_fin date) returns int
language sql stable as $$
  with dias as (select generate_series(d_inicio, d_fin, interval '1 day')::date as d)
  select count(*)::int from dias
  where extract(isodow from d) < 6
    and d not in (select fecha from public.festivos);
$$;

-- 6. VISTA: días de vacaciones consumidos / restantes ---------------------
create or replace view public.vista_dias_vacaciones as
select
  t.id as trabajador_id,
  t.nombre,
  t.apellidos,
  t.dias_vacaciones_anuales,
  coalesce(sum(case
    when a.tipo = 'vacaciones'
      and extract(year from a.fecha_inicio) = extract(year from current_date)
    then public.dias_laborables(a.fecha_inicio, a.fecha_fin)
    else 0 end), 0)::int as dias_consumidos,
  (t.dias_vacaciones_anuales - coalesce(sum(case
    when a.tipo = 'vacaciones'
      and extract(year from a.fecha_inicio) = extract(year from current_date)
    then public.dias_laborables(a.fecha_inicio, a.fecha_fin)
    else 0 end), 0))::int as dias_restantes
from public.trabajadores t
left join public.ausencias a on a.trabajador_id = t.id
where t.activo = true
group by t.id, t.nombre, t.apellidos, t.dias_vacaciones_anuales;

-- 7. RLS -------------------------------------------------------------------
alter table public.trabajadores enable row level security;
alter table public.ausencias    enable row level security;
alter table public.asistencias  enable row level security;
alter table public.festivos     enable row level security;

drop policy if exists "admin all trabajadores"  on public.trabajadores;
drop policy if exists "admin all ausencias"     on public.ausencias;
drop policy if exists "admin all asistencias"   on public.asistencias;
drop policy if exists "admin all festivos"      on public.festivos;
drop policy if exists "self read trabajadores"  on public.trabajadores;
drop policy if exists "self read ausencias"     on public.ausencias;
drop policy if exists "self read asistencias"   on public.asistencias;
drop policy if exists "all read festivos"       on public.festivos;

create policy "admin all trabajadores" on public.trabajadores
  for all to authenticated using (es_admin()) with check (es_admin());
create policy "admin all ausencias" on public.ausencias
  for all to authenticated using (es_admin()) with check (es_admin());
create policy "admin all asistencias" on public.asistencias
  for all to authenticated using (es_admin()) with check (es_admin());
create policy "admin all festivos" on public.festivos
  for all to authenticated using (es_admin()) with check (es_admin());

create policy "self read trabajadores" on public.trabajadores
  for select to authenticated using (user_id = auth.uid());
create policy "self read ausencias" on public.ausencias
  for select to authenticated using (trabajador_id = mi_trabajador_id());
create policy "self read asistencias" on public.asistencias
  for select to authenticated using (trabajador_id = mi_trabajador_id());

create policy "all read festivos" on public.festivos
  for select to authenticated using (true);

-- 8. FESTIVOS NACIONALES + ANDALUCÍA + SEVILLA (2026/2027) -----------------
insert into public.festivos (fecha, nombre, ambito) values
  ('2026-01-01','Año Nuevo','nacional'),
  ('2026-01-06','Epifanía del Señor','nacional'),
  ('2026-04-03','Viernes Santo','nacional'),
  ('2026-05-01','Fiesta del Trabajo','nacional'),
  ('2026-08-15','Asunción de la Virgen','nacional'),
  ('2026-10-12','Fiesta Nacional de España','nacional'),
  ('2026-11-02','Día de Todos los Santos (trasladado)','nacional'),
  ('2026-12-07','Día de la Constitución (trasladado)','nacional'),
  ('2026-12-08','Inmaculada Concepción','nacional'),
  ('2026-12-25','Natividad del Señor','nacional'),
  ('2026-02-28','Día de Andalucía','autonomico'),
  ('2026-04-02','Jueves Santo','autonomico'),
  ('2026-06-04','Corpus Christi (Sevilla)','local'),
  ('2026-09-08','Virgen de los Reyes (Sevilla)','local'),
  ('2027-01-01','Año Nuevo','nacional'),
  ('2027-01-06','Epifanía del Señor','nacional'),
  ('2027-03-26','Viernes Santo','nacional'),
  ('2027-08-15','Asunción de la Virgen','nacional'),
  ('2027-10-12','Fiesta Nacional de España','nacional'),
  ('2027-11-01','Día de Todos los Santos','nacional'),
  ('2027-12-06','Día de la Constitución','nacional'),
  ('2027-12-08','Inmaculada Concepción','nacional'),
  ('2027-12-25','Natividad del Señor','nacional'),
  ('2027-03-25','Jueves Santo','autonomico'),
  ('2027-05-27','Corpus Christi (Sevilla)','local'),
  ('2027-09-08','Virgen de los Reyes (Sevilla)','local')
on conflict (fecha) do nothing;

-- ============================================================
-- LISTO. Con esto la base de datos está completamente operativa.
-- El primer usuario que entre en la app será auto-promovido a admin
-- por el endpoint /api/auth/bootstrap.
-- ============================================================
