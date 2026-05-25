-- ============================================================
-- VACANTIA · Migración Multi-Tenant (single-tenant → SaaS)
-- ============================================================
-- Ejecuta este SQL UNA VEZ después de schema.sql.
-- Es idempotente: puedes volver a ejecutarlo sin perder datos.
--
-- Resultado:
--   - Tabla empresas (clientes del SaaS)
--   - Tabla plataforma_admins (superadmins como Manuel)
--   - Columna empresa_id en trabajadores/ausencias/asistencias/festivos
--   - festivos.empresa_id NULL = festivo global (nacional)
--   - RLS de 3 niveles: superadmin → todo, admin de empresa → su empresa,
--     trabajador → su ficha
--   - Backfill: crea "Grupo Garantía" y asigna todos los datos actuales
--   - Inserta manuelruizredondo@gmail.com como superadmin pendiente de enlazar
-- ============================================================

-- 0. EMPRESAS --------------------------------------------------------------
create table if not exists public.empresas (
  id uuid primary key default gen_random_uuid(),
  nombre text not null,
  slug text not null unique,
  color text not null default '#062E73',
  plan text not null default 'free' check (plan in ('free','basic','pro','enterprise')),
  activo boolean not null default true,
  notas text,
  created_at timestamptz default now()
);
create index if not exists idx_empresas_slug on public.empresas(slug);

-- 1. PLATAFORMA_ADMINS (superadmins del SaaS) -----------------------------
-- Vive fuera de "trabajadores": el dueño del SaaS no es empleado de nadie.
-- Puedes pre-insertar emails que aún no se han registrado; al hacer login
-- el bootstrap enlazará el user_id.
create table if not exists public.plataforma_admins (
  id uuid primary key default gen_random_uuid(),
  email text not null unique,
  user_id uuid references auth.users(id) on delete set null,
  nombre text,
  created_at timestamptz default now()
);
create unique index if not exists plataforma_admins_user_id_uniq
  on public.plataforma_admins(user_id) where user_id is not null;

-- 2. Añadir empresa_id a tablas existentes --------------------------------
alter table public.trabajadores
  add column if not exists empresa_id uuid references public.empresas(id) on delete cascade;
alter table public.ausencias
  add column if not exists empresa_id uuid references public.empresas(id) on delete cascade;
alter table public.asistencias
  add column if not exists empresa_id uuid references public.empresas(id) on delete cascade;
alter table public.festivos
  add column if not exists empresa_id uuid references public.empresas(id) on delete cascade;
-- festivos.empresa_id NULL = festivo global (nacional); no NULL = local de esa empresa

create index if not exists idx_trabajadores_empresa on public.trabajadores(empresa_id);
create index if not exists idx_ausencias_empresa    on public.ausencias(empresa_id);
create index if not exists idx_asistencias_empresa  on public.asistencias(empresa_id);
create index if not exists idx_festivos_empresa     on public.festivos(empresa_id);

-- 3. BACKFILL: crear "Grupo Garantía" y asignar lo existente --------------
do $$
declare
  v_empresa_id uuid;
begin
  -- ¿Hay datos huérfanos sin empresa_id? Solo entonces creamos Grupo Garantía.
  if exists (select 1 from public.trabajadores where empresa_id is null)
     or exists (select 1 from public.ausencias where empresa_id is null)
     or exists (select 1 from public.asistencias where empresa_id is null)
  then
    -- ¿Existe ya Grupo Garantía? Si no, créala
    select id into v_empresa_id from public.empresas where slug = 'grupo-garantia';
    if v_empresa_id is null then
      insert into public.empresas (nombre, slug, color, plan, activo)
      values ('Grupo Garantía', 'grupo-garantia', '#062E73', 'pro', true)
      returning id into v_empresa_id;
    end if;

    -- Asignar todo lo huérfano a Grupo Garantía
    update public.trabajadores set empresa_id = v_empresa_id where empresa_id is null;
    update public.ausencias    set empresa_id = v_empresa_id where empresa_id is null;
    update public.asistencias  set empresa_id = v_empresa_id where empresa_id is null;
    -- Los festivos los dejamos como globales (empresa_id = NULL) → los ve cualquier empresa
  end if;
end $$;

-- 4. Una vez backfilled, empresa_id es obligatorio en estas tres tablas ---
do $$ begin
  if exists (select 1 from public.trabajadores where empresa_id is null) then
    raise notice 'Hay trabajadores sin empresa_id; revisa antes de aplicar NOT NULL';
  else
    alter table public.trabajadores alter column empresa_id set not null;
  end if;
end $$;

do $$ begin
  if exists (select 1 from public.ausencias where empresa_id is null) then
    raise notice 'Hay ausencias sin empresa_id; revisa antes de aplicar NOT NULL';
  else
    alter table public.ausencias alter column empresa_id set not null;
  end if;
end $$;

do $$ begin
  if exists (select 1 from public.asistencias where empresa_id is null) then
    raise notice 'Hay asistencias sin empresa_id; revisa antes de aplicar NOT NULL';
  else
    alter table public.asistencias alter column empresa_id set not null;
  end if;
end $$;

-- 5. FESTIVOS: la unicidad de fecha pasa a ser (fecha, empresa_id) -------
-- Antes la PK secundaria era UNIQUE(fecha) global. Con empresa local
-- puede coexistir "2026-06-04 Corpus" para varias empresas + el nacional.
do $$ begin
  if exists (
    select 1 from pg_indexes
    where schemaname='public' and indexname='festivos_fecha_key'
  ) then
    execute 'alter table public.festivos drop constraint festivos_fecha_key';
  end if;
end $$;

create unique index if not exists festivos_fecha_global_uniq
  on public.festivos(fecha) where empresa_id is null;
create unique index if not exists festivos_fecha_empresa_uniq
  on public.festivos(fecha, empresa_id) where empresa_id is not null;

-- 5b. TRIGGERS: auto-rellenar empresa_id en ausencias/asistencias --------
-- Así el cliente puede insertar solo con trabajador_id y la BD pone el
-- empresa_id correcto. Imposible que un admin "filtree" una fila a otra empresa.
create or replace function public.fill_empresa_id_from_trabajador()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  v_empresa uuid;
begin
  select empresa_id into v_empresa from public.trabajadores where id = new.trabajador_id;
  if v_empresa is null then
    raise exception 'Trabajador % no encontrado o sin empresa', new.trabajador_id;
  end if;
  -- Si el cliente pasa otro empresa_id, lo sobreescribimos con el real del trabajador
  new.empresa_id := v_empresa;
  return new;
end $$;

drop trigger if exists trg_ausencias_empresa on public.ausencias;
create trigger trg_ausencias_empresa
  before insert or update on public.ausencias
  for each row execute function public.fill_empresa_id_from_trabajador();

drop trigger if exists trg_asistencias_empresa on public.asistencias;
create trigger trg_asistencias_empresa
  before insert or update on public.asistencias
  for each row execute function public.fill_empresa_id_from_trabajador();

-- 6. FUNCIONES HELPER -----------------------------------------------------
create or replace function public.es_superadmin() returns boolean
language sql security definer set search_path = public as $$
  select exists (
    select 1 from public.plataforma_admins
    where user_id = auth.uid()
  );
$$;

create or replace function public.mi_empresa_id() returns uuid
language sql security definer set search_path = public as $$
  select empresa_id from public.trabajadores
  where user_id = auth.uid() limit 1;
$$;

-- es_admin() ya existe; lo redefinimos para asegurarnos del search_path
create or replace function public.es_admin() returns boolean
language sql security definer set search_path = public as $$
  select exists (
    select 1 from public.trabajadores
    where user_id = auth.uid() and rol = 'admin'
  );
$$;

-- 7. RLS — borrar políticas antiguas y crear las nuevas (3 niveles) ------
alter table public.empresas          enable row level security;
alter table public.plataforma_admins enable row level security;

-- Limpiar políticas previas (idempotente)
drop policy if exists "admin all trabajadores"  on public.trabajadores;
drop policy if exists "admin all ausencias"     on public.ausencias;
drop policy if exists "admin all asistencias"   on public.asistencias;
drop policy if exists "admin all festivos"      on public.festivos;
drop policy if exists "self read trabajadores"  on public.trabajadores;
drop policy if exists "self read ausencias"     on public.ausencias;
drop policy if exists "self read asistencias"   on public.asistencias;
drop policy if exists "all read festivos"       on public.festivos;

drop policy if exists "superadmin all trabajadores" on public.trabajadores;
drop policy if exists "superadmin all ausencias"    on public.ausencias;
drop policy if exists "superadmin all asistencias"  on public.asistencias;
drop policy if exists "superadmin all festivos"     on public.festivos;
drop policy if exists "empresa admin trabajadores"  on public.trabajadores;
drop policy if exists "empresa admin ausencias"     on public.ausencias;
drop policy if exists "empresa admin asistencias"   on public.asistencias;
drop policy if exists "empresa admin festivos"      on public.festivos;
drop policy if exists "trabajador self trabajadores" on public.trabajadores;
drop policy if exists "trabajador self ausencias"    on public.ausencias;
drop policy if exists "trabajador self asistencias"  on public.asistencias;
drop policy if exists "festivos visibles"            on public.festivos;
drop policy if exists "superadmin all empresas"      on public.empresas;
drop policy if exists "miembros leer empresa"        on public.empresas;
drop policy if exists "self read plataforma admin"   on public.plataforma_admins;
drop policy if exists "superadmin all plataforma admins" on public.plataforma_admins;

-- ============== EMPRESAS ==============
-- Superadmin: todo
create policy "superadmin all empresas" on public.empresas
  for all to authenticated
  using (public.es_superadmin())
  with check (public.es_superadmin());

-- Cualquier usuario logueado puede leer SU empresa (para mostrar nombre/color)
create policy "miembros leer empresa" on public.empresas
  for select to authenticated
  using (id = public.mi_empresa_id());

-- ============== PLATAFORMA_ADMINS ==============
-- Solo superadmin puede listar/editar la tabla
create policy "superadmin all plataforma admins" on public.plataforma_admins
  for all to authenticated
  using (public.es_superadmin())
  with check (public.es_superadmin());

-- Permitir al propio usuario leer su fila (útil para el bootstrap)
create policy "self read plataforma admin" on public.plataforma_admins
  for select to authenticated
  using (user_id = auth.uid());

-- ============== TRABAJADORES ==============
create policy "superadmin all trabajadores" on public.trabajadores
  for all to authenticated
  using (public.es_superadmin())
  with check (public.es_superadmin());

create policy "empresa admin trabajadores" on public.trabajadores
  for all to authenticated
  using (public.es_admin() and empresa_id = public.mi_empresa_id())
  with check (public.es_admin() and empresa_id = public.mi_empresa_id());

create policy "trabajador self trabajadores" on public.trabajadores
  for select to authenticated
  using (user_id = auth.uid());

-- ============== AUSENCIAS ==============
create policy "superadmin all ausencias" on public.ausencias
  for all to authenticated
  using (public.es_superadmin())
  with check (public.es_superadmin());

create policy "empresa admin ausencias" on public.ausencias
  for all to authenticated
  using (public.es_admin() and empresa_id = public.mi_empresa_id())
  with check (public.es_admin() and empresa_id = public.mi_empresa_id());

create policy "trabajador self ausencias" on public.ausencias
  for select to authenticated
  using (trabajador_id = public.mi_trabajador_id());

-- ============== ASISTENCIAS ==============
create policy "superadmin all asistencias" on public.asistencias
  for all to authenticated
  using (public.es_superadmin())
  with check (public.es_superadmin());

create policy "empresa admin asistencias" on public.asistencias
  for all to authenticated
  using (public.es_admin() and empresa_id = public.mi_empresa_id())
  with check (public.es_admin() and empresa_id = public.mi_empresa_id());

create policy "trabajador self asistencias" on public.asistencias
  for select to authenticated
  using (trabajador_id = public.mi_trabajador_id());

-- ============== FESTIVOS ==============
create policy "superadmin all festivos" on public.festivos
  for all to authenticated
  using (public.es_superadmin())
  with check (public.es_superadmin());

-- Admin de empresa: puede gestionar los festivos de su empresa (los globales NO los toca)
create policy "empresa admin festivos" on public.festivos
  for all to authenticated
  using (
    public.es_admin()
    and empresa_id is not null
    and empresa_id = public.mi_empresa_id()
  )
  with check (
    public.es_admin()
    and empresa_id is not null
    and empresa_id = public.mi_empresa_id()
  );

-- Todos los autenticados pueden LEER: globales + los de su empresa
create policy "festivos visibles" on public.festivos
  for select to authenticated
  using (
    empresa_id is null
    or empresa_id = public.mi_empresa_id()
  );

-- 8. SEMILLA: superadmin pendiente de enlazar -----------------------------
-- Inserta el email del dueño del SaaS; al hacer login con ese email,
-- el bootstrap rellenará automáticamente el user_id.
insert into public.plataforma_admins (email, nombre)
values ('manuelruizredondo@gmail.com', 'Manuel Ruiz')
on conflict (email) do nothing;

-- ============================================================
-- LISTO. La base de datos es ya multi-tenant.
--
-- Próximos pasos manuales (solo la primera vez):
--   1. Asegúrate de tener un usuario en Supabase Auth con tu email de superadmin.
--   2. Al hacer login con ese email, el endpoint /api/auth/bootstrap enlazará
--      tu user_id en plataforma_admins. A partir de ahí verás el menú "Empresas".
--   3. Desde /superadmin podrás dar de alta nuevos clientes con su primer admin.
-- ============================================================
