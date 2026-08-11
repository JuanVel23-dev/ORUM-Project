# Reorganización — Paso 5: Planes, Usuarios, Cuenta con el kit — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Migrate `planes`, `usuarios`, and `cuenta` — the three simplest remaining admin modules — to the `src/components/ui/` kit, moving their `*-form.tsx` files into `_components/`, applying the `usuarios` naming pass from spec §4.2, and closing out the deferred `PasswordReveal` decision.

**Architecture:** Same pattern as `comercios` (Paso 3) and `miembros` (Paso 4). Spec §7 step 5.

**Tech Stack:** Next.js 16 (App Router, Server Components + `'use client'` forms with `useActionState`), TypeScript, React 19, pnpm.

## Global Constraints

- **Zero visual/behavioral change**, same as Pasos 3-4.
- Depends on Pasos 3-4 already being applied (kit exists, `comercios` and `miembros` already migrated).
- **`PageHeader` on simple titles — apply case by case, per file, based on exact margin match** (same rule established in Paso 4): if a page's plain `<h1>`/`<h2>` is *only* `{ fontSize, fontWeight, marginBottom }` matching `PageHeader`'s defaults with no action, use `PageHeader`. If it has extra margin (e.g. a back-link pushing `marginTop`) or a non-standard size, leave it inline. This plan calls out the decision per file below — check it before touching the title of any file not explicitly listed.
- **Password-reveal block: confirmed not extracted (closes the Paso 3 deferral).** `usuario-form.tsx`'s success block copy ("✓ Usuario creado correctamente." / "Comparte estos datos con la persona… el usuario podrá cambiarla después.") differs from both `comercio-form.tsx`'s and `miembro-form.tsx`'s copy. All three are now confirmed non-identical — restyle each with kit primitives (`Alert`, `Row`, `Button`) but keep the block local to each form, as already done for `comercio-form.tsx` and `miembro-form.tsx`.
- **Naming pass (spec §4.2):** `usuarios/[id]/editar/editar-form.tsx` is the only edit-form file that doesn't include the entity name (compare `editar-comercio-form.tsx`, `editar-miembro-form.tsx`). Task 3 renames it to `editar-usuario-form.tsx` on the move, and its export from `EditarForm` to `EditarUsuarioForm`, updating the one call site.
- No automated UI tests exist (spec §8) — verification per task is `tsc --noEmit` + `pnpm lint` + `pnpm build`, plus your manual visual check before moving to the next task.
- **Single commit policy:** this whole reorganization lands as one commit at the very end — do not commit after this plan or after any task in it.

---

### Task 1: Migrate `planes`

**Files:**
- Move: `src/app/admin/planes/plan-form.tsx` → `src/app/admin/planes/_components/plan-form.tsx`
- Modify: `src/app/admin/planes/page.tsx`
- Modify: `src/app/admin/planes/nuevo/page.tsx`
- Modify: `src/app/admin/planes/[id]/editar/page.tsx`

**Interfaces:**
- Consumes: `Alert`, `Badge`, `Button`, `DataTable`, `EmptyState`, `Field`, `LinkButton`, `PageHeader`, `Row` from `@/components/ui`.
- Produces: `PlanForm({ plan?: PlanInicial })` — unchanged export/props, new location, shared by `nuevo/` and `[id]/editar/` (sibling subroutes → lives in `planes/_components/`, per spec §4.1's exact mapping).
- **`PageHeader` decision:** `nuevo/page.tsx` and `[id]/editar/page.tsx` titles are plain `<h1 style={{fontSize:'1.5rem',fontWeight:700,marginBottom:'1.25rem'}}>` with no back-link — exact match for `PageHeader`'s `h1` default. Both use `PageHeader`.

- [ ] **Step 1: Move the form file**

```bash
mkdir -p src/app/admin/planes/_components
git mv src/app/admin/planes/plan-form.tsx src/app/admin/planes/_components/plan-form.tsx
```

- [ ] **Step 2: Rewrite the moved file to use the kit**

The action import goes from `./actions` to `../actions` (one level deeper). Replace the full file with:

```tsx
'use client'

import { useActionState } from 'react'
import { crearPlan, editarPlan, type PlanState } from '../actions'
import { Alert, Button, Field, LinkButton, Row } from '@/components/ui'

type PlanInicial = {
  id: number
  nombre: string
  descripcion: string | null
  precio: number
  duracion_meses: number
}

const estadoInicial: PlanState = {}

export function PlanForm({ plan }: { plan?: PlanInicial }) {
  const accion = plan ? editarPlan : crearPlan
  const [state, formAction, pending] = useActionState(accion, estadoInicial)

  return (
    <form action={formAction} className="orum-card">
      {state.error && <Alert tone="error">{state.error}</Alert>}

      {plan && <input type="hidden" name="id" value={plan.id} />}

      <Field label="Nombre" htmlFor="nombre">
        <input id="nombre" name="nombre" className="orum-input" required defaultValue={plan?.nombre} />
      </Field>

      <Field label="Descripción (opcional)" htmlFor="descripcion">
        <input id="descripcion" name="descripcion" className="orum-input" defaultValue={plan?.descripcion ?? ''} />
      </Field>

      <Row>
        <Field label="Precio" htmlFor="precio" flex>
          <input
            id="precio"
            name="precio"
            type="number"
            min="0"
            step="0.01"
            className="orum-input"
            required
            defaultValue={plan?.precio}
          />
        </Field>
        <Field label="Duración (meses)" htmlFor="duracion_meses" flex>
          <input
            id="duracion_meses"
            name="duracion_meses"
            type="number"
            min="1"
            step="1"
            className="orum-input"
            required
            defaultValue={plan?.duracion_meses ?? 1}
          />
        </Field>
      </Row>

      <Row style={{ marginTop: '0.5rem' }}>
        <Button type="submit" disabled={pending}>
          {pending ? 'Guardando…' : plan ? 'Guardar cambios' : 'Crear plan'}
        </Button>
        <LinkButton href="/admin/planes" variant="secondary">Cancelar</LinkButton>
      </Row>
    </form>
  )
}
```

- [ ] **Step 3: Rewrite `src/app/admin/planes/page.tsx` to use the kit**

Replace the full file with:

```tsx
import { requireRol } from '@/lib/auth/auth'
import { createAdminClient } from '@/lib/supabase/admin'
import { cambiarEstadoPlan } from './actions'
import { Badge, DataTable, EmptyState, LinkButton, PageHeader, Row } from '@/components/ui'

export const metadata = { title: 'Planes · ORUM' }

export default async function PlanesPage() {
  await requireRol('super_admin')

  const admin = createAdminClient()
  const { data: planes } = await admin
    .from('planes_membresia')
    .select('id, nombre, descripcion, precio, duracion_meses, activo')
    .is('deleted_at', null)
    .order('nombre')

  return (
    <div>
      <PageHeader title="Planes de membresía" action={{ href: '/admin/planes/nuevo', label: '+ Crear plan' }} />

      {!planes || planes.length === 0 ? (
        <EmptyState>Aún no hay planes. Crea el primero para poder vender membresías.</EmptyState>
      ) : (
        <DataTable>
          <thead>
            <tr>
              <th>Nombre</th>
              <th>Precio</th>
              <th>Duración</th>
              <th>Estado</th>
              <th style={{ textAlign: 'right' }}>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {planes.map((p) => (
              <tr key={p.id}>
                <td>{p.nombre}</td>
                <td>${p.precio.toLocaleString('es-CO')}</td>
                <td>{p.duracion_meses} mes(es)</td>
                <td>
                  <Badge tone={p.activo ? 'on' : 'off'}>{p.activo ? 'Activo' : 'Inactivo'}</Badge>
                </td>
                <td>
                  <Row gap="0.5rem" style={{ justifyContent: 'flex-end' }}>
                    <LinkButton href={`/admin/planes/${p.id}/editar`} variant="secondary">
                      Editar
                    </LinkButton>
                    <form action={cambiarEstadoPlan}>
                      <input type="hidden" name="id" value={p.id} />
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

- [ ] **Step 4: Rewrite `src/app/admin/planes/nuevo/page.tsx`**

Replace the full file with:

```tsx
import { requireRol } from '@/lib/auth/auth'
import { PlanForm } from '../_components/plan-form'
import { PageHeader } from '@/components/ui'

export const metadata = { title: 'Nuevo plan · ORUM' }

export default async function NuevoPlanPage() {
  await requireRol('super_admin')
  return (
    <div>
      <PageHeader title="Nuevo plan" />
      <PlanForm />
    </div>
  )
}
```

- [ ] **Step 5: Rewrite `src/app/admin/planes/[id]/editar/page.tsx`**

Replace the full file with:

```tsx
import { notFound } from 'next/navigation'
import { requireRol } from '@/lib/auth/auth'
import { createAdminClient } from '@/lib/supabase/admin'
import { PlanForm } from '../../_components/plan-form'
import { PageHeader } from '@/components/ui'

export const metadata = { title: 'Editar plan · ORUM' }

export default async function EditarPlanPage({ params }: { params: Promise<{ id: string }> }) {
  await requireRol('super_admin')
  const { id } = await params

  const admin = createAdminClient()
  const { data: plan } = await admin
    .from('planes_membresia')
    .select('id, nombre, descripcion, precio, duracion_meses')
    .eq('id', Number(id))
    .is('deleted_at', null)
    .maybeSingle()

  if (!plan) notFound()

  return (
    <div>
      <PageHeader title="Editar plan" />
      <PlanForm plan={plan} />
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

`/admin/planes` (list, empty state), `/admin/planes/nuevo`, and `/admin/planes/[id]/editar`.

Do not commit yet — see "Single commit policy" in Global Constraints.

---

### Task 2: Migrate `usuarios` listing + create form

**Files:**
- Move: `src/app/admin/usuarios/nuevo/usuario-form.tsx` → `src/app/admin/usuarios/nuevo/_components/usuario-form.tsx`
- Modify: `src/app/admin/usuarios/page.tsx`
- Modify: `src/app/admin/usuarios/nuevo/page.tsx`

**Interfaces:**
- Consumes: `Alert`, `Badge`, `Button`, `DataTable`, `EmptyState`, `Field`, `LinkButton`, `PageHeader`, `Row` from `@/components/ui`.
- Produces: `UsuarioForm()` — unchanged export/props, new location. Used only by `nuevo/page.tsx` (single-consumer, hence `nuevo/_components/`, per spec §4.1's exact mapping).
- **`PageHeader` decision:** `nuevo/page.tsx`'s title is a plain `<h1 style={{fontSize:'1.5rem',fontWeight:700,marginBottom:'1.25rem'}}>` with no back-link — matches `PageHeader`'s `h1` default. Uses `PageHeader`.

- [ ] **Step 1: Move the form file**

```bash
mkdir -p src/app/admin/usuarios/nuevo/_components
git mv src/app/admin/usuarios/nuevo/usuario-form.tsx src/app/admin/usuarios/nuevo/_components/usuario-form.tsx
```

- [ ] **Step 2: Rewrite the moved file to use the kit**

The action import goes from `../actions` to `../../actions` (one level deeper). Replace the full file with:

```tsx
'use client'

import { useActionState, useState } from 'react'
import { crearUsuario, type CrearUsuarioState } from '../../actions'
import { Alert, Button, Field, LinkButton, Row } from '@/components/ui'

const estadoInicial: CrearUsuarioState = {}

export function UsuarioForm() {
  const [state, formAction, pending] = useActionState(crearUsuario, estadoInicial)
  const [tipo, setTipo] = useState<'empleado' | 'super_admin'>('empleado')
  const [copiado, setCopiado] = useState(false)

  // Pantalla de éxito: mostramos la contraseña generada UNA sola vez.
  if (state.ok && state.password) {
    return (
      <div className="orum-card">
        <Alert tone="success">✓ Usuario creado correctamente.</Alert>
        <p style={{ marginBottom: '0.75rem' }}>
          Comparte estos datos con la persona. La contraseña <strong>no se volverá a mostrar</strong>;
          el usuario podrá cambiarla después.
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
          <LinkButton href="/admin/usuarios">Ir a la lista</LinkButton>
          <LinkButton href="/admin/usuarios/nuevo" variant="secondary">Crear otro</LinkButton>
        </Row>
      </div>
    )
  }

  return (
    <form action={formAction} className="orum-card">
      {state.error && <Alert tone="error">{state.error}</Alert>}

      <Field label="Tipo de usuario" htmlFor="tipo">
        <select
          id="tipo"
          name="tipo"
          className="orum-select"
          value={tipo}
          onChange={(e) => setTipo(e.target.value as typeof tipo)}
        >
          <option value="empleado">Empleado</option>
          <option value="super_admin">Administrador</option>
        </select>
      </Field>

      <Field label="Correo electrónico (para iniciar sesión)" htmlFor="email">
        <input id="email" name="email" type="email" className="orum-input" required />
      </Field>

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
      <Field label="Teléfono (opcional)" htmlFor="telefono">
        <input id="telefono" name="telefono" className="orum-input" />
      </Field>

      <p className="orum-muted" style={{ fontSize: '0.85rem', marginBottom: '1rem' }}>
        El sistema generará una contraseña segura automáticamente y te la mostrará al terminar.
      </p>

      <Row>
        <Button type="submit" disabled={pending}>
          {pending ? 'Creando…' : 'Crear usuario'}
        </Button>
        <LinkButton href="/admin/usuarios" variant="secondary">Cancelar</LinkButton>
      </Row>
    </form>
  )
}
```

- [ ] **Step 3: Rewrite `src/app/admin/usuarios/page.tsx` to use the kit**

Replace the full file with:

```tsx
import { requireRol } from '@/lib/auth/auth'
import { createAdminClient } from '@/lib/supabase/admin'
import { cambiarEstadoAcceso } from './actions'
import { Badge, DataTable, EmptyState, LinkButton, PageHeader, Row } from '@/components/ui'

export const metadata = { title: 'Usuarios · ORUM' }

type Fila = {
  perfilId: string
  nombre: string
  email: string
  rolNombre: string
  rolCodigo: string
  activo: boolean
}

export default async function UsuariosPage() {
  // Solo el administrador mayor gestiona usuarios.
  await requireRol('super_admin')

  const admin = createAdminClient()

  const [{ data: perfiles }, { data: roles }, { data: empleados }, authList] = await Promise.all([
    admin.from('perfiles').select('id, rol_id, activo'),
    admin.from('roles').select('id, codigo, nombre'),
    admin.from('empleados').select('perfil_id, nombres, apellidos').is('deleted_at', null),
    admin.auth.admin.listUsers({ page: 1, perPage: 1000 }),
  ])

  const rolPorId = new Map((roles ?? []).map((r) => [r.id, r]))
  const emailPorId = new Map((authList.data?.users ?? []).map((u) => [u.id, u.email ?? '—']))
  const empleadoPorPerfil = new Map((empleados ?? []).map((e) => [e.perfil_id, e]))

  const filas: Fila[] = (perfiles ?? [])
    .map((p): Fila | null => {
      const rol = rolPorId.get(p.rol_id)
      const emp = empleadoPorPerfil.get(p.id)
      if (!rol || !emp) return null

      return {
        perfilId: p.id,
        nombre: `${emp.nombres} ${emp.apellidos}`.trim(),
        email: emailPorId.get(p.id) ?? '—',
        rolNombre: rol.nombre,
        rolCodigo: rol.codigo,
        activo: p.activo,
      }
    })
    .filter((f): f is Fila => f !== null)
    .sort((a, b) => a.nombre.localeCompare(b.nombre))

  return (
    <div>
      <PageHeader title="Usuarios" action={{ href: '/admin/usuarios/nuevo', label: '+ Crear usuario' }} />

      {filas.length === 0 ? (
        <EmptyState>Aún no hay usuarios registrados. Crea el primero.</EmptyState>
      ) : (
        <DataTable>
          <thead>
            <tr>
              <th>Nombre</th>
              <th>Correo</th>
              <th>Rol</th>
              <th>Estado</th>
              <th style={{ textAlign: 'right' }}>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {filas.map((f) => (
              <tr key={f.perfilId}>
                <td>{f.nombre}</td>
                <td className="orum-muted">{f.email}</td>
                <td>{f.rolNombre}</td>
                <td>
                  <Badge tone={f.activo ? 'on' : 'off'}>{f.activo ? 'Activo' : 'Inactivo'}</Badge>
                </td>
                <td>
                  <Row gap="0.5rem" style={{ justifyContent: 'flex-end' }}>
                    <LinkButton href={`/admin/usuarios/${f.perfilId}/editar`} variant="secondary">
                      Editar
                    </LinkButton>
                    <form action={cambiarEstadoAcceso}>
                      <input type="hidden" name="perfil_id" value={f.perfilId} />
                      <input type="hidden" name="activar" value={f.activo ? 'false' : 'true'} />
                      <button type="submit" className={`orum-button ${f.activo ? 'orum-button--danger' : ''}`}>
                        {f.activo ? 'Desactivar' : 'Activar'}
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

- [ ] **Step 4: Rewrite `src/app/admin/usuarios/nuevo/page.tsx`**

Replace the full file with:

```tsx
import { requireRol } from '@/lib/auth/auth'
import { UsuarioForm } from './_components/usuario-form'
import { PageHeader } from '@/components/ui'

export const metadata = { title: 'Crear usuario · ORUM' }

export default async function NuevoUsuarioPage() {
  await requireRol('super_admin')

  return (
    <div style={{ maxWidth: 560 }}>
      <PageHeader title="Crear usuario" />
      <UsuarioForm />
    </div>
  )
}
```

- [ ] **Step 5: Verify**

```bash
pnpm exec tsc --noEmit
pnpm lint
pnpm build
```

- [ ] **Step 6: Manual visual check**

`/admin/usuarios` (list, empty state) and `/admin/usuarios/nuevo` (both "Empleado" and "Administrador" tipo selections, and the post-submit password screen).

Do not commit yet — see "Single commit policy" in Global Constraints.

---

### Task 3: Migrate `usuarios/[id]/editar` (with the naming pass)

**Files:**
- Move + rename: `src/app/admin/usuarios/[id]/editar/editar-form.tsx` → `src/app/admin/usuarios/[id]/editar/_components/editar-usuario-form.tsx`
- Modify: `src/app/admin/usuarios/[id]/editar/page.tsx`

**Interfaces:**
- Consumes: `Alert`, `Button`, `Field`, `LinkButton`, `Row` from `@/components/ui`.
- Produces: `EditarUsuarioForm({ perfilId: string, email: string, empleado: {...} })` — **renamed** from `EditarForm` per spec §4.2 (the only edit-form in the codebase whose name didn't include the entity). Same props, new name, new location.
- **`PageHeader` decision: do NOT use it here.** This page's `<h1>` has a "← Volver a usuarios" back-link above it, pushing an extra `marginTop: '0.5rem'` that `PageHeader` doesn't support (same situation as `comercios/nuevo/page.tsx` in Paso 3) — left inline.

- [ ] **Step 1: Move and rename the form file**

```bash
mkdir -p "src/app/admin/usuarios/[id]/editar/_components"
git mv "src/app/admin/usuarios/[id]/editar/editar-form.tsx" "src/app/admin/usuarios/[id]/editar/_components/editar-usuario-form.tsx"
```

- [ ] **Step 2: Rewrite the moved file — apply the kit AND the rename**

The action import goes from `../../actions` to `../../../actions` (one level deeper). The export renames from `EditarForm` to `EditarUsuarioForm`. Replace the full file with:

```tsx
'use client'

import { useActionState } from 'react'
import { editarUsuario, type EditarUsuarioState } from '../../../actions'
import { Alert, Button, Field, LinkButton, Row } from '@/components/ui'

const estadoInicial: EditarUsuarioState = {}

type Props = {
  perfilId: string
  email: string
  empleado: { nombres: string; apellidos: string; cedula: string | null; telefono: string | null }
}

export function EditarUsuarioForm({ perfilId, email, empleado }: Props) {
  const [state, formAction, pending] = useActionState(editarUsuario, estadoInicial)

  return (
    <form action={formAction} className="orum-card">
      {state.error && <Alert tone="error">{state.error}</Alert>}

      <input type="hidden" name="perfil_id" value={perfilId} />
      <input type="hidden" name="email_original" value={email} />

      <Field label="Correo de acceso" htmlFor="email">
        <input id="email" name="email" type="email" className="orum-input" defaultValue={email} required />
      </Field>

      <Row>
        <Field label="Nombres" htmlFor="nombres" flex>
          <input id="nombres" name="nombres" className="orum-input" defaultValue={empleado.nombres} required />
        </Field>
        <Field label="Apellidos" htmlFor="apellidos" flex>
          <input id="apellidos" name="apellidos" className="orum-input" defaultValue={empleado.apellidos} required />
        </Field>
      </Row>
      <Field label="Cédula" htmlFor="cedula">
        <input id="cedula" name="cedula" className="orum-input" defaultValue={empleado.cedula ?? ''} required />
      </Field>
      <Field label="Teléfono (opcional)" htmlFor="telefono">
        <input id="telefono" name="telefono" className="orum-input" defaultValue={empleado.telefono ?? ''} />
      </Field>

      <Row style={{ marginTop: '0.5rem' }}>
        <Button type="submit" disabled={pending}>
          {pending ? 'Guardando…' : 'Guardar cambios'}
        </Button>
        <LinkButton href="/admin/usuarios" variant="secondary">Cancelar</LinkButton>
      </Row>
    </form>
  )
}
```

- [ ] **Step 3: Update `src/app/admin/usuarios/[id]/editar/page.tsx`**

Update the import and the two usages of the renamed component; everything else (the back-link, the inline `<h1>`, the data fetching) stays exactly as-is. Replace the full file with:

```tsx
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { requireRol } from '@/lib/auth/auth'
import { createAdminClient } from '@/lib/supabase/admin'
import { EditarUsuarioForm } from './_components/editar-usuario-form'

export const metadata = { title: 'Editar usuario · ORUM' }

export default async function EditarUsuarioPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  await requireRol('super_admin')
  const { id: perfilId } = await params

  const admin = createAdminClient()

  const [{ data: empleado }, { data: authUser }] = await Promise.all([
    admin
      .from('empleados')
      .select('nombres, apellidos, cedula, telefono')
      .eq('perfil_id', perfilId)
      .maybeSingle(),
    admin.auth.admin.getUserById(perfilId),
  ])

  if (!empleado) notFound()

  const email = authUser?.user?.email ?? ''

  return (
    <div style={{ maxWidth: 560 }}>
      <Link href="/admin/usuarios" className="orum-muted" style={{ fontSize: '0.9rem' }}>
        ← Volver a usuarios
      </Link>
      <h1 style={{ fontSize: '1.5rem', fontWeight: 700, margin: '0.5rem 0 1.25rem' }}>
        Editar usuario
      </h1>

      <EditarUsuarioForm perfilId={perfilId} email={email} empleado={empleado} />
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

`/admin/usuarios/[id]/editar` for an existing usuario.

Do not commit yet — see "Single commit policy" in Global Constraints.

---

### Task 4: Migrate `cuenta/password`

**Files:**
- Move: `src/app/admin/cuenta/password/password-form.tsx` → `src/app/admin/cuenta/password/_components/password-form.tsx`
- Modify: `src/app/admin/cuenta/password/page.tsx`

**Interfaces:**
- Consumes: `Alert`, `Button`, `Field` from `@/components/ui`.
- Produces: `PasswordForm()` — unchanged export/props, new location.
- **`PageHeader` decision: do NOT use it here.** This page's `<h1>` uses `marginBottom: '0.25rem'` (not `1.25rem`) because it's immediately followed by a subtitle paragraph, not a form — doesn't match `PageHeader`'s default. Left inline.

- [ ] **Step 1: Move the form file**

```bash
mkdir -p src/app/admin/cuenta/password/_components
git mv src/app/admin/cuenta/password/password-form.tsx src/app/admin/cuenta/password/_components/password-form.tsx
```

- [ ] **Step 2: Rewrite the moved file to use the kit**

The action import goes from `../actions` to `../../actions` (one level deeper). Replace the full file with:

```tsx
'use client'

import { useActionState } from 'react'
import { cambiarPassword, type PasswordState } from '../../actions'
import { Alert, Button, Field } from '@/components/ui'

const estadoInicial: PasswordState = {}

export function PasswordForm() {
  const [state, formAction, pending] = useActionState(cambiarPassword, estadoInicial)

  return (
    <form action={formAction} className="orum-card" style={{ maxWidth: 460 }}>
      {state.ok && <Alert tone="success">✓ Tu contraseña se actualizó correctamente.</Alert>}
      {state.error && <Alert tone="error">{state.error}</Alert>}

      <Field label="Nueva contraseña" htmlFor="password">
        <input
          id="password"
          name="password"
          type="password"
          className="orum-input"
          autoComplete="new-password"
          minLength={8}
          required
        />
      </Field>

      <Field label="Confirmar nueva contraseña" htmlFor="confirmar">
        <input
          id="confirmar"
          name="confirmar"
          type="password"
          className="orum-input"
          autoComplete="new-password"
          minLength={8}
          required
        />
      </Field>

      <Button type="submit" disabled={pending}>
        {pending ? 'Guardando…' : 'Cambiar contraseña'}
      </Button>
    </form>
  )
}
```

- [ ] **Step 3: Update the import in `src/app/admin/cuenta/password/page.tsx`**

Change:

```tsx
import { PasswordForm } from './password-form'
```

to:

```tsx
import { PasswordForm } from './_components/password-form'
```

Nothing else in this file changes.

- [ ] **Step 4: Verify**

```bash
pnpm exec tsc --noEmit
pnpm lint
pnpm build
```

- [ ] **Step 5: Manual visual check**

`/admin/cuenta/password` — both the success and error alert states (submit a too-short password to see the error, then a valid one to see success), and the form still changes your own password correctly.

Do not commit yet — see "Single commit policy" in Global Constraints.

---

## Acceptance check (maps to spec §10, planes/usuarios/cuenta slice)

- [ ] `plan-form.tsx`, `usuario-form.tsx`, `editar-usuario-form.tsx` (renamed from `editar-form.tsx`), `password-form.tsx` all live under the correct `_components/` folder per spec §4.1, with updated imports.
- [ ] `usuarios/[id]/editar/editar-form.tsx` no longer exists; `EditarForm` no longer exists anywhere in the codebase (renamed to `EditarUsuarioForm`).
- [ ] No `page.tsx`, `layout.tsx`, or `actions.ts` in `planes/**`, `usuarios/**`, or `cuenta/**` changed location or public route.
- [ ] `tsc --noEmit`, `pnpm lint`, and `pnpm build` pass clean after every task.
- [ ] User has visually confirmed every migrated page looks and functions identically to before.

## Next steps

Plans for `bitacora`/`metricas` (spec §7 step 6) and `admin/layout.tsx` (step 7) are not written yet — write them next, in that order. After step 7, spec §10's full acceptance checklist can be run end-to-end.
