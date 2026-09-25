# Novedades del club (anuncios) — Plan de implementación

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Permitir que el administrador publique novedades (texto + imagen opcional) que aparecen como banner en la portada y como historial en `/novedades`, en el Portal Público y/o el de Miembros según elija.

**Architecture:** Tabla nueva `anuncios` con RLS calcada de `planes_membresia`/`comercios`. CRUD en `/admin/anuncios` calcado de `/admin/planes` (lista + overlay de crear/editar), con una imagen opcional subida en el propio overlay de edición reutilizando `SubidaImagen`. Lectura compartida vía `src/lib/anuncios/`, consumida por dos componentes de presentación (`AnuncioBanner`, `ListaAnuncios`) que cada portal monta con su propio cliente de Supabase (público: `createAdminClient()`, sin RLS; miembros: `createClient()`, con RLS).

**Tech Stack:** Next.js 16 (App Router, Server Components + Server Actions), Supabase (Postgres + Storage + RLS), TypeScript, Vitest.

**Spec:** `docs/superpowers/specs/2026-09-23-anuncios-novedades-design.md`

## Global Constraints

- Nunca `className="orum-*"`, nunca valores literales de color/espaciado/radio/duración — todo sale de `src/styles/tokens.css` vía `var(--…)`.
- Nunca `style={{ … }}` para maquetar — los estilos van en `.module.css`.
- Un formulario nunca navega: overlay (`OverlayRuta`), con su gemela bajo `@modal/(.)…` en el layout de `app/admin/layout.tsx` (única ranura, ya existente).
- `imagen_url` se llena EXCLUSIVAMENTE por la subida a Storage (`subirImagen`), nunca por texto libre.
- Fechas: `anuncios.created_at` es `timestamptz` → formatear en `America/Bogota`.
- Contraste AA en todo texto; `:focus-visible` visible en todo interactivo; objetivos táctiles ≥44px.
- Server Components con `requireRol`/`requireMiembroVigente`; mutaciones en Server Actions con verificación de rol al entrar.
- Pruebas automatizadas solo de funciones puras (`src/lib/anuncios/*.ts`).
- Verificación final: `.\node_modules\.bin\tsc.cmd --noEmit`, `.\node_modules\.bin\eslint.cmd .`, `.\node_modules\.bin\vitest.cmd run --reporter=dot`, `.\node_modules\.bin\next.cmd build`.

## Review Focus

- **Alcance sin ninguna casilla marcada**: si el admin desmarca las dos casillas de alcance y envía, la acción debe rechazar con "Elige al menos un portal donde mostrarla." y no crear/guardar una fila invisible en los dos portales.
- **Anuncio sin imagen**: el banner y la tarjeta del historial deben verse bien con `imagenUrl: null` — sin hueco vacío ni `<img>` con `src` vacío.
- **Cuerpo largo en el banner**: un `cuerpo` de 600 caracteres no debe reventar la franja del banner ni desbordar la página — necesita recorte visual (line-clamp), no solo confiar en que el admin escriba corto.
- **Cerrar el banner y que vuelva a aparecer con el siguiente anuncio**: cerrar el anuncio A (guarda `anuncio-cerrado-{idA}`) y publicar un anuncio B con id distinto debe mostrar B — la clave por id, no una clave fija, es lo que lo garantiza.
- **`activo = false` no debe aparecer en ningún lado**: ni en el banner, ni en `/novedades`, ni en `/miembros/novedades`, aunque `mostrar_publico`/`mostrar_miembros` sigan en `true`.

---

## Task 1: Migración de base de datos — tabla, RLS y bucket de imágenes

**Files:**
- Create: `supabase/migrations/20260923140000_anuncios.sql`

**Interfaces:**
- Produces: tabla `public.anuncios` (columnas: `id bigint`, `titulo text`, `cuerpo text`, `imagen_url text|null`, `mostrar_publico boolean`, `mostrar_miembros boolean`, `activo boolean`, `creado_por uuid|null`, `created_at timestamptz`, `deleted_at timestamptz|null`); bucket de Storage `imagenes-anuncios`.

- [ ] **Step 1: Escribir la migración**

```sql
-- ORUM · Novedades del club: tabla anuncios, RLS y bucket de imágenes
--
-- Spec: docs/superpowers/specs/2026-09-23-anuncios-novedades-design.md
--
-- "anuncios" y no "novedades": `src/lib/comercios/estanterias.ts` ya usa
-- "novedades" para los comercios recién sumados al catálogo
-- (`seleccionarNovedades`). La etiqueta de interfaz sigue siendo "Novedades";
-- el nombre interno evita el choque de conceptos en el código.

-- ---------------------------------------------------------------------------
-- 1. Tabla
-- ---------------------------------------------------------------------------

create table public.anuncios (
  id bigint generated always as identity primary key,
  titulo text not null,
  cuerpo text not null,
  imagen_url text,
  mostrar_publico boolean not null default true,
  mostrar_miembros boolean not null default true,
  activo boolean not null default true,
  creado_por uuid references public.perfiles(id),
  created_at timestamptz not null default now(),
  deleted_at timestamptz
);

comment on table public.anuncios is
  'Novedades del club publicadas por administración. Visibles en el Portal Público y/o el de Miembros según mostrar_publico/mostrar_miembros.';

-- ---------------------------------------------------------------------------
-- 2. RLS de la tabla — mismo patrón que comercios_admin / planes_admin
-- ---------------------------------------------------------------------------

alter table public.anuncios enable row level security;

drop policy if exists "anuncios_admin" on public.anuncios;
create policy "anuncios_admin"
on public.anuncios for all to authenticated
using (public.es_admin())
with check (public.es_admin());

drop policy if exists "anuncios_public_select" on public.anuncios;
create policy "anuncios_public_select"
on public.anuncios for select to anon, authenticated
using (activo and deleted_at is null);

-- ---------------------------------------------------------------------------
-- 3. Bucket de imágenes — mismo patrón que imagenes-comercios
-- ---------------------------------------------------------------------------

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  ('imagenes-anuncios', 'imagenes-anuncios', true, 1048576,
   array['image/png','image/jpeg','image/webp'])
on conflict (id) do nothing;

drop policy if exists "imganu_lectura_publica" on storage.objects;
create policy "imganu_lectura_publica"
on storage.objects for select
using (bucket_id = 'imagenes-anuncios');

drop policy if exists "imganu_escritura_admin" on storage.objects;
create policy "imganu_escritura_admin"
on storage.objects for all to authenticated
using (bucket_id = 'imagenes-anuncios' and public.es_administracion())
with check (bucket_id = 'imagenes-anuncios' and public.es_administracion());
```

- [ ] **Step 2: Aplicar la migración con la herramienta MCP de Supabase**

Aplica el contenido exacto del archivo con `mcp__supabase__apply_migration`, `name: "anuncios"`. Confirma que el resultado no reporta error.

- [ ] **Step 3: Verificar la tabla y el bucket con SQL**

Con `mcp__supabase__execute_sql`:

```sql
select column_name, data_type, is_nullable, column_default
from information_schema.columns
where table_name = 'anuncios'
order by ordinal_position;

select id, public, file_size_limit from storage.buckets where id = 'imagenes-anuncios';

select policyname, cmd, roles from pg_policies where tablename = 'anuncios';
```

Esperado: 10 columnas con los tipos de arriba; el bucket con `public = true` y `file_size_limit = 1048576`; dos políticas (`anuncios_admin`, `anuncios_public_select`).

- [ ] **Step 4: Regenerar los tipos de TypeScript**

Con `mcp__supabase__generate_typescript_types`, sobrescribe `src/lib/supabase/database.types.ts` con el resultado completo. Verifica que el nuevo archivo incluya `anuncios` en `Tables`.

- [ ] **Step 5: Commit**

```bash
git add supabase/migrations/20260923140000_anuncios.sql src/lib/supabase/database.types.ts
git commit -m "feat(db): tabla anuncios, RLS y bucket imagenes-anuncios"
```

---

## Task 2: `etiquetaAlcance` — función pura (TDD)

**Files:**
- Create: `src/lib/anuncios/alcance.ts`
- Test: `src/lib/anuncios/alcance.test.ts`

**Interfaces:**
- Produces: `etiquetaAlcance(mostrarPublico: boolean, mostrarMiembros: boolean): string`

- [ ] **Step 1: Escribir la prueba que falla**

```ts
import { describe, it, expect } from 'vitest'
import { etiquetaAlcance } from './alcance'

describe('etiquetaAlcance', () => {
  it('público y miembros', () => {
    expect(etiquetaAlcance(true, true)).toBe('Público y miembros')
  })

  it('solo público', () => {
    expect(etiquetaAlcance(true, false)).toBe('Solo público')
  })

  it('solo miembros', () => {
    expect(etiquetaAlcance(false, true)).toBe('Solo miembros')
  })

  it('ninguno marcado: no debería ocurrir, pero no debe reventar', () => {
    expect(etiquetaAlcance(false, false)).toBe('Sin publicar')
  })
})
```

- [ ] **Step 2: Ejecutar la prueba para verificar que falla**

Run: `.\node_modules\.bin\vitest.cmd run src/lib/anuncios/alcance.test.ts`
Expected: FAIL — `Cannot find module './alcance'`

- [ ] **Step 3: Implementación mínima**

```ts
/**
 * Etiqueta del badge de alcance en la lista de administración.
 *
 * `false, false` no debería llegar aquí — la acción de crear/editar exige al
 * menos un portal marcado — pero una fila creada fuera de la app (o un dato
 * viejo) no puede reventar la tabla: se etiqueta explícitamente en vez de
 * pintar un hueco.
 */
export function etiquetaAlcance(mostrarPublico: boolean, mostrarMiembros: boolean): string {
  if (mostrarPublico && mostrarMiembros) return 'Público y miembros'
  if (mostrarPublico) return 'Solo público'
  if (mostrarMiembros) return 'Solo miembros'
  return 'Sin publicar'
}
```

- [ ] **Step 4: Ejecutar la prueba para verificar que pasa**

Run: `.\node_modules\.bin\vitest.cmd run src/lib/anuncios/alcance.test.ts`
Expected: PASS (4 tests)

- [ ] **Step 5: Commit**

```bash
git add src/lib/anuncios/alcance.ts src/lib/anuncios/alcance.test.ts
git commit -m "feat(anuncios): etiquetaAlcance"
```

---

## Task 3: `formatearFechaNovedad` — función pura (TDD)

**Files:**
- Create: `src/lib/anuncios/fecha.ts`
- Test: `src/lib/anuncios/fecha.test.ts`

**Interfaces:**
- Produces: `formatearFechaNovedad(iso: string): string`

- [ ] **Step 1: Escribir la prueba que falla**

```ts
import { describe, it, expect } from 'vitest'
import { formatearFechaNovedad } from './fecha'

describe('formatearFechaNovedad', () => {
  it('formatea un timestamptz en America/Bogota, en español', () => {
    // 2026-09-23T23:30:00Z son las 18:30 en Bogotá (UTC-5): mismo día.
    expect(formatearFechaNovedad('2026-09-23T23:30:00Z')).toBe('23 de septiembre de 2026')
  })

  it('un timestamp que cruza medianoche UTC hacia el día anterior en Bogotá', () => {
    // 2026-09-24T02:00:00Z son las 21:00 del 23 en Bogotá.
    expect(formatearFechaNovedad('2026-09-24T02:00:00Z')).toBe('23 de septiembre de 2026')
  })
})
```

- [ ] **Step 2: Ejecutar la prueba para verificar que falla**

Run: `.\node_modules\.bin\vitest.cmd run src/lib/anuncios/fecha.test.ts`
Expected: FAIL — `Cannot find module './fecha'`

- [ ] **Step 3: Implementación mínima**

```ts
/**
 * Fecha de un anuncio en prosa, en `America/Bogota` — igual que el resto del
 * proyecto formatea un `timestamptz` (ver `src/lib/shared/fecha.ts`). Bogotá
 * no tiene horario de verano, así que el offset es siempre -05:00.
 */
export function formatearFechaNovedad(iso: string): string {
  return new Intl.DateTimeFormat('es-CO', {
    timeZone: 'America/Bogota',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(new Date(iso))
}
```

- [ ] **Step 4: Ejecutar la prueba para verificar que pasa**

Run: `.\node_modules\.bin\vitest.cmd run src/lib/anuncios/fecha.test.ts`
Expected: PASS (2 tests)

- [ ] **Step 5: Commit**

```bash
git add src/lib/anuncios/fecha.ts src/lib/anuncios/fecha.test.ts
git commit -m "feat(anuncios): formatearFechaNovedad"
```

---

## Task 4: Tipos y consulta compartida `obtenerAnunciosVisibles`

**Files:**
- Create: `src/lib/anuncios/tipos.ts`
- Create: `src/lib/anuncios/consultas.ts`

**Interfaces:**
- Consumes: `Database` de `@/lib/supabase/database.types` (tabla `anuncios`, generada en Task 1).
- Produces: `type AnuncioResumen = { id: number; titulo: string; cuerpo: string; imagenUrl: string | null; createdAt: string }`; `type PortalAnuncios = 'publico' | 'miembros'`; `obtenerAnunciosVisibles(supabase: SupabaseClient<Database>, portal: PortalAnuncios): Promise<AnuncioResumen[]>`.

- [ ] **Step 1: Tipos**

```ts
// src/lib/anuncios/tipos.ts

/** Una novedad tal como la consumen el banner y el historial. */
export type AnuncioResumen = {
  id: number
  titulo: string
  cuerpo: string
  imagenUrl: string | null
  createdAt: string
}
```

- [ ] **Step 2: Consulta compartida**

```ts
// src/lib/anuncios/consultas.ts
import 'server-only'

import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/lib/supabase/database.types'
import type { AnuncioResumen } from './tipos'

export type PortalAnuncios = 'publico' | 'miembros'

/*
  Qué columna de alcance mira cada portal. El Portal Público lee con
  `createAdminClient()` (se salta RLS) y el de Miembros con `createClient()`
  (RLS activa vía `anuncios_public_select`); en los dos casos el filtro de
  alcance es de la QUERY, no de la política — la política solo decide si la
  fila es legible en absoluto (activa y no borrada).
*/
const COLUMNA_ALCANCE = {
  publico: 'mostrar_publico',
  miembros: 'mostrar_miembros',
} as const satisfies Record<PortalAnuncios, 'mostrar_publico' | 'mostrar_miembros'>

/** Las novedades visibles en un portal, la más reciente primero. */
export async function obtenerAnunciosVisibles(
  supabase: SupabaseClient<Database>,
  portal: PortalAnuncios,
): Promise<AnuncioResumen[]> {
  const { data } = await supabase
    .from('anuncios')
    .select('id, titulo, cuerpo, imagen_url, created_at')
    .eq('activo', true)
    .eq(COLUMNA_ALCANCE[portal], true)
    .is('deleted_at', null)
    .order('created_at', { ascending: false })
    .limit(50)

  return (data ?? []).map((fila) => ({
    id: fila.id,
    titulo: fila.titulo,
    cuerpo: fila.cuerpo,
    imagenUrl: fila.imagen_url,
    createdAt: fila.created_at,
  }))
}
```

- [ ] **Step 3: Verificar que compila**

Run: `.\node_modules\.bin\tsc.cmd --noEmit`
Expected: sin errores. Si `Database['public']['Tables']['anuncios']` no existe, revisa que Task 1 Step 4 (regenerar tipos) se haya completado.

- [ ] **Step 4: Commit**

```bash
git add src/lib/anuncios/tipos.ts src/lib/anuncios/consultas.ts
git commit -m "feat(anuncios): tipos y obtenerAnunciosVisibles"
```

---

## Task 5: Rutas de imagen y extensión de la bitácora

**Files:**
- Modify: `src/lib/imagenes/rutas.ts`
- Modify: `src/lib/imagenes/auditoria.ts:25`

**Interfaces:**
- Produces: `BUCKET_IMAGENES_ANUNCIOS = 'imagenes-anuncios'`; `rutaImagenAnuncio(anuncioId: number, extension: string): string`.

- [ ] **Step 1: Añadir la constante de bucket y la función de ruta**

En `src/lib/imagenes/rutas.ts`, junto a `BUCKET_IMAGENES_COMERCIOS`:

```ts
export const BUCKET_IMAGENES_ANUNCIOS = 'imagenes-anuncios'
```

Y junto a `rutaPortadaComercio`:

```ts
/**
 * `imagenes-anuncios/anuncios/{id}/imagen.{ext}` — nombre fijo por destino,
 * igual que el logo o la portada de un comercio: subir dos veces SUSTITUYE
 * en vez de acumular archivos huérfanos.
 */
export function rutaImagenAnuncio(anuncioId: number, extension: string): string {
  return `anuncios/${anuncioId}/imagen.${extension}`
}
```

- [ ] **Step 2: Extender `EntidadImagen`**

En `src/lib/imagenes/auditoria.ts:25`, cambia:

```ts
export type EntidadImagen = 'comercio' | 'perfil' | 'miembro' | 'comercio_imagen'
```

por:

```ts
export type EntidadImagen = 'comercio' | 'perfil' | 'miembro' | 'comercio_imagen' | 'anuncio'
```

- [ ] **Step 3: Verificar que compila**

Run: `.\node_modules\.bin\tsc.cmd --noEmit`
Expected: sin errores.

- [ ] **Step 4: Commit**

```bash
git add src/lib/imagenes/rutas.ts src/lib/imagenes/auditoria.ts
git commit -m "feat(anuncios): ruta de imagen y entidad de bitácora"
```

---

## Task 6: Acciones de servidor del admin — crear, editar, activar/desactivar

**Files:**
- Create: `src/app/admin/anuncios/actions.ts`

**Interfaces:**
- Consumes: `createAdminClient` de `@/lib/supabase/admin`; `getPerfilActual` de `@/lib/auth/auth`.
- Produces: `type AnuncioState = { error?: string; ok?: boolean }`; `crearAnuncio(prev: AnuncioState, formData: FormData): Promise<AnuncioState>`; `editarAnuncio(prev: AnuncioState, formData: FormData): Promise<AnuncioState>`; `cambiarEstadoAnuncio(formData: FormData): Promise<void>`.

- [ ] **Step 1: Escribir el archivo de acciones**

```ts
'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createAdminClient } from '@/lib/supabase/admin'
import { getPerfilActual } from '@/lib/auth/auth'

export type AnuncioState = { error?: string; ok?: boolean }

const TITULO_MAXIMO = 120
const CUERPO_MAXIMO = 600

/** Verifica que quien ejecuta la acción sea super_admin. Calcado de planes/actions.ts. */
async function exigirSuperAdmin(): Promise<{ actorId: string } | null> {
  const actor = await getPerfilActual()
  if (!actor || !actor.activo || actor.rolCodigo !== 'super_admin') return null
  return { actorId: actor.userId }
}

/** Refresca las cuatro superficies que leen anuncios. */
function refrescar(): void {
  revalidatePath('/admin/anuncios')
  revalidatePath('/')
  revalidatePath('/novedades')
  revalidatePath('/miembros')
  revalidatePath('/miembros/novedades')
}

/** Lee y valida los campos comunes de un anuncio desde el formulario. */
function leerCampos(formData: FormData):
  | {
      ok: true
      titulo: string
      cuerpo: string
      mostrarPublico: boolean
      mostrarMiembros: boolean
    }
  | { ok: false; error: string } {
  const titulo = String(formData.get('titulo') ?? '').trim()
  if (!titulo) return { ok: false, error: 'El título es obligatorio.' }
  if (titulo.length > TITULO_MAXIMO) {
    return { ok: false, error: `El título no puede pasar de ${TITULO_MAXIMO} caracteres.` }
  }

  const cuerpo = String(formData.get('cuerpo') ?? '').trim()
  if (!cuerpo) return { ok: false, error: 'El cuerpo es obligatorio.' }
  if (cuerpo.length > CUERPO_MAXIMO) {
    return { ok: false, error: `El cuerpo no puede pasar de ${CUERPO_MAXIMO} caracteres.` }
  }

  const mostrarPublico = formData.get('mostrar_publico') === 'true'
  const mostrarMiembros = formData.get('mostrar_miembros') === 'true'
  if (!mostrarPublico && !mostrarMiembros) {
    return { ok: false, error: 'Elige al menos un portal donde mostrarla.' }
  }

  return { ok: true, titulo, cuerpo, mostrarPublico, mostrarMiembros }
}

export async function crearAnuncio(_prev: AnuncioState, formData: FormData): Promise<AnuncioState> {
  const actor = await exigirSuperAdmin()
  if (!actor) return { error: 'No tienes permiso para realizar esta acción.' }

  const campos = leerCampos(formData)
  if (!campos.ok) return { error: campos.error }

  const admin = createAdminClient()
  const { error } = await admin.from('anuncios').insert({
    titulo: campos.titulo,
    cuerpo: campos.cuerpo,
    mostrar_publico: campos.mostrarPublico,
    mostrar_miembros: campos.mostrarMiembros,
    activo: true,
    creado_por: actor.actorId,
  })
  if (error) return { error: `No se pudo crear la novedad: ${error.message}` }

  refrescar()
  return { ok: true }
}

export async function editarAnuncio(_prev: AnuncioState, formData: FormData): Promise<AnuncioState> {
  const actor = await exigirSuperAdmin()
  if (!actor) return { error: 'No tienes permiso para realizar esta acción.' }

  const id = Number(formData.get('id'))
  if (!Number.isInteger(id) || id < 1) return { error: 'Falta el identificador de la novedad.' }

  const campos = leerCampos(formData)
  if (!campos.ok) return { error: campos.error }

  const admin = createAdminClient()
  const { error } = await admin
    .from('anuncios')
    .update({
      titulo: campos.titulo,
      cuerpo: campos.cuerpo,
      mostrar_publico: campos.mostrarPublico,
      mostrar_miembros: campos.mostrarMiembros,
    })
    .eq('id', id)
  if (error) return { error: `No se pudieron guardar los cambios: ${error.message}` }

  refrescar()
  return { ok: true }
}

/** Activa o desactiva un anuncio (anuncios.activo). Calcado de cambiarEstadoPlan. */
export async function cambiarEstadoAnuncio(formData: FormData): Promise<void> {
  const actor = await exigirSuperAdmin()
  if (!actor) redirect('/login?error=sin_permiso')

  const id = Number(formData.get('id'))
  const activar = String(formData.get('activar') ?? '') === 'true'
  if (!Number.isInteger(id) || id < 1) redirect('/admin/anuncios')

  const admin = createAdminClient()
  await admin.from('anuncios').update({ activo: activar }).eq('id', id)

  refrescar()
  redirect('/admin/anuncios')
}
```

- [ ] **Step 2: Verificar que compila**

Run: `.\node_modules\.bin\tsc.cmd --noEmit`
Expected: sin errores.

- [ ] **Step 3: Commit**

```bash
git add src/app/admin/anuncios/actions.ts
git commit -m "feat(admin): acciones de servidor de anuncios"
```

---

## Task 7: Acción de imagen del admin — `guardarImagenAnuncio`

**Files:**
- Create: `src/app/admin/anuncios/imagen-actions.ts`

**Interfaces:**
- Consumes: `subirImagen` de `@/lib/imagenes/subir`; `BUCKET_IMAGENES_ANUNCIOS`, `rutaImagenAnuncio` de `@/lib/imagenes/rutas` (Task 5); `LIMITE_IMAGENES_COMERCIOS` de `@/lib/imagenes/validacion` (mismo límite de 1 MB, mismo bucket público); `registrarCambioImagen` de `@/lib/imagenes/auditoria`; `EstadoSubida` de `@/lib/imagenes/estado`.
- Produces: `guardarImagenAnuncio(prev: EstadoSubida, formData: FormData): Promise<EstadoSubida>`.

- [ ] **Step 1: Escribir la acción**

```ts
'use server'

/*
  IMAGEN DE UN ANUNCIO · archivo aparte, igual que imagenes-actions.ts de
  comercios: la subida de archivos es superficie nueva y se audita como tal.
*/

import { revalidatePath } from 'next/cache'
import { getPerfilActual } from '@/lib/auth/auth'
import { createAdminClient } from '@/lib/supabase/admin'
import { registrarCambioImagen } from '@/lib/imagenes/auditoria'
import { subirImagen } from '@/lib/imagenes/subir'
import { BUCKET_IMAGENES_ANUNCIOS, rutaImagenAnuncio } from '@/lib/imagenes/rutas'
import { LIMITE_IMAGENES_COMERCIOS } from '@/lib/imagenes/validacion'
import type { EstadoSubida } from '@/lib/imagenes/estado'

/** Mismo criterio que `exigirSuperAdmin` de `actions.ts`. No se relaja aquí. */
async function actorSuperAdmin(): Promise<string | null> {
  const actor = await getPerfilActual()
  if (!actor || !actor.activo || actor.rolCodigo !== 'super_admin') return null
  return actor.userId
}

const SIN_PERMISO = 'No tienes permiso para realizar esta acción.'

function refrescar(anuncioId: number): void {
  revalidatePath('/admin/anuncios')
  revalidatePath(`/admin/anuncios/${anuncioId}/editar`)
  revalidatePath('/')
  revalidatePath('/novedades')
  revalidatePath('/miembros')
  revalidatePath('/miembros/novedades')
}

/**
 * Sustituye la imagen de un anuncio. La columna solo se escribe DESPUÉS de
 * que la subida haya ido bien: si Storage falla, `imagen_url` se queda
 * exactamente como estaba.
 */
export async function guardarImagenAnuncio(
  _prev: EstadoSubida,
  formData: FormData,
): Promise<EstadoSubida> {
  const actorId = await actorSuperAdmin()
  if (!actorId) return { error: SIN_PERMISO }

  const anuncioId = Number(formData.get('id'))
  if (!Number.isInteger(anuncioId) || anuncioId < 1) {
    return { error: 'Falta el identificador de la novedad.' }
  }

  const admin = createAdminClient()

  const { data: anuncio } = await admin
    .from('anuncios')
    .select('id, imagen_url')
    .eq('id', anuncioId)
    .is('deleted_at', null)
    .maybeSingle()
  if (!anuncio) return { error: 'La novedad ya no existe.' }

  const resultado = await subirImagen(admin, {
    archivo: formData.get('archivo'),
    bucket: BUCKET_IMAGENES_ANUNCIOS,
    ruta: (ext) => rutaImagenAnuncio(anuncioId, ext),
    limite: LIMITE_IMAGENES_COMERCIOS,
  })
  if (!resultado.ok) return { error: resultado.error }

  const { error } = await admin
    .from('anuncios')
    .update({ imagen_url: resultado.url })
    .eq('id', anuncioId)

  if (error) {
    return {
      error: `La imagen se subió pero no se pudo guardar en la novedad: ${error.message}. Se conserva la anterior.`,
    }
  }

  await registrarCambioImagen(admin, {
    actorId,
    entidad: 'anuncio',
    entidadId: anuncioId,
    campo: 'imagen_url',
    urlAnterior: anuncio.imagen_url,
    urlNueva: resultado.url,
  })

  refrescar(anuncioId)
  return { ok: true, url: resultado.url }
}
```

- [ ] **Step 2: Verificar que compila**

Run: `.\node_modules\.bin\tsc.cmd --noEmit`
Expected: sin errores.

- [ ] **Step 3: Commit**

```bash
git add src/app/admin/anuncios/imagen-actions.ts
git commit -m "feat(admin): subida de imagen de anuncios"
```

---

## Task 8: Formulario del admin — `AnuncioForm`

**Files:**
- Create: `src/app/admin/anuncios/_components/anuncio-form.tsx`
- Create: `src/app/admin/anuncios/_components/anuncio-form.module.css`

**Interfaces:**
- Consumes: `crearAnuncio`, `editarAnuncio`, `type AnuncioState` de `../actions` (Task 6); `Field`, `Input`, `Textarea` de `@/components/ui/input` y `@/components/ui/field`; `Checkbox` de `@/components/ui/toggle`; `useCerrarCuando`, `useCerrarOverlay` de `@/components/shell/overlay-ruta`.
- Produces: `<AnuncioForm anuncio?={AnuncioInicial} />`, con `type AnuncioInicial = { id: number; titulo: string; cuerpo: string; mostrarPublico: boolean; mostrarMiembros: boolean }`.

- [ ] **Step 1: Escribir el componente**

```tsx
'use client'

import { useActionState } from 'react'
import { Megaphone, Save } from 'lucide-react'
import { Alert } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Field } from '@/components/ui/field'
import { Input, Textarea } from '@/components/ui/input'
import { Checkbox } from '@/components/ui/toggle'
import { Stack } from '@/components/ui/layout'
import { useCerrarCuando, useCerrarOverlay } from '@/components/shell/overlay-ruta'
import { crearAnuncio, editarAnuncio, type AnuncioState } from '../actions'
import formStyles from '@/styles/formulario.module.css'
import styles from './anuncio-form.module.css'

export type AnuncioInicial = {
  id: number
  titulo: string
  cuerpo: string
  mostrarPublico: boolean
  mostrarMiembros: boolean
}

const estadoInicial: AnuncioState = {}

export function AnuncioForm({ anuncio }: { anuncio?: AnuncioInicial }) {
  const editando = Boolean(anuncio)
  const [state, formAction, pending] = useActionState(
    editando ? editarAnuncio : crearAnuncio,
    estadoInicial,
  )
  const cerrar = useCerrarOverlay()
  useCerrarCuando(state.ok)

  return (
    <form action={formAction} className={formStyles.formulario} noValidate>
      {state.error && <Alert tone="danger">{state.error}</Alert>}

      {anuncio && <input type="hidden" name="id" value={anuncio.id} />}

      <Stack gap={5}>
        <Field label="Título" help="Lo primero que lee el socio en el aviso.">
          <Input
            name="titulo"
            defaultValue={anuncio?.titulo}
            maxLength={120}
            required
            autoFocus
          />
        </Field>

        <Field label="Cuerpo" help="El texto completo del aviso. Máximo 600 caracteres.">
          <Textarea
            name="cuerpo"
            defaultValue={anuncio?.cuerpo}
            maxLength={600}
            rows={5}
            required
          />
        </Field>

        {/*
          `<fieldset>`/`<legend>` y no `Field`: `Field` cablea un único
          control por `id` (`useField()`), y aquí hay DOS checkboxes
          independientes — usar `Field` dejaría la etiqueta apuntando a un
          control que no existe.
        */}
        <fieldset className={styles.grupo}>
          <legend className={styles.etiquetaGrupo}>Dónde se muestra</legend>
          <Stack gap={2}>
            <Checkbox
              name="mostrar_publico"
              value="true"
              label="Portal público"
              description="La ve cualquier visitante, incluso sin ser socio."
              defaultChecked={anuncio ? anuncio.mostrarPublico : true}
            />
            <Checkbox
              name="mostrar_miembros"
              value="true"
              label="Portal de miembros"
              description="La ven los socios con membresía vigente."
              defaultChecked={anuncio ? anuncio.mostrarMiembros : true}
            />
          </Stack>
        </fieldset>
      </Stack>

      <div className={formStyles.acciones}>
        <Button
          type="submit"
          loading={pending}
          icon={editando ? <Save size={16} /> : <Megaphone size={16} />}
        >
          {editando ? 'Guardar cambios' : 'Crear novedad'}
        </Button>
        <Button type="button" variant="secondary" onClick={cerrar}>
          Cancelar
        </Button>
      </div>
    </form>
  )
}
```

- [ ] **Step 2: Escribir el módulo CSS del grupo de casillas**

```css
/* src/app/admin/anuncios/_components/anuncio-form.module.css */

.grupo {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
  padding: 0;
  border: none;
  margin: 0;
}

.etiquetaGrupo {
  font-size: var(--t-callout-size);
  line-height: var(--t-callout-leading);
  letter-spacing: var(--t-callout-tracking);
  font-weight: 600;
  color: var(--text);
  padding: 0;
}
```

- [ ] **Step 3: Verificar que compila**

Run: `.\node_modules\.bin\tsc.cmd --noEmit`
Expected: sin errores.

- [ ] **Step 4: Commit**

```bash
git add src/app/admin/anuncios/_components/anuncio-form.tsx src/app/admin/anuncios/_components/anuncio-form.module.css
git commit -m "feat(admin): formulario de anuncios"
```

---

## Task 9: Navegación del admin y lista `/admin/anuncios`

**Files:**
- Modify: `src/components/shell/nav-config.ts`
- Create: `src/app/admin/anuncios/page.tsx`

**Interfaces:**
- Consumes: `etiquetaAlcance` de `@/lib/anuncios/alcance` (Task 2); `formatearFechaNovedad` de `@/lib/anuncios/fecha` (Task 3); `cambiarEstadoAnuncio` de `./actions` (Task 6); `DataList`, `type Column` de `@/components/ui/data-list`.

- [ ] **Step 1: Añadir la entrada de navegación**

En `src/components/shell/nav-config.ts`, el import actual (arriba del todo) es:

```ts
import {
  BarChart3,
  CreditCard,
  Home,
  LayoutGrid,
  Search,
  ScrollText,
  Store,
  UserPlus,
  Users,
  UserCog,
  type LucideIcon,
} from 'lucide-react'
```

Cámbialo por (añade `Megaphone`, mismo orden alfabético que ya trae la lista):

```ts
import {
  BarChart3,
  CreditCard,
  Home,
  LayoutGrid,
  Megaphone,
  Search,
  ScrollText,
  Store,
  UserPlus,
  Users,
  UserCog,
  type LucideIcon,
} from 'lucide-react'
```

Justo debajo de la constante `PLANES` hay esta línea:

```ts
const PLANES: NavItem = { href: '/admin/planes', label: 'Planes', icon: CreditCard }
```

Añade debajo, en la misma forma:

```ts
const ANUNCIOS: NavItem = { href: '/admin/anuncios', label: 'Novedades', icon: Megaphone }
```

Y en `navegacionPara`, la rama de `super_admin` termina con:

```ts
      { label: 'Administración', items: [USUARIOS, PLANES] },
    ]
  }
```

Cámbiala por:

```ts
      { label: 'Administración', items: [USUARIOS, PLANES, ANUNCIOS] },
    ]
  }
```

- [ ] **Step 2: Escribir la lista de administración**

```tsx
// src/app/admin/anuncios/page.tsx
import { Megaphone, MoreHorizontal, Pencil } from 'lucide-react'
import { requireRol } from '@/lib/auth/auth'
import { createAdminClient } from '@/lib/supabase/admin'
import { etiquetaAlcance } from '@/lib/anuncios/alcance'
import { formatearFechaNovedad } from '@/lib/anuncios/fecha'
import { AccionEstado } from '@/components/ui/accion-estado'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { DataList, type Column } from '@/components/ui/data-list'
import { EmptyState } from '@/components/ui/feedback'
import { PageHeader } from '@/components/ui/layout'
import { DropdownMenu, MenuItem } from '@/components/ui/menu'
import { cambiarEstadoAnuncio } from './actions'

export const metadata = { title: 'Novedades · ORUM' }

type Anuncio = {
  id: number
  titulo: string
  mostrar_publico: boolean
  mostrar_miembros: boolean
  activo: boolean
  created_at: string
}

const COLUMNAS: ReadonlyArray<Column<Anuncio>> = [
  {
    key: 'titulo',
    header: 'Título',
    primary: true,
    cell: (a) => a.titulo,
  },
  {
    key: 'alcance',
    header: 'Alcance',
    hideOnMobile: true,
    cell: (a) => (
      <Badge tone="info" size="sm">
        {etiquetaAlcance(a.mostrar_publico, a.mostrar_miembros)}
      </Badge>
    ),
  },
  {
    key: 'activo',
    header: 'Estado',
    width: '150px',
    cell: (a) => (
      <Badge tone={a.activo ? 'success' : 'warning'} size="sm">
        {a.activo ? 'Publicada' : 'Retirada'}
      </Badge>
    ),
  },
  {
    key: 'creado',
    header: 'Creada',
    hideOnMobile: true,
    cell: (a) => formatearFechaNovedad(a.created_at),
  },
]

export default async function AnunciosPage() {
  await requireRol('super_admin')

  const admin = createAdminClient()
  const { data: anuncios } = await admin
    .from('anuncios')
    .select('id, titulo, mostrar_publico, mostrar_miembros, activo, created_at')
    .is('deleted_at', null)
    .order('created_at', { ascending: false })

  return (
    <>
      <PageHeader
        title="Novedades"
        description="Lo que el admin publica se ve en el Portal Público y/o el de Miembros, según el alcance de cada una."
        actions={
          <Button href="/admin/anuncios/nuevo" icon={<Megaphone size={16} />}>
            Nueva novedad
          </Button>
        }
      />

      <DataList
        caption="Novedades"
        items={(anuncios ?? []) as Anuncio[]}
        columns={COLUMNAS}
        getKey={(a) => a.id}
        alwaysShowActions
        empty={
          <EmptyState
            title="Aún no hay novedades"
            description="Publica la primera para anunciar un beneficio nuevo o una actualización del club."
            actions={
              <Button href="/admin/anuncios/nuevo" icon={<Megaphone size={16} />}>
                Nueva novedad
              </Button>
            }
          />
        }
        actions={(a) => (
          <>
            <AccionEstado
              activo={a.activo}
              accion={cambiarEstadoAnuncio}
              campos={{ id: a.id }}
              etiquetaDesactivar="Retirar"
              etiquetaActivar="Publicar"
            />

            <DropdownMenu
              trigger={
                <Button
                  iconOnly
                  variant="ghost"
                  size="sm"
                  aria-label={`Acciones de ${a.titulo}`}
                >
                  <MoreHorizontal size={16} />
                </Button>
              }
            >
              <MenuItem href={`/admin/anuncios/${a.id}/editar`} icon={<Pencil size={16} />}>
                Editar novedad
              </MenuItem>
            </DropdownMenu>
          </>
        )}
      />
    </>
  )
}
```

- [ ] **Step 3: Verificar que compila**

Run: `.\node_modules\.bin\tsc.cmd --noEmit`
Expected: sin errores. (Fallará hasta que `./actions` de Task 6 exista — si se ejecuta este plan en orden, ya existe.)

- [ ] **Step 4: Commit**

```bash
git add src/components/shell/nav-config.ts src/app/admin/anuncios/page.tsx
git commit -m "feat(admin): navegación y lista de anuncios"
```

---

## Task 10: Crear y editar — páginas y gemelas `@modal`

**Files:**
- Create: `src/app/admin/anuncios/nuevo/page.tsx`
- Create: `src/app/admin/@modal/(.)anuncios/nuevo/page.tsx`
- Create: `src/app/admin/anuncios/[id]/editar/page.tsx`
- Create: `src/app/admin/@modal/(.)anuncios/[id]/editar/page.tsx`

**Interfaces:**
- Consumes: `AnuncioForm`, `type AnuncioInicial` de `@/app/admin/anuncios/_components/anuncio-form` (Task 8); `SubidaImagen` de `@/components/imagenes/subida-imagen`; `guardarImagenAnuncio` de `@/app/admin/anuncios/imagen-actions` (Task 7); `LIMITE_IMAGENES_COMERCIOS` de `@/lib/imagenes/validacion`.

- [ ] **Step 1: Página de creación (pantalla completa)**

```tsx
// src/app/admin/anuncios/nuevo/page.tsx
import { requireRol } from '@/lib/auth/auth'
import { PageHeader } from '@/components/ui/layout'
import { FormCard } from '@/components/ui/form-card'
import { AnuncioForm } from '../_components/anuncio-form'

export const metadata = { title: 'Nueva novedad · ORUM' }

export default async function NuevaAnuncioPage() {
  await requireRol('super_admin')

  return (
    <>
      <PageHeader
        title="Nueva novedad"
        description="Nace publicada. Puedes retirarla después sin borrarla."
      />
      <FormCard>
        <AnuncioForm />
      </FormCard>
    </>
  )
}
```

- [ ] **Step 2: Gemela interceptada de creación**

```tsx
// src/app/admin/@modal/(.)anuncios/nuevo/page.tsx
import { requireRol } from '@/lib/auth/auth'
import { OverlayRuta } from '@/components/shell/overlay-ruta'
import { AnuncioForm } from '@/app/admin/anuncios/_components/anuncio-form'

export default async function NuevaAnuncioInterceptada() {
  await requireRol('super_admin')

  return (
    <OverlayRuta
      title="Nueva novedad"
      description="Nace publicada. Puedes retirarla después sin borrarla."
      detent="medium"
    >
      <AnuncioForm />
    </OverlayRuta>
  )
}
```

- [ ] **Step 3: Página de edición (pantalla completa), con la imagen**

La imagen va en un `SubidaImagen` aparte, fuera de `AnuncioForm`: es una subida propia con su propia server action (`guardarImagenAnuncio`), igual que el logo de un comercio no viaja dentro del formulario de texto del comercio.

```tsx
// src/app/admin/anuncios/[id]/editar/page.tsx
import { notFound } from 'next/navigation'
import { requireRol } from '@/lib/auth/auth'
import { createAdminClient } from '@/lib/supabase/admin'
import { PageHeader, Stack } from '@/components/ui/layout'
import { FormCard } from '@/components/ui/form-card'
import { SubidaImagen } from '@/components/imagenes/subida-imagen'
import { LIMITE_IMAGENES_COMERCIOS } from '@/lib/imagenes/validacion'
import { AnuncioForm } from '../../_components/anuncio-form'
import { guardarImagenAnuncio } from '../../imagen-actions'

export const metadata = { title: 'Editar novedad · ORUM' }

export default async function EditarAnuncioPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  await requireRol('super_admin')

  const { id } = await params
  const anuncioId = Number(id)
  if (!Number.isInteger(anuncioId) || anuncioId < 1) notFound()

  const admin = createAdminClient()
  const { data: anuncio } = await admin
    .from('anuncios')
    .select('id, titulo, cuerpo, imagen_url, mostrar_publico, mostrar_miembros')
    .eq('id', anuncioId)
    .is('deleted_at', null)
    .maybeSingle()

  if (!anuncio) notFound()

  return (
    <>
      <PageHeader title="Editar novedad" />
      <Stack gap={6}>
        <FormCard>
          <AnuncioForm
            anuncio={{
              id: anuncio.id,
              titulo: anuncio.titulo,
              cuerpo: anuncio.cuerpo,
              mostrarPublico: anuncio.mostrar_publico,
              mostrarMiembros: anuncio.mostrar_miembros,
            }}
          />
        </FormCard>

        <FormCard>
          <SubidaImagen
            accion={guardarImagenAnuncio}
            campos={{ id: anuncio.id }}
            label="Imagen de la novedad"
            urlActual={anuncio.imagen_url}
            nombre={anuncio.titulo}
            limite={LIMITE_IMAGENES_COMERCIOS}
            forma="apaisada"
            etiquetaAccion="Subir imagen"
          />
        </FormCard>
      </Stack>
    </>
  )
}
```

- [ ] **Step 4: Gemela interceptada de edición**

```tsx
// src/app/admin/@modal/(.)anuncios/[id]/editar/page.tsx
import { notFound } from 'next/navigation'
import { requireRol } from '@/lib/auth/auth'
import { createAdminClient } from '@/lib/supabase/admin'
import { OverlayRuta } from '@/components/shell/overlay-ruta'
import { Stack } from '@/components/ui/layout'
import { SubidaImagen } from '@/components/imagenes/subida-imagen'
import { LIMITE_IMAGENES_COMERCIOS } from '@/lib/imagenes/validacion'
import { AnuncioForm } from '@/app/admin/anuncios/_components/anuncio-form'
import { guardarImagenAnuncio } from '@/app/admin/anuncios/imagen-actions'

export default async function EditarAnuncioInterceptada({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  await requireRol('super_admin')

  const { id } = await params
  const anuncioId = Number(id)
  if (!Number.isInteger(anuncioId) || anuncioId < 1) notFound()

  const admin = createAdminClient()
  const { data: anuncio } = await admin
    .from('anuncios')
    .select('id, titulo, cuerpo, imagen_url, mostrar_publico, mostrar_miembros')
    .eq('id', anuncioId)
    .is('deleted_at', null)
    .maybeSingle()

  if (!anuncio) notFound()

  return (
    <OverlayRuta title="Editar novedad" detent="large">
      <Stack gap={6}>
        <AnuncioForm
          anuncio={{
            id: anuncio.id,
            titulo: anuncio.titulo,
            cuerpo: anuncio.cuerpo,
            mostrarPublico: anuncio.mostrar_publico,
            mostrarMiembros: anuncio.mostrar_miembros,
          }}
        />

        <SubidaImagen
          accion={guardarImagenAnuncio}
          campos={{ id: anuncio.id }}
          label="Imagen de la novedad"
          urlActual={anuncio.imagen_url}
          nombre={anuncio.titulo}
          limite={LIMITE_IMAGENES_COMERCIOS}
          forma="apaisada"
          etiquetaAccion="Subir imagen"
        />
      </Stack>
    </OverlayRuta>
  )
}
```

- [ ] **Step 5: Verificar que compila**

Run: `.\node_modules\.bin\tsc.cmd --noEmit`
Expected: sin errores.

- [ ] **Step 6: Reiniciar el servidor de desarrollo y verificar la interceptación en el navegador**

Reinicia `next dev` (el manifiesto de rutas paralelas queda obsoleto tras crear rutas nuevas bajo `@modal`). Desde `/admin/anuncios`, pulsa "Nueva novedad": debe abrir como overlay, no navegar a pantalla completa. Confirma con `document.querySelector('dialog[open]')` en la consola del navegador — debe existir y la lista de detrás debe seguir montada.

- [ ] **Step 7: Commit**

```bash
git add src/app/admin/anuncios/nuevo src/app/admin/anuncios/[id] "src/app/admin/@modal/(.)anuncios"
git commit -m "feat(admin): paginas de crear y editar anuncios, con su interceptacion"
```

---

## Task 11: Componentes compartidos de lectura — `AnuncioBanner` y `ListaAnuncios`

**Files:**
- Create: `src/components/anuncios/anuncio-banner.tsx`
- Create: `src/components/anuncios/anuncio-banner.module.css`
- Create: `src/components/anuncios/lista-anuncios.tsx`
- Create: `src/components/anuncios/lista-anuncios.module.css`

**Interfaces:**
- Consumes: `type AnuncioResumen` de `@/lib/anuncios/tipos` (Task 4); `formatearFechaNovedad` de `@/lib/anuncios/fecha` (Task 3); `usePreferenciaLocal` de `@/components/use-preferencia-local`; `Section` de `@/components/ui/layout`; `Card` de `@/components/ui/card`; `EmptyState` de `@/components/ui/feedback`.
- Produces: `<AnuncioBanner anuncio={AnuncioResumen | null} hrefHistorial={string} />`; `<ListaAnuncios anuncios={AnuncioResumen[]} />`.

Viven en `src/components/` y no en la ruta de un portal porque los usan DOS portales (Público y Miembros) — la misma razón por la que `SubidaImagen` no vive dentro de `admin/`.

- [ ] **Step 1: El banner**

```tsx
// src/components/anuncios/anuncio-banner.tsx
'use client'

import Link from 'next/link'
import { Megaphone, X } from 'lucide-react'
import { Section } from '@/components/ui/layout'
import { Button } from '@/components/ui/button'
import { usePreferenciaLocal } from '@/components/use-preferencia-local'
import type { AnuncioResumen } from '@/lib/anuncios/tipos'
import styles from './anuncio-banner.module.css'

/*
  FRANJA DE ANUNCIO EN LA PORTADA DE CADA PORTAL.

  `<Section tono="cacao">` y no la franja de ancho completo de la landing
  (`escaparate.module.css`): esa es un mecanismo propio de `(publico)/page.tsx`
  con su regla `.franja:first-child`. `Section` es la superficie tonal
  GENÉRICA del sistema (`layout.module.css`), sin sangrado a los bordes ni
  reglas de primer hijo — así este componente no interfiere con esa CSS por
  compartir un nombre de clase parecido: son dos módulos distintos.

  Se cierra guardando `anuncio-cerrado-{id}` en localStorage. La clave lleva
  el ID: un anuncio nuevo (id distinto) vuelve a aparecer aunque el socio
  haya cerrado el anterior, sin backend ni tabla de lecturas.
*/
export function AnuncioBanner({
  anuncio,
  hrefHistorial,
}: {
  anuncio: AnuncioResumen | null
  /** `/novedades` en el Portal Público, `/miembros/novedades` en el de Miembros. */
  hrefHistorial: string
}) {
  const [cerrado, cerrar] = usePreferenciaLocal(
    anuncio ? `anuncio-cerrado-${anuncio.id}` : 'anuncio-cerrado-ninguno',
    false,
  )

  if (!anuncio || cerrado) return null

  return (
    <Section tono="cacao" className={styles.banner}>
      <div className={styles.fila}>
        <Megaphone className={styles.icono} size={20} aria-hidden="true" />

        <div className={styles.textos}>
          <p className={styles.titulo}>{anuncio.titulo}</p>
          <p className={styles.extracto}>{anuncio.cuerpo}</p>
        </div>

        <Link href={hrefHistorial} className={styles.verMas}>
          Ver más
        </Link>

        <Button
          iconOnly
          variant="ghost"
          size="sm"
          aria-label="Cerrar aviso"
          className={styles.cerrar}
          onClick={() => cerrar(true)}
        >
          <X size={16} aria-hidden="true" />
        </Button>
      </div>
    </Section>
  )
}
```

- [ ] **Step 2: Su CSS**

```css
/* src/components/anuncios/anuncio-banner.module.css */

.banner {
  margin-bottom: var(--space-6);
  /* Nunca `scale(0)`: nace desde 0.95 con opacidad, no desde la nada.
     Es un mount/unmount de React (el hook decide si existe), así que un
     `@keyframes` en vez de una transición es lo correcto — no hay valor de
     partida que transicionar cuando el elemento aparece de cero. */
  animation: entrar var(--dur-slow) var(--ease-out);
}

@keyframes entrar {
  from {
    opacity: 0;
    transform: scale(0.95);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}

.fila {
  display: flex;
  align-items: flex-start;
  gap: var(--space-4);
}

.icono {
  flex-shrink: 0;
  color: var(--gold-400);
  margin-top: var(--space-1);
}

.textos {
  flex: 1;
  min-width: 0;
}

.titulo {
  font-weight: 600;
  color: var(--text);
}

.extracto {
  color: var(--text-2);
  margin-top: var(--space-1);
  /* Recorte a dos líneas: un cuerpo de hasta 600 caracteres no puede reventar
     la franja del banner — el texto completo vive en /novedades. */
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.verMas {
  flex-shrink: 0;
  align-self: center;
  color: var(--gold-300);
  font-weight: 600;
  white-space: nowrap;
}

.cerrar {
  flex-shrink: 0;
  color: var(--text-2);
}
```

- [ ] **Step 3: El historial**

```tsx
// src/components/anuncios/lista-anuncios.tsx
import { Megaphone } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { EmptyState } from '@/components/ui/feedback'
import { Stack } from '@/components/ui/layout'
import { formatearFechaNovedad } from '@/lib/anuncios/fecha'
import type { AnuncioResumen } from '@/lib/anuncios/tipos'
import styles from './lista-anuncios.module.css'

export function ListaAnuncios({ anuncios }: { anuncios: AnuncioResumen[] }) {
  if (anuncios.length === 0) {
    return (
      <EmptyState
        icon={<Megaphone size={22} />}
        title="Todavía no hay novedades"
        description="Cuando el club anuncie algo, aparecerá aquí."
      />
    )
  }

  return (
    <Stack gap={5}>
      {anuncios.map((anuncio) => (
        <Card key={anuncio.id} padding="lg">
          {anuncio.imagenUrl && (
            // eslint-disable-next-line @next/next/no-img-element -- URL externa de Storage, no un asset local
            <img
              src={anuncio.imagenUrl}
              alt=""
              className={styles.imagen}
              loading="lazy"
              decoding="async"
            />
          )}
          <p className={styles.fecha}>{formatearFechaNovedad(anuncio.createdAt)}</p>
          <h2 className={styles.titulo}>{anuncio.titulo}</h2>
          <p className={styles.cuerpo}>{anuncio.cuerpo}</p>
        </Card>
      ))}
    </Stack>
  )
}
```

- [ ] **Step 4: Su CSS**

```css
/* src/components/anuncios/lista-anuncios.module.css */

.imagen {
  width: 100%;
  aspect-ratio: 16 / 9;
  object-fit: cover;
  border-radius: var(--radius-md);
  margin-bottom: var(--space-4);
}

.fecha {
  font-size: var(--t-footnote-size);
  line-height: var(--t-footnote-leading);
  color: var(--text-3);
}

.titulo {
  font-weight: 700;
  margin-top: var(--space-1);
}

.cuerpo {
  color: var(--text-2);
  margin-top: var(--space-2);
  white-space: pre-wrap;
}
```

- [ ] **Step 5: Verificar que compila**

Run: `.\node_modules\.bin\tsc.cmd --noEmit`
Expected: sin errores.

- [ ] **Step 6: Commit**

```bash
git add src/components/anuncios
git commit -m "feat(anuncios): AnuncioBanner y ListaAnuncios"
```

---

## Task 12: Portal Público — banner, historial y navegación

**Files:**
- Modify: `src/app/(publico)/page.tsx`
- Create: `src/app/(publico)/novedades/page.tsx`
- Modify: `src/app/(publico)/_components/anclas.ts`

**Interfaces:**
- Consumes: `obtenerAnunciosVisibles` de `@/lib/anuncios/consultas` (Task 4); `AnuncioBanner`, `ListaAnuncios` de `@/components/anuncios/*` (Task 11); `createAdminClient` de `@/lib/supabase/admin`.

- [ ] **Step 1: Añadir "Novedades" a las anclas del encabezado público**

En `src/app/(publico)/_components/anclas.ts`, añade una cuarta entrada (no es un ancla de la misma página, es una ruta real — el componente que consume `ANCLAS` ya renderiza cualquier `href` con `<Link>`, así que no hace falta tocar `encabezado-publico.tsx` ni `menu-movil-publico.tsx`):

```ts
export const ANCLAS = [
  { href: '/#que-es-orum', texto: 'Qué es ORUM' },
  { href: '/#como-funciona', texto: 'Cómo funciona' },
  { href: '/#comercios-aliados', texto: 'Comercios aliados' },
  { href: '/novedades', texto: 'Novedades' },
] as const
```

- [ ] **Step 2: Montar el banner en la landing**

En `src/app/(publico)/page.tsx`, el bloque de imports empieza así:

```tsx
import type { Metadata } from 'next'
import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Cifra } from '@/components/ui/cifra'
import { getPerfilActual } from '@/lib/auth/auth'
import {
  obtenerInstanteServidor,
  obtenerVitrinaPublica,
  obtenerWhatsappSoporte,
  type ComercioVitrina,
} from '@/lib/publico/datos-publicos'
```

Añade, justo debajo de esas líneas (antes de los imports de `_components`):

```tsx
import { createAdminClient } from '@/lib/supabase/admin'
import { obtenerAnunciosVisibles } from '@/lib/anuncios/consultas'
import { AnuncioBanner } from '@/components/anuncios/anuncio-banner'
```

Más abajo, dentro de `export default async function LandingPublica()`, está:

```tsx
  const [vitrina, soporte, perfil, abiertoEn] = await Promise.all([
    obtenerVitrinaPublica(),
    obtenerWhatsappSoporte(),
    getPerfilActual(),
    obtenerInstanteServidor(),
  ])
```

Cámbialo por:

```tsx
  const [vitrina, soporte, perfil, abiertoEn, anuncios] = await Promise.all([
    obtenerVitrinaPublica(),
    obtenerWhatsappSoporte(),
    getPerfilActual(),
    obtenerInstanteServidor(),
    obtenerAnunciosVisibles(createAdminClient(), 'publico'),
  ])
```

Y el `return` de la función empieza así:

```tsx
  return (
    <>
      {/*
        EL SOCIO CON SESIÓN ABIERTA QUE LLEGA A `/`.
        ...
      */}
      {perfil?.rolCodigo === 'miembro' && (
        <Link href="/miembros" className={estilos.puente}>
```

Añade el banner como el primer hijo del fragmento, antes del comentario y del bloque del puente:

```tsx
  return (
    <>
      <AnuncioBanner anuncio={anuncios[0] ?? null} hrefHistorial="/novedades" />

      {/*
        EL SOCIO CON SESIÓN ABIERTA QUE LLEGA A `/`.
        ...
      */}
      {perfil?.rolCodigo === 'miembro' && (
        <Link href="/miembros" className={estilos.puente}>
```

Nada más en el archivo cambia: `<HeroPublico>` y el resto de secciones siguen exactamente igual.

- [ ] **Step 3: La página de historial**

```tsx
// src/app/(publico)/novedades/page.tsx
import type { Metadata } from 'next'
import { createAdminClient } from '@/lib/supabase/admin'
import { obtenerAnunciosVisibles } from '@/lib/anuncios/consultas'
import { ListaAnuncios } from '@/components/anuncios/lista-anuncios'
import { PageHeader } from '@/components/ui/layout'
import estilos from './novedades.module.css'

export const metadata: Metadata = {
  title: 'Novedades · ORUM',
  description: 'Beneficios nuevos y actualizaciones del club.',
}

export const dynamic = 'force-dynamic'

export default async function NovedadesPublicas() {
  const anuncios = await obtenerAnunciosVisibles(createAdminClient(), 'publico')

  return (
    <div className={estilos.pagina}>
      <PageHeader
        title="Novedades"
        description="Beneficios nuevos y actualizaciones del club."
      />
      <ListaAnuncios anuncios={anuncios} />
    </div>
  )
}
```

```css
/* src/app/(publico)/novedades/novedades.module.css */

.pagina {
  max-width: 640px;
  margin-inline: auto;
  padding-block: var(--space-8);
}
```

- [ ] **Step 4: Verificar que compila**

Run: `.\node_modules\.bin\tsc.cmd --noEmit`
Expected: sin errores.

- [ ] **Step 5: Verificar en el navegador**

Con el servidor de desarrollo corriendo, crea una novedad de prueba desde `/admin/anuncios/nuevo` con "Portal público" marcado, y confirma que aparece como banner en `/` y como tarjeta en `/novedades`. Cierra el banner con la "×" y recarga: debe seguir cerrado. Publica una segunda novedad: el banner debe cambiar a la nueva.

- [ ] **Step 6: Commit**

```bash
git add "src/app/(publico)/page.tsx" "src/app/(publico)/novedades" "src/app/(publico)/_components/anclas.ts"
git commit -m "feat(publico): banner y pagina de novedades"
```

---

## Task 13: Portal de Miembros — banner, historial y navegación

**Files:**
- Modify: `src/app/miembros/(portal)/page.tsx`
- Create: `src/app/miembros/(portal)/novedades/page.tsx`
- Create: `src/app/miembros/(portal)/novedades/loading.tsx`
- Modify: `src/app/miembros/(portal)/_components/portal-nav.tsx`

**Interfaces:**
- Consumes: `obtenerAnunciosVisibles` de `@/lib/anuncios/consultas` (Task 4); `AnuncioBanner`, `ListaAnuncios` de `@/components/anuncios/*` (Task 11); `createClient` de `@/lib/supabase/server`; `requireMiembroVigente` de `@/lib/miembros/requerir-miembro`.

- [ ] **Step 1: Tercer destino en la navegación del portal**

En `src/app/miembros/(portal)/_components/portal-nav.tsx`, las dos primeras líneas relevantes son:

```tsx
import { Home, User } from 'lucide-react'
import { esDestinoActivo } from '@/lib/miembros/navegacion-portal'
import styles from '../portal.module.css'

const DESTINOS = [
  { href: '/miembros', etiqueta: 'Inicio', Icono: Home },
  { href: '/miembros/perfil', etiqueta: 'Mi perfil', Icono: User },
] as const
```

Cámbialas por:

```tsx
import { Home, Megaphone, User } from 'lucide-react'
import { esDestinoActivo } from '@/lib/miembros/navegacion-portal'
import styles from '../portal.module.css'

const DESTINOS = [
  { href: '/miembros', etiqueta: 'Inicio', Icono: Home },
  { href: '/miembros/novedades', etiqueta: 'Novedades', Icono: Megaphone },
  { href: '/miembros/perfil', etiqueta: 'Mi perfil', Icono: User },
] as const
```

El resto del archivo (`PortalNav`, `PortalTabBar`) itera `DESTINOS` sin listarlos por nombre, así que no necesita ningún otro cambio. `esDestinoActivo` (en `src/lib/miembros/navegacion-portal.ts`) tampoco cambia: `/miembros/novedades` no es hijo de `/miembros` (no está en su lista `HIJOS_DE_INICIO`), así que activa su propia pestaña y ninguna otra.

- [ ] **Step 2: Montar el banner en la portada del socio**

En `src/app/miembros/(portal)/page.tsx`, el import de `TopDescuentos` es la última línea del bloque de imports de componentes:

```tsx
import { TopDescuentos } from './_components/top-descuentos'
import {
  ComercioCard,
  ComercioCardCompacta,
  type ComercioListado,
} from './_components/comercio-card'
import estilos from './_components/catalogo.module.css'
```

Añade, entre esas dos líneas y antes de `import estilos`:

```tsx
import { TopDescuentos } from './_components/top-descuentos'
import { obtenerAnunciosVisibles } from '@/lib/anuncios/consultas'
import { AnuncioBanner } from '@/components/anuncios/anuncio-banner'
import {
  ComercioCard,
  ComercioCardCompacta,
  type ComercioListado,
} from './_components/comercio-card'
import estilos from './_components/catalogo.module.css'
```

Más abajo está la consulta en paralelo que arma toda la página:

```tsx
  const [
    { data: comerciosDelClub },
    { data: todasMarcas },
    { data: todasCiudades },
    { data: todasCategorias },
    { data: tipos },
    { data: filasFavoritos },
    { data: filasMasUsados },
    { data: filasTop },
  ] = await Promise.all([
```

Cambia la desestructuración por (añade `anuncios` al final de la lista de resultados; las nueve entradas del `Promise.all` que siguen —desde `supabase.from('comercios')...` hasta el `sinFiltrar ? supabase.rpc(...) : ...` de `top_descuentos`— no se tocan, solo se añade una décima entrada al final del array):

```tsx
  const [
    { data: comerciosDelClub },
    { data: todasMarcas },
    { data: todasCiudades },
    { data: todasCategorias },
    { data: tipos },
    { data: filasFavoritos },
    { data: filasMasUsados },
    { data: filasTop },
    anuncios,
  ] = await Promise.all([
```

Y en el cierre de ese mismo `Promise.all` (la última entrada del array, ahora mismo la promesa de `top_descuentos`):

```tsx
    sinFiltrar
      ? supabase.rpc('top_descuentos', { p_limite: TOPE_TOP_DESCUENTOS })
      : Promise.resolve({ data: [] as FilaTopDescuento[] }),
  ])
```

Añade la nueva consulta justo después, dentro del mismo array:

```tsx
    sinFiltrar
      ? supabase.rpc('top_descuentos', { p_limite: TOPE_TOP_DESCUENTOS })
      : Promise.resolve({ data: [] as FilaTopDescuento[] }),
    obtenerAnunciosVisibles(supabase, 'miembros'),
  ])
```

Por último, el `return` de la página empieza así:

```tsx
    <FavoritosProvider inicial={idsFavoritos}>
      <div className={estilos.pagina}>
        <EncabezadoCatalogo />
```

Añade el banner como primer hijo de `.pagina`, antes de `<EncabezadoCatalogo />`:

```tsx
    <FavoritosProvider inicial={idsFavoritos}>
      <div className={estilos.pagina}>
        <AnuncioBanner anuncio={anuncios[0] ?? null} hrefHistorial="/miembros/novedades" />

        <EncabezadoCatalogo />
```

Nada más en el archivo cambia.

- [ ] **Step 3: La página de historial**

```tsx
// src/app/miembros/(portal)/novedades/page.tsx
import { requireMiembroVigente } from '@/lib/miembros/requerir-miembro'
import { createClient } from '@/lib/supabase/server'
import { obtenerAnunciosVisibles } from '@/lib/anuncios/consultas'
import { ListaAnuncios } from '@/components/anuncios/lista-anuncios'
import { PageHeader } from '@/components/ui/layout'
import estilos from './novedades.module.css'

export const metadata = { title: 'Novedades · ORUM' }

export default async function NovedadesMiembro() {
  await requireMiembroVigente()

  const supabase = await createClient()
  const anuncios = await obtenerAnunciosVisibles(supabase, 'miembros')

  return (
    <div className={estilos.pagina}>
      <PageHeader
        title="Novedades"
        description="Beneficios nuevos y actualizaciones del club."
      />
      <ListaAnuncios anuncios={anuncios} />
    </div>
  )
}
```

```css
/* src/app/miembros/(portal)/novedades/novedades.module.css */

.pagina {
  max-width: 640px;
  margin-inline: auto;
  padding-block: var(--space-6);
}
```

- [ ] **Step 4: Su `loading.tsx`**

```tsx
// src/app/miembros/(portal)/novedades/loading.tsx
import { PageHeader, Stack } from '@/components/ui/layout'
import { Card } from '@/components/ui/card'
import { SkeletonText, Skeleton } from '@/components/ui/feedback'

export default function CargandoNovedades() {
  return (
    <div>
      <PageHeader title="Novedades" />
      <Stack gap={5}>
        {Array.from({ length: 3 }, (_, i) => (
          <Card key={i} padding="lg">
            <Skeleton width="30%" height="14px" />
            <Skeleton width="60%" height="20px" />
            <SkeletonText lines={2} />
          </Card>
        ))}
      </Stack>
    </div>
  )
}
```

- [ ] **Step 5: Verificar que compila**

Run: `.\node_modules\.bin\tsc.cmd --noEmit`
Expected: sin errores.

- [ ] **Step 6: Verificar en el navegador**

Con sesión de un miembro con membresía vigente (o, si no hay credenciales de prueba disponibles, verificar solo hasta donde permita el acceso actual — ver "Deuda conocida" del proyecto sobre el Portal de Miembros), confirma que la pestaña "Novedades" aparece en la navegación de escritorio y en la barra inferior de móvil, que el banner aparece en `/miembros` para una novedad con "Portal de miembros" marcado, y que `/miembros/novedades` lista el historial.

- [ ] **Step 7: Commit**

```bash
git add "src/app/miembros/(portal)/page.tsx" "src/app/miembros/(portal)/novedades" "src/app/miembros/(portal)/_components/portal-nav.tsx"
git commit -m "feat(miembros): banner y pagina de novedades"
```

---

## Task 14: Verificación final completa

**Files:** ninguno (solo verificación).

- [ ] **Step 1: Tipos**

Run: `.\node_modules\.bin\tsc.cmd --noEmit`
Expected: 0 errores.

- [ ] **Step 2: Lint**

Run: `.\node_modules\.bin\eslint.cmd .`
Expected: 0 errores.

- [ ] **Step 3: Pruebas**

Run: `.\node_modules\.bin\vitest.cmd run --reporter=dot`
Expected: todas pasan, incluidas `alcance.test.ts` y `fecha.test.ts`.

- [ ] **Step 4: Build**

Run: `.\node_modules\.bin\next.cmd build`
Expected: build exitoso, sin advertencias nuevas de rutas paralelas o de tipos.

- [ ] **Step 5: Revisión manual de los cinco puntos de "Review Focus"**

En el navegador (con el servidor de desarrollo):
1. Crear una novedad con las dos casillas de alcance desmarcadas → debe rechazar con "Elige al menos un portal donde mostrarla."
2. Crear una novedad sin imagen → banner y tarjeta del historial se ven bien, sin hueco.
3. Crear una novedad con un cuerpo de ~600 caracteres → el banner la recorta a dos líneas, sin desbordar.
4. Cerrar el banner de una novedad, publicar una segunda → la segunda aparece.
5. Retirar una novedad (`activo = false`) → desaparece del banner y de los dos historiales aunque su alcance siga marcado.

- [ ] **Step 6: Commit final si hubo ajustes**

Si algún paso anterior requirió una corrección, commitéala con un mensaje que describa el ajuste puntual (no una nueva tarea).
