# Reorganización — Paso 3: Kit de UI + módulo comercios — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build `src/components/ui/` (thin wrappers over the existing `orum-*` CSS classes, zero visual change) and use it to migrate the `comercios` module — the reference module per spec §7 step 3 — including moving its form components into `_components/` folders per the routing convention (spec §4).

**Architecture:** New shared component kit under `src/components/ui/`, each component a thin wrapper over one repeated JSX pattern already present in the admin UI (see spec `docs/superpowers/specs/2026-08-05-reorganizacion-proyecto-design.md` §3). `comercios` is migrated first, both because it has the widest variety of patterns (listing, create form, ficha with sub-resources, nested edit forms) and because the spec's own risk mitigation (§9) calls for validating the kit against one real module before generalizing to `miembros`, `planes`, `usuarios`, `cuenta`, `bitacora`, `metricas` in later plans.

**Tech Stack:** Next.js 15 (App Router, Server Components + `'use client'` forms with `useActionState`), TypeScript, React 19, pnpm.

## Global Constraints

- **Zero visual/behavioral change.** Every kit component must render markup and classes identical to what it replaces — same `orum-*` classes, same inline styles, same DOM structure where it matters for CSS (e.g. `orum-card` wrapping a `table`). This is a refactor, not a redesign.
- Depends on Paso 2 (`docs/superpowers/plans/2026-08-07-reorg-02-lib-por-dominio.md`) already being applied — this plan's code samples import `@/lib/auth/auth`, `@/lib/supabase/admin`, etc. from their post-Paso-2 locations. If Paso 2 hasn't run yet, do it first.
- URLs do not change. No `page.tsx`, `layout.tsx`, or `actions.ts` changes location — only `*-form.tsx` files move into `_components/`, per spec §4.
- Only genuinely repeated patterns become kit components (spec §3's table). Simple one-off page titles (plain `<h1>` with no action button, e.g. on `nuevo`/`editar` pages) are explicitly **left inline** — routing them through `PageHeader` would require faking its margin/flex behavior for a case it wasn't designed for (see Task 2 note). This mirrors spec §9's guidance: "si un patrón no encaja limpio en un componente genérico, se deja local en vez de forzarlo."
- The password-reveal block in `comercio-form.tsx` is restyled with kit primitives (`Alert`, `Button`, `Row`) but **not** extracted into a shared `PasswordReveal` component yet — that decision (spec §3) requires comparing it against `usuario-form.tsx` and `miembro-form.tsx`, which are migrated in later plans. Revisit then.
- No automated UI tests exist in this repo (spec §8) — verification per task is `tsc --noEmit` + `pnpm lint` + `pnpm build`, plus a manual visual check by the user in the browser before moving to the next task.
- **Single commit policy:** this whole reorganization lands as one commit at the very end — do not commit after this plan or after any task in it. Leave changes staged/unstaged in the working tree.

---

### Task 1: Build the UI kit (`src/components/ui/`)

**Files:**
- Create: `src/components/ui/PageHeader.tsx`
- Create: `src/components/ui/Field.tsx`
- Create: `src/components/ui/Button.tsx`
- Create: `src/components/ui/EmptyState.tsx`
- Create: `src/components/ui/Badge.tsx`
- Create: `src/components/ui/SearchForm.tsx`
- Create: `src/components/ui/DataTable.tsx`
- Create: `src/components/ui/Layout.tsx`
- Create: `src/components/ui/Alert.tsx`
- Create: `src/components/ui/index.ts`

**Interfaces:**
- Produces (consumed by every later task in this plan, and by the later per-module plans):
  - `PageHeader({ title: string, action？: { href: string, label: string, variant?: 'primary'|'secondary' }, as?: 'h1'|'h2' })`
  - `Field({ label: string, htmlFor: string, children: ReactNode, flex?: boolean })`
  - `Button(props: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: 'primary'|'secondary'|'danger' })`
  - `LinkButton(props: ComponentProps<typeof Link> & { variant?: 'primary'|'secondary'|'danger' })`
  - `EmptyState({ children: ReactNode, marginBottom?: string })`
  - `Badge({ tone: 'on'|'off', children: ReactNode })`
  - `SearchForm({ name: string, placeholder: string, defaultValue?: string })`
  - `DataTable({ children: ReactNode, marginBottom?: string })` — `children` is the caller-built `<thead>`/`<tbody>`
  - `Row({ children: ReactNode, gap?: string, style?: CSSProperties })`
  - `Stack({ children: ReactNode, gap?: string, style?: CSSProperties })`
  - `Alert({ tone: 'error'|'success', children: ReactNode })`
  - All re-exported from `src/components/ui/index.ts` so callers can `import { PageHeader, DataTable } from '@/components/ui'`.

- [ ] **Step 1: Create `src/components/ui/PageHeader.tsx`**

```tsx
import Link from 'next/link'

type PageHeaderAction = {
  href: string
  label: string
  variant?: 'primary' | 'secondary'
}

export function PageHeader({
  title,
  action,
  as = 'h1',
}: {
  title: string
  action?: PageHeaderAction
  as?: 'h1' | 'h2'
}) {
  const Heading = as
  const isSub = as === 'h2'

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: isSub ? '0.75rem' : '1.25rem',
      }}
    >
      <Heading style={{ fontSize: isSub ? '1.2rem' : '1.5rem', fontWeight: 700 }}>{title}</Heading>
      {action && (
        <Link
          href={action.href}
          className={action.variant === 'secondary' ? 'orum-button orum-button--secondary' : 'orum-button'}
        >
          {action.label}
        </Link>
      )}
    </div>
  )
}
```

- [ ] **Step 2: Create `src/components/ui/Field.tsx`**

```tsx
import type { ReactNode } from 'react'

export function Field({
  label,
  htmlFor,
  children,
  flex,
}: {
  label: string
  htmlFor: string
  children: ReactNode
  flex?: boolean
}) {
  return (
    <div className="orum-field" style={{ flex: flex ? 1 : undefined }}>
      <label className="orum-label" htmlFor={htmlFor}>
        {label}
      </label>
      {children}
    </div>
  )
}
```

- [ ] **Step 3: Create `src/components/ui/Button.tsx`**

```tsx
import Link, { type LinkProps } from 'next/link'
import type { AnchorHTMLAttributes, ButtonHTMLAttributes } from 'react'

type Variant = 'primary' | 'secondary' | 'danger'

function variantClass(variant: Variant) {
  return variant === 'primary' ? 'orum-button' : `orum-button orum-button--${variant}`
}

export function Button({
  variant = 'primary',
  className,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant }) {
  return <button className={[variantClass(variant), className].filter(Boolean).join(' ')} {...props} />
}

export function LinkButton({
  variant = 'primary',
  className,
  ...props
}: LinkProps & Omit<AnchorHTMLAttributes<HTMLAnchorElement>, keyof LinkProps> & { variant?: Variant }) {
  return <Link className={[variantClass(variant), className].filter(Boolean).join(' ')} {...props} />
}
```

- [ ] **Step 4: Create `src/components/ui/EmptyState.tsx`**

```tsx
import type { ReactNode } from 'react'

export function EmptyState({
  children,
  marginBottom,
}: {
  children: ReactNode
  marginBottom?: string
}) {
  return (
    <div className="orum-card" style={{ marginBottom }}>
      <p className="orum-muted">{children}</p>
    </div>
  )
}
```

- [ ] **Step 5: Create `src/components/ui/Badge.tsx`**

```tsx
import type { ReactNode } from 'react'

export function Badge({ tone, children }: { tone: 'on' | 'off'; children: ReactNode }) {
  return <span className={`orum-badge orum-badge--${tone}`}>{children}</span>
}
```

- [ ] **Step 6: Create `src/components/ui/SearchForm.tsx`**

```tsx
export function SearchForm({
  name,
  placeholder,
  defaultValue,
}: {
  name: string
  placeholder: string
  defaultValue?: string
}) {
  return (
    <form method="get" className="orum-card" style={{ marginBottom: '1.25rem', display: 'flex', gap: '0.75rem' }}>
      <input type="text" name={name} className="orum-input" placeholder={placeholder} defaultValue={defaultValue} />
      <button type="submit" className="orum-button orum-button--secondary">
        Buscar
      </button>
    </form>
  )
}
```

- [ ] **Step 7: Create `src/components/ui/DataTable.tsx`**

```tsx
import type { ReactNode } from 'react'

export function DataTable({
  children,
  marginBottom,
}: {
  children: ReactNode
  marginBottom?: string
}) {
  return (
    <div className="orum-card" style={{ overflowX: 'auto', padding: 0, marginBottom }}>
      <table className="orum-table">{children}</table>
    </div>
  )
}
```

- [ ] **Step 8: Create `src/components/ui/Layout.tsx`**

```tsx
import type { CSSProperties, ReactNode } from 'react'

type LayoutProps = {
  children: ReactNode
  gap?: string
  style?: CSSProperties
}

export function Row({ children, gap = '0.75rem', style }: LayoutProps) {
  return <div style={{ display: 'flex', gap, ...style }}>{children}</div>
}

export function Stack({ children, gap = '0.75rem', style }: LayoutProps) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap, ...style }}>
      {children}
    </div>
  )
}
```

- [ ] **Step 9: Create `src/components/ui/Alert.tsx`**

```tsx
import type { ReactNode } from 'react'

export function Alert({ tone, children }: { tone: 'error' | 'success'; children: ReactNode }) {
  return (
    <p className={`orum-alert orum-alert--${tone}`} role={tone === 'error' ? 'alert' : undefined}>
      {children}
    </p>
  )
}
```

- [ ] **Step 10: Create the barrel export `src/components/ui/index.ts`**

```typescript
export { PageHeader } from './PageHeader'
export { Field } from './Field'
export { Button, LinkButton } from './Button'
export { EmptyState } from './EmptyState'
export { Badge } from './Badge'
export { SearchForm } from './SearchForm'
export { DataTable } from './DataTable'
export { Row, Stack } from './Layout'
export { Alert } from './Alert'
```

- [ ] **Step 11: Verify**

```bash
pnpm exec tsc --noEmit
pnpm lint
```

Expected: both clean. Nothing imports these components yet, so this only checks the kit's own internal type correctness.

Do not commit yet — see "Single commit policy" in Global Constraints.

---

### Task 2: Migrate `comercios` listing + create form

**Files:**
- Move: `src/app/admin/comercios/comercio-form.tsx` → `src/app/admin/comercios/_components/comercio-form.tsx`
- Modify: `src/app/admin/comercios/page.tsx`
- Modify: `src/app/admin/comercios/nuevo/page.tsx`

**Interfaces:**
- Consumes: kit components from Task 1 (`PageHeader`, `SearchForm`, `DataTable`, `EmptyState`, `Badge`, `LinkButton`, `Field`, `Button`, `Alert`, `Row`).
- Produces: `ComercioForm({ marcas: Opcion[], categorias: Opcion[] })` — same export name and props as before, just a new file location and import path for consumers.

- [ ] **Step 1: Move the form file**

```bash
mkdir -p src/app/admin/comercios/_components
git mv src/app/admin/comercios/comercio-form.tsx src/app/admin/comercios/_components/comercio-form.tsx
```

- [ ] **Step 2: Rewrite `src/app/admin/comercios/_components/comercio-form.tsx` to use the kit**

The action import goes from `./actions` to `../actions` (file is now one level deeper). Replace the full file with:

```tsx
'use client'

import { useActionState, useState } from 'react'
import { crearComercio, type CrearComercioState } from '../actions'
import { Alert, Button, Field, LinkButton, Row } from '@/components/ui'

type Opcion = { id: number; nombre: string }

const estadoInicial: CrearComercioState = {}

export function ComercioForm({ marcas, categorias }: { marcas: Opcion[]; categorias: Opcion[] }) {
  const [state, formAction, pending] = useActionState(crearComercio, estadoInicial)
  const [copiado, setCopiado] = useState(false)

  if (state.ok && state.password) {
    return (
      <div className="orum-card">
        <Alert tone="success">✓ Comercio creado correctamente.</Alert>
        <p style={{ marginBottom: '0.75rem' }}>
          Comparte estos datos con el comercio. La contraseña <strong>no se volverá a mostrar</strong>;
          podrá cambiarla después.
        </p>
        <div className="orum-field">
          <span className="orum-label">Correo</span>
          <input className="orum-input" readOnly value={state.email} />
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
          <LinkButton href="/admin/comercios">Ir a la lista</LinkButton>
          <LinkButton href="/admin/comercios/nuevo" variant="secondary">Crear otro</LinkButton>
        </Row>
      </div>
    )
  }

  return (
    <form action={formAction} className="orum-card">
      {state.error && <Alert tone="error">{state.error}</Alert>}

      <Field label="Correo electrónico (para iniciar sesión)" htmlFor="correo">
        <input id="correo" name="correo" type="email" className="orum-input" required />
      </Field>

      <Field label="Nombre del comercio" htmlFor="nombre">
        <input id="nombre" name="nombre" className="orum-input" required />
      </Field>

      <Field label="Descripción (opcional)" htmlFor="descripcion">
        <input id="descripcion" name="descripcion" className="orum-input" />
      </Field>

      <Row>
        <Field label="Marca (opcional)" htmlFor="marca_id" flex>
          <select id="marca_id" name="marca_id" className="orum-select" defaultValue="">
            <option value="">— Sin marca —</option>
            {marcas.map((m) => (
              <option key={m.id} value={m.id}>
                {m.nombre}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Categoría (opcional)" htmlFor="categoria_id" flex>
          <select id="categoria_id" name="categoria_id" className="orum-select" defaultValue="">
            <option value="">— Sin categoría —</option>
            {categorias.map((c) => (
              <option key={c.id} value={c.id}>
                {c.nombre}
              </option>
            ))}
          </select>
        </Field>
      </Row>

      <Field label="URL del logo (opcional)" htmlFor="logo_url">
        <input id="logo_url" name="logo_url" className="orum-input" placeholder="https://…" />
      </Field>

      <p className="orum-muted" style={{ fontSize: '0.85rem', marginBottom: '1rem' }}>
        El sistema generará una contraseña segura automáticamente y te la mostrará al terminar.
      </p>

      <Row>
        <Button type="submit" disabled={pending}>
          {pending ? 'Creando…' : 'Crear comercio'}
        </Button>
        <LinkButton href="/admin/comercios" variant="secondary">Cancelar</LinkButton>
      </Row>
    </form>
  )
}
```

- [ ] **Step 3: Rewrite `src/app/admin/comercios/page.tsx` to use the kit**

Replace the full file with:

```tsx
import { requireRol } from '@/lib/auth/auth'
import { createAdminClient } from '@/lib/supabase/admin'
import { Badge, DataTable, EmptyState, LinkButton, PageHeader, SearchForm } from '@/components/ui'

export const metadata = { title: 'Comercios · ORUM' }

export default async function ComerciosPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>
}) {
  await requireRol('super_admin')
  const { q } = await searchParams
  const busqueda = (q ?? '').trim()

  const admin = createAdminClient()
  let query = admin
    .from('comercios')
    .select('id, nombre, descripcion, activo')
    .is('deleted_at', null)
    .order('nombre')
  if (busqueda) query = query.ilike('nombre', `%${busqueda}%`)
  const { data: comercios } = await query

  return (
    <div>
      <PageHeader title="Comercios" action={{ href: '/admin/comercios/nuevo', label: '+ Crear comercio' }} />

      <SearchForm name="q" placeholder="Buscar por nombre…" defaultValue={busqueda} />

      {!comercios || comercios.length === 0 ? (
        <EmptyState>
          {busqueda ? 'Ningún comercio coincide con la búsqueda.' : 'Aún no hay comercios. Crea el primero.'}
        </EmptyState>
      ) : (
        <DataTable>
          <thead>
            <tr>
              <th>Nombre</th>
              <th>Descripción</th>
              <th>Estado</th>
              <th style={{ textAlign: 'right' }}>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {comercios.map((c) => (
              <tr key={c.id}>
                <td>{c.nombre}</td>
                <td className="orum-muted">{c.descripcion ?? '—'}</td>
                <td>
                  <Badge tone={c.activo ? 'on' : 'off'}>{c.activo ? 'Activo' : 'Inactivo'}</Badge>
                </td>
                <td style={{ textAlign: 'right' }}>
                  <LinkButton href={`/admin/comercios/${c.id}`} variant="secondary">
                    Ver ficha
                  </LinkButton>
                </td>
              </tr>
            ))}
          </tbody>
        </DataTable>
      )}
    </div>
  )
}
```

Note this drops the `import Link from 'next/link'` line entirely — `LinkButton` replaces the only `Link` usage in this file.

- [ ] **Step 4: Update the form import in `src/app/admin/comercios/nuevo/page.tsx`**

This page keeps its plain `<h1>` (no action button, so it doesn't fit `PageHeader`'s listing/section pattern — see Global Constraints). Only the form import changes. Change:

```tsx
import { ComercioForm } from '../comercio-form'
```

to:

```tsx
import { ComercioForm } from '../_components/comercio-form'
```

The rest of the file (the `requireRol`, `createAdminClient`, the back link, the `<h1>`, the `<ComercioForm ... />` call) stays exactly as-is.

- [ ] **Step 5: Verify**

```bash
pnpm exec tsc --noEmit
pnpm lint
pnpm build
```

Expected: all clean. A stale import (e.g. forgetting to update `nuevo/page.tsx`) shows up in `tsc` as "Cannot find module './comercio-form'".

- [ ] **Step 6: Manual visual check**

In the browser: `/admin/comercios` (list, search, empty state if you clear all results) and `/admin/comercios/nuevo` (create form, including the post-submit password-reveal screen) must look and behave identically to before this task.

Do not commit yet — see "Single commit policy" in Global Constraints.

---

### Task 3: Migrate `comercios/[id]/editar`

**Files:**
- Move: `src/app/admin/comercios/[id]/editar/editar-comercio-form.tsx` → `src/app/admin/comercios/[id]/editar/_components/editar-comercio-form.tsx`
- Modify: `src/app/admin/comercios/[id]/editar/page.tsx`

**Interfaces:**
- Consumes: `Alert`, `Button`, `Field`, `LinkButton`, `Row` from `@/components/ui`.
- Produces: `EditarComercioForm({ comercio: ComercioInicial, marcas: Opcion[], categorias: Opcion[] })` — unchanged export name/props, new location.

- [ ] **Step 1: Move the form file**

```bash
mkdir -p "src/app/admin/comercios/[id]/editar/_components"
git mv "src/app/admin/comercios/[id]/editar/editar-comercio-form.tsx" "src/app/admin/comercios/[id]/editar/_components/editar-comercio-form.tsx"
```

- [ ] **Step 2: Rewrite the moved file to use the kit**

The action import goes from `../../actions` to `../../../actions` (one level deeper). Replace the full file with:

```tsx
'use client'

import { useActionState } from 'react'
import { editarComercio, type EditarComercioState } from '../../../actions'
import { Alert, Button, Field, LinkButton, Row } from '@/components/ui'

type Opcion = { id: number; nombre: string }
type ComercioInicial = {
  id: number
  perfil_id: string | null
  nombre: string
  descripcion: string | null
  marca_id: number | null
  categoria_id: number | null
  logo_url: string | null
  correo: string
}

const estadoInicial: EditarComercioState = {}

export function EditarComercioForm({
  comercio,
  marcas,
  categorias,
}: {
  comercio: ComercioInicial
  marcas: Opcion[]
  categorias: Opcion[]
}) {
  const [state, formAction, pending] = useActionState(editarComercio, estadoInicial)

  return (
    <form action={formAction} className="orum-card">
      {state.error && <Alert tone="error">{state.error}</Alert>}

      <input type="hidden" name="id" value={comercio.id} />
      <input type="hidden" name="perfil_id" value={comercio.perfil_id ?? ''} />
      <input type="hidden" name="correo_original" value={comercio.correo} />

      <Field label="Correo electrónico" htmlFor="correo">
        <input
          id="correo"
          name="correo"
          type="email"
          className="orum-input"
          defaultValue={comercio.correo === '—' ? '' : comercio.correo}
        />
      </Field>

      <Field label="Nombre" htmlFor="nombre">
        <input id="nombre" name="nombre" className="orum-input" required defaultValue={comercio.nombre} />
      </Field>

      <Field label="Descripción (opcional)" htmlFor="descripcion">
        <input id="descripcion" name="descripcion" className="orum-input" defaultValue={comercio.descripcion ?? ''} />
      </Field>

      <Row>
        <Field label="Marca (opcional)" htmlFor="marca_id" flex>
          <select id="marca_id" name="marca_id" className="orum-select" defaultValue={comercio.marca_id ?? ''}>
            <option value="">— Sin marca —</option>
            {marcas.map((m) => (
              <option key={m.id} value={m.id}>
                {m.nombre}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Categoría (opcional)" htmlFor="categoria_id" flex>
          <select id="categoria_id" name="categoria_id" className="orum-select" defaultValue={comercio.categoria_id ?? ''}>
            <option value="">— Sin categoría —</option>
            {categorias.map((c) => (
              <option key={c.id} value={c.id}>
                {c.nombre}
              </option>
            ))}
          </select>
        </Field>
      </Row>

      <Field label="URL del logo (opcional)" htmlFor="logo_url">
        <input id="logo_url" name="logo_url" className="orum-input" defaultValue={comercio.logo_url ?? ''} placeholder="https://…" />
      </Field>

      <Row style={{ marginTop: '0.5rem' }}>
        <Button type="submit" disabled={pending}>
          {pending ? 'Guardando…' : 'Guardar cambios'}
        </Button>
        <LinkButton href={`/admin/comercios/${comercio.id}`} variant="secondary">Cancelar</LinkButton>
      </Row>
    </form>
  )
}
```

- [ ] **Step 3: Update the import in `src/app/admin/comercios/[id]/editar/page.tsx`**

Change:

```tsx
import { EditarComercioForm } from './editar-comercio-form'
```

to:

```tsx
import { EditarComercioForm } from './_components/editar-comercio-form'
```

Nothing else in this file changes (its `<h1>` is a plain, action-less title — left inline per Global Constraints).

- [ ] **Step 4: Verify**

```bash
pnpm exec tsc --noEmit
pnpm lint
pnpm build
```

- [ ] **Step 5: Manual visual check**

`/admin/comercios/[id]/editar` for an existing comercio — form must look and submit identically to before.

Do not commit yet — see "Single commit policy" in Global Constraints.

---

### Task 4: Migrate `comercios/[id]/sucursales`

**Files:**
- Move: `src/app/admin/comercios/[id]/sucursales/sucursal-form.tsx` → `src/app/admin/comercios/[id]/sucursales/_components/sucursal-form.tsx`
- Modify: `src/app/admin/comercios/[id]/sucursales/nueva/page.tsx`
- Modify: `src/app/admin/comercios/[id]/sucursales/[sucursalId]/editar/page.tsx`

**Interfaces:**
- Consumes: `Alert`, `Button`, `Field`, `LinkButton`, `Row` from `@/components/ui`.
- Produces: `SucursalForm({ comercioId: number, ciudades: Opcion[], sucursal?: SucursalInicial })` — unchanged export name/props, new location, shared by both `nueva/` and `[sucursalId]/editar/` (this is the "shared by several sibling subroutes" case from spec §4, so it lives in `sucursales/_components/`, not nested deeper).

- [ ] **Step 1: Move the form file**

```bash
mkdir -p "src/app/admin/comercios/[id]/sucursales/_components"
git mv "src/app/admin/comercios/[id]/sucursales/sucursal-form.tsx" "src/app/admin/comercios/[id]/sucursales/_components/sucursal-form.tsx"
```

- [ ] **Step 2: Rewrite the moved file to use the kit**

The action import goes from `../../sucursales-actions` to `../../../sucursales-actions` (one level deeper). Replace the full file with:

```tsx
'use client'

import { useActionState } from 'react'
import { crearSucursal, editarSucursal, type SucursalState } from '../../../sucursales-actions'
import { Alert, Button, Field, LinkButton, Row } from '@/components/ui'

type Opcion = { id: number; nombre: string }
type SucursalInicial = {
  id: number
  nombre: string
  direccion: string | null
  telefono: string | null
  ciudad_id: number | null
}

const estadoInicial: SucursalState = {}

export function SucursalForm({
  comercioId,
  ciudades,
  sucursal,
}: {
  comercioId: number
  ciudades: Opcion[]
  sucursal?: SucursalInicial
}) {
  const accion = sucursal ? editarSucursal : crearSucursal
  const [state, formAction, pending] = useActionState(accion, estadoInicial)

  return (
    <form action={formAction} className="orum-card">
      {state.error && <Alert tone="error">{state.error}</Alert>}

      <input type="hidden" name="comercio_id" value={comercioId} />
      {sucursal && <input type="hidden" name="id" value={sucursal.id} />}

      <Field label="Nombre" htmlFor="nombre">
        <input id="nombre" name="nombre" className="orum-input" required defaultValue={sucursal?.nombre} />
      </Field>

      <Field label="Dirección (opcional)" htmlFor="direccion">
        <input id="direccion" name="direccion" className="orum-input" defaultValue={sucursal?.direccion ?? ''} />
      </Field>

      <Row>
        <Field label="Teléfono (opcional)" htmlFor="telefono" flex>
          <input id="telefono" name="telefono" className="orum-input" defaultValue={sucursal?.telefono ?? ''} />
        </Field>
        <Field label="Ciudad" htmlFor="ciudad_id" flex>
          <select
            id="ciudad_id"
            name="ciudad_id"
            className="orum-select"
            required
            defaultValue={sucursal?.ciudad_id ?? ''}
          >
            <option value="">— Selecciona una ciudad —</option>
            {ciudades.map((c) => (
              <option key={c.id} value={c.id}>
                {c.nombre}
              </option>
            ))}
          </select>
        </Field>
      </Row>

      <Row style={{ marginTop: '0.5rem' }}>
        <Button type="submit" disabled={pending}>
          {pending ? 'Guardando…' : sucursal ? 'Guardar cambios' : 'Crear sucursal'}
        </Button>
        <LinkButton href={`/admin/comercios/${comercioId}`} variant="secondary">Cancelar</LinkButton>
      </Row>
    </form>
  )
}
```

- [ ] **Step 3: Update the import in `src/app/admin/comercios/[id]/sucursales/nueva/page.tsx`**

Change:

```tsx
import { SucursalForm } from '../sucursal-form'
```

to:

```tsx
import { SucursalForm } from '../_components/sucursal-form'
```

- [ ] **Step 4: Update the import in `src/app/admin/comercios/[id]/sucursales/[sucursalId]/editar/page.tsx`**

Change:

```tsx
import { SucursalForm } from '../../sucursal-form'
```

to:

```tsx
import { SucursalForm } from '../../_components/sucursal-form'
```

- [ ] **Step 5: Verify**

```bash
pnpm exec tsc --noEmit
pnpm lint
pnpm build
```

- [ ] **Step 6: Manual visual check**

`/admin/comercios/[id]/sucursales/nueva` and `/admin/comercios/[id]/sucursales/[sucursalId]/editar` for an existing comercio — both forms must look and submit identically to before.

Do not commit yet — see "Single commit policy" in Global Constraints.

---

### Task 5: Migrate `comercios/[id]/promociones`

**Files:**
- Move: `src/app/admin/comercios/[id]/promociones/promocion-form.tsx` → `src/app/admin/comercios/[id]/promociones/_components/promocion-form.tsx`
- Modify: `src/app/admin/comercios/[id]/promociones/nueva/page.tsx`
- Modify: `src/app/admin/comercios/[id]/promociones/[promoId]/editar/page.tsx`

**Interfaces:**
- Consumes: `Alert`, `Button`, `Field`, `LinkButton`, `Row` from `@/components/ui`.
- Produces: `PromocionForm({ comercioId: number, tipos: TipoOpcion[], promocion?: PromocionInicial })` — unchanged export name/props, new location, shared by `nueva/` and `[promoId]/editar/`.

- [ ] **Step 1: Move the form file**

```bash
mkdir -p "src/app/admin/comercios/[id]/promociones/_components"
git mv "src/app/admin/comercios/[id]/promociones/promocion-form.tsx" "src/app/admin/comercios/[id]/promociones/_components/promocion-form.tsx"
```

- [ ] **Step 2: Rewrite the moved file to use the kit**

The action import goes from `../../promociones-actions` to `../../../promociones-actions` (one level deeper). Replace the full file with:

```tsx
'use client'

import { useActionState, useState } from 'react'
import { crearPromocion, editarPromocion, type PromocionState } from '../../../promociones-actions'
import { Alert, Button, Field, LinkButton, Row } from '@/components/ui'

type TipoOpcion = { id: number; codigo: string; nombre: string }
type PromocionInicial = {
  id: number
  titulo: string
  descripcion: string | null
  tipo_beneficio_id: number
  valor: number | null
  fecha_inicio: string | null
  fecha_fin: string | null
}

const estadoInicial: PromocionState = {}
const TIPOS_SIN_VALOR = new Set(['dos_por_uno', 'regalo'])

export function PromocionForm({
  comercioId,
  tipos,
  promocion,
}: {
  comercioId: number
  tipos: TipoOpcion[]
  promocion?: PromocionInicial
}) {
  const accion = promocion ? editarPromocion : crearPromocion
  const [state, formAction, pending] = useActionState(accion, estadoInicial)
  const [tipoId, setTipoId] = useState<string>(String(promocion?.tipo_beneficio_id ?? tipos[0]?.id ?? ''))
  const tipoSeleccionado = tipos.find((t) => String(t.id) === tipoId)
  const requiereValor = tipoSeleccionado ? !TIPOS_SIN_VALOR.has(tipoSeleccionado.codigo) : true

  return (
    <form action={formAction} className="orum-card">
      {state.error && <Alert tone="error">{state.error}</Alert>}

      <input type="hidden" name="comercio_id" value={comercioId} />
      {promocion && <input type="hidden" name="id" value={promocion.id} />}

      <Field label="Título" htmlFor="titulo">
        <input id="titulo" name="titulo" className="orum-input" required defaultValue={promocion?.titulo} />
      </Field>

      <Field label="Descripción (opcional)" htmlFor="descripcion">
        <input id="descripcion" name="descripcion" className="orum-input" defaultValue={promocion?.descripcion ?? ''} />
      </Field>

      <Field label="Tipo de beneficio" htmlFor="tipo_beneficio_id">
        <select
          id="tipo_beneficio_id"
          name="tipo_beneficio_id"
          className="orum-select"
          required
          value={tipoId}
          onChange={(e) => setTipoId(e.target.value)}
        >
          {tipos.length === 0 && <option value="">— No hay tipos de beneficio —</option>}
          {tipos.map((t) => (
            <option key={t.id} value={t.id}>
              {t.nombre}
            </option>
          ))}
        </select>
      </Field>

      {requiereValor && (
        <Field
          label={`Valor ${tipoSeleccionado?.codigo === 'porcentaje' ? '(porcentaje, 1-100)' : '(monto)'}`}
          htmlFor="valor"
        >
          <input
            id="valor"
            name="valor"
            type="number"
            min="0"
            step="0.01"
            className="orum-input"
            defaultValue={promocion?.valor ?? ''}
          />
        </Field>
      )}

      <Row>
        <Field label="Fecha de inicio (opcional)" htmlFor="fecha_inicio" flex>
          <input id="fecha_inicio" name="fecha_inicio" type="date" className="orum-input" defaultValue={promocion?.fecha_inicio ?? ''} />
        </Field>
        <Field label="Fecha de fin (opcional)" htmlFor="fecha_fin" flex>
          <input id="fecha_fin" name="fecha_fin" type="date" className="orum-input" defaultValue={promocion?.fecha_fin ?? ''} />
        </Field>
      </Row>

      <Row style={{ marginTop: '0.5rem' }}>
        <Button type="submit" disabled={pending || tipos.length === 0}>
          {pending ? 'Guardando…' : promocion ? 'Guardar cambios' : 'Crear promoción'}
        </Button>
        <LinkButton href={`/admin/comercios/${comercioId}`} variant="secondary">Cancelar</LinkButton>
      </Row>
    </form>
  )
}
```

- [ ] **Step 3: Update the import in `src/app/admin/comercios/[id]/promociones/nueva/page.tsx`**

Change:

```tsx
import { PromocionForm } from '../promocion-form'
```

to:

```tsx
import { PromocionForm } from '../_components/promocion-form'
```

- [ ] **Step 4: Update the import in `src/app/admin/comercios/[id]/promociones/[promoId]/editar/page.tsx`**

Change:

```tsx
import { PromocionForm } from '../../promocion-form'
```

to:

```tsx
import { PromocionForm } from '../../_components/promocion-form'
```

- [ ] **Step 5: Verify**

```bash
pnpm exec tsc --noEmit
pnpm lint
pnpm build
```

- [ ] **Step 6: Manual visual check**

`/admin/comercios/[id]/promociones/nueva` and `/admin/comercios/[id]/promociones/[promoId]/editar` for an existing comercio — including the conditional "Valor" field toggling when you change "Tipo de beneficio" to `dos_por_uno`/`regalo` and back.

Do not commit yet — see "Single commit policy" in Global Constraints.

---

### Task 6: Migrate `comercios/[id]/page.tsx` (ficha)

**Files:**
- Modify: `src/app/admin/comercios/[id]/page.tsx`

No file move — this route has no `_components` to relocate (it only reads from `actions.ts`/`sucursales-actions.ts`/`promociones-actions.ts`, which stay put). Only the JSX inside `page.tsx` changes to use the kit.

**Interfaces:**
- Consumes: `Badge`, `DataTable`, `EmptyState`, `LinkButton`, `PageHeader`, `Row` from `@/components/ui`.

- [ ] **Step 1: Rewrite `src/app/admin/comercios/[id]/page.tsx` to use the kit**

Replace the full file with:

```tsx
import { notFound } from 'next/navigation'
import { requireRol } from '@/lib/auth/auth'
import { createAdminClient } from '@/lib/supabase/admin'
import { cambiarEstadoComercio, cambiarEstadoAccesoComercio } from '../actions'
import { cambiarEstadoSucursal } from '../sucursales-actions'
import { cambiarEstadoPromocion } from '../promociones-actions'
import { Badge, DataTable, EmptyState, LinkButton, PageHeader, Row } from '@/components/ui'

export const metadata = { title: 'Ficha de comercio · ORUM' }

export default async function FichaComercioPage({ params }: { params: Promise<{ id: string }> }) {
  await requireRol('super_admin')
  const { id } = await params
  const comercioId = Number(id)

  const admin = createAdminClient()
  const { data: comercio } = await admin
    .from('comercios')
    .select('id, perfil_id, nombre, descripcion, marca_id, categoria_id, logo_url, activo')
    .eq('id', comercioId)
    .is('deleted_at', null)
    .maybeSingle()
  if (!comercio) notFound()

  const [{ data: marca }, { data: categoria }, { data: sucursales }, { data: promociones }, { data: tipos }] =
    await Promise.all([
      comercio.marca_id
        ? admin.from('marcas').select('nombre').eq('id', comercio.marca_id).maybeSingle()
        : Promise.resolve({ data: null }),
      comercio.categoria_id
        ? admin.from('categorias').select('nombre').eq('id', comercio.categoria_id).maybeSingle()
        : Promise.resolve({ data: null }),
      admin
        .from('sucursales')
        .select('id, nombre, direccion, telefono, activo')
        .eq('comercio_id', comercioId)
        .is('deleted_at', null)
        .order('nombre'),
      admin
        .from('promociones')
        .select('id, titulo, valor, activo, tipo_beneficio_id')
        .eq('comercio_id', comercioId)
        .is('deleted_at', null)
        .order('titulo'),
      admin.from('tipos_beneficio').select('id, nombre'),
    ])

  let correo = '—'
  let perfilActivo = false
  if (comercio.perfil_id) {
    const [{ data: authUser }, { data: perfil }] = await Promise.all([
      admin.auth.admin.getUserById(comercio.perfil_id),
      admin.from('perfiles').select('activo').eq('id', comercio.perfil_id).maybeSingle(),
    ])
    correo = authUser.user?.email ?? '—'
    perfilActivo = perfil?.activo ?? false
  }

  const nombreTipo = new Map((tipos ?? []).map((t) => [t.id, t.nombre]))

  return (
    <div>
      <PageHeader
        title={comercio.nombre}
        action={{ href: `/admin/comercios/${comercio.id}/editar`, label: 'Editar datos', variant: 'secondary' }}
      />

      <div className="orum-card" style={{ marginBottom: '1.25rem' }}>
        <p><strong>Correo:</strong> {correo}</p>
        <p><strong>Descripción:</strong> {comercio.descripcion ?? '—'}</p>
        <p><strong>Marca:</strong> {marca?.nombre ?? '—'}</p>
        <p><strong>Categoría:</strong> {categoria?.nombre ?? '—'}</p>

        <Row gap="1.5rem" style={{ marginTop: '0.75rem', flexWrap: 'wrap' }}>
          <Row gap="0.5rem" style={{ alignItems: 'center' }}>
            <Badge tone={comercio.activo ? 'on' : 'off'}>
              {comercio.activo ? 'Aliado activo' : 'Aliado inactivo'}
            </Badge>
            <form action={cambiarEstadoComercio}>
              <input type="hidden" name="id" value={comercio.id} />
              <input type="hidden" name="activar" value={comercio.activo ? 'false' : 'true'} />
              <button type="submit" className={`orum-button ${comercio.activo ? 'orum-button--danger' : ''}`}>
                {comercio.activo ? 'Desactivar aliado' : 'Activar aliado'}
              </button>
            </form>
          </Row>

          <Row gap="0.5rem" style={{ alignItems: 'center' }}>
            <Badge tone={perfilActivo ? 'on' : 'off'}>
              {perfilActivo ? 'Acceso activo' : 'Acceso desactivado'}
            </Badge>
            <form action={cambiarEstadoAccesoComercio}>
              <input type="hidden" name="id" value={comercio.id} />
              <input type="hidden" name="perfil_id" value={comercio.perfil_id ?? ''} />
              <input type="hidden" name="activar" value={perfilActivo ? 'false' : 'true'} />
              <button type="submit" className={`orum-button ${perfilActivo ? 'orum-button--danger' : ''}`}>
                {perfilActivo ? 'Desactivar acceso' : 'Activar acceso'}
              </button>
            </form>
          </Row>
        </Row>
      </div>

      <PageHeader
        as="h2"
        title="Sucursales"
        action={{ href: `/admin/comercios/${comercio.id}/sucursales/nueva`, label: '+ Nueva sucursal', variant: 'secondary' }}
      />
      {!sucursales || sucursales.length === 0 ? (
        <EmptyState marginBottom="1.25rem">Este comercio aún no tiene sucursales.</EmptyState>
      ) : (
        <DataTable marginBottom="1.25rem">
          <thead>
            <tr>
              <th>Nombre</th>
              <th>Dirección</th>
              <th>Teléfono</th>
              <th>Estado</th>
              <th style={{ textAlign: 'right' }}>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {sucursales.map((s) => (
              <tr key={s.id}>
                <td>{s.nombre}</td>
                <td className="orum-muted">{s.direccion ?? '—'}</td>
                <td className="orum-muted">{s.telefono ?? '—'}</td>
                <td>
                  <Badge tone={s.activo ? 'on' : 'off'}>{s.activo ? 'Activa' : 'Inactiva'}</Badge>
                </td>
                <td>
                  <Row gap="0.5rem" style={{ justifyContent: 'flex-end' }}>
                    <LinkButton
                      href={`/admin/comercios/${comercio.id}/sucursales/${s.id}/editar`}
                      variant="secondary"
                    >
                      Editar
                    </LinkButton>
                    <form action={cambiarEstadoSucursal}>
                      <input type="hidden" name="id" value={s.id} />
                      <input type="hidden" name="comercio_id" value={comercio.id} />
                      <input type="hidden" name="activar" value={s.activo ? 'false' : 'true'} />
                      <button type="submit" className={`orum-button ${s.activo ? 'orum-button--danger' : ''}`}>
                        {s.activo ? 'Desactivar' : 'Activar'}
                      </button>
                    </form>
                  </Row>
                </td>
              </tr>
            ))}
          </tbody>
        </DataTable>
      )}

      <PageHeader
        as="h2"
        title="Promociones"
        action={{ href: `/admin/comercios/${comercio.id}/promociones/nueva`, label: '+ Nueva promoción', variant: 'secondary' }}
      />
      {!promociones || promociones.length === 0 ? (
        <EmptyState>Este comercio aún no tiene promociones.</EmptyState>
      ) : (
        <DataTable>
          <thead>
            <tr>
              <th>Título</th>
              <th>Tipo</th>
              <th>Valor</th>
              <th>Estado</th>
              <th style={{ textAlign: 'right' }}>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {promociones.map((p) => (
              <tr key={p.id}>
                <td>{p.titulo}</td>
                <td>{nombreTipo.get(p.tipo_beneficio_id) ?? `Tipo #${p.tipo_beneficio_id}`}</td>
                <td>{p.valor ?? '—'}</td>
                <td>
                  <Badge tone={p.activo ? 'on' : 'off'}>{p.activo ? 'Activa' : 'Inactiva'}</Badge>
                </td>
                <td>
                  <Row gap="0.5rem" style={{ justifyContent: 'flex-end' }}>
                    <LinkButton
                      href={`/admin/comercios/${comercio.id}/promociones/${p.id}/editar`}
                      variant="secondary"
                    >
                      Editar
                    </LinkButton>
                    <form action={cambiarEstadoPromocion}>
                      <input type="hidden" name="id" value={p.id} />
                      <input type="hidden" name="comercio_id" value={comercio.id} />
                      <input type="hidden" name="activar" value={p.activo ? 'false' : 'true'} />
                      <button type="submit" className={`orum-button ${p.activo ? 'orum-button--danger' : ''}`}>
                        {p.activo ? 'Desactivar' : 'Activar'}
                      </button>
                    </form>
                  </Row>
                </td>
              </tr>
            ))}
          </tbody>
        </DataTable>
      )}
    </div>
  )
}
```

Note this file no longer imports `next/link` directly — the two `Link`/header-action usages are now `PageHeader`'s `action` prop and `LinkButton`.

- [ ] **Step 2: Verify**

```bash
pnpm exec tsc --noEmit
pnpm lint
pnpm build
```

- [ ] **Step 3: Manual visual check**

`/admin/comercios/[id]` for a comercio with at least one sucursal and one promoción, and for one with neither (to see both `EmptyState`s) — header, status badges/toggle buttons, and both tables must look and behave identically to before, including the "Desactivar"/"Activar" form submissions.

Do not commit yet — see "Single commit policy" in Global Constraints.

---

## Acceptance check (maps to spec §10, comercios-module slice)

- [ ] `src/components/ui/` exists with all 9 components from spec §3's table, exported from `index.ts`.
- [ ] `comercio-form.tsx`, `editar-comercio-form.tsx`, `sucursal-form.tsx`, `promocion-form.tsx` all live under the correct `_components/` folder per spec §4.1, with updated imports.
- [ ] No `page.tsx`, `layout.tsx`, or `actions.ts` in `comercios/**` changed location or public route.
- [ ] `tsc --noEmit`, `pnpm lint`, and `pnpm build` pass clean after every task.
- [ ] User has visually confirmed every migrated `comercios` page (list, create, ficha, edit, sucursales nueva/editar, promociones nueva/editar) looks and functions identically to before.

## Next steps

Once this plan is executed and the kit is validated against the real `comercios` module, write the next plans (`miembros`; then `planes`/`usuarios`/`cuenta`; then `bitacora`/`metricas`; then `admin/layout.tsx`) reusing this same kit — per spec §7 steps 4-7 and §9's risk mitigation (validate the kit against one real module before generalizing). Those plans are not written yet.
