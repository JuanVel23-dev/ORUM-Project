# Portal de Comercios — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build `/comercios` — a portal where a comercio (rol `comercio`) logs in, searches a
member by QR/número, sees if the membership is active, picks the promotion being applied (if any),
and registers the sale in `ventas`.

**Architecture:** Mirrors the Portal de Miembros (Fase 5): a route group (`(portal)`) with a
`requireRolComercio` guard, session-client (`createClient()`) Supabase queries protected by RLS, and
a `SECURITY DEFINER` Postgres function for the one cross-row lookup RLS can't express cleanly
(searching *any* member by number without exposing their cédula/teléfono/dirección to the comercio).
The verification+sale flow is a single client-rendered screen (search → result → sale form) built
from small composable components, using `useActionState` for both server actions involved.

**Tech Stack:** Next.js 16 (App Router) + React 19, TypeScript, Supabase (`@supabase/ssr`),
`@yudiel/react-qr-scanner` (new dependency, camera QR scanning), Vitest for pure-function tests.

## Global Constraints

- Spec: `docs/superpowers/specs/2026-08-12-portal-comercios-design.md` — read it if any task here
  seems ambiguous, it has the full rationale.
- Package manager is **pnpm** (`packageManager: pnpm@11.17.0` in `package.json`) — never `npm`.
- This codebase's testing convention: **only pure functions under `src/lib/**` get Vitest tests**
  (TDD: red → green). Server actions, pages, and client components that talk to Supabase are
  *not* unit tested here — they're verified with `tsc --noEmit`, `pnpm lint`, `pnpm build`, and a
  manual browser pass at the end (same pattern every prior phase used).
- UI copy is in Spanish, matching the rest of the app. Reuse the existing `orum-*` CSS classes
  (`orum-card`, `orum-field`, `orum-label`, `orum-input`, `orum-select`, `orum-button`,
  `orum-button--secondary`, `orum-alert`, `orum-badge`) and the `@/components/ui` kit
  (`PageHeader`, `EmptyState`, `Badge`, `Select`, `Alert`, `Row`) — do not invent new class names.
- "Today" in business logic is always Bogotá time via the shared `hoyISO()` helper built in Task 3
  (`src/lib/shared/fecha.ts`), never `new Date()` directly and never a locally re-declared
  `function hoyISO()` — Task 3 consolidates the one pre-existing copy (in
  `src/app/admin/miembros/actions.ts`) plus this plan's two new call sites into a single import.
- Server actions always re-check authorization themselves (`requireRolComercio()`), even though the
  layout already guards the page — matches the existing `/admin/**` and `/miembros/**` actions.
- **Out of scope for this plan** (see spec §1): no welcome email, no sales-history screen for the
  comercio, no self-service password change for comercio, no changes to `/login` or
  `/miembros/login`.

---

## Task 1: Apply RLS + RPC function in Supabase (manual, do this first)

**This task is not code — it's a manual step in the Supabase SQL Editor**, same as every prior
phase's RLS/index changes (there are no migration files in this repo). Everything from Task 2
onward can be written and type-checked without this being live yet, but the **manual browser test
in Task 16 will not work until this is applied**, so do it now to avoid a late blocker.

**Files:** none (no files in the repo track this SQL — it's applied directly against the Supabase
project).

- [ ] **Step 1: Run this SQL in the Supabase SQL Editor**

```sql
-- Función segura: el comercio busca a cualquier miembro por número, pero solo
-- recibe los campos que le corresponden (nunca cédula/teléfono/dirección).
create or replace function buscar_miembro_comercio(p_numero text)
returns table (
  miembro_id bigint, nombres text, apellidos text, numero_membresia text,
  vigente boolean, membresia_id bigint, plan_nombre text
)
security definer set search_path = public as $$
  select m.id, m.nombres, m.apellidos, m.numero_membresia,
         coalesce(mb.estado = 'activa' and mb.fecha_fin >= current_date, false),
         mb.id, pl.nombre
  from miembros m
  left join lateral (
    select * from membresias where miembro_id = m.id
    order by fecha_fin desc limit 1
  ) mb on true
  left join planes_membresia pl on pl.id = mb.plan_id
  where m.numero_membresia = p_numero and m.deleted_at is null
    and exists (
      select 1 from perfiles pf join roles r on r.id = pf.rol_id
      where pf.id = auth.uid() and r.codigo = 'comercio' and pf.activo
    );
$$ language sql stable;

grant execute on function buscar_miembro_comercio(text) to authenticated;

-- Habilitar RLS en `ventas` (hoy no está activo) y permitir que un comercio
-- inserte únicamente ventas propias, en una sucursal de su propio comercio.
alter table ventas enable row level security;

create policy ventas_insert_comercio_propio on ventas
for insert to authenticated
with check (
  registrada_por_perfil = auth.uid()
  and sucursal_id in (
    select s.id from sucursales s
    join comercios c on c.id = s.comercio_id
    where c.perfil_id = auth.uid()
  )
);
```

- [ ] **Step 2: Verify the function exists**

Run in the SQL Editor:
```sql
select proname from pg_proc where proname = 'buscar_miembro_comercio';
```
Expected: one row, `buscar_miembro_comercio`.

- [ ] **Step 3: Verify RLS is enabled on `ventas`**

```sql
select relrowsecurity from pg_class where relname = 'ventas';
```
Expected: `t` (true).

---

## Task 2: Type the RPC function in `database.types.ts`

**Files:**
- Modify: `src/lib/supabase/database.types.ts:411` (the `Functions: Record<string, never>` line)

**Interfaces:**
- Produces: `Database['public']['Functions']['buscar_miembro_comercio']` — used by
  `supabase.rpc('buscar_miembro_comercio', { p_numero: string })` in Task 9.

- [ ] **Step 1: Replace the empty `Functions` type**

In `src/lib/supabase/database.types.ts`, replace:

```ts
    Functions: Record<string, never>
```

with:

```ts
    Functions: {
      buscar_miembro_comercio: {
        Args: { p_numero: string }
        Returns: {
          miembro_id: number
          nombres: string
          apellidos: string
          numero_membresia: string
          vigente: boolean
          membresia_id: number | null
          plan_nombre: string | null
        }[]
      }
    }
```

- [ ] **Step 2: Type-check**

Run: `pnpm exec tsc --noEmit`
Expected: no new errors.

- [ ] **Step 3: Commit**

```bash
git add src/lib/supabase/database.types.ts
git commit -m "feat(comercios): tipar función RPC buscar_miembro_comercio"
```

---

## Task 3: Shared `hoyISO` helper (`src/lib/shared/fecha.ts`)

**Why this task exists:** `src/app/admin/miembros/actions.ts` already has a local
`function hoyISO()` (Bogotá "today", used for registration/renewal dates). This plan needs the same
logic in two new files (Tasks 10 and 15). Rather than adding two more local copies, this task
extracts the one existing copy into a shared helper, and Tasks 10/15 import it instead of
re-declaring it — no duplication anywhere in the codebase after this plan lands.

**Files:**
- Create: `src/lib/shared/fecha.ts`
- Modify: `src/app/admin/miembros/actions.ts:44-51` (remove the local `hoyISO`, import the shared one)

**Interfaces:**
- Produces: `hoyISO(): string` (returns `'YYYY-MM-DD'` in `America/Bogota`) — consumed by
  `src/app/admin/miembros/actions.ts` (existing call sites, unchanged behavior), Task 10
  (`registrarVenta`), and Task 15 (`page.tsx`).

- [ ] **Step 1: Write the implementation**

```ts
// src/lib/shared/fecha.ts

/**
 * Fecha de hoy en formato 'YYYY-MM-DD' en la zona horaria del negocio
 * (America/Bogota), no la del servidor (que corre en UTC). Evita que
 * registros/renovaciones/ventas hechos por la tarde-noche salten al día
 * siguiente.
 */
export function hoyISO(): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Bogota' }).format(new Date())
}
```

- [ ] **Step 2: Update `src/app/admin/miembros/actions.ts` to use the shared helper**

Remove the local declaration:

```ts
/**
 * Fecha de hoy en formato 'YYYY-MM-DD' en la zona horaria del negocio
 * (America/Bogota), no la del servidor (que corre en UTC). Así los registros y
 * renovaciones hechos por la tarde-noche no saltan al día siguiente.
 */
function hoyISO(): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Bogota' }).format(new Date())
}
```

and add an import for it instead, alongside the file's existing imports:

```ts
import { hoyISO } from '@/lib/shared/fecha'
```

The rest of the file (both call sites, `hoyISO()` inside `registrarMiembro` and inside
`renovarMembresia`) is unchanged — same name, same signature, same behavior.

- [ ] **Step 3: Type-check and run the full test suite**

Run: `pnpm exec tsc --noEmit && pnpm exec vitest run`
Expected: no new type errors; all existing tests still pass (this task doesn't change behavior,
only where the function lives).

- [ ] **Step 4: Commit**

```bash
git add src/lib/shared/fecha.ts src/app/admin/miembros/actions.ts
git commit -m "refactor: extraer hoyISO a un helper compartido"
```

---

## Task 4: Pure functions for sale calculations (`src/lib/comercios/ventas.ts`)

**Files:**
- Create: `src/lib/comercios/ventas.ts`
- Test: `src/lib/comercios/ventas.test.ts`

**Interfaces:**
- Produces: `calcularDescuento(tipoCodigo: 'porcentaje' | 'monto_fijo', valorPromocion: number, valorCompra: number): number`
- Produces: `calcularValorFinal(valorCompra: number, valorDescuento: number): number`
- Consumed by: Task 10 (`registrarVenta` action) and Task 13 (`ConfirmarVentaForm`).

- [ ] **Step 1: Write the failing tests**

```ts
// src/lib/comercios/ventas.test.ts
import { describe, it, expect } from 'vitest'
import { calcularDescuento, calcularValorFinal } from './ventas'

describe('calcularDescuento', () => {
  it('porcentaje: calcula el % sobre el valor de compra', () => {
    expect(calcularDescuento('porcentaje', 20, 100000)).toBe(20000)
  })

  it('porcentaje: redondea al entero más cercano', () => {
    expect(calcularDescuento('porcentaje', 15, 10000)).toBe(1500)
  })

  it('monto_fijo: usa el valor fijo cuando es menor a la compra', () => {
    expect(calcularDescuento('monto_fijo', 5000, 100000)).toBe(5000)
  })

  it('monto_fijo: se limita al valor de la compra si el fijo es mayor', () => {
    expect(calcularDescuento('monto_fijo', 50000, 10000)).toBe(10000)
  })
})

describe('calcularValorFinal', () => {
  it('resta el descuento del valor de compra', () => {
    expect(calcularValorFinal(100000, 20000)).toBe(80000)
  })

  it('nunca es negativo', () => {
    expect(calcularValorFinal(10000, 50000)).toBe(0)
  })

  it('con compra 0 y sin descuento (obsequio puro) da 0', () => {
    expect(calcularValorFinal(0, 0)).toBe(0)
  })
})
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `pnpm exec vitest run src/lib/comercios/ventas.test.ts`
Expected: FAIL — `Cannot find module './ventas'` (file doesn't exist yet).

- [ ] **Step 3: Write the implementation**

```ts
// src/lib/comercios/ventas.ts

/**
 * Descuento automático para promociones de tipo `porcentaje` o `monto_fijo`.
 * `dos_por_uno` y `regalo` no se calculan aquí: el comercio los digita a mano
 * porque el sistema no conoce precios de artículos individuales.
 */
export function calcularDescuento(
  tipoCodigo: 'porcentaje' | 'monto_fijo',
  valorPromocion: number,
  valorCompra: number,
): number {
  if (tipoCodigo === 'porcentaje') {
    return Math.round((valorCompra * valorPromocion) / 100)
  }
  return Math.min(valorPromocion, valorCompra)
}

/** Valor final de la venta: compra menos descuento, nunca negativo. */
export function calcularValorFinal(valorCompra: number, valorDescuento: number): number {
  return Math.max(0, valorCompra - valorDescuento)
}
```

- [ ] **Step 4: Run the tests to verify they pass**

Run: `pnpm exec vitest run src/lib/comercios/ventas.test.ts`
Expected: PASS, 7 tests.

- [ ] **Step 5: Commit**

```bash
git add src/lib/comercios/ventas.ts src/lib/comercios/ventas.test.ts
git commit -m "feat(comercios): funciones puras de cálculo de venta"
```

---

## Task 5: Pure function for promotion validity (`src/lib/comercios/promocion-vigente.ts`)

**Files:**
- Create: `src/lib/comercios/promocion-vigente.ts`
- Test: `src/lib/comercios/promocion-vigente.test.ts`

**Interfaces:**
- Produces: `esPromocionVigente(activo: boolean, fechaInicio: string | null, fechaFin: string | null, hoy: string): boolean`
- Consumed by: Task 10 (`registrarVenta` action) and Task 15 (`page.tsx`, to filter the promotion list).

- [ ] **Step 1: Write the failing tests**

```ts
// src/lib/comercios/promocion-vigente.test.ts
import { describe, it, expect } from 'vitest'
import { esPromocionVigente } from './promocion-vigente'

describe('esPromocionVigente', () => {
  it('vigente: activa sin fechas límite', () => {
    expect(esPromocionVigente(true, null, null, '2026-08-12')).toBe(true)
  })

  it('no vigente: inactiva aunque las fechas sean válidas', () => {
    expect(esPromocionVigente(false, '2026-01-01', '2026-12-31', '2026-08-12')).toBe(false)
  })

  it('vigente: dentro del rango de fechas', () => {
    expect(esPromocionVigente(true, '2026-08-01', '2026-08-31', '2026-08-12')).toBe(true)
  })

  it('no vigente: antes de la fecha de inicio', () => {
    expect(esPromocionVigente(true, '2026-09-01', null, '2026-08-12')).toBe(false)
  })

  it('no vigente: después de la fecha de fin', () => {
    expect(esPromocionVigente(true, null, '2026-08-01', '2026-08-12')).toBe(false)
  })

  it('vigente: hoy es exactamente la fecha de fin', () => {
    expect(esPromocionVigente(true, null, '2026-08-12', '2026-08-12')).toBe(true)
  })
})
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `pnpm exec vitest run src/lib/comercios/promocion-vigente.test.ts`
Expected: FAIL — `Cannot find module './promocion-vigente'`.

- [ ] **Step 3: Write the implementation**

```ts
// src/lib/comercios/promocion-vigente.ts

/**
 * Vigencia de una promoción: debe estar activa y, si tiene fechas límite, hoy
 * debe caer dentro del rango. Fechas nulas = sin límite. Formato 'YYYY-MM-DD'.
 */
export function esPromocionVigente(
  activo: boolean,
  fechaInicio: string | null,
  fechaFin: string | null,
  hoy: string,
): boolean {
  if (!activo) return false
  if (fechaInicio && hoy < fechaInicio) return false
  if (fechaFin && hoy > fechaFin) return false
  return true
}
```

- [ ] **Step 4: Run the tests to verify they pass**

Run: `pnpm exec vitest run src/lib/comercios/promocion-vigente.test.ts`
Expected: PASS, 6 tests.

- [ ] **Step 5: Commit**

```bash
git add src/lib/comercios/promocion-vigente.ts src/lib/comercios/promocion-vigente.test.ts
git commit -m "feat(comercios): función pura esPromocionVigente"
```

---

## Task 6: `requireRolComercio` guard

**Files:**
- Create: `src/lib/comercios/requerir-comercio.ts`

**Interfaces:**
- Consumes: `getPerfilActual` and `PerfilActual` from `@/lib/auth/auth`.
- Produces: `requireRolComercio(): Promise<PerfilActual>` — consumed by Task 8 (layout), Task 9, and
  Task 10 (server actions), Task 15 (`page.tsx`).

- [ ] **Step 1: Write the implementation**

```ts
// src/lib/comercios/requerir-comercio.ts
import { redirect } from 'next/navigation'
import { getPerfilActual, type PerfilActual } from '@/lib/auth/auth'

/**
 * Exige sesión activa con rol `comercio`. La usan el layout de `/comercios` y
 * las server actions del portal (defensa en profundidad, mismo patrón que
 * `requireRolMiembro`).
 */
export async function requireRolComercio(): Promise<PerfilActual> {
  const perfil = await getPerfilActual()

  if (!perfil || !perfil.activo) {
    redirect('/comercios/login')
  }
  if (perfil.rolCodigo !== 'comercio') {
    redirect('/comercios/login?error=sin_permiso')
  }

  return perfil
}
```

No dedicated test for this file — it's a thin `redirect()` wrapper, same as `requireRolMiembro`
(`src/lib/miembros/requerir-miembro.ts`), which also has no test. It's exercised by the manual
browser test in Task 16.

- [ ] **Step 2: Type-check**

Run: `pnpm exec tsc --noEmit`
Expected: no new errors.

- [ ] **Step 3: Commit**

```bash
git add src/lib/comercios/requerir-comercio.ts
git commit -m "feat(comercios): requireRolComercio"
```

---

## Task 7: Login de comercios (`/comercios/login`)

**Files:**
- Create: `src/app/comercios/login/page.tsx`
- Create: `src/app/comercios/login/_components/login-form.tsx`
- Create: `src/app/comercios/login/actions.ts`

**Interfaces:**
- Produces: `iniciarSesionComercio(prevState: LoginComercioState, formData: FormData): Promise<LoginComercioState>`
  and `cerrarSesionComercio(): Promise<void>` — `cerrarSesionComercio` is consumed by Task 8 (layout).
- `LoginComercioState = { error?: string }`

- [ ] **Step 1: Write `actions.ts`**

```ts
// src/app/comercios/login/actions.ts
'use server'

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getPerfilActual } from '@/lib/auth/auth'

export type LoginComercioState = { error?: string }

/** Inicia sesión de un comercio con correo + contraseña (RF-20). */
export async function iniciarSesionComercio(
  _prevState: LoginComercioState,
  formData: FormData,
): Promise<LoginComercioState> {
  const email = String(formData.get('email') ?? '').trim()
  const password = String(formData.get('password') ?? '')

  if (!email || !password) {
    return { error: 'Ingresa tu correo y tu contraseña.' }
  }

  const supabase = await createClient()
  const { error } = await supabase.auth.signInWithPassword({ email, password })
  if (error) {
    return { error: 'Correo o contraseña incorrectos.' }
  }

  const perfil = await getPerfilActual()
  if (!perfil || !perfil.activo) {
    await supabase.auth.signOut()
    return { error: 'Tu cuenta está inactiva. Contacta al administrador.' }
  }

  if (perfil.rolCodigo !== 'comercio') {
    await supabase.auth.signOut()
    return { error: 'Este acceso es exclusivo para comercios.' }
  }

  redirect('/comercios')
}

/** Cierra la sesión actual y vuelve al login de comercios. */
export async function cerrarSesionComercio() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  redirect('/comercios/login')
}
```

- [ ] **Step 2: Write `_components/login-form.tsx`**

```tsx
// src/app/comercios/login/_components/login-form.tsx
'use client'

import { useActionState } from 'react'
import { iniciarSesionComercio, type LoginComercioState } from '../actions'

const estadoInicial: LoginComercioState = {}

export function LoginComercioForm({ mensajeInicial }: { mensajeInicial?: string }) {
  const [state, formAction, pending] = useActionState(iniciarSesionComercio, estadoInicial)
  const error = state.error ?? mensajeInicial

  return (
    <form action={formAction}>
      {error && (
        <p className="orum-alert orum-alert--error" role="alert">
          {error}
        </p>
      )}

      <div className="orum-field">
        <label className="orum-label" htmlFor="email">
          Correo electrónico
        </label>
        <input
          id="email"
          name="email"
          type="email"
          className="orum-input"
          autoComplete="username"
          required
        />
      </div>

      <div className="orum-field">
        <label className="orum-label" htmlFor="password">
          Contraseña
        </label>
        <input
          id="password"
          name="password"
          type="password"
          className="orum-input"
          autoComplete="current-password"
          required
        />
      </div>

      <button type="submit" className="orum-button" disabled={pending} style={{ width: '100%' }}>
        {pending ? 'Ingresando…' : 'Iniciar sesión'}
      </button>
    </form>
  )
}
```

- [ ] **Step 3: Write `page.tsx`**

```tsx
// src/app/comercios/login/page.tsx
import { redirect } from 'next/navigation'
import { getPerfilActual } from '@/lib/auth/auth'
import { LoginComercioForm } from './_components/login-form'

export const metadata = { title: 'Iniciar sesión · ORUM Comercios' }

const MENSAJES: Record<string, string> = {
  sin_permiso: 'Ese acceso no tiene una cuenta de comercio asociada.',
}

export default async function LoginComercioPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>
}) {
  const perfil = await getPerfilActual()
  if (perfil && perfil.activo && perfil.rolCodigo === 'comercio') {
    redirect('/comercios')
  }

  const { error } = await searchParams
  const mensajeInicial = error ? MENSAJES[error] : undefined

  return (
    <main
      style={{
        flex: 1,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '2rem 1rem',
      }}
    >
      <div className="orum-card" style={{ width: '100%', maxWidth: 400 }}>
        <div style={{ marginBottom: '1.5rem', textAlign: 'center' }}>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 700 }}>ORUM</h1>
          <p className="orum-muted" style={{ fontSize: '0.9rem', marginTop: '0.25rem' }}>
            Portal de Comercios
          </p>
        </div>
        <LoginComercioForm mensajeInicial={mensajeInicial} />
      </div>
    </main>
  )
}
```

- [ ] **Step 4: Type-check and lint**

Run: `pnpm exec tsc --noEmit && pnpm lint`
Expected: no errors.

- [ ] **Step 5: Commit**

```bash
git add src/app/comercios/login
git commit -m "feat(comercios): login de comercios (RF-20)"
```

---

## Task 8: Layout protegido (`/comercios/(portal)/layout.tsx`)

**Files:**
- Create: `src/app/comercios/(portal)/layout.tsx`

**Interfaces:**
- Consumes: `requireRolComercio` (Task 6), `cerrarSesionComercio` (Task 7), `Row` from `@/components/ui`.

- [ ] **Step 1: Write the implementation**

```tsx
// src/app/comercios/(portal)/layout.tsx
import Link from 'next/link'
import { requireRolComercio } from '@/lib/comercios/requerir-comercio'
import { cerrarSesionComercio } from '../login/actions'
import { Row } from '@/components/ui'

export const metadata = { title: 'Portal de Comercios · ORUM' }

export default async function ComerciosLayout({ children }: { children: React.ReactNode }) {
  const perfil = await requireRolComercio()

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
      <Row
        gap="1.5rem"
        style={{
          alignItems: 'center',
          padding: '0.75rem 1.5rem',
          borderBottom: '1px solid var(--orum-border)',
          flexWrap: 'wrap',
        }}
      >
        <Link href="/comercios" style={{ fontWeight: 700, fontSize: '1.15rem' }}>
          ORUM
        </Link>

        <Row gap="1rem" style={{ flex: 1 }}>
          <Link href="/comercios">Verificar membresía</Link>
        </Row>

        <span className="orum-muted" style={{ fontSize: '0.85rem' }}>
          {perfil.email}
        </span>
        <form action={cerrarSesionComercio}>
          <button type="submit" className="orum-button orum-button--secondary">
            Cerrar sesión
          </button>
        </form>
      </Row>

      <main style={{ flex: 1, padding: '1.5rem', maxWidth: 1100, width: '100%', margin: '0 auto' }}>
        {children}
      </main>
    </div>
  )
}
```

- [ ] **Step 2: Type-check**

Run: `pnpm exec tsc --noEmit`
Expected: no new errors (this file references `page.tsx` under `(portal)/`, which doesn't exist
yet — that's fine, Next.js route groups don't require it to compile; `tsc` only checks this file's
own imports, all of which already exist).

- [ ] **Step 3: Commit**

```bash
git add "src/app/comercios/(portal)/layout.tsx"
git commit -m "feat(comercios): layout protegido del portal"
```

---

## Task 9: Server action `buscarMiembro`

**Files:**
- Create: `src/app/comercios/(portal)/actions.ts`

**Interfaces:**
- Consumes: `requireRolComercio` (Task 6), `createClient` from `@/lib/supabase/server`, the
  `buscar_miembro_comercio` RPC typed in Task 2, `MetodoRegistroVenta` from
  `@/lib/supabase/database.types`.
- Produces: `type MiembroEncontrado = { id: number; nombreCompleto: string; numeroMembresia: string; vigente: boolean; membresiaId: number | null; planNombre: string | null }`,
  `type BuscarMiembroState = { error?: string; miembro?: MiembroEncontrado; metodo?: MetodoRegistroVenta }`,
  `buscarMiembro(prevState: BuscarMiembroState, formData: FormData): Promise<BuscarMiembroState>` —
  consumed by Task 14 (`BuscarMiembroForm`).

- [ ] **Step 1: Write the implementation**

```ts
// src/app/comercios/(portal)/actions.ts
'use server'

import { createClient } from '@/lib/supabase/server'
import { requireRolComercio } from '@/lib/comercios/requerir-comercio'
import type { MetodoRegistroVenta } from '@/lib/supabase/database.types'

export type MiembroEncontrado = {
  id: number
  nombreCompleto: string
  numeroMembresia: string
  vigente: boolean
  membresiaId: number | null
  planNombre: string | null
}

export type BuscarMiembroState = {
  error?: string
  miembro?: MiembroEncontrado
  metodo?: MetodoRegistroVenta
}

/** Busca un miembro por número de membresía vía la función segura `buscar_miembro_comercio` (RF-21/RF-22). */
export async function buscarMiembro(
  _prev: BuscarMiembroState,
  formData: FormData,
): Promise<BuscarMiembroState> {
  await requireRolComercio()

  const numero = String(formData.get('numero_membresia') ?? '').trim()
  const metodo: MetodoRegistroVenta = formData.get('metodo') === 'qr' ? 'qr' : 'numero'

  if (!/^\d{8}$/.test(numero)) {
    return { error: 'Ingresa un número de membresía válido (8 dígitos).' }
  }

  const supabase = await createClient()
  const { data, error } = await supabase
    .rpc('buscar_miembro_comercio', { p_numero: numero })
    .maybeSingle()

  if (error) {
    return { error: 'No se pudo verificar el miembro. Intenta de nuevo.' }
  }
  if (!data) {
    return { error: 'No se encontró un miembro con ese número.' }
  }

  return {
    metodo,
    miembro: {
      id: data.miembro_id,
      nombreCompleto: `${data.nombres} ${data.apellidos}`.trim(),
      numeroMembresia: data.numero_membresia,
      vigente: data.vigente,
      membresiaId: data.membresia_id,
      planNombre: data.plan_nombre,
    },
  }
}
```

- [ ] **Step 2: Type-check**

Run: `pnpm exec tsc --noEmit`
Expected: no new errors.

- [ ] **Step 3: Commit**

```bash
git add "src/app/comercios/(portal)/actions.ts"
git commit -m "feat(comercios): server action buscarMiembro"
```

---

## Task 10: Server action `registrarVenta`

**Files:**
- Modify: `src/app/comercios/(portal)/actions.ts` (append to the file from Task 9)

**Interfaces:**
- Consumes: `calcularDescuento`, `calcularValorFinal` (Task 4), `esPromocionVigente` (Task 5),
  `hoyISO` from `@/lib/shared/fecha` (Task 3).
- Produces: `type RegistrarVentaState = { error?: string; ok?: boolean }`,
  `registrarVenta(prevState: RegistrarVentaState, formData: FormData): Promise<RegistrarVentaState>` —
  consumed by Task 13 (`ConfirmarVentaForm`).

- [ ] **Step 1: Add the imports**

At the top of `src/app/comercios/(portal)/actions.ts`, add:

```ts
import { calcularDescuento, calcularValorFinal } from '@/lib/comercios/ventas'
import { esPromocionVigente } from '@/lib/comercios/promocion-vigente'
import { hoyISO } from '@/lib/shared/fecha'
```

- [ ] **Step 2: Append the implementation**

```ts
export type RegistrarVentaState = { error?: string; ok?: boolean }

/**
 * Registra la venta (RF-21/RF-22): valida que la sucursal y la promoción sean
 * del propio comercio, recalcula el descuento en servidor (no confía en el
 * valor que mandó el formulario) y luego inserta en `ventas`.
 */
export async function registrarVenta(
  _prev: RegistrarVentaState,
  formData: FormData,
): Promise<RegistrarVentaState> {
  const actor = await requireRolComercio()

  const miembroId = Number(formData.get('miembro_id'))
  const membresiaIdRaw = String(formData.get('membresia_id') ?? '')
  const membresiaId = membresiaIdRaw ? Number(membresiaIdRaw) : null
  const sucursalId = Number(formData.get('sucursal_id'))
  const promocionIdRaw = String(formData.get('promocion_id') ?? '')
  const promocionId = promocionIdRaw ? Number(promocionIdRaw) : null
  const metodoRegistro: MetodoRegistroVenta = formData.get('metodo_registro') === 'qr' ? 'qr' : 'numero'
  const valorCompra = Number(formData.get('valor_compra'))
  const valorDescuentoInput = Number(formData.get('valor_descuento'))

  if (!Number.isInteger(miembroId) || miembroId < 1) {
    return { error: 'Falta el identificador del miembro.' }
  }
  if (!Number.isInteger(sucursalId) || sucursalId < 1) {
    return { error: 'Selecciona la sucursal.' }
  }
  if (!Number.isFinite(valorCompra) || valorCompra < 0) {
    return { error: 'El valor de la compra debe ser un número mayor o igual a 0.' }
  }
  if (!Number.isFinite(valorDescuentoInput) || valorDescuentoInput < 0) {
    return { error: 'El valor del descuento debe ser un número mayor o igual a 0.' }
  }

  const supabase = await createClient()

  const { data: comercio } = await supabase
    .from('comercios')
    .select('id')
    .eq('perfil_id', actor.userId)
    .maybeSingle()
  if (!comercio) return { error: 'No se encontró el comercio asociado a esta cuenta.' }

  const { data: sucursal } = await supabase
    .from('sucursales')
    .select('id')
    .eq('id', sucursalId)
    .eq('comercio_id', comercio.id)
    .eq('activo', true)
    .maybeSingle()
  if (!sucursal) return { error: 'La sucursal seleccionada no es válida.' }

  let valorDescuento = 0
  if (promocionId) {
    const { data: promo } = await supabase
      .from('promociones')
      .select('id, comercio_id, tipo_beneficio_id, valor, activo, fecha_inicio, fecha_fin')
      .eq('id', promocionId)
      .maybeSingle()
    if (!promo || promo.comercio_id !== comercio.id) {
      return { error: 'La promoción seleccionada no es válida.' }
    }

    const { data: tipo } = await supabase
      .from('tipos_beneficio')
      .select('codigo')
      .eq('id', promo.tipo_beneficio_id)
      .single()

    if (!tipo || !esPromocionVigente(promo.activo, promo.fecha_inicio, promo.fecha_fin, hoyISO())) {
      return { error: 'Esa promoción ya no está vigente.' }
    }

    valorDescuento =
      tipo.codigo === 'porcentaje' || tipo.codigo === 'monto_fijo'
        ? calcularDescuento(tipo.codigo, promo.valor ?? 0, valorCompra)
        : valorDescuentoInput
  }

  const valorFinal = calcularValorFinal(valorCompra, valorDescuento)

  const { error: errVenta } = await supabase.from('ventas').insert({
    miembro_id: miembroId,
    membresia_id: membresiaId,
    sucursal_id: sucursalId,
    promocion_id: promocionId,
    valor_compra: valorCompra,
    valor_descuento: valorDescuento,
    valor_final: valorFinal,
    metodo_registro: metodoRegistro,
    registrada_por_perfil: actor.userId,
  })
  if (errVenta) return { error: `No se pudo registrar la venta: ${errVenta.message}` }

  return { ok: true }
}
```

- [ ] **Step 3: Type-check**

Run: `pnpm exec tsc --noEmit`
Expected: no new errors.

- [ ] **Step 4: Commit**

```bash
git add "src/app/comercios/(portal)/actions.ts"
git commit -m "feat(comercios): server action registrarVenta"
```

---

## Task 11: Componente `EscanerQr`

**Files:**
- Create: `src/app/comercios/(portal)/_components/escaner-qr.tsx`
- Modify: `package.json` (new dependency)

**Interfaces:**
- Produces: `EscanerQr({ onDetectado: (valor: string) => void; onError: () => void })` — consumed
  by Task 14 (`BuscarMiembroForm`).

- [ ] **Step 1: Add the dependency**

Run: `pnpm add @yudiel/react-qr-scanner`

- [ ] **Step 2: Write the implementation**

```tsx
// src/app/comercios/(portal)/_components/escaner-qr.tsx
'use client'

import { Scanner } from '@yudiel/react-qr-scanner'

type CodigoDetectado = { rawValue: string }

/**
 * Escáner de QR con cámara. Si la cámara falla o no hay permiso, `onError` la
 * cierra y el operador sigue usando el input manual (siempre disponible).
 */
export function EscanerQr({
  onDetectado,
  onError,
}: {
  onDetectado: (valor: string) => void
  onError: () => void
}) {
  return (
    <div className="orum-card" style={{ maxWidth: 360, marginTop: '0.75rem' }}>
      <Scanner
        onScan={(codigos: CodigoDetectado[]) => {
          const valor = codigos[0]?.rawValue
          if (valor) onDetectado(valor)
        }}
        onError={onError}
      />
    </div>
  )
}
```

- [ ] **Step 3: Type-check**

Run: `pnpm exec tsc --noEmit`
Expected: no new errors. If `Scanner`'s `onScan` prop type rejects the local `CodigoDetectado[]`
parameter type, import the real type instead: `import type { IDetectedBarcode } from '@yudiel/react-qr-scanner'`
and use `(codigos: IDetectedBarcode[]) => ...`.

- [ ] **Step 4: Commit**

```bash
git add package.json pnpm-lock.yaml "src/app/comercios/(portal)/_components/escaner-qr.tsx"
git commit -m "feat(comercios): componente EscanerQr"
```

---

## Task 12: Componente `ResultadoMiembro`

**Files:**
- Create: `src/app/comercios/(portal)/_components/resultado-miembro.tsx`

**Interfaces:**
- Consumes: `MiembroEncontrado` (Task 9), `Badge` from `@/components/ui`.
- Produces: `ResultadoMiembro({ miembro: MiembroEncontrado })` — consumed by Task 14.

- [ ] **Step 1: Write the implementation**

```tsx
// src/app/comercios/(portal)/_components/resultado-miembro.tsx
import { Badge } from '@/components/ui'
import type { MiembroEncontrado } from '../actions'

export function ResultadoMiembro({ miembro }: { miembro: MiembroEncontrado }) {
  return (
    <div className="orum-card" style={{ marginTop: '1rem' }}>
      <p style={{ fontWeight: 700, fontSize: '1.1rem' }}>{miembro.nombreCompleto}</p>
      <p className="orum-muted" style={{ fontSize: '0.85rem', marginBottom: '0.5rem' }}>
        N.º {miembro.numeroMembresia}
      </p>
      <Badge tone={miembro.vigente ? 'on' : 'off'}>{miembro.vigente ? 'Activa' : 'Inactiva'}</Badge>
      {miembro.vigente && miembro.planNombre && (
        <p style={{ marginTop: '0.5rem' }}>
          <strong>Plan:</strong> {miembro.planNombre}
        </p>
      )}
    </div>
  )
}
```

- [ ] **Step 2: Type-check**

Run: `pnpm exec tsc --noEmit`
Expected: no new errors.

- [ ] **Step 3: Commit**

```bash
git add "src/app/comercios/(portal)/_components/resultado-miembro.tsx"
git commit -m "feat(comercios): componente ResultadoMiembro"
```

---

## Task 13: Componente `ConfirmarVentaForm`

**Files:**
- Create: `src/app/comercios/(portal)/_components/confirmar-venta-form.tsx`

**Interfaces:**
- Consumes: `registrarVenta`, `RegistrarVentaState` (Task 10); `calcularDescuento`,
  `calcularValorFinal` (Task 4); `formatearBeneficio` from `@/lib/comercios/beneficios-formato`
  (already exists); `Alert`, `Select` from `@/components/ui`; `MetodoRegistroVenta`,
  `TipoBeneficioCodigo` from `@/lib/supabase/database.types`.
- Produces: `ConfirmarVentaForm({ miembroId: number; membresiaId: number | null; metodo: MetodoRegistroVenta; sucursales: { id: number; nombre: string | null }[]; promociones: { id: number; titulo: string; tipoCodigo: TipoBeneficioCodigo; valor: number | null }[]; onExito: () => void })` —
  consumed by Task 14.

- [ ] **Step 1: Write the implementation**

```tsx
// src/app/comercios/(portal)/_components/confirmar-venta-form.tsx
'use client'

import { useActionState, useMemo, useState } from 'react'
import { Alert, Select } from '@/components/ui'
import { formatearBeneficio } from '@/lib/comercios/beneficios-formato'
import { calcularDescuento, calcularValorFinal } from '@/lib/comercios/ventas'
import { registrarVenta, type RegistrarVentaState } from '../actions'
import type { MetodoRegistroVenta, TipoBeneficioCodigo } from '@/lib/supabase/database.types'

type Sucursal = { id: number; nombre: string | null }
type Promocion = { id: number; titulo: string; tipoCodigo: TipoBeneficioCodigo; valor: number | null }

const estadoInicial: RegistrarVentaState = {}

export function ConfirmarVentaForm({
  miembroId,
  membresiaId,
  metodo,
  sucursales,
  promociones,
  onExito,
}: {
  miembroId: number
  membresiaId: number | null
  metodo: MetodoRegistroVenta
  sucursales: Sucursal[]
  promociones: Promocion[]
  onExito: () => void
}) {
  const [state, formAction, pending] = useActionState(registrarVenta, estadoInicial)
  const [promocionId, setPromocionId] = useState('')
  const [valorCompra, setValorCompra] = useState('0')
  const [descuentoManual, setDescuentoManual] = useState('0')

  const promocionSeleccionada = promociones.find((p) => String(p.id) === promocionId) ?? null
  const calculoAutomatico =
    promocionSeleccionada?.tipoCodigo === 'porcentaje' || promocionSeleccionada?.tipoCodigo === 'monto_fijo'
  const editable = promocionSeleccionada !== null && !calculoAutomatico

  const valorDescuento = useMemo(() => {
    if (!promocionSeleccionada) return 0
    if (calculoAutomatico) {
      return calcularDescuento(
        promocionSeleccionada.tipoCodigo as 'porcentaje' | 'monto_fijo',
        promocionSeleccionada.valor ?? 0,
        Number(valorCompra) || 0,
      )
    }
    return Number(descuentoManual) || 0
  }, [promocionSeleccionada, calculoAutomatico, valorCompra, descuentoManual])

  const valorFinal = calcularValorFinal(Number(valorCompra) || 0, valorDescuento)

  if (state.ok) {
    return (
      <div className="orum-card" style={{ marginTop: '1rem' }}>
        <Alert tone="success">Venta registrada correctamente.</Alert>
        <button
          type="button"
          className="orum-button"
          onClick={onExito}
          style={{ marginTop: '0.75rem' }}
        >
          Verificar otro miembro
        </button>
      </div>
    )
  }

  return (
    <form action={formAction} className="orum-card" style={{ marginTop: '1rem' }}>
      <input type="hidden" name="miembro_id" value={miembroId} />
      <input type="hidden" name="membresia_id" value={membresiaId ?? ''} />
      <input type="hidden" name="metodo_registro" value={metodo} />

      {state.error && <Alert tone="error">{state.error}</Alert>}

      <Select
        label="Promoción aplicada"
        htmlFor="promocion_id"
        name="promocion_id"
        value={promocionId}
        onChange={(e) => setPromocionId(e.target.value)}
      >
        <option value="">Sin promoción</option>
        {promociones.map((p) => (
          <option key={p.id} value={p.id}>
            {p.titulo} — {formatearBeneficio(p.tipoCodigo, p.valor)}
          </option>
        ))}
      </Select>

      {sucursales.length > 1 ? (
        <Select label="Sucursal" htmlFor="sucursal_id" name="sucursal_id" required defaultValue="">
          <option value="" disabled>
            Selecciona una sucursal
          </option>
          {sucursales.map((s) => (
            <option key={s.id} value={s.id}>
              {s.nombre ?? `Sucursal ${s.id}`}
            </option>
          ))}
        </Select>
      ) : (
        <input type="hidden" name="sucursal_id" value={sucursales[0]?.id ?? ''} />
      )}

      <div className="orum-field">
        <label className="orum-label" htmlFor="valor_compra">
          Valor de la compra
        </label>
        <input
          id="valor_compra"
          name="valor_compra"
          type="number"
          min={0}
          step="1"
          className="orum-input"
          value={valorCompra}
          onChange={(e) => setValorCompra(e.target.value)}
          required
        />
      </div>

      <div className="orum-field">
        <label className="orum-label" htmlFor="valor_descuento">
          Valor del descuento
        </label>
        <input
          id="valor_descuento"
          name="valor_descuento"
          type="number"
          min={0}
          step="1"
          className="orum-input"
          value={valorDescuento}
          onChange={(e) => setDescuentoManual(e.target.value)}
          readOnly={!editable}
        />
      </div>

      <p className="orum-muted">Valor final: ${valorFinal.toLocaleString('es-CO')}</p>

      <button type="submit" className="orum-button" disabled={pending} style={{ width: '100%' }}>
        {pending ? 'Registrando…' : 'Registrar venta'}
      </button>
    </form>
  )
}
```

- [ ] **Step 2: Type-check**

Run: `pnpm exec tsc --noEmit`
Expected: no new errors.

- [ ] **Step 3: Commit**

```bash
git add "src/app/comercios/(portal)/_components/confirmar-venta-form.tsx"
git commit -m "feat(comercios): componente ConfirmarVentaForm"
```

---

## Task 14: Componente `BuscarMiembroForm`

**Files:**
- Create: `src/app/comercios/(portal)/_components/buscar-miembro-form.tsx`

**Interfaces:**
- Consumes: `buscarMiembro`, `BuscarMiembroState` (Task 9); `EscanerQr` (Task 11);
  `ResultadoMiembro` (Task 12); `ConfirmarVentaForm` (Task 13).
- Produces: `BuscarMiembroForm({ sucursales: { id: number; nombre: string | null }[]; promociones: { id: number; titulo: string; tipoCodigo: TipoBeneficioCodigo; valor: number | null }[]; onNuevaVerificacion: () => void })` —
  consumed by Task 15 (`VerificacionTool`).

- [ ] **Step 1: Write the implementation**

```tsx
// src/app/comercios/(portal)/_components/buscar-miembro-form.tsx
'use client'

import { useActionState, useState } from 'react'
import { Alert } from '@/components/ui'
import { buscarMiembro, type BuscarMiembroState } from '../actions'
import { EscanerQr } from './escaner-qr'
import { ResultadoMiembro } from './resultado-miembro'
import { ConfirmarVentaForm } from './confirmar-venta-form'
import type { TipoBeneficioCodigo } from '@/lib/supabase/database.types'

type Sucursal = { id: number; nombre: string | null }
type Promocion = { id: number; titulo: string; tipoCodigo: TipoBeneficioCodigo; valor: number | null }

const estadoInicial: BuscarMiembroState = {}

export function BuscarMiembroForm({
  sucursales,
  promociones,
  onNuevaVerificacion,
}: {
  sucursales: Sucursal[]
  promociones: Promocion[]
  onNuevaVerificacion: () => void
}) {
  const [state, formAction, pending] = useActionState(buscarMiembro, estadoInicial)
  const [mostrarCamara, setMostrarCamara] = useState(false)
  const [numero, setNumero] = useState('')
  const [metodo, setMetodo] = useState<'qr' | 'numero'>('numero')

  return (
    <div>
      <form action={formAction} className="orum-card">
        {state.error && <Alert tone="error">{state.error}</Alert>}

        <div className="orum-field">
          <label className="orum-label" htmlFor="numero_membresia">
            Número de membresía
          </label>
          <input
            id="numero_membresia"
            name="numero_membresia"
            type="text"
            inputMode="numeric"
            className="orum-input"
            placeholder="00012345"
            value={numero}
            onChange={(e) => {
              setNumero(e.target.value)
              setMetodo('numero')
            }}
            required
          />
        </div>
        <input type="hidden" name="metodo" value={metodo} />

        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button type="submit" className="orum-button" disabled={pending}>
            {pending ? 'Buscando…' : 'Buscar'}
          </button>
          <button
            type="button"
            className="orum-button orum-button--secondary"
            onClick={() => setMostrarCamara((v) => !v)}
          >
            {mostrarCamara ? 'Cerrar cámara' : 'Escanear QR'}
          </button>
        </div>
      </form>

      {mostrarCamara && (
        <EscanerQr
          onDetectado={(valor) => {
            setNumero(valor)
            setMetodo('qr')
            setMostrarCamara(false)
          }}
          onError={() => setMostrarCamara(false)}
        />
      )}

      {state.miembro && (
        <>
          <ResultadoMiembro miembro={state.miembro} />
          {state.miembro.vigente && (
            <ConfirmarVentaForm
              miembroId={state.miembro.id}
              membresiaId={state.miembro.membresiaId}
              metodo={state.metodo ?? 'numero'}
              sucursales={sucursales}
              promociones={promociones}
              onExito={onNuevaVerificacion}
            />
          )}
        </>
      )}
    </div>
  )
}
```

- [ ] **Step 2: Type-check and lint**

Run: `pnpm exec tsc --noEmit && pnpm lint`
Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add "src/app/comercios/(portal)/_components/buscar-miembro-form.tsx"
git commit -m "feat(comercios): componente BuscarMiembroForm"
```

---

## Task 15: Orquestador `VerificacionTool` + `page.tsx`

**Files:**
- Create: `src/app/comercios/(portal)/_components/verificacion-tool.tsx`
- Create: `src/app/comercios/(portal)/page.tsx`

**Interfaces:**
- `verificacion-tool.tsx` consumes: `BuscarMiembroForm` (Task 14). Produces:
  `VerificacionTool({ sucursales: { id: number; nombre: string | null }[]; promociones: { id: number; titulo: string; tipoCodigo: TipoBeneficioCodigo; valor: number | null }[] })`.
- `page.tsx` consumes: `requireRolComercio` (Task 6), `esPromocionVigente` (Task 5), `hoyISO` from
  `@/lib/shared/fecha` (Task 3), `VerificacionTool`, `PageHeader`/`EmptyState` from `@/components/ui`.

- [ ] **Step 1: Write `_components/verificacion-tool.tsx`**

```tsx
// src/app/comercios/(portal)/_components/verificacion-tool.tsx
'use client'

import { useState } from 'react'
import { BuscarMiembroForm } from './buscar-miembro-form'
import type { TipoBeneficioCodigo } from '@/lib/supabase/database.types'

type Sucursal = { id: number; nombre: string | null }
type Promocion = { id: number; titulo: string; tipoCodigo: TipoBeneficioCodigo; valor: number | null }

/**
 * Envuelve `BuscarMiembroForm` con una `key` que se incrementa después de cada
 * venta registrada, para remontarlo con estado limpio (nuevo número, sin
 * resultado previo) sin recargar la página.
 */
export function VerificacionTool({
  sucursales,
  promociones,
}: {
  sucursales: Sucursal[]
  promociones: Promocion[]
}) {
  const [resetKey, setResetKey] = useState(0)

  return (
    <BuscarMiembroForm
      key={resetKey}
      sucursales={sucursales}
      promociones={promociones}
      onNuevaVerificacion={() => setResetKey((k) => k + 1)}
    />
  )
}
```

- [ ] **Step 2: Write `page.tsx`**

```tsx
// src/app/comercios/(portal)/page.tsx
import { requireRolComercio } from '@/lib/comercios/requerir-comercio'
import { createClient } from '@/lib/supabase/server'
import { PageHeader, EmptyState } from '@/components/ui'
import { esPromocionVigente } from '@/lib/comercios/promocion-vigente'
import { hoyISO } from '@/lib/shared/fecha'
import { VerificacionTool } from './_components/verificacion-tool'
import type { TipoBeneficioCodigo } from '@/lib/supabase/database.types'

export const metadata = { title: 'Verificar membresía · ORUM Comercios' }

export default async function ComerciosHomePage() {
  const perfil = await requireRolComercio()
  const supabase = await createClient()

  const { data: comercio } = await supabase
    .from('comercios')
    .select('id')
    .eq('perfil_id', perfil.userId)
    .maybeSingle()

  if (!comercio) {
    return (
      <div>
        <PageHeader title="Verificar membresía" />
        <EmptyState>No se encontró el comercio asociado a esta cuenta. Contacta al administrador.</EmptyState>
      </div>
    )
  }

  const [{ data: sucursales }, { data: promocionesRaw }, { data: tipos }] = await Promise.all([
    supabase
      .from('sucursales')
      .select('id, nombre')
      .eq('comercio_id', comercio.id)
      .eq('activo', true)
      .is('deleted_at', null)
      .order('nombre')
      .limit(50),
    supabase
      .from('promociones')
      .select('id, titulo, tipo_beneficio_id, valor, activo, fecha_inicio, fecha_fin')
      .eq('comercio_id', comercio.id)
      .eq('activo', true)
      .is('deleted_at', null)
      .limit(50),
    supabase.from('tipos_beneficio').select('id, codigo').limit(10),
  ])

  if (!sucursales || sucursales.length === 0) {
    return (
      <div>
        <PageHeader title="Verificar membresía" />
        <EmptyState>Este comercio no tiene sucursales activas. Contacta al administrador.</EmptyState>
      </div>
    )
  }

  const codigoPorTipoId = new Map((tipos ?? []).map((t) => [t.id, t.codigo as TipoBeneficioCodigo]))
  const hoy = hoyISO()
  const promociones = (promocionesRaw ?? [])
    .filter(
      (p) => esPromocionVigente(p.activo, p.fecha_inicio, p.fecha_fin, hoy) && codigoPorTipoId.has(p.tipo_beneficio_id),
    )
    .map((p) => ({
      id: p.id,
      titulo: p.titulo,
      tipoCodigo: codigoPorTipoId.get(p.tipo_beneficio_id)!,
      valor: p.valor,
    }))

  return (
    <div>
      <PageHeader title="Verificar membresía" />
      <VerificacionTool sucursales={sucursales} promociones={promociones} />
    </div>
  )
}
```

- [ ] **Step 3: Type-check, lint, and build**

Run: `pnpm exec tsc --noEmit && pnpm lint && pnpm build`
Expected: all three pass clean.

- [ ] **Step 4: Commit**

```bash
git add "src/app/comercios/(portal)/_components/verificacion-tool.tsx" "src/app/comercios/(portal)/page.tsx"
git commit -m "feat(comercios): pantalla de verificación y registro de venta"
```

---

## Task 16: Verificación final y ROADMAP

**Files:**
- Modify: `docs/ROADMAP.md`

- [ ] **Step 1: Run the full check suite**

Run: `pnpm exec tsc --noEmit && pnpm lint && pnpm test && pnpm build`
Expected: all four pass clean.

- [ ] **Step 2: Manual browser test checklist**

With the Task 1 SQL already applied and a real comercio account (created via `/admin/comercios`),
verify by hand:

- [ ] Login en `/comercios/login` con correo/contraseña del comercio; rechaza roles distintos.
- [ ] Búsqueda por número: miembro inexistente → mensaje de "no encontrado".
- [ ] Búsqueda por número: miembro con membresía vencida → badge "Inactiva", sin formulario de venta.
- [ ] Búsqueda por número: miembro vigente → badge "Activa", nombre y plan correctos, formulario de venta visible.
- [ ] Escaneo con cámara real (celular o laptop con webcam) rellena el número y lo marca como método `qr`.
- [ ] Promoción `porcentaje`: el campo de descuento se autocalcula y queda de solo lectura.
- [ ] Promoción `monto_fijo`: se autocalcula, limitado al valor de la compra si el fijo es mayor.
- [ ] Promoción `dos_por_uno` o `regalo`: el campo de descuento es editable a mano.
- [ ] "Sin promoción": descuento fijo en 0, no editable.
- [ ] Comercio con una sola sucursal activa: no aparece selector, se usa automáticamente.
- [ ] Comercio con varias sucursales activas: aparece el selector y es obligatorio.
- [ ] Al confirmar, la fila aparece en `ventas` (verificar en Supabase) con los valores correctos.
- [ ] "Verificar otro miembro" limpia todo el formulario para una nueva búsqueda.
- [ ] Registro/renovación de un miembro en `/admin/miembros` sigue funcionando igual que antes
      (confirma que extraer `hoyISO` en Task 3 no cambió el comportamiento existente).
- [ ] Prueba de acceso cruzado: con la sesión de un comercio distinto, confirmar que no puede
      insertar una venta con `sucursal_id` de otro comercio (debe fallar por la política RLS del
      Task 1), y que `buscar_miembro_comercio` nunca devuelve cédula/teléfono/dirección.

- [ ] **Step 3: Update `docs/ROADMAP.md`**

Add a new phase entry (adjust wording to match the doc's existing tone/format for prior phases —
see the "✅ Fase 5" entry for the pattern) marking this as implemented but pending the manual browser
test above, cross-reference the spec and this plan, and mark RF-20 to RF-22 covered in the
requirements table (§5). Also update §9 "Próximo paso sugerido" to reflect that the Herramienta de
Comercios is done and what's left (Portal Público, RF-01–04).

- [ ] **Step 4: Commit**

```bash
git add docs/ROADMAP.md
git commit -m "docs: marcar el Portal de Comercios como implementado en el ROADMAP"
```
