# Reorganización — Paso 4: Módulo miembros con el kit — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Migrate the `miembros` module (listing, registration form, ficha with membership + activity history, renewal form, edit) to the `src/components/ui/` kit built and validated in Paso 3 (`docs/superpowers/plans/2026-08-07-reorg-03-kit-ui-comercios.md`), moving its form components into `_components/` per spec §4.

**Architecture:** Same pattern as the `comercios` migration — thin kit wrappers replace repeated JSX, `*-form.tsx` files move under `_components/`, zero visual/behavioral change. `miembros` is spec §7 step 4.

**Tech Stack:** Next.js 16 (App Router, Server Components + `'use client'` forms with `useActionState`), TypeScript, React 19, pnpm.

## Global Constraints

- **Zero visual/behavioral change**, same as Paso 3.
- Depends on Paso 3 already being applied (the kit exists at `src/components/ui/`, `comercios` already migrated).
- **`SearchForm` spacing is not uniform across modules in the current codebase**: `comercios/page.tsx`'s search bar uses `marginBottom: '1.25rem', gap: '0.75rem'` (the values hard-coded as `SearchForm`'s defaults in Paso 3), but `miembros/page.tsx`'s search bar uses `marginBottom: '1rem', gap: '0.5rem'` — a genuine pre-existing inconsistency, not a typo. Task 1 extends `SearchForm` with optional `marginBottom`/`gap` overrides (defaulting to the Paso-3 values, so `comercios/page.tsx` needs no change) so `miembros` can reuse the component without silently changing its spacing. Unifying the spacing itself is a design decision outside this reorg's scope (spec §2: "no agrega funcionalidad ni cambia" look and feel).
- **`PageHeader` usage is more consistent here than in `comercios`.** In Paso 3, `comercios/nuevo/page.tsx`'s plain `<h1>` had an extra `marginTop: '0.5rem'` (to create space under a "← Volver" back-link) that `PageHeader` doesn't support, so it was left inline — and for consistency, every other simple one-off page title in `comercios` was left inline too, even ones that had no such mismatch. In `miembros`, `nuevo/page.tsx` and `[id]/editar/page.tsx` have **no back link** and their `<h1>` is *only* `{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '1.25rem' }` — an exact match for `PageHeader`'s `h1` default. This plan uses `PageHeader` there. (`comercios`'s already-executed, already-visually-confirmed files are not touched to retrofit this — same render output either way, not worth re-touching validated work.)
- **Password-reveal block: final decision, not extracted.** Paso 3 deferred this (spec §3 footnote): extract to a shared `PasswordReveal` only if the block is textually identical across `comercio-form.tsx`, `miembro-form.tsx`, and `usuario-form.tsx`. Comparing `comercio-form.tsx` (already migrated) against `miembro-form.tsx` here: the success copy differs ("Comercio creado correctamente" vs "Miembro {nombre} registrado", and comercio's paragraph has an extra "podrá cambiarla después" clause), and the first readonly field differs (`Correo` vs `Número de membresía`, the latter monospaced). Not textually identical → **do not extract**. Keep it local to each form, restyled with kit primitives (`Alert`, `Row`, `Button`) same as `comercio-form.tsx`. This closes the decision; the same conclusion applies when `usuarios` is migrated later, no need to re-litigate it there.
- No automated UI tests exist (spec §8) — verification per task is `tsc --noEmit` + `pnpm lint` + `pnpm build`, plus your manual visual check before moving to the next task.
- **Single commit policy:** this whole reorganization lands as one commit at the very end — do not commit after this plan or after any task in it.

---

### Task 1: Migrate `miembros` listing + registration form (and extend `SearchForm`)

**Files:**
- Modify: `src/components/ui/SearchForm.tsx` (add optional `gap`/`marginBottom` props)
- Move: `src/app/admin/miembros/miembro-form.tsx` → `src/app/admin/miembros/_components/miembro-form.tsx`
- Modify: `src/app/admin/miembros/page.tsx`
- Modify: `src/app/admin/miembros/nuevo/page.tsx`

**Interfaces:**
- Consumes: `PageHeader`, `SearchForm`, `DataTable`, `EmptyState`, `Badge`, `LinkButton`, `Field`, `Button`, `Alert`, `Row` from `@/components/ui`.
- Produces: `SearchForm` gains two new optional props, backward compatible — `comercios/page.tsx`'s existing call (`<SearchForm name="q" placeholder="…" defaultValue={busqueda} />`) keeps rendering identically since the new props default to the values it implicitly relied on.
- Produces: `MiembroForm({ ciudades: Opcion[], planes: PlanOpcion[] })` — same export/props, new location.

- [ ] **Step 1: Extend `SearchForm` with optional spacing overrides**

Replace `src/components/ui/SearchForm.tsx` with:

```tsx
export function SearchForm({
  name,
  placeholder,
  defaultValue,
  gap = '0.75rem',
  marginBottom = '1.25rem',
}: {
  name: string
  placeholder: string
  defaultValue?: string
  gap?: string
  marginBottom?: string
}) {
  return (
    <form method="get" className="orum-card" style={{ marginBottom, display: 'flex', gap }}>
      <input type="text" name={name} className="orum-input" placeholder={placeholder} defaultValue={defaultValue} />
      <button type="submit" className="orum-button orum-button--secondary">
        Buscar
      </button>
    </form>
  )
}
```

- [ ] **Step 2: Move `miembro-form.tsx`**

```bash
mkdir -p src/app/admin/miembros/_components
git mv src/app/admin/miembros/miembro-form.tsx src/app/admin/miembros/_components/miembro-form.tsx
```

- [ ] **Step 3: Rewrite the moved file to use the kit**

The action import goes from `./actions` to `../actions` (one level deeper). Replace the full file with:

```tsx
'use client'

import { useActionState, useState } from 'react'
import { registrarMiembro, type RegistrarMiembroState } from '../actions'
import { Alert, Button, Field, LinkButton, Row } from '@/components/ui'

type Opcion = { id: number; nombre: string }
type PlanOpcion = { id: number; nombre: string; precio: number }

const estadoInicial: RegistrarMiembroState = {}

export function MiembroForm({ ciudades, planes }: { ciudades: Opcion[]; planes: PlanOpcion[] }) {
  const [state, formAction, pending] = useActionState(registrarMiembro, estadoInicial)
  const [precio, setPrecio] = useState<string>(planes[0] ? String(planes[0].precio) : '')
  const [copiado, setCopiado] = useState(false)

  if (state.ok && state.numero && state.password) {
    return (
      <div className="orum-card">
        <Alert tone="success">✓ Miembro {state.nombre} registrado.</Alert>
        <p style={{ marginBottom: '0.75rem' }}>
          Entrega estos datos al cliente. La contraseña <strong>no se volverá a mostrar</strong>.
        </p>
        <div className="orum-field">
          <span className="orum-label">Número de membresía</span>
          <input
            className="orum-input"
            readOnly
            value={state.numero}
            style={{ fontFamily: 'var(--font-geist-mono, monospace)' }}
          />
        </div>
        <div className="orum-field">
          <span className="orum-label">Contraseña temporal</span>
          <Row gap="0.5rem">
            <input
              className="orum-input"
              readOnly
              value={state.password}
              style={{ fontFamily: 'var(--font-geist-mono, monospace)' }}
            />
            <Button
              type="button"
              variant="secondary"
              onClick={() => {
                navigator.clipboard?.writeText(state.password ?? '')
                setCopiado(true)
                setTimeout(() => setCopiado(false), 2000)
              }}
            >
              {copiado ? '¡Copiado!' : 'Copiar'}
            </Button>
          </Row>
        </div>
        <Row style={{ marginTop: '1rem' }}>
          <LinkButton href="/admin/miembros">Ir a la lista</LinkButton>
          <LinkButton href="/admin/miembros/nuevo" variant="secondary">Registrar otro</LinkButton>
        </Row>
      </div>
    )
  }

  return (
    <form action={formAction} className="orum-card">
      {state.error && <Alert tone="error">{state.error}</Alert>}

      <Row>
        <Field label="Nombres" htmlFor="nombres" flex>
          <input id="nombres" name="nombres" className="orum-input" required />
        </Field>
        <Field label="Apellidos" htmlFor="apellidos" flex>
          <input id="apellidos" name="apellidos" className="orum-input" required />
        </Field>
      </Row>

      <Field label="Cédula" htmlFor="cedula">
        <input id="cedula" name="cedula" className="orum-input" required />
      </Field>

      <Field label="Correo electrónico" htmlFor="correo">
        <input id="correo" name="correo" type="email" className="orum-input" required />
      </Field>

      <Row>
        <Field label="Teléfono (opcional)" htmlFor="telefono" flex>
          <input id="telefono" name="telefono" className="orum-input" />
        </Field>
        <Field label="Ciudad (opcional)" htmlFor="ciudad_id" flex>
          <select id="ciudad_id" name="ciudad_id" className="orum-select" defaultValue="">
            <option value="">— Sin ciudad —</option>
            {ciudades.map((c) => (
              <option key={c.id} value={c.id}>
                {c.nombre}
              </option>
            ))}
          </select>
        </Field>
      </Row>

      <Field label="Dirección (opcional)" htmlFor="direccion">
        <input id="direccion" name="direccion" className="orum-input" />
      </Field>

      <hr style={{ border: 0, borderTop: '1px solid var(--orum-border)', margin: '1rem 0' }} />

      <Row>
        <Field label="Plan de membresía" htmlFor="plan_id" flex>
          <select
            id="plan_id"
            name="plan_id"
            className="orum-select"
            required
            defaultValue={planes[0]?.id ?? ''}
            onChange={(e) => {
              const p = planes.find((x) => x.id === Number(e.target.value))
              if (p) setPrecio(String(p.precio))
            }}
          >
            {planes.length === 0 && <option value="">— No hay planes activos —</option>}
            {planes.map((p) => (
              <option key={p.id} value={p.id}>
                {p.nombre} (${p.precio.toLocaleString('es-CO')})
              </option>
            ))}
          </select>
        </Field>
        <Field label="Precio pagado" htmlFor="precio_pagado" flex>
          <input
            id="precio_pagado"
            name="precio_pagado"
            type="number"
            min="0"
            step="0.01"
            className="orum-input"
            required
            value={precio}
            onChange={(e) => setPrecio(e.target.value)}
          />
        </Field>
      </Row>

      <p className="orum-muted" style={{ fontSize: '0.85rem', margin: '0.5rem 0 1rem' }}>
        Se generará el número de membresía y una contraseña segura; se mostrarán al terminar.
      </p>

      <Row>
        <Button type="submit" disabled={pending || planes.length === 0}>
          {pending ? 'Registrando…' : 'Registrar miembro'}
        </Button>
        <LinkButton href="/admin/miembros" variant="secondary">Cancelar</LinkButton>
      </Row>
    </form>
  )
}
```

- [ ] **Step 4: Rewrite `src/app/admin/miembros/page.tsx` to use the kit**

Replace the full file with:

```tsx
import { requireRol } from '@/lib/auth/auth'
import { createAdminClient } from '@/lib/supabase/admin'
import { Badge, DataTable, EmptyState, LinkButton, PageHeader, SearchForm } from '@/components/ui'

export const metadata = { title: 'Miembros · ORUM' }

export default async function MiembrosPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>
}) {
  await requireRol('super_admin', 'empleado')
  const { q } = await searchParams
  const busqueda = (q ?? '').trim()

  const admin = createAdminClient()
  let consulta = admin
    .from('miembros')
    .select('id, numero_membresia, nombres, apellidos, cedula')
    .is('deleted_at', null)

  // Quitar caracteres que son estructura del filtro `.or(...)` de PostgREST
  // (comas, paréntesis y comodines) para que una búsqueda con puntuación
  // —p. ej. "Pérez, Juan"— no rompa la consulta.
  const termino = busqueda.replace(/[,()%*\\]/g, ' ').trim()
  if (termino) {
    consulta = consulta.or(
      `numero_membresia.ilike.%${termino}%,cedula.ilike.%${termino}%,nombres.ilike.%${termino}%,apellidos.ilike.%${termino}%`,
    )
  }

  const { data: miembros } = await consulta.order('apellidos').limit(100)

  // Estado de la membresía vigente (activa) por miembro.
  const ids = (miembros ?? []).map((m) => m.id)
  const estadoPorMiembro = new Map<number, string>()
  if (ids.length > 0) {
    const { data: activas } = await admin
      .from('membresias')
      .select('miembro_id, estado')
      .in('miembro_id', ids)
      .eq('estado', 'activa')
    for (const a of activas ?? []) estadoPorMiembro.set(a.miembro_id, a.estado)
  }

  return (
    <div>
      <PageHeader title="Miembros" action={{ href: '/admin/miembros/nuevo', label: '+ Registrar miembro' }} />

      <SearchForm
        name="q"
        placeholder="Buscar por número, cédula o nombre"
        defaultValue={busqueda}
        gap="0.5rem"
        marginBottom="1rem"
      />

      {!miembros || miembros.length === 0 ? (
        <EmptyState>
          {busqueda ? 'No se encontraron miembros con esa búsqueda.' : 'Aún no hay miembros registrados.'}
        </EmptyState>
      ) : (
        <DataTable>
          <thead>
            <tr>
              <th>Número</th>
              <th>Nombre</th>
              <th>Cédula</th>
              <th>Membresía</th>
              <th style={{ textAlign: 'right' }}>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {miembros.map((m) => {
              const vigente = estadoPorMiembro.has(m.id)
              return (
                <tr key={m.id}>
                  <td style={{ fontFamily: 'var(--font-geist-mono, monospace)' }}>{m.numero_membresia}</td>
                  <td>{`${m.nombres} ${m.apellidos}`.trim()}</td>
                  <td className="orum-muted">{m.cedula}</td>
                  <td>
                    <Badge tone={vigente ? 'on' : 'off'}>{vigente ? 'Activa' : 'Sin membresía activa'}</Badge>
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    <LinkButton href={`/admin/miembros/${m.id}`} variant="secondary">
                      Ver ficha
                    </LinkButton>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </DataTable>
      )}
    </div>
  )
}
```

- [ ] **Step 5: Rewrite `src/app/admin/miembros/nuevo/page.tsx`**

Replace the full file with:

```tsx
import { requireRol } from '@/lib/auth/auth'
import { createAdminClient } from '@/lib/supabase/admin'
import { MiembroForm } from '../_components/miembro-form'
import { PageHeader } from '@/components/ui'

export const metadata = { title: 'Registrar miembro · ORUM' }

export default async function NuevoMiembroPage() {
  await requireRol('super_admin', 'empleado')

  const admin = createAdminClient()
  const [{ data: ciudades }, { data: planes }] = await Promise.all([
    admin.from('ciudades').select('id, nombre').order('nombre'),
    admin.from('planes_membresia').select('id, nombre, precio').eq('activo', true).is('deleted_at', null).order('nombre'),
  ])

  return (
    <div>
      <PageHeader title="Registrar miembro" />
      <MiembroForm ciudades={ciudades ?? []} planes={planes ?? []} />
    </div>
  )
}
```

- [ ] **Step 6: Verify**

```bash
pnpm exec tsc --noEmit
pnpm lint
pnpm build
```

- [ ] **Step 7: Manual visual check**

`/admin/miembros` (list, search — check the search bar's tighter spacing is unchanged from before, empty state) and `/admin/miembros/nuevo` (registration form, including the post-submit password-reveal screen).

Do not commit yet — see "Single commit policy" in Global Constraints.

---

### Task 2: Migrate `miembros/[id]/editar`

**Files:**
- Move: `src/app/admin/miembros/[id]/editar/editar-miembro-form.tsx` → `src/app/admin/miembros/[id]/editar/_components/editar-miembro-form.tsx`
- Modify: `src/app/admin/miembros/[id]/editar/page.tsx`

**Interfaces:**
- Consumes: `Alert`, `Button`, `Field`, `LinkButton`, `PageHeader`, `Row` from `@/components/ui`.
- Produces: `EditarMiembroForm({ miembro: MiembroInicial, ciudades: Opcion[] })` — unchanged export/props, new location.

- [ ] **Step 1: Move the form file**

```bash
mkdir -p "src/app/admin/miembros/[id]/editar/_components"
git mv "src/app/admin/miembros/[id]/editar/editar-miembro-form.tsx" "src/app/admin/miembros/[id]/editar/_components/editar-miembro-form.tsx"
```

- [ ] **Step 2: Rewrite the moved file to use the kit**

The action import goes from `../../actions` to `../../../actions` (one level deeper). Replace the full file with:

```tsx
'use client'

import { useActionState } from 'react'
import { editarMiembro, type EditarMiembroState } from '../../../actions'
import { Alert, Button, Field, LinkButton, Row } from '@/components/ui'

type Opcion = { id: number; nombre: string }
type MiembroInicial = {
  id: number
  perfil_id: string | null
  nombres: string
  apellidos: string
  cedula: string
  telefono: string | null
  direccion: string | null
  ciudad_id: number | null
  correo: string
}

const estadoInicial: EditarMiembroState = {}

export function EditarMiembroForm({ miembro, ciudades }: { miembro: MiembroInicial; ciudades: Opcion[] }) {
  const [state, formAction, pending] = useActionState(editarMiembro, estadoInicial)

  return (
    <form action={formAction} className="orum-card">
      {state.error && <Alert tone="error">{state.error}</Alert>}

      <input type="hidden" name="miembro_id" value={miembro.id} />
      <input type="hidden" name="perfil_id" value={miembro.perfil_id ?? ''} />
      <input type="hidden" name="correo_original" value={miembro.correo} />

      <Row>
        <Field label="Nombres" htmlFor="nombres" flex>
          <input id="nombres" name="nombres" className="orum-input" required defaultValue={miembro.nombres} />
        </Field>
        <Field label="Apellidos" htmlFor="apellidos" flex>
          <input id="apellidos" name="apellidos" className="orum-input" required defaultValue={miembro.apellidos} />
        </Field>
      </Row>

      <Field label="Cédula" htmlFor="cedula">
        <input id="cedula" name="cedula" className="orum-input" required defaultValue={miembro.cedula} />
      </Field>

      <Field label="Correo electrónico" htmlFor="correo">
        <input
          id="correo"
          name="correo"
          type="email"
          className="orum-input"
          defaultValue={miembro.correo === '—' ? '' : miembro.correo}
        />
      </Field>

      <Row>
        <Field label="Teléfono (opcional)" htmlFor="telefono" flex>
          <input id="telefono" name="telefono" className="orum-input" defaultValue={miembro.telefono ?? ''} />
        </Field>
        <Field label="Ciudad (opcional)" htmlFor="ciudad_id" flex>
          <select id="ciudad_id" name="ciudad_id" className="orum-select" defaultValue={miembro.ciudad_id ?? ''}>
            <option value="">— Sin ciudad —</option>
            {ciudades.map((c) => (
              <option key={c.id} value={c.id}>
                {c.nombre}
              </option>
            ))}
          </select>
        </Field>
      </Row>

      <Field label="Dirección (opcional)" htmlFor="direccion">
        <input id="direccion" name="direccion" className="orum-input" defaultValue={miembro.direccion ?? ''} />
      </Field>

      <Row>
        <Button type="submit" disabled={pending}>
          {pending ? 'Guardando…' : 'Guardar cambios'}
        </Button>
        <LinkButton href={`/admin/miembros/${miembro.id}`} variant="secondary">Cancelar</LinkButton>
      </Row>
    </form>
  )
}
```

- [ ] **Step 3: Rewrite `src/app/admin/miembros/[id]/editar/page.tsx`**

Replace the full file with:

```tsx
import { notFound } from 'next/navigation'
import { requireRol } from '@/lib/auth/auth'
import { createAdminClient } from '@/lib/supabase/admin'
import { EditarMiembroForm } from './_components/editar-miembro-form'
import { PageHeader } from '@/components/ui'

export const metadata = { title: 'Editar miembro · ORUM' }

export default async function EditarMiembroPage({ params }: { params: Promise<{ id: string }> }) {
  await requireRol('super_admin', 'empleado')
  const { id } = await params
  const miembroId = Number(id)

  const admin = createAdminClient()
  const { data: miembro } = await admin
    .from('miembros')
    .select('id, perfil_id, nombres, apellidos, cedula, telefono, direccion, ciudad_id')
    .eq('id', miembroId)
    .is('deleted_at', null)
    .maybeSingle()
  if (!miembro) notFound()

  const { data: ciudades } = await admin.from('ciudades').select('id, nombre').order('nombre')

  let correo = '—'
  if (miembro.perfil_id) {
    const { data: authUser } = await admin.auth.admin.getUserById(miembro.perfil_id)
    correo = authUser.user?.email ?? '—'
  }

  return (
    <div>
      <PageHeader title="Editar miembro" />
      <EditarMiembroForm miembro={{ ...miembro, correo }} ciudades={ciudades ?? []} />
    </div>
  )
}
```

- [ ] **Step 4: Verify**

```bash
pnpm exec tsc --noEmit
pnpm lint
pnpm build
```

- [ ] **Step 5: Manual visual check**

`/admin/miembros/[id]/editar` for an existing miembro.

Do not commit yet — see "Single commit policy" in Global Constraints.

---

### Task 3: Migrate the miembro ficha (`[id]/page.tsx`) + renewal form

**Files:**
- Move: `src/app/admin/miembros/[id]/renovar-form.tsx` → `src/app/admin/miembros/[id]/_components/renovar-form.tsx`
- Modify: `src/app/admin/miembros/[id]/page.tsx`

**Interfaces:**
- Consumes: `Alert`, `Badge`, `Button`, `DataTable`, `EmptyState`, `Field`, `PageHeader`, `Row` from `@/components/ui`.
- Produces: `RenovarForm({ miembroId: number, planes: PlanOpcion[] })` — unchanged export/props, new location. Used only by this ficha page (single-consumer, hence `[id]/_components/`, not shared further up — per spec §4.1's exact mapping).

- [ ] **Step 1: Move the renewal form**

```bash
mkdir -p "src/app/admin/miembros/[id]/_components"
git mv "src/app/admin/miembros/[id]/renovar-form.tsx" "src/app/admin/miembros/[id]/_components/renovar-form.tsx"
```

- [ ] **Step 2: Rewrite the moved file to use the kit**

The action import goes from `../actions` to `../../actions` (one level deeper). Replace the full file with:

```tsx
'use client'

import { useActionState, useState } from 'react'
import { renovarMembresia, type RenovarState } from '../../actions'
import { Alert, Button, Field, Row } from '@/components/ui'

type PlanOpcion = { id: number; nombre: string; precio: number }

const estadoInicial: RenovarState = {}

export function RenovarForm({ miembroId, planes }: { miembroId: number; planes: PlanOpcion[] }) {
  const [state, formAction, pending] = useActionState(renovarMembresia, estadoInicial)
  const [precio, setPrecio] = useState<string>(planes[0] ? String(planes[0].precio) : '')

  return (
    <form action={formAction} className="orum-card">
      <h2 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '0.75rem' }}>Renovar / nueva membresía</h2>
      {state.error && <Alert tone="error">{state.error}</Alert>}

      <input type="hidden" name="miembro_id" value={miembroId} />

      <Row>
        <Field label="Plan" htmlFor="plan_id" flex>
          <select
            id="plan_id"
            name="plan_id"
            className="orum-select"
            required
            defaultValue={planes[0]?.id ?? ''}
            onChange={(e) => {
              const p = planes.find((x) => x.id === Number(e.target.value))
              if (p) setPrecio(String(p.precio))
            }}
          >
            {planes.length === 0 && <option value="">— No hay planes activos —</option>}
            {planes.map((p) => (
              <option key={p.id} value={p.id}>
                {p.nombre} (${p.precio.toLocaleString('es-CO')})
              </option>
            ))}
          </select>
        </Field>
        <Field label="Precio pagado" htmlFor="precio_pagado" flex>
          <input
            id="precio_pagado"
            name="precio_pagado"
            type="number"
            min="0"
            step="0.01"
            className="orum-input"
            required
            value={precio}
            onChange={(e) => setPrecio(e.target.value)}
          />
        </Field>
      </Row>

      <Button type="submit" disabled={pending || planes.length === 0}>
        {pending ? 'Registrando…' : 'Registrar renovación'}
      </Button>
    </form>
  )
}
```

Note the submit button stays a lone `<Button>` (not wrapped in `Row` with a cancel link) — matches the original, which had no cancel action on this inline card.

- [ ] **Step 3: Rewrite `src/app/admin/miembros/[id]/page.tsx` to use the kit**

Replace the full file with:

```tsx
import { notFound } from 'next/navigation'
import { requireRol } from '@/lib/auth/auth'
import { createAdminClient } from '@/lib/supabase/admin'
import { resumirEventoBitacora } from '@/lib/bitacora/bitacora'
import { RenovarForm } from './_components/renovar-form'
import { Badge, DataTable, EmptyState, PageHeader } from '@/components/ui'

export const metadata = { title: 'Ficha de miembro · ORUM' }

export default async function FichaMiembroPage({ params }: { params: Promise<{ id: string }> }) {
  await requireRol('super_admin', 'empleado')
  const { id } = await params
  const miembroId = Number(id)

  const admin = createAdminClient()
  const { data: miembro } = await admin
    .from('miembros')
    .select('id, numero_membresia, nombres, apellidos, cedula, telefono, direccion, ciudad_id, perfil_id')
    .eq('id', miembroId)
    .is('deleted_at', null)
    .maybeSingle()
  if (!miembro) notFound()

  const [{ data: membresias }, { data: planes }, { data: ciudad }, { data: eventos }] = await Promise.all([
    admin.from('membresias')
      .select('id, tipo, estado, fecha_inicio, fecha_fin, precio_pagado, plan_id')
      .eq('miembro_id', miembroId)
      .order('fecha_inicio', { ascending: false }),
    admin.from('planes_membresia').select('id, nombre, precio').eq('activo', true).is('deleted_at', null).order('nombre'),
    miembro.ciudad_id
      ? admin.from('ciudades').select('nombre').eq('id', miembro.ciudad_id).maybeSingle()
      : Promise.resolve({ data: null }),
    admin.from('bitacora_actividad')
      .select('id, actor_id, accion, datos_anteriores, datos_nuevos, fecha_hora')
      .eq('entidad', 'miembro')
      .eq('entidad_id', miembroId)
      .order('fecha_hora', { ascending: false }),
  ])

  const nombrePlan = new Map((planes ?? []).map((p) => [p.id, p.nombre]))

  const actorIds = Array.from(
    new Set((eventos ?? []).map((e) => e.actor_id).filter((idActor): idActor is string => !!idActor)),
  )
  const correoActor = new Map<string, string>()
  await Promise.all(
    actorIds.map(async (idActor) => {
      const { data } = await admin.auth.admin.getUserById(idActor)
      correoActor.set(idActor, data.user?.email ?? '—')
    }),
  )

  // Correo de Auth (informativo), como en la gestión de usuarios.
  let correo = '—'
  if (miembro.perfil_id) {
    const { data: authUser } = await admin.auth.admin.getUserById(miembro.perfil_id)
    correo = authUser.user?.email ?? '—'
  }

  return (
    <div>
      <PageHeader
        title={`${miembro.nombres} ${miembro.apellidos}`.trim()}
        action={{ href: `/admin/miembros/${miembro.id}/editar`, label: 'Editar datos', variant: 'secondary' }}
      />

      <div className="orum-card" style={{ marginBottom: '1.25rem' }}>
        <p><strong>Número de membresía:</strong> <span style={{ fontFamily: 'var(--font-geist-mono, monospace)' }}>{miembro.numero_membresia}</span></p>
        <p><strong>Cédula:</strong> {miembro.cedula}</p>
        <p><strong>Correo:</strong> {correo}</p>
        <p><strong>Teléfono:</strong> {miembro.telefono ?? '—'}</p>
        <p><strong>Dirección:</strong> {miembro.direccion ?? '—'}</p>
        <p><strong>Ciudad:</strong> {ciudad?.nombre ?? '—'}</p>
      </div>

      <PageHeader as="h2" title="Historial de membresías" />
      {!membresias || membresias.length === 0 ? (
        <EmptyState marginBottom="1.25rem">Este miembro no tiene membresías registradas.</EmptyState>
      ) : (
        <DataTable marginBottom="1.25rem">
          <thead>
            <tr><th>Plan</th><th>Tipo</th><th>Estado</th><th>Inicio</th><th>Fin</th><th>Precio</th></tr>
          </thead>
          <tbody>
            {membresias.map((m) => (
              <tr key={m.id}>
                <td>{nombrePlan.get(m.plan_id) ?? `Plan #${m.plan_id}`}</td>
                <td>{m.tipo}</td>
                <td>
                  <Badge tone={m.estado === 'activa' ? 'on' : 'off'}>{m.estado}</Badge>
                </td>
                <td>{m.fecha_inicio}</td>
                <td>{m.fecha_fin}</td>
                <td>${m.precio_pagado.toLocaleString('es-CO')}</td>
              </tr>
            ))}
          </tbody>
        </DataTable>
      )}

      <PageHeader as="h2" title="Historial de actividad" />
      {!eventos || eventos.length === 0 ? (
        <EmptyState marginBottom="1.25rem">Aún no hay eventos registrados para este miembro.</EmptyState>
      ) : (
        <DataTable marginBottom="1.25rem">
          <thead>
            <tr><th>Fecha</th><th>Acción</th><th>Detalle</th><th>Registrado por</th></tr>
          </thead>
          <tbody>
            {eventos.map((e) => (
              <tr key={e.id}>
                <td>{new Date(e.fecha_hora).toLocaleString('es-CO', { timeZone: 'America/Bogota' })}</td>
                <td><Badge tone="on">{e.accion}</Badge></td>
                <td>{resumirEventoBitacora(e.accion, e.datos_anteriores, e.datos_nuevos)}</td>
                <td className="orum-muted">{e.actor_id ? (correoActor.get(e.actor_id) ?? '—') : '—'}</td>
              </tr>
            ))}
          </tbody>
        </DataTable>
      )}

      <RenovarForm miembroId={miembro.id} planes={planes ?? []} />
    </div>
  )
}
```

Note this drops the `import Link from 'next/link'` line — the header's "Editar datos" link is now `PageHeader`'s `action` prop.

- [ ] **Step 4: Verify**

```bash
pnpm exec tsc --noEmit
pnpm lint
pnpm build
```

- [ ] **Step 5: Manual visual check**

`/admin/miembros/[id]` for a miembro with membership + activity history, and for a freshly-registered one with neither (to see both `EmptyState`s) — including the "Registrar renovación" form at the bottom.

Do not commit yet — see "Single commit policy" in Global Constraints.

---

## Acceptance check (maps to spec §10, miembros-module slice)

- [ ] `miembro-form.tsx`, `editar-miembro-form.tsx`, `renovar-form.tsx` all live under the correct `_components/` folder per spec §4.1, with updated imports.
- [ ] No `page.tsx`, `layout.tsx`, or `actions.ts` in `miembros/**` changed location or public route.
- [ ] `tsc --noEmit`, `pnpm lint`, and `pnpm build` pass clean after every task.
- [ ] User has visually confirmed every migrated `miembros` page looks and functions identically to before, including the intentionally-preserved tighter search-bar spacing.

## Next steps

Plans for `planes`/`usuarios`/`cuenta` (spec §7 step 5), `bitacora`/`metricas` (step 6), and `admin/layout.tsx` (step 7) are not written yet — write them next, in that order.
