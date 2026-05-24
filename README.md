# Vacantia

> Vacaciones · Descansos · Bienestar

Gestor de ausencias para equipos pequeños: vacaciones, bajas médicas, asistencia diaria, permisos y festivos. Con autenticación, roles y una vista por trabajador.

Construido con **Next.js 14 (App Router) · Tailwind CSS · Supabase (Auth + Postgres + RLS)**.

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

### 2. Crear proyecto Supabase y ejecutar el esquema

1. Crea proyecto gratis en https://supabase.com/.
2. Abre **SQL Editor → New query** y ejecuta el contenido de [`supabase/schema.sql`](supabase/schema.sql). Es idempotente, podés repetirlo cuando quieras.
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

### 4. Crear el primer admin

No hace falta SQL ni configuración previa: arranca la app, ve a `/login`, crea el usuario desde **Supabase → Authentication → Users → Add user** (marca "Auto Confirm User") y entra con esas credenciales. La app detectará que es el primer usuario y le asignará automáticamente el rol `admin`.

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

## Seguridad y RLS

- **admin** ve y edita todo.
- **trabajador** solo ve su propio registro, sus ausencias y sus asistencias (solo lectura).
- Las políticas RLS están en `supabase/schema.sql` y se aplican a nivel PostgreSQL: aunque se manipule el cliente, nadie podrá leer datos ajenos.
- El endpoint `/api/admin/users` (crear/borrar usuarios y cambiar contraseñas) está protegido por el JWT del caller + verificación de rol admin.

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

- [ ] Drag & drop en el calendario para crear ausencias rápido.
- [ ] Notificaciones por email cuando empieza/acaba una ausencia.
- [ ] Importar trabajadores desde CSV.
- [ ] Tabla de auditoría (quién creó/modificó qué y cuándo).
- [ ] Integración con Google Calendar.
- [ ] Soporte multi-empresa.
