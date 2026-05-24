-- ============================================================
-- MIGRACIÓN: roles, festivos, RLS y helpers de auth
-- ============================================================
-- Ejecuta este SQL en Supabase → SQL Editor del proyecto sarapp.
-- Es idempotente: puedes ejecutarlo varias veces sin problema.
-- ============================================================

-- 1. Columnas extra en trabajadores ----------------------------------------
alter table public.trabajadores
  add column if not exists user_id uuid references auth.users(id) on delete set null,
  add column if not exists rol text not null default 'trabajador'
    check (rol in ('admin', 'trabajador'));

create unique index if not exists trabajadores_user_id_uniq
  on public.trabajadores(user_id) where user_id is not null;

-- 2. Tabla de festivos -----------------------------------------------------
create table if not exists public.festivos (
  id uuid primary key default gen_random_uuid(),
  fecha date not null unique,
  nombre text not null,
  ambito text not null default 'nacional'
    check (ambito in ('nacional','autonomico','local')),
  created_at timestamptz default now()
);
create index if not exists idx_festivos_fecha on public.festivos(fecha);

-- 3. Funciones helper ------------------------------------------------------
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

-- Cuenta días laborables (lunes-viernes excluyendo festivos) entre dos fechas
create or replace function public.dias_laborables(d_inicio date, d_fin date) returns int
language sql stable as $$
  with dias as (
    select generate_series(d_inicio, d_fin, interval '1 day')::date as d
  )
  select count(*)::int from dias
  where extract(isodow from d) < 6  -- 1..5 = lun-vie
    and d not in (select fecha from public.festivos);
$$;

-- 4. Activar RLS -----------------------------------------------------------
alter table public.trabajadores enable row level security;
alter table public.ausencias    enable row level security;
alter table public.asistencias  enable row level security;
alter table public.festivos     enable row level security;

-- Borrar políticas previas si existen, para poder re-ejecutar limpio
drop policy if exists "admin all trabajadores"  on public.trabajadores;
drop policy if exists "admin all ausencias"     on public.ausencias;
drop policy if exists "admin all asistencias"   on public.asistencias;
drop policy if exists "admin all festivos"      on public.festivos;
drop policy if exists "self read trabajadores"  on public.trabajadores;
drop policy if exists "self update trabajadores" on public.trabajadores;
drop policy if exists "self read ausencias"     on public.ausencias;
drop policy if exists "self read asistencias"   on public.asistencias;
drop policy if exists "all read festivos"       on public.festivos;

-- Políticas del admin: acceso total
create policy "admin all trabajadores" on public.trabajadores
  for all to authenticated using (es_admin()) with check (es_admin());
create policy "admin all ausencias" on public.ausencias
  for all to authenticated using (es_admin()) with check (es_admin());
create policy "admin all asistencias" on public.asistencias
  for all to authenticated using (es_admin()) with check (es_admin());
create policy "admin all festivos" on public.festivos
  for all to authenticated using (es_admin()) with check (es_admin());

-- Políticas del trabajador: solo lo suyo, sólo lectura
create policy "self read trabajadores" on public.trabajadores
  for select to authenticated using (user_id = auth.uid());
create policy "self read ausencias" on public.ausencias
  for select to authenticated using (trabajador_id = mi_trabajador_id());
create policy "self read asistencias" on public.asistencias
  for select to authenticated using (trabajador_id = mi_trabajador_id());

-- Cualquier persona autenticada puede leer los festivos (los necesita para el calendario)
create policy "all read festivos" on public.festivos
  for select to authenticated using (true);

-- 5. Vista de vacaciones actualizada: ahora cuenta días laborables ---------
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
      then public.dias_laborables(a.fecha_inicio, a.fecha_fin)
      else 0
    end
  ), 0)::int as dias_consumidos,
  (t.dias_vacaciones_anuales - coalesce(sum(
    case
      when a.tipo = 'vacaciones'
        and extract(year from a.fecha_inicio) = extract(year from current_date)
      then public.dias_laborables(a.fecha_inicio, a.fecha_fin)
      else 0
    end
  ), 0))::int as dias_restantes
from public.trabajadores t
left join public.ausencias a on a.trabajador_id = t.id
where t.activo = true
group by t.id, t.nombre, t.apellidos, t.dias_vacaciones_anuales;

-- 6. Festivos nacionales de España 2026 ------------------------------------
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
  ('2026-12-25','Natividad del Señor','nacional')
on conflict (fecha) do nothing;

-- ============================================================
-- IMPORTANTE — pasos manuales después de ejecutar este SQL:
-- ============================================================
--
-- 1. Crea tu usuario admin desde Authentication → Users → Add user
--    (rellena email + password). Por ejemplo: saravera@grupogarantia.es
--
-- 2. Ejecuta esta consulta para enlazar tu usuario a un registro de
--    trabajador con rol admin. Sustituye el email por el tuyo:
--
--    insert into public.trabajadores (nombre, email, user_id, rol, dias_vacaciones_anuales, color)
--    select 'Admin', u.email, u.id, 'admin', 22, '#0f172a'
--    from auth.users u where u.email = 'saravera@grupogarantia.es'
--    on conflict (user_id) do update set rol = 'admin';
--
-- 3. Para cada empleado:
--    a) Crea su usuario en Authentication → Users
--    b) Edítalo desde la app o ejecuta:
--       update public.trabajadores
--       set user_id = (select id from auth.users where email = 'empleado@empresa.com')
--       where id = '<id_del_trabajador>';
-- ============================================================
