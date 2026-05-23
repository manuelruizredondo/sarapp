# Sarapp

Control de **vacaciones, bajas médicas, asistencia diaria y permisos** para equipos pequeños.

Hecho con **Next.js 14 (App Router) + Tailwind CSS + Supabase**.

## Funcionalidades

- 🏠 **Dashboard "Hoy"** — cuántas personas están fuera hoy, quién, y vista de los próximos 7 días.
- 📅 **Calendario mensual** — quién está fuera cada día, con código de colores por tipo de ausencia.
- 🗓️ **Resumen por semanas** — agrupación semanal del mes con personas únicas y días por semana.
- 🏖️ **Ausencias** — registro de vacaciones, bajas médicas, permisos, asuntos propios, formación y otros, con filtros.
- ✅ **Asistencia diaria** — fichaje rápido (presente / teletrabajo / retraso / ausente) por trabajador.
- 👥 **Trabajadores** — alta, edición, baja y contador automático de **días de vacaciones consumidos / restantes** del año en curso.

## Puesta en marcha

### 1. Instalar dependencias

```bash
npm install
```

### 2. Crear proyecto en Supabase

1. Crea un proyecto gratis en https://supabase.com/.
2. En **SQL Editor**, pega y ejecuta el contenido de [`supabase/schema.sql`](supabase/schema.sql).
3. En **Project Settings → API** copia:
   - `Project URL`
   - `anon public key`

### 3. Configurar variables de entorno

```bash
cp .env.local.example .env.local
```

Edita `.env.local` y pega tus claves:

```
NEXT_PUBLIC_SUPABASE_URL=https://xxxxxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOi...
```

### 4. Arrancar en local

```bash
npm run dev
```

Abre http://localhost:3000

> Si aún no has configurado Supabase, la app arranca igual y muestra un aviso amarillo en la cabecera.

## Despliegue rápido en Vercel

1. Sube el repo a GitHub (ya lo tienes en `https://github.com/manuelruizredondo/sarapp`).
2. Entra en https://vercel.com/new e importa el repo.
3. En **Environment Variables** pega las dos mismas variables del paso 3.
4. Deploy.

## Estructura del proyecto

```
sarapp/
├── app/                     # Páginas (Next.js App Router)
│   ├── page.tsx             # Dashboard "Hoy"
│   ├── calendario/          # Vista mensual
│   ├── resumen/             # Resumen por semanas
│   ├── ausencias/           # CRUD de ausencias
│   ├── asistencia/          # Fichaje diario
│   ├── trabajadores/        # CRUD de trabajadores
│   ├── layout.tsx
│   └── globals.css
├── components/
│   ├── Sidebar.tsx
│   ├── PageHeader.tsx
│   └── SupabaseBanner.tsx
├── lib/
│   ├── supabase.ts          # Cliente Supabase
│   ├── data.ts              # Funciones CRUD
│   ├── types.ts             # Tipos + labels/colores
│   └── dates.ts             # Helpers de fechas
├── supabase/
│   └── schema.sql           # Esquema de BBDD listo para pegar
├── tailwind.config.ts
├── next.config.js
├── tsconfig.json
└── package.json
```

## Tablas de Supabase

- `trabajadores` — datos de cada empleado + `dias_vacaciones_anuales`.
- `ausencias` — vacaciones, bajas y permisos (con rango de fechas y tipo).
- `asistencias` — fichaje diario por trabajador (1 fila por trabajador/día).
- `vista_dias_vacaciones` — vista que calcula los días consumidos y restantes del año.

## Notas

- La app está pensada para **uso solo-admin** (sin login). Si más adelante quieres permitir que los empleados consulten o soliciten ausencias, activa Auth en Supabase y políticas RLS sobre las tablas.
- Los días de vacaciones se calculan en **días naturales** entre `fecha_inicio` y `fecha_fin` (ambos inclusive). Si necesitas días laborables, hay que modificar `lib/dates.ts` y `vista_dias_vacaciones`.

## Roadmap sugerido

- [ ] Filtrar días laborables (excluir sábados, domingos y festivos).
- [ ] Exportar a CSV / Excel.
- [ ] Login con Google + RLS por trabajador.
- [ ] Notificaciones al admin cuando se solapan vacaciones.
- [ ] Vista anual (heatmap) por trabajador.
