# Sarapp

Control de **vacaciones, bajas médicas, asistencia diaria, permisos y festivos** para equipos pequeños.

Hecho con **Next.js 14 (App Router) + Tailwind CSS + Supabase (Auth + Postgres + RLS)**.

## Funcionalidades

### Para todos los usuarios
- 🏠 **Hoy**: cuántas personas hay fuera, lista de ausentes, próximos 7 días, cobertura por departamento.
- 📅 **Calendario** mensual con festivos marcados y barras de color por persona.
- 🗓️ **Resumen por semanas**.
- 🏖️ **Ausencias** con filtros y exportación a CSV.
- 📊 **Vista anual** estilo heatmap por trabajador.
- 👤 **Mi cuenta**: ficha personal con histórico, días consumidos y restantes.

### Solo administradores
- 👥 **Trabajadores** (CRUD): alta, color en calendario, rol, enlace con usuario de Supabase Auth.
- ✅ **Asistencia diaria** (fichaje rápido).
- 🎉 **Festivos** (CRUD) con carga rápida de festivos nacionales de España.
- ➕ **Registrar/editar/borrar** ausencias, con avisos de solapamiento y de baja cobertura.

### Cálculo correcto
- Las vacaciones se cuentan en **días laborables** (lun-vie, sin festivos).
- Los festivos se reflejan en el calendario y se descuentan del cómputo.
- Aviso al guardar si la persona ya tiene otra ausencia en esas fechas, o si 3 o más personas estarán fuera ese día.

## Puesta en marcha

### 1. Instalar dependencias

```bash
npm install
```

### 2. Crear proyecto en Supabase y ejecutar SQL

1. Crea proyecto en https://supabase.com/.
2. SQL Editor → ejecuta primero [`supabase/schema.sql`](supabase/schema.sql) (tablas y vista).
3. SQL Editor → ejecuta después [`supabase/migration_auth_festivos.sql`](supabase/migration_auth_festivos.sql) (roles, RLS y festivos).
4. Project Settings → API → copia **Project URL** y **anon public key**.

### 3. Crear el primer admin

a) Authentication → Users → **Add user** (introduce email y contraseña).
b) En SQL Editor ejecuta (sustituyendo tu email):

```sql
insert into public.trabajadores (nombre, email, user_id, rol, dias_vacaciones_anuales, color)
select 'Admin', u.email, u.id, 'admin', 22, '#0f172a'
from auth.users u where u.email = 'TU_EMAIL@empresa.com'
on conflict (user_id) do update set rol = 'admin';
```

### 4. Configurar variables de entorno

```bash
cp .env.local.example .env.local
```

Pega tu `NEXT_PUBLIC_SUPABASE_URL` y `NEXT_PUBLIC_SUPABASE_ANON_KEY`.

### 5. Arrancar

```bash
npm run dev
```

Abre http://localhost:3000 e inicia sesión con el admin creado.

### 6. Dar de alta empleados

Para cada trabajador:

1. Authentication → Users → **Add user** con su email.
2. En la app, **Trabajadores → + Nuevo trabajador**:
   - Rellena nombre, puesto, etc.
   - **Rol:** Trabajador
   - **user_id de Supabase Auth:** pega el `id` que ves en Authentication → Users
3. Listo: el empleado puede entrar con su email/contraseña y verá solo sus propias ausencias.

## Seguridad y RLS

- **Admin** (rol = `admin`): ve y edita todo.
- **Trabajador** (rol = `trabajador`): solo ve su propio registro, sus propias ausencias y sus propias asistencias. No puede editar nada (solo lectura).
- Las **políticas RLS** están definidas en `supabase/migration_auth_festivos.sql` y se aplican a nivel de PostgreSQL, así que aunque alguien manipule el cliente nunca podrá ver datos ajenos.

## Despliegue (Vercel / Netlify)

1. Sube a GitHub.
2. Importa el repo en Vercel o Netlify.
3. Variables de entorno:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
4. Deploy.

## Estructura del proyecto

```
sarapp/
├── app/
│   ├── login/                  # Login con email + password
│   ├── page.tsx                # Dashboard "Hoy" + cobertura
│   ├── calendario/             # Vista mensual (festivos en ámbar)
│   ├── resumen/                # Resumen por semanas
│   ├── ausencias/              # CRUD + CSV + solapamientos
│   ├── asistencia/             # Fichaje diario (admin)
│   ├── trabajadores/
│   │   ├── page.tsx            # Listado (admin)
│   │   └── [id]/page.tsx       # Detalle + heatmap anual
│   ├── festivos/               # CRUD festivos (admin)
│   ├── mi-cuenta/              # Redirige a la ficha del usuario logueado
│   ├── layout.tsx
│   └── globals.css
├── components/
│   ├── AuthProvider.tsx        # Contexto de sesión + perfil + rol
│   ├── AppShell.tsx            # Wrapper que decide layout según sesión
│   ├── Sidebar.tsx             # Navegación filtrada por rol
│   ├── ColorPicker.tsx
│   ├── HeatmapAnual.tsx
│   ├── PageHeader.tsx
│   └── SupabaseBanner.tsx
├── lib/
│   ├── supabase.ts             # Cliente Supabase con auth persistente
│   ├── data.ts                 # CRUD trabajadores/ausencias/asistencias/festivos
│   ├── types.ts
│   └── dates.ts                # Días naturales + laborables (con festivos)
├── supabase/
│   ├── schema.sql              # Tablas base
│   └── migration_auth_festivos.sql  # Roles, RLS, festivos, helpers
└── package.json
```

## Roadmap pendiente

- [ ] Drag & drop en el calendario para crear ausencias rápido.
- [ ] Notificaciones por email (admin) cuando empieza/acaba una ausencia o quedan pocos días.
- [ ] Importar trabajadores desde CSV.
- [ ] Mejorar móvil (drawer + bottom nav).
- [ ] Auditoría (tabla de logs).
- [ ] Integración con Google Calendar.
