# Vacantia

> Vacaciones · Descansos · Bienestar — SaaS multi-empresa

Gestor de ausencias para equipos pequeños: vacaciones, bajas médicas, asistencia diaria, permisos y festivos. **Multi-tenant**: una sola instalación atiende a muchas empresas cliente, cada una con su propio admin y sus trabajadores totalmente aislados (RLS).

Construido con **Next.js 14 (App Router) · Tailwind CSS · Supabase (Auth + Postgres + RLS)**.

## Roles

- **Superadmin** (tú, dueño del SaaS): da de alta empresas cliente desde `/superadmin`. Vive en la tabla `plataforma_admins`, fuera de cualquier empresa.
- **Admin de empresa**: gestiona los trabajadores, ausencias y festivos de SU empresa. Es un `trabajador` con `rol='admin'`.
- **Trabajador**: ve su propia ficha, sus ausencias y los festivos visibles.

## Vista funcional

**Para todo el equipo**
- 🏠 **Hoy** — quién está fuera, próximos 7 días y cobertura por departamento.
- 📅 **Calendario** — vista mensual con festivos marcados y barras de color por persona.
- 🗓️ **Semanas** — resumen agrupado por semana.
- 🏖️ **Ausencias** — listado, filtros y exportación a CSV.
- 👤 **Mi cuenta** — ficha personal con histórico, días consumidos y restantes (heatmap anual).

**Solo administradores**
- 👥 **Trabajadores** — alta, edición y baja con creación automática del usuario de Auth.
- ✅ **Asistencia diaria** — fichaje rápido.
- 🎉 **Festivos** — gestión y carga rápida de festivos.
- ✏️ Crear, editar y borrar ausencias de cualquier persona.

**Reglas de negocio**
- Las vacaciones se cuentan en **días laborables** (lun-vie, sin festivos).
- Aviso al registrar una ausencia si solapa con otra del mismo trabajador o si ≥3 personas estarán fuera el mismo día.
- Cada trabajador tiene un color que se respeta en todas las vistas.

## Puesta en marcha

### 1. Instalar dependencias

```bash
npm install
```

### 2. Crear proyecto Supabase y ejecutar los esquemas

1. Crea proyecto gratis en https://supabase.com/.
2. Abre **SQL Editor → New query** y ejecuta, **en este orden**:
   1. [`supabase/schema.sql`](supabase/schema.sql) — esquema base.
   2. [`supabase/migration_multi_tenant.sql`](supabase/migration_multi_tenant.sql) — añade soporte multi-empresa. Idempotente: lo puedes volver a correr.
3. Anota tu **Project URL** y la **anon public key** (Project Settings → API).
4. Copia también la **service_role key** (la usa el servidor para crear usuarios).

### 3. Variables de entorno

```bash
cp .env.local.example .env.local
```

Pega tus claves en `.env.local`:

```
NEXT_PUBLIC_SUPABASE_URL=https://xxxxxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOi...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOi...
```

⚠️ Nunca subas la `service_role` al cliente: salta RLS y permite leer/borrar todo.

### 4. Crear el superadmin (dueño del SaaS)

La migración `migration_multi_tenant.sql` ya pre-inserta el email `manuelruizredondo@gmail.com` en `plataforma_admins` (cámbialo en el SQL si tu email es otro). Pasos:

1. En **Supabase → Authentication → Users → Add user** crea un usuario con ese email (marca "Auto Confirm User").
2. Arranca la app, ve a `/login` y entra con esas credenciales.
3. La primera vez, `/api/auth/bootstrap` enlaza tu `user_id` en `plataforma_admins`. A partir de ahí verás en el sidebar la opción **🏢 Empresas** que te lleva a `/superadmin`.

### 4b. Dar de alta una empresa cliente

Desde `/superadmin`:
1. Pulsa **"+ Nueva empresa"**.
2. Rellena el nombre (ej: "Grupo Garantía"), color, plan, y el email/contraseña del primer admin de esa empresa.
3. La app crea la empresa + el usuario admin + su ficha de trabajador de un golpe.
4. Comparte la contraseña con el cliente. Al loguearse en `/login` con ese email, verá únicamente los datos de su empresa.

> **Nota:** si ya tenías datos en la BD antes de la migración, ésta crea automáticamente la empresa **"Grupo Garantía"** (slug `grupo-garantia`) y reasigna todos los trabajadores, ausencias y asistencias existentes a esa empresa. Los festivos antiguos quedan como **globales** (visibles para cualquier empresa).

### 5. Arrancar

```bash
npm run dev
```

Abre http://localhost:3000

## Despliegue (Vercel / Netlify)

1. Push del repo a GitHub.
2. Importa el repo en Netlify/Vercel.
3. Variables de entorno (las tres):
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
4. En Supabase → **Authentication → URL Configuration** añade tu dominio público en **Site URL** y en **Redirect URLs**.
5. Deploy.

## Seguridad y RLS (multi-tenant)

Tres niveles, definidos en `supabase/migration_multi_tenant.sql`:

- **superadmin** (tabla `plataforma_admins`): ve y edita todas las empresas. Acceso al panel `/superadmin`.
- **admin de empresa** (`trabajadores.rol = 'admin'`): ve y edita todo dentro de `mi_empresa_id()`. Imposible leer/escribir en otra empresa: RLS lo bloquea a nivel Postgres.
- **trabajador**: ve su propia ficha, sus ausencias y sus asistencias (solo lectura). Y los festivos visibles para su empresa (los globales + los locales).

Triggers SQL rellenan automáticamente `empresa_id` en `ausencias` y `asistencias` a partir del `trabajador_id`, así que es imposible que un admin "filtree" una fila a la empresa equivocada.

Los endpoints protegidos (`/api/admin/users`, `/api/superadmin/empresas`) validan el JWT del caller + el rol/empresa, además de la RLS. Defensa en profundidad.

## Estructura

```
vacantia/
├── app/
│   ├── login/                    # Login con email+password
│   ├── page.tsx                  # Dashboard "Hoy" + cobertura
│   ├── calendario/               # Vista mensual con festivos
│   ├── resumen/                  # Resumen por semanas
│   ├── ausencias/                # CRUD + CSV + avisos
│   ├── asistencia/               # Fichaje diario (admin)
│   ├── trabajadores/
│   │   ├── page.tsx              # Listado (admin)
│   │   └── [id]/page.tsx         # Detalle + heatmap anual
│   ├── festivos/                 # CRUD festivos (admin)
│   ├── mi-cuenta/                # Redirige a la ficha del usuario
│   ├── api/
│   │   ├── auth/bootstrap/       # Crea/enlaza ficha en primer login
│   │   └── admin/users/          # Crear, borrar y cambiar pwd
│   ├── not-found.tsx
│   ├── layout.tsx
│   └── globals.css
├── components/
│   ├── AuthProvider.tsx          # Sesión + perfil + rol
│   ├── AppShell.tsx              # Decide qué layout mostrar
│   ├── Sidebar.tsx               # Nav desktop
│   ├── MobileNav.tsx             # Nav móvil (burger + drawer)
│   ├── Logo.tsx                  # SVG inline + fallback a PNG
│   ├── ColorPicker.tsx
│   ├── HeatmapAnual.tsx
│   ├── PageHeader.tsx
│   ├── Modal.tsx
│   ├── EmptyState.tsx
│   ├── Skeleton.tsx
│   └── SupabaseBanner.tsx
├── lib/
│   ├── supabase.ts               # Cliente browser
│   ├── supabaseAdmin.ts          # Cliente server (service role)
│   ├── data.ts                   # Funciones CRUD
│   ├── types.ts                  # Tipos + paleta + labels
│   └── dates.ts                  # Días naturales + laborables
├── public/                       # logo.png, logo-mark.png, favicon.png
├── supabase/
│   └── schema.sql                # Esquema completo idempotente
└── package.json
```

## Roadmap

- [x] **Soporte multi-empresa (SaaS)** — superadmin + empresas + RLS por `empresa_id`.
- [ ] Facturación recurrente por empresa (Stripe / plan mensual).
- [ ] Drag & drop en el calendario para crear ausencias rápido.
- [ ] Notificaciones por email cuando empieza/acaba una ausencia.
- [ ] Importar trabajadores desde CSV.
- [ ] Tabla de auditoría (quién creó/modificó qué y cuándo).
- [ ] Integración con Google Calendar.
