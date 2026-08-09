# Portal de Miembros — Plan de implementación

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Construir `/miembros/**` — login por número de membresía, perfil de solo lectura con QR, y un listado único de comercios/promociones con búsqueda y filtros — cubriendo RF-06 a RF-14.

**Architecture:** Mismo patrón que Fases 1-4: Server Components para lectura con una guardia de acceso al inicio (`requireRolMiembro`/`requireMiembroVigente`, análogas a `requireRol`), Server Actions `'use server'` para el login, componentes de formulario `'use client'` con `useActionState`. A diferencia de `/admin` (que usa `createAdminClient()` con `service_role`), `/miembros/**` usa el cliente de sesión (`createClient()`) porque ahora hay RLS activo en Supabase protegiendo los datos por usuario — ver spec §5. La única excepción es la resolución de número de membresía → correo en el login, que ocurre antes de que exista sesión.

**Tech Stack:** Next.js 16 (App Router, Server Actions), React 19, Supabase (`@supabase/ssr`, `@supabase/supabase-js`), TypeScript, Vitest, `react-qr-code`.

## Global Constraints

- Spec de referencia: `docs/superpowers/specs/2026-08-09-portal-miembros-design.md`. Cada tarea referencia su sección.
- **RLS ya está activo en Supabase** (tarea previa completada y verificada manualmente por el usuario: `miembros`/`membresias` filtran a la fila propia, `comercios` muestra el catálogo activo completo). Todo el código de `/miembros/**` debe usar `createClient()` (`@/lib/supabase/server`), **nunca** `createAdminClient()`, excepto la única función de §Task 4.
- El perfil del miembro es de **solo lectura** — no se construye ningún formulario de edición en este plan.
- El QR usa `numero_membresia` como payload (decisión ya tomada en Fase 2, confirmada en spec §7).
- Las promociones no se filtran por `fecha_inicio`/`fecha_fin` (son informativas, decisión ya tomada en Fase 3) — solo por `activo = true AND deleted_at IS NULL`.
- `requireRol` (`lib/auth/auth.ts`) **no se modifica** — redirige a `/login`, que es correcto solo para el portal admin. El portal de miembros usa sus propias guardias (Task 5) que redirigen a `/miembros/login`, para no romper el login de `/admin` y evitar un bucle de redirect entre el layout y `/miembros/inactiva`.
- Patrón de pruebas igual que en fases anteriores: **solo las funciones puras de `src/lib/**` llevan pruebas automatizadas** (Vitest). El resto (server actions, páginas) se verifica manualmente contra los criterios de aceptación del spec (§11).
- Todas las tablas nuevas que se consultan (`comercios`, `sucursales`, `promociones`, `marcas`, `categorias`, `ciudades`, `tipos_beneficio`, `planes_membresia`, `configuracion`, `miembros`, `membresias`) ya existen en Supabase con RLS — no hay migraciones SQL en este plan.

## Notas antes de empezar

1. **Confirma que existe la fila de configuración de soporte.** En el SQL Editor de Supabase:
   ```sql
   SELECT * FROM configuracion WHERE clave = 'whatsapp_soporte';
   ```
   Si no devuelve fila, insértala (ajusta el número real):
   ```sql
   INSERT INTO configuracion (clave, valor, descripcion)
   VALUES ('whatsapp_soporte', '573001234567', 'Número de WhatsApp de soporte para miembros');
   ```
   Sin esta fila, el botón de soporte no se muestra (el código lo maneja de forma segura, pero no vas a poder probarlo visualmente).

2. **Necesitas un miembro de prueba con membresía vigente y contraseña conocida.** Las contraseñas de miembros se autogeneraron y se mostraron una sola vez al crearlos (Fase 2) — probablemente ya no la tengas. Antes del Task 10, resetea la contraseña de un miembro real desde el dashboard de Supabase: **Authentication → Users → busca el correo asociado al `perfil_id` del miembro → "Send password recovery"** o defínela manualmente ahí mismo. Anota el `numero_membresia` de ese miembro (`SELECT numero_membresia FROM miembros WHERE id = ...`).

3. **Necesitas también un miembro con membresía vencida/suspendida** para probar el bloqueo (`/miembros/inactiva`) del Task 12. Si no existe uno de prueba, puedes editar temporalmente el `estado` de una membresía existente en Supabase (`UPDATE membresias SET estado = 'suspendida' WHERE id = ...`) y revertirlo después de probar.

---

## Task 1: Extender `database.types.ts` con la tabla `configuracion`

**Files:**
- Modify: `src/lib/supabase/database.types.ts`

**Interfaces:**
- Produces: entrada `configuracion` en `Database['public']['Tables']`, usada por Task 11 (layout) y Task 12 (`/miembros/inactiva`) para leer `whatsapp_soporte`.

`configuracion` es la única tabla del spec que faltaba tipar (existe en Supabase — ver `docs/referencia/Esquema_BD.txt` — pero nunca se había consultado desde el código).

- [ ] **Step 1: Agregar la tabla al final de `Tables`, después de `ventas`**

En `src/lib/supabase/database.types.ts`, inserta antes del cierre `}` de `Tables` (después de la definición de `ventas`, línea ~390):

```ts
      configuracion: {
        Row: {
          id: number
          clave: string
          valor: string | null
          descripcion: string | null
          updated_at: Timestamp
        }
        Insert: {
          id?: number
          clave: string
          valor?: string | null
          descripcion?: string | null
          updated_at?: Timestamp
        }
        Update: Partial<Database['public']['Tables']['configuracion']['Insert']>
        Relationships: []
      }
```

- [ ] **Step 2: Verificar que el proyecto sigue compilando**

Run: `npx tsc --noEmit`
Expected: sin errores.

- [ ] **Step 3: Commit**

```bash
git add src/lib/supabase/database.types.ts
git commit -m "types: agregar tabla configuracion"
```

---

## Task 2: Función pura `esMembresiaVigente` con pruebas

**Files:**
- Create: `src/lib/miembros/membresia-vigente.ts`
- Test: `src/lib/miembros/membresia-vigente.test.ts`

**Interfaces:**
- Produces: `esMembresiaVigente(estado: EstadoMembresia, fechaFin: string, hoy: string): boolean`, usada por Task 5 (`requireMiembroVigente`).

El `estado` guardado en `membresias` no se actualiza solo cuando `fecha_fin` pasa (no hay job que lo haga — deuda técnica ya anotada en el ROADMAP), así que la vigencia real exige comprobar **ambas** cosas: `estado === 'activa'` Y `fecha_fin >= hoy`.

- [ ] **Step 1: Escribir las pruebas (deben fallar primero)**

Crea `src/lib/miembros/membresia-vigente.test.ts`:

```ts
import { describe, it, expect } from 'vitest'
import { esMembresiaVigente } from './membresia-vigente'

describe('esMembresiaVigente', () => {
  it('vigente: activa y fecha_fin en el futuro', () => {
    expect(esMembresiaVigente('activa', '2026-12-31', '2026-08-09')).toBe(true)
  })

  it('vigente: activa y fecha_fin es hoy mismo', () => {
    expect(esMembresiaVigente('activa', '2026-08-09', '2026-08-09')).toBe(true)
  })

  it('no vigente: activa pero fecha_fin ya pasó (nadie la marcó vencida)', () => {
    expect(esMembresiaVigente('activa', '2026-08-01', '2026-08-09')).toBe(false)
  })

  it('no vigente: estado vencida', () => {
    expect(esMembresiaVigente('vencida', '2026-12-31', '2026-08-09')).toBe(false)
  })

  it('no vigente: estado suspendida', () => {
    expect(esMembresiaVigente('suspendida', '2026-12-31', '2026-08-09')).toBe(false)
  })

  it('no vigente: estado cancelada', () => {
    expect(esMembresiaVigente('cancelada', '2026-12-31', '2026-08-09')).toBe(false)
  })
})
```

- [ ] **Step 2: Ejecutar y confirmar que falla**

Run: `npx vitest run src/lib/miembros/membresia-vigente.test.ts`
Expected: FAIL — `Cannot find module './membresia-vigente'`.

- [ ] **Step 3: Implementación mínima**

Crea `src/lib/miembros/membresia-vigente.ts`:

```ts
import type { EstadoMembresia } from '@/lib/supabase/database.types'

/**
 * Vigencia real de una membresía. `estado` no se actualiza solo al pasar
 * `fecha_fin` (no hay job automático), por eso se comprueban ambas cosas.
 * Todas las fechas en formato 'YYYY-MM-DD'.
 */
export function esMembresiaVigente(
  estado: EstadoMembresia,
  fechaFin: string,
  hoy: string,
): boolean {
  return estado === 'activa' && fechaFin >= hoy
}
```

- [ ] **Step 4: Ejecutar y confirmar que pasa**

Run: `npx vitest run src/lib/miembros/membresia-vigente.test.ts`
Expected: PASS (6/6).

- [ ] **Step 5: Commit**

```bash
git add src/lib/miembros/membresia-vigente.ts src/lib/miembros/membresia-vigente.test.ts
git commit -m "feat: función pura esMembresiaVigente con pruebas"
```

---

## Task 3: Función pura `formatearBeneficio` con pruebas

**Files:**
- Create: `src/lib/comercios/beneficios-formato.ts`
- Test: `src/lib/comercios/beneficios-formato.test.ts`

**Interfaces:**
- Produces: `formatearBeneficio(tipoCodigo: TipoBeneficioCodigo, valor: number | null): string`, usada por Task 14 (`ComercioCard`).

- [ ] **Step 1: Escribir las pruebas**

Crea `src/lib/comercios/beneficios-formato.test.ts`:

```ts
import { describe, it, expect } from 'vitest'
import { formatearBeneficio } from './beneficios-formato'

describe('formatearBeneficio', () => {
  it('porcentaje', () => {
    expect(formatearBeneficio('porcentaje', 20)).toBe('20% de descuento')
  })

  it('monto_fijo', () => {
    expect(formatearBeneficio('monto_fijo', 15000)).toBe('$15.000 de descuento')
  })

  it('dos_por_uno', () => {
    expect(formatearBeneficio('dos_por_uno', null)).toBe('2x1')
  })

  it('regalo', () => {
    expect(formatearBeneficio('regalo', null)).toBe('Regalo')
  })
})
```

- [ ] **Step 2: Ejecutar y confirmar que falla**

Run: `npx vitest run src/lib/comercios/beneficios-formato.test.ts`
Expected: FAIL — `Cannot find module './beneficios-formato'`.

- [ ] **Step 3: Implementación mínima**

Crea `src/lib/comercios/beneficios-formato.ts`:

```ts
import type { TipoBeneficioCodigo } from '@/lib/supabase/database.types'

/** Texto amigable para mostrar un beneficio en el portal de miembros. */
export function formatearBeneficio(tipoCodigo: TipoBeneficioCodigo, valor: number | null): string {
  switch (tipoCodigo) {
    case 'porcentaje':
      return `${valor}% de descuento`
    case 'monto_fijo':
      return `$${(valor ?? 0).toLocaleString('es-CO')} de descuento`
    case 'dos_por_uno':
      return '2x1'
    case 'regalo':
      return 'Regalo'
  }
}
```

- [ ] **Step 4: Ejecutar y confirmar que pasa**

Run: `npx vitest run src/lib/comercios/beneficios-formato.test.ts`
Expected: PASS (4/4).

- [ ] **Step 5: Commit**

```bash
git add src/lib/comercios/beneficios-formato.ts src/lib/comercios/beneficios-formato.test.ts
git commit -m "feat: función pura formatearBeneficio con pruebas"
```

---

## Task 4: Resolución de número de membresía a correo (`lib/miembros/auth-miembro.ts`)

**Files:**
- Create: `src/lib/miembros/auth-miembro.ts`

**Interfaces:**
- Consumes: `createAdminClient` de `@/lib/supabase/admin` (ya existe, sin cambios).
- Produces: `resolverCorreoPorNumeroMembresia(numeroMembresia: string): Promise<string | null>`, usada por Task 10 (login).

No es una función pura (toca la BD) — no lleva prueba automatizada, igual que el resto de las server actions del proyecto. Se verifica manualmente en el Task 10.

Es la **única** pieza de `/miembros/**` que usa `createAdminClient()` (`service_role`): la resolución ocurre *antes* de que exista sesión, no hay `auth.uid()` todavía para que RLS pueda filtrar nada.

- [ ] **Step 1: Crear el archivo**

Crea `src/lib/miembros/auth-miembro.ts`:

```ts
import { createAdminClient } from '@/lib/supabase/admin'

/**
 * Resuelve el correo real de Auth a partir del número de membresía (RF-06).
 * Se usa únicamente en el login de miembros, antes de que exista sesión — por
 * eso es la única función de este portal que usa el admin client. Nunca se
 * inventan correos internos: el miembro siempre tiene un correo real
 * asociado a su cuenta de Auth (provisionado desde Fase 2).
 */
export async function resolverCorreoPorNumeroMembresia(
  numeroMembresia: string,
): Promise<string | null> {
  const admin = createAdminClient()

  const { data: miembro } = await admin
    .from('miembros')
    .select('perfil_id')
    .eq('numero_membresia', numeroMembresia)
    .is('deleted_at', null)
    .maybeSingle()

  if (!miembro?.perfil_id) return null

  const { data } = await admin.auth.admin.getUserById(miembro.perfil_id)
  return data.user?.email ?? null
}
```

- [ ] **Step 2: Verificar que el proyecto sigue compilando**

Run: `npx tsc --noEmit`
Expected: sin errores.

- [ ] **Step 3: Commit**

```bash
git add src/lib/miembros/auth-miembro.ts
git commit -m "feat: resolver número de membresía a correo para el login de miembros"
```

---

## Task 5: Guardias de acceso del portal (`lib/miembros/requerir-miembro.ts`)

**Files:**
- Create: `src/lib/miembros/requerir-miembro.ts`

**Interfaces:**
- Consumes: `getPerfilActual`, `type PerfilActual` de `@/lib/auth/auth` (sin cambios); `createClient` de `@/lib/supabase/server`; `esMembresiaVigente` de `./membresia-vigente` (Task 2).
- Produces:
  - `requireRolMiembro(): Promise<PerfilActual>` — exige sesión activa con rol `miembro`, redirige a `/miembros/login` si no. Usada por Task 11 (layout) y Task 12 (`/miembros/inactiva`).
  - `requireMiembroVigente(): Promise<MiembroActual>` — además exige membresía vigente, redirige a `/miembros/inactiva` si no. Usada por Task 13 (perfil) y Task 14 (home).
  - `type MiembroActual = { id: number; nombres: string; apellidos: string; numeroMembresia: string; membresiaVigente: { id: number; planId: number; tipo: string; estado: string; fechaInicio: string; fechaFin: string } }`

**Por qué dos funciones separadas:** si el layout de `/miembros` exigiera membresía vigente, redirigir a `/miembros/inactiva` (que vive *dentro* de `/miembros/**`) crearía un bucle infinito — el layout se ejecuta también para esa ruta. `requireRolMiembro` (solo rol) la usan tanto el layout como `/miembros/inactiva`; `requireMiembroVigente` (rol + vigencia) la usan las páginas que sí requieren membresía activa.

- [ ] **Step 1: Crear el archivo**

Crea `src/lib/miembros/requerir-miembro.ts`:

```ts
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getPerfilActual, type PerfilActual } from '@/lib/auth/auth'
import { esMembresiaVigente } from './membresia-vigente'

export type MiembroActual = {
  id: number
  nombres: string
  apellidos: string
  numeroMembresia: string
  membresiaVigente: {
    id: number
    planId: number
    tipo: string
    estado: string
    fechaInicio: string
    fechaFin: string
  }
}

/**
 * Exige sesión activa con rol `miembro`. No valida el estado de la
 * membresía — eso lo hace `requireMiembroVigente`. La usan tanto el layout
 * de `/miembros` como `/miembros/inactiva` (que no puede exigir membresía
 * vigente sin crear un redirect en bucle).
 */
export async function requireRolMiembro(): Promise<PerfilActual> {
  const perfil = await getPerfilActual()

  if (!perfil || !perfil.activo) {
    redirect('/miembros/login')
  }
  if (perfil.rolCodigo !== 'miembro') {
    redirect('/miembros/login?error=sin_permiso')
  }

  return perfil
}

/**
 * Exige sesión activa con rol `miembro` Y una membresía vigente (RF-06).
 * Si no hay membresía vigente, redirige a `/miembros/inactiva`.
 */
export async function requireMiembroVigente(): Promise<MiembroActual> {
  const perfil = await requireRolMiembro()

  const supabase = await createClient()
  const { data: miembro } = await supabase
    .from('miembros')
    .select('id, nombres, apellidos, numero_membresia')
    .eq('perfil_id', perfil.userId)
    .is('deleted_at', null)
    .maybeSingle()

  if (!miembro) {
    redirect('/miembros/inactiva')
  }

  const { data: membresias } = await supabase
    .from('membresias')
    .select('id, plan_id, tipo, estado, fecha_inicio, fecha_fin')
    .eq('miembro_id', miembro.id)
    .order('fecha_fin', { ascending: false })
    .limit(1)

  const ultima = membresias?.[0] ?? null
  const hoy = new Date().toISOString().slice(0, 10)

  if (!ultima || !esMembresiaVigente(ultima.estado, ultima.fecha_fin, hoy)) {
    redirect('/miembros/inactiva')
  }

  return {
    id: miembro.id,
    nombres: miembro.nombres,
    apellidos: miembro.apellidos,
    numeroMembresia: miembro.numero_membresia,
    membresiaVigente: {
      id: ultima.id,
      planId: ultima.plan_id,
      tipo: ultima.tipo,
      estado: ultima.estado,
      fechaInicio: ultima.fecha_inicio,
      fechaFin: ultima.fecha_fin,
    },
  }
}
```

- [ ] **Step 2: Verificar que el proyecto sigue compilando**

Run: `npx tsc --noEmit`
Expected: sin errores.

- [ ] **Step 3: Commit**

```bash
git add src/lib/miembros/requerir-miembro.ts
git commit -m "feat: guardias de acceso del portal de miembros (rol + membresía vigente)"
```

---

## Task 6: Kit — componente `Select`

**Files:**
- Create: `src/components/ui/Select.tsx`
- Modify: `src/components/ui/index.ts`

**Interfaces:**
- Produces: `<Select label htmlFor flex? ...selectProps>` — hermano de `Field`, para filtros con `<select>`. Usada por Task 14 (formulario de filtros del home de miembros).

Reutiliza la clase `.orum-select` que ya existe en `globals.css` (definida junto a `.orum-input`, sin usar hasta ahora) — cero cambios de CSS.

- [ ] **Step 1: Crear el componente**

Crea `src/components/ui/Select.tsx`:

```tsx
import type { ReactNode, SelectHTMLAttributes } from 'react'

export function Select({
  label,
  htmlFor,
  children,
  flex,
  ...props
}: Omit<SelectHTMLAttributes<HTMLSelectElement>, 'children'> & {
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
      <select id={htmlFor} className="orum-select" {...props}>
        {children}
      </select>
    </div>
  )
}
```

- [ ] **Step 2: Exportarlo desde el índice del kit**

En `src/components/ui/index.ts`, agrega junto a `Field`:

```ts
export { Field } from './Field'
export { Select } from './Select'
```

- [ ] **Step 3: Verificar que el proyecto sigue compilando**

Run: `npx tsc --noEmit`
Expected: sin errores.

- [ ] **Step 4: Commit**

```bash
git add src/components/ui/Select.tsx src/components/ui/index.ts
git commit -m "feat: componente Select en el kit de UI"
```

---

## Task 7: Kit — componentes `Card` y `CardGrid`

**Files:**
- Create: `src/components/ui/Card.tsx`
- Modify: `src/app/globals.css`
- Modify: `src/components/ui/index.ts`

**Interfaces:**
- Produces: `<Card>` (envoltorio de `.orum-card`, semántico para tarjetas de contenido) y `<CardGrid>` (grid responsivo). Usados por Task 14 (`ComercioCard` y el listado del home).

A diferencia del resto del kit (que solo envuelve clases `orum-*` ya existentes), esto agrega CSS nuevo porque no existía un patrón de grilla de tarjetas en el proyecto (el admin solo usa tablas).

- [ ] **Step 1: Agregar la clase de grilla a `globals.css`**

Al final de `src/app/globals.css`, después de `.orum-badge--off`:

```css
.orum-card-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
  gap: 1rem;
}
```

- [ ] **Step 2: Crear el componente**

Crea `src/components/ui/Card.tsx`:

```tsx
import type { ReactNode } from 'react'

export function Card({ children }: { children: ReactNode }) {
  return <div className="orum-card">{children}</div>
}

export function CardGrid({ children }: { children: ReactNode }) {
  return <div className="orum-card-grid">{children}</div>
}
```

- [ ] **Step 3: Exportarlo desde el índice del kit**

En `src/components/ui/index.ts`, agrega:

```ts
export { Card, CardGrid } from './Card'
```

- [ ] **Step 4: Verificar que el proyecto sigue compilando**

Run: `npx tsc --noEmit`
Expected: sin errores.

- [ ] **Step 5: Commit**

```bash
git add src/components/ui/Card.tsx src/app/globals.css src/components/ui/index.ts
git commit -m "feat: componentes Card y CardGrid en el kit de UI"
```

---

## Task 8: Kit — componente `QrCode`

**Files:**
- Create: `src/components/ui/QrCode.tsx`
- Modify: `src/components/ui/index.ts`
- Modify: `package.json`, `pnpm-lock.yaml` (vía `pnpm add`)

**Interfaces:**
- Produces: `<QrCode value size?>`. Usado por Task 13 (perfil del miembro).

- [ ] **Step 1: Agregar la dependencia**

Run: `pnpm add react-qr-code`
Expected: se agrega `react-qr-code` a `dependencies` en `package.json` y se actualiza `pnpm-lock.yaml`.

- [ ] **Step 2: Crear el componente**

Crea `src/components/ui/QrCode.tsx`:

```tsx
import QRCode from 'react-qr-code'

/**
 * El QR debe verse siempre en negro sobre blanco para poder escanearse,
 * independientemente del tema (claro/oscuro) de la página — por eso el fondo
 * blanco va forzado en vez de usar `--orum-surface`.
 */
export function QrCode({ value, size = 200 }: { value: string; size?: number }) {
  return (
    <div className="orum-card" style={{ display: 'inline-flex', padding: '1rem', background: '#fff' }}>
      <QRCode value={value} size={size} />
    </div>
  )
}
```

- [ ] **Step 3: Exportarlo desde el índice del kit**

En `src/components/ui/index.ts`, agrega:

```ts
export { QrCode } from './QrCode'
```

- [ ] **Step 4: Verificar que el proyecto sigue compilando**

Run: `npx tsc --noEmit`
Expected: sin errores.

- [ ] **Step 5: Commit**

```bash
git add package.json pnpm-lock.yaml src/components/ui/QrCode.tsx src/components/ui/index.ts
git commit -m "feat: componente QrCode en el kit de UI (react-qr-code)"
```

---

## Task 9: Kit — componente `WhatsAppButton`

**Files:**
- Create: `src/components/ui/WhatsAppButton.tsx`
- Modify: `src/components/ui/index.ts`

**Interfaces:**
- Produces: `<WhatsAppButton telefono mensaje? children?>`. Usado por Task 11 (layout), Task 12 (`/miembros/inactiva`). Portal-agnóstico a propósito: el futuro RF-04 del Portal Público lo reutiliza igual.

No lee `configuracion` él mismo — la página/layout que lo usa ya le pasa el teléfono resuelto.

- [ ] **Step 1: Crear el componente**

Crea `src/components/ui/WhatsAppButton.tsx`:

```tsx
import type { ReactNode } from 'react'

function limpiarTelefono(telefono: string) {
  return telefono.replace(/[^\d]/g, '')
}

export function WhatsAppButton({
  telefono,
  mensaje,
  children = 'Soporte por WhatsApp',
}: {
  telefono: string
  mensaje?: string
  children?: ReactNode
}) {
  const numero = limpiarTelefono(telefono)
  const texto = mensaje ? `?text=${encodeURIComponent(mensaje)}` : ''
  const href = `https://wa.me/${numero}${texto}`

  return (
    <a href={href} target="_blank" rel="noopener noreferrer" className="orum-button orum-button--secondary">
      {children}
    </a>
  )
}
```

- [ ] **Step 2: Exportarlo desde el índice del kit**

En `src/components/ui/index.ts`, agrega:

```ts
export { WhatsAppButton } from './WhatsAppButton'
```

- [ ] **Step 3: Verificar que el proyecto sigue compilando**

Run: `npx tsc --noEmit`
Expected: sin errores.

- [ ] **Step 4: Commit**

```bash
git add src/components/ui/WhatsAppButton.tsx src/components/ui/index.ts
git commit -m "feat: componente WhatsAppButton en el kit de UI"
```

---

## Task 10: Ruta `/miembros/login` — login por número de membresía (RF-06)

**Files:**
- Create: `src/app/miembros/login/actions.ts`
- Create: `src/app/miembros/login/_components/login-form.tsx`
- Create: `src/app/miembros/login/page.tsx`

**Interfaces:**
- Consumes: `resolverCorreoPorNumeroMembresia` (Task 4), `getPerfilActual` de `@/lib/auth/auth`, `createClient` de `@/lib/supabase/server`.
- Produces: server actions `iniciarSesionMiembro(prevState, formData)` y `cerrarSesionMiembro()`, usadas por Task 11 (layout, botón de cerrar sesión).

Mensaje de error genérico ante número inválido o contraseña incorrecta (no se revela cuál de los dos falló — criterio de aceptación del spec §11).

- [ ] **Step 1: Crear las server actions**

Crea `src/app/miembros/login/actions.ts`:

```ts
'use server'

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getPerfilActual } from '@/lib/auth/auth'
import { resolverCorreoPorNumeroMembresia } from '@/lib/miembros/auth-miembro'

export type LoginMiembroState = { error?: string }

/**
 * Inicia sesión con número de membresía + contraseña (RF-06). El número se
 * resuelve al correo real por debajo; nunca se pide el correo directamente.
 */
export async function iniciarSesionMiembro(
  _prevState: LoginMiembroState,
  formData: FormData,
): Promise<LoginMiembroState> {
  const numeroMembresia = String(formData.get('numero_membresia') ?? '').trim()
  const password = String(formData.get('password') ?? '')

  if (!numeroMembresia || !password) {
    return { error: 'Ingresa tu número de membresía y tu contraseña.' }
  }

  const correo = await resolverCorreoPorNumeroMembresia(numeroMembresia)
  if (!correo) {
    return { error: 'Número de membresía o contraseña incorrectos.' }
  }

  const supabase = await createClient()
  const { error } = await supabase.auth.signInWithPassword({ email: correo, password })
  if (error) {
    return { error: 'Número de membresía o contraseña incorrectos.' }
  }

  const perfil = await getPerfilActual()
  if (!perfil || !perfil.activo) {
    await supabase.auth.signOut()
    return { error: 'Tu cuenta está inactiva. Contacta a soporte.' }
  }

  if (perfil.rolCodigo !== 'miembro') {
    await supabase.auth.signOut()
    return { error: 'Este acceso es exclusivo para miembros.' }
  }

  redirect('/miembros')
}

/** Cierra la sesión actual y vuelve al login de miembros. */
export async function cerrarSesionMiembro() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  redirect('/miembros/login')
}
```

- [ ] **Step 2: Crear el formulario**

Crea `src/app/miembros/login/_components/login-form.tsx`:

```tsx
'use client'

import { useActionState } from 'react'
import { iniciarSesionMiembro, type LoginMiembroState } from '../actions'

const estadoInicial: LoginMiembroState = {}

export function LoginMiembroForm({ mensajeInicial }: { mensajeInicial?: string }) {
  const [state, formAction, pending] = useActionState(iniciarSesionMiembro, estadoInicial)
  const error = state.error ?? mensajeInicial

  return (
    <form action={formAction}>
      {error && (
        <p className="orum-alert orum-alert--error" role="alert">
          {error}
        </p>
      )}

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
          autoComplete="username"
          required
          placeholder="00012345"
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

- [ ] **Step 3: Crear la página**

Crea `src/app/miembros/login/page.tsx`:

```tsx
import { redirect } from 'next/navigation'
import { getPerfilActual } from '@/lib/auth/auth'
import { LoginMiembroForm } from './_components/login-form'

export const metadata = { title: 'Iniciar sesión · ORUM Miembros' }

const MENSAJES: Record<string, string> = {
  sin_permiso: 'Ese acceso no tiene una cuenta de miembro asociada.',
}

export default async function LoginMiembroPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>
}) {
  const perfil = await getPerfilActual()
  if (perfil && perfil.activo && perfil.rolCodigo === 'miembro') {
    redirect('/miembros')
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
            Portal de Miembros
          </p>
        </div>
        <LoginMiembroForm mensajeInicial={mensajeInicial} />
      </div>
    </main>
  )
}
```

- [ ] **Step 4: Verificar que el proyecto sigue compilando**

Run: `npx tsc --noEmit`
Expected: sin errores.

- [ ] **Step 5: Verificación manual**

Run: `pnpm dev`, abre `http://localhost:3000/miembros/login`.

- Prueba con número de membresía inexistente → mensaje "Número de membresía o contraseña incorrectos."
- Prueba con el número de membresía real (ver "Notas antes de empezar") + la contraseña que reseteaste → debe redirigir a `/miembros` (dará 404 hasta el Task 15, es esperado por ahora — confirma solo que el redirect ocurre y no hay error de login).
- Prueba con la contraseña equivocada para ese mismo número → mismo mensaje genérico.

- [ ] **Step 6: Commit**

```bash
git add src/app/miembros/login
git commit -m "feat: login de miembros por número de membresía (RF-06)"
```

---

## Task 11: `/miembros/layout.tsx` — guardia de rol, header y soporte persistente

**Files:**
- Create: `src/app/miembros/layout.tsx`

**Interfaces:**
- Consumes: `requireRolMiembro` (Task 5), `cerrarSesionMiembro` (Task 10), `createClient`, `Row`/`WhatsAppButton` del kit (Task 9).

El botón de soporte (RF-13) vive aquí porque debe ser visible en **todas** las pantallas del portal, no solo en el perfil.

- [ ] **Step 1: Crear el layout**

Crea `src/app/miembros/layout.tsx`:

```tsx
import Link from 'next/link'
import { requireRolMiembro } from '@/lib/miembros/requerir-miembro'
import { cerrarSesionMiembro } from './login/actions'
import { createClient } from '@/lib/supabase/server'
import { Row, WhatsAppButton } from '@/components/ui'

export const metadata = { title: 'Portal de Miembros · ORUM' }

export default async function MiembrosLayout({ children }: { children: React.ReactNode }) {
  const perfil = await requireRolMiembro()

  const supabase = await createClient()
  const { data: config } = await supabase
    .from('configuracion')
    .select('valor')
    .eq('clave', 'whatsapp_soporte')
    .maybeSingle()

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
        <Link href="/miembros" style={{ fontWeight: 700, fontSize: '1.15rem' }}>
          ORUM
        </Link>

        <Row gap="1rem" style={{ flex: 1 }}>
          <Link href="/miembros">Inicio</Link>
          <Link href="/miembros/perfil">Mi perfil</Link>
        </Row>

        {config?.valor && (
          <WhatsAppButton telefono={config.valor} mensaje="Hola, necesito ayuda con mi membresía ORUM." />
        )}

        <span className="orum-muted" style={{ fontSize: '0.85rem' }}>
          {perfil.email}
        </span>
        <form action={cerrarSesionMiembro}>
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

- [ ] **Step 2: Verificar que el proyecto sigue compilando**

Run: `npx tsc --noEmit`
Expected: sin errores.

- [ ] **Step 3: Verificación manual**

Con el servidor corriendo (`pnpm dev`), inicia sesión con el miembro de prueba. Debe verse el header con "ORUM", "Inicio", "Mi perfil", el botón de WhatsApp (si sembraste la fila de `configuracion`) y "Cerrar sesión". El contenido de la página seguirá dando 404 hasta el Task 15 — es esperado. Prueba también "Cerrar sesión" y confirma que vuelve a `/miembros/login`.

- [ ] **Step 4: Commit**

```bash
git add src/app/miembros/layout.tsx
git commit -m "feat: layout del portal de miembros (guardia de rol, header, soporte)"
```

---

## Task 12: `/miembros/inactiva` — pantalla de bloqueo

**Files:**
- Create: `src/app/miembros/inactiva/page.tsx`

**Interfaces:**
- Consumes: `requireRolMiembro` (Task 5, **no** `requireMiembroVigente` — evita el bucle de redirect descrito en Task 5), `createClient`, `WhatsAppButton`.

- [ ] **Step 1: Crear la página**

Crea `src/app/miembros/inactiva/page.tsx`:

```tsx
import { requireRolMiembro } from '@/lib/miembros/requerir-miembro'
import { createClient } from '@/lib/supabase/server'
import { WhatsAppButton } from '@/components/ui'

export const metadata = { title: 'Membresía inactiva · ORUM' }

export default async function MembresiaInactivaPage() {
  await requireRolMiembro()

  const supabase = await createClient()
  const { data: config } = await supabase
    .from('configuracion')
    .select('valor')
    .eq('clave', 'whatsapp_soporte')
    .maybeSingle()

  return (
    <div className="orum-card" style={{ textAlign: 'center', maxWidth: 480, margin: '3rem auto' }}>
      <h1 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '0.75rem' }}>
        Tu membresía no está activa
      </h1>
      <p className="orum-muted" style={{ marginBottom: '1.25rem' }}>
        No encontramos una membresía vigente asociada a tu cuenta. Si crees que esto es un error,
        o quieres renovarla, contáctanos por WhatsApp.
      </p>
      {config?.valor && (
        <WhatsAppButton telefono={config.valor} mensaje="Hola, mi membresía ORUM aparece inactiva.">
          Contactar soporte
        </WhatsAppButton>
      )}
    </div>
  )
}
```

- [ ] **Step 2: Verificar que el proyecto sigue compilando**

Run: `npx tsc --noEmit`
Expected: sin errores.

- [ ] **Step 3: Verificación manual**

Marca temporalmente como `suspendida` la membresía del miembro de prueba (ver "Notas antes de empezar", punto 3):

```sql
UPDATE membresias SET estado = 'suspendida' WHERE id = <id-de-la-membresia>;
```

Inicia sesión con ese miembro → debe caer en `/miembros/inactiva` con el mensaje y el botón de soporte, sin poder ver el resto del portal. Revierte el cambio:

```sql
UPDATE membresias SET estado = 'activa' WHERE id = <id-de-la-membresia>;
```

- [ ] **Step 4: Commit**

```bash
git add src/app/miembros/inactiva
git commit -m "feat: pantalla de bloqueo para membresía no vigente"
```

---

## Task 13: `/miembros/perfil` — perfil de solo lectura + QR (RF-07, RF-14)

**Files:**
- Create: `src/app/miembros/perfil/page.tsx`

**Interfaces:**
- Consumes: `requireMiembroVigente` (Task 5), `createClient`, `QrCode`/`Badge` del kit.

- [ ] **Step 1: Crear la página**

Crea `src/app/miembros/perfil/page.tsx`:

```tsx
import { requireMiembroVigente } from '@/lib/miembros/requerir-miembro'
import { createClient } from '@/lib/supabase/server'
import { QrCode, Badge } from '@/components/ui'

export const metadata = { title: 'Mi perfil · ORUM' }

export default async function PerfilMiembroPage() {
  const miembro = await requireMiembroVigente()

  const supabase = await createClient()
  const { data: plan } = await supabase
    .from('planes_membresia')
    .select('nombre')
    .eq('id', miembro.membresiaVigente.planId)
    .maybeSingle()

  return (
    <div>
      <h1 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '1.25rem' }}>Mi perfil</h1>

      <div
        className="orum-card"
        style={{ display: 'flex', gap: '2rem', flexWrap: 'wrap', alignItems: 'flex-start' }}
      >
        <div style={{ flex: 1, minWidth: 240 }}>
          <p>
            <strong>Nombre:</strong> {miembro.nombres} {miembro.apellidos}
          </p>
          <p>
            <strong>Número de membresía:</strong>{' '}
            <span style={{ fontFamily: 'var(--font-geist-mono, monospace)' }}>{miembro.numeroMembresia}</span>
          </p>
          <p>
            <strong>Plan:</strong> {plan?.nombre ?? '—'}
          </p>
          <p>
            <strong>Tipo:</strong> {miembro.membresiaVigente.tipo === 'nueva' ? 'Nueva' : 'Renovada'}
          </p>
          <p>
            <strong>Vigencia:</strong> {miembro.membresiaVigente.fechaInicio} a {miembro.membresiaVigente.fechaFin}
          </p>
          <p>
            <strong>Estado:</strong> <Badge tone="on">Activa</Badge>
          </p>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem' }}>
          <QrCode value={miembro.numeroMembresia} />
          <p className="orum-muted" style={{ fontSize: '0.8rem' }}>
            Muestra este código en el comercio
          </p>
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Verificar que el proyecto sigue compilando**

Run: `npx tsc --noEmit`
Expected: sin errores.

- [ ] **Step 3: Verificación manual**

Con el miembro de prueba (membresía activa) autenticado, abre `/miembros/perfil`. Debe verse nombre, número de membresía, plan, tipo, vigencia, badge "Activa", y el QR (código negro sobre fondo blanco, legible incluso si tu sistema está en modo oscuro).

- [ ] **Step 4: Commit**

```bash
git add src/app/miembros/perfil
git commit -m "feat: perfil de miembro de solo lectura con QR (RF-07, RF-14)"
```

---

## Task 14: `/miembros` — home con búsqueda, filtros y listado (RF-08 a RF-12)

**Files:**
- Create: `src/app/miembros/_components/comercio-card.tsx`
- Create: `src/app/miembros/_components/filtros-form.tsx`
- Create: `src/app/miembros/page.tsx`

**Interfaces:**
- Consumes: `requireMiembroVigente` (Task 5), `formatearBeneficio` (Task 3), `createClient`, `Card`/`CardGrid`/`EmptyState`/`PageHeader`/`Select`/`Badge` del kit.
- Produces: `type ComercioListado` (usado internamente por esta página), `<ComercioCard comercio>`, `<FiltrosForm ...>`.

Sin filtros aplicados se ve todo el catálogo activo (RF-08); con búsqueda y/o los tres filtros se acota (RF-09 a RF-12). No se reutiliza el `SearchForm` existente del kit tal cual porque aquí la búsqueda va combinada con tres `<select>` en un único formulario — anidar dos `<form>` no es válido en HTML, así que este formulario de filtros es específico de esta ruta.

- [ ] **Step 1: Crear `ComercioCard`**

Crea `src/app/miembros/_components/comercio-card.tsx`:

```tsx
import { Badge, Card } from '@/components/ui'
import { formatearBeneficio } from '@/lib/comercios/beneficios-formato'
import type { TipoBeneficioCodigo } from '@/lib/supabase/database.types'

export type ComercioListado = {
  id: number
  nombre: string
  descripcion: string | null
  marcaNombre: string | null
  ciudades: string[]
  promociones: { id: number; titulo: string; tipoCodigo: TipoBeneficioCodigo; valor: number | null }[]
}

export function ComercioCard({ comercio }: { comercio: ComercioListado }) {
  return (
    <Card>
      <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '0.25rem' }}>{comercio.nombre}</h3>
      {comercio.marcaNombre && (
        <p className="orum-muted" style={{ fontSize: '0.85rem' }}>
          {comercio.marcaNombre}
        </p>
      )}
      {comercio.descripcion && <p style={{ margin: '0.5rem 0' }}>{comercio.descripcion}</p>}
      {comercio.ciudades.length > 0 && (
        <p className="orum-muted" style={{ fontSize: '0.85rem', marginBottom: '0.5rem' }}>
          {comercio.ciudades.join(', ')}
        </p>
      )}

      {comercio.promociones.length === 0 ? (
        <p className="orum-muted" style={{ fontSize: '0.85rem' }}>
          Sin promociones activas por ahora.
        </p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', marginTop: '0.5rem' }}>
          {comercio.promociones.map((p) => (
            <div key={p.id} style={{ display: 'flex', justifyContent: 'space-between', gap: '0.5rem' }}>
              <span>{p.titulo}</span>
              <Badge tone="on">{formatearBeneficio(p.tipoCodigo, p.valor)}</Badge>
            </div>
          ))}
        </div>
      )}
    </Card>
  )
}
```

- [ ] **Step 2: Crear `FiltrosForm`**

Crea `src/app/miembros/_components/filtros-form.tsx`:

```tsx
import { Select } from '@/components/ui'

type Opcion = { id: number; nombre: string }

export function FiltrosForm({
  q,
  comercioId,
  marcaId,
  ciudadId,
  comercios,
  marcas,
  ciudades,
}: {
  q: string
  comercioId: string
  marcaId: string
  ciudadId: string
  comercios: Opcion[]
  marcas: Opcion[]
  ciudades: Opcion[]
}) {
  return (
    <form
      method="get"
      className="orum-card"
      style={{
        marginBottom: '1.25rem',
        display: 'flex',
        flexWrap: 'wrap',
        gap: '0.75rem',
        alignItems: 'flex-end',
      }}
    >
      <div className="orum-field" style={{ flex: 2, minWidth: 200 }}>
        <label className="orum-label" htmlFor="q">
          Buscar
        </label>
        <input
          id="q"
          name="q"
          type="text"
          className="orum-input"
          placeholder="Comercio o promoción…"
          defaultValue={q}
        />
      </div>

      <Select label="Comercio" htmlFor="comercio_id" name="comercio_id" defaultValue={comercioId} flex>
        <option value="">Todos</option>
        {comercios.map((c) => (
          <option key={c.id} value={c.id}>
            {c.nombre}
          </option>
        ))}
      </Select>

      <Select label="Marca" htmlFor="marca_id" name="marca_id" defaultValue={marcaId} flex>
        <option value="">Todas</option>
        {marcas.map((m) => (
          <option key={m.id} value={m.id}>
            {m.nombre}
          </option>
        ))}
      </Select>

      <Select label="Ciudad" htmlFor="ciudad_id" name="ciudad_id" defaultValue={ciudadId} flex>
        <option value="">Todas</option>
        {ciudades.map((c) => (
          <option key={c.id} value={c.id}>
            {c.nombre}
          </option>
        ))}
      </Select>

      <button type="submit" className="orum-button">
        Filtrar
      </button>
    </form>
  )
}
```

- [ ] **Step 3: Crear la página del home**

Crea `src/app/miembros/page.tsx`:

```tsx
import { requireMiembroVigente } from '@/lib/miembros/requerir-miembro'
import { createClient } from '@/lib/supabase/server'
import { CardGrid, EmptyState, PageHeader } from '@/components/ui'
import { FiltrosForm } from './_components/filtros-form'
import { ComercioCard, type ComercioListado } from './_components/comercio-card'
import type { TipoBeneficioCodigo } from '@/lib/supabase/database.types'

export const metadata = { title: 'Comercios y beneficios · ORUM' }

export default async function MiembrosHomePage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; comercio_id?: string; marca_id?: string; ciudad_id?: string }>
}) {
  await requireMiembroVigente()

  const { q, comercio_id, marca_id, ciudad_id } = await searchParams
  const busqueda = (q ?? '').trim()
  const comercioIdFiltro = comercio_id ? Number(comercio_id) : null
  const marcaIdFiltro = marca_id ? Number(marca_id) : null
  const ciudadIdFiltro = ciudad_id ? Number(ciudad_id) : null

  const supabase = await createClient()

  const [{ data: todosComercios }, { data: todasMarcas }, { data: todasCiudades }, { data: tipos }] =
    await Promise.all([
      supabase.from('comercios').select('id, nombre').eq('activo', true).is('deleted_at', null).order('nombre'),
      supabase.from('marcas').select('id, nombre').order('nombre'),
      supabase.from('ciudades').select('id, nombre').order('nombre'),
      supabase.from('tipos_beneficio').select('id, codigo'),
    ])

  // Comercios cuyo nombre coincide con la búsqueda.
  let queryPorNombre = supabase
    .from('comercios')
    .select('id, nombre, descripcion, marca_id')
    .eq('activo', true)
    .is('deleted_at', null)
  if (busqueda) queryPorNombre = queryPorNombre.ilike('nombre', `%${busqueda}%`)

  // Comercios con una promoción cuyo título coincide con la búsqueda.
  let idsPorPromocion: number[] = []
  if (busqueda) {
    const { data: promosCoincidentes } = await supabase
      .from('promociones')
      .select('comercio_id')
      .eq('activo', true)
      .is('deleted_at', null)
      .ilike('titulo', `%${busqueda}%`)
    idsPorPromocion = Array.from(new Set((promosCoincidentes ?? []).map((p) => p.comercio_id)))
  }

  type ComercioBase = { id: number; nombre: string; descripcion: string | null; marca_id: number | null }

  const queryPorPromocion =
    idsPorPromocion.length > 0
      ? supabase
          .from('comercios')
          .select('id, nombre, descripcion, marca_id')
          .eq('activo', true)
          .is('deleted_at', null)
          .in('id', idsPorPromocion)
      : Promise.resolve({ data: [] as ComercioBase[] })

  // Comercios con al menos una sucursal en la ciudad filtrada.
  let idsPorCiudad: number[] | null = null
  if (ciudadIdFiltro) {
    const { data: sucursalesEnCiudad } = await supabase
      .from('sucursales')
      .select('comercio_id')
      .eq('ciudad_id', ciudadIdFiltro)
      .eq('activo', true)
      .is('deleted_at', null)
    idsPorCiudad = Array.from(new Set((sucursalesEnCiudad ?? []).map((s) => s.comercio_id)))
  }

  const [{ data: porNombre }, { data: porPromocion }] = await Promise.all([queryPorNombre, queryPorPromocion])
  const baseComercios: ComercioBase[] = busqueda
    ? Array.from(new Map([...(porNombre ?? []), ...(porPromocion ?? [])].map((c) => [c.id, c])).values())
    : (porNombre ?? [])

  const comerciosFiltrados = baseComercios.filter((c) => {
    if (comercioIdFiltro && c.id !== comercioIdFiltro) return false
    if (marcaIdFiltro && c.marca_id !== marcaIdFiltro) return false
    if (idsPorCiudad && !idsPorCiudad.includes(c.id)) return false
    return true
  })

  const comercioIds = comerciosFiltrados.map((c) => c.id)

  type PromocionRow = { id: number; comercio_id: number; titulo: string; valor: number | null; tipo_beneficio_id: number }
  type SucursalRow = { comercio_id: number; ciudad_id: number }

  const [{ data: promociones }, { data: sucursales }] =
    comercioIds.length > 0
      ? await Promise.all([
          supabase
            .from('promociones')
            .select('id, comercio_id, titulo, valor, tipo_beneficio_id')
            .eq('activo', true)
            .is('deleted_at', null)
            .in('comercio_id', comercioIds)
            .order('titulo'),
          supabase
            .from('sucursales')
            .select('comercio_id, ciudad_id')
            .eq('activo', true)
            .is('deleted_at', null)
            .in('comercio_id', comercioIds),
        ])
      : [{ data: [] as PromocionRow[] }, { data: [] as SucursalRow[] }]

  const nombreMarca = new Map((todasMarcas ?? []).map((m) => [m.id, m.nombre]))
  const nombreCiudad = new Map((todasCiudades ?? []).map((c) => [c.id, c.nombre]))
  const codigoTipo = new Map((tipos ?? []).map((t) => [t.id, t.codigo as TipoBeneficioCodigo]))

  const ciudadesPorComercio = new Map<number, Set<string>>()
  for (const s of sucursales ?? []) {
    const nombre = nombreCiudad.get(s.ciudad_id)
    if (!nombre) continue
    if (!ciudadesPorComercio.has(s.comercio_id)) ciudadesPorComercio.set(s.comercio_id, new Set())
    ciudadesPorComercio.get(s.comercio_id)!.add(nombre)
  }

  const promocionesPorComercio = new Map<number, ComercioListado['promociones']>()
  for (const p of promociones ?? []) {
    const tipoCodigo = codigoTipo.get(p.tipo_beneficio_id)
    if (!tipoCodigo) continue
    if (!promocionesPorComercio.has(p.comercio_id)) promocionesPorComercio.set(p.comercio_id, [])
    promocionesPorComercio.get(p.comercio_id)!.push({ id: p.id, titulo: p.titulo, tipoCodigo, valor: p.valor })
  }

  const comerciosListado: ComercioListado[] = comerciosFiltrados.map((c) => ({
    id: c.id,
    nombre: c.nombre,
    descripcion: c.descripcion,
    marcaNombre: c.marca_id ? (nombreMarca.get(c.marca_id) ?? null) : null,
    ciudades: Array.from(ciudadesPorComercio.get(c.id) ?? []),
    promociones: promocionesPorComercio.get(c.id) ?? [],
  }))

  return (
    <div>
      <PageHeader title="Comercios y beneficios" />

      <FiltrosForm
        q={busqueda}
        comercioId={comercio_id ?? ''}
        marcaId={marca_id ?? ''}
        ciudadId={ciudad_id ?? ''}
        comercios={todosComercios ?? []}
        marcas={todasMarcas ?? []}
        ciudades={todasCiudades ?? []}
      />

      {comerciosListado.length === 0 ? (
        <EmptyState>Ningún comercio coincide con la búsqueda o los filtros.</EmptyState>
      ) : (
        <CardGrid>
          {comerciosListado.map((c) => (
            <ComercioCard key={c.id} comercio={c} />
          ))}
        </CardGrid>
      )}
    </div>
  )
}
```

- [ ] **Step 4: Verificar que el proyecto sigue compilando**

Run: `npx tsc --noEmit`
Expected: sin errores.

- [ ] **Step 5: Verificación manual**

Con el miembro de prueba autenticado:

- Abre `/miembros` sin filtros → deben verse todos los comercios activos con promociones activas (si no hay datos de prueba en `comercios`/`promociones`, siembra un par manualmente en Supabase para poder verificar visualmente).
- Escribe algo en "Buscar" que coincida con el nombre de un comercio → se acota a ese comercio.
- Escribe algo que coincida con el título de una promoción de otro comercio → ese comercio también aparece.
- Selecciona un comercio específico en el filtro "Comercio" → solo ese aparece.
- Selecciona una marca → solo los comercios de esa marca aparecen.
- Selecciona una ciudad → solo los comercios con sucursal activa en esa ciudad aparecen.
- Combina dos filtros a la vez → el resultado respeta ambos.
- Con un filtro que no coincide con nada → se ve el `EmptyState` ("Ningún comercio coincide…").

- [ ] **Step 6: Commit**

```bash
git add src/app/miembros/_components src/app/miembros/page.tsx
git commit -m "feat: home de miembros con búsqueda y filtros (RF-08 a RF-12)"
```

---

## Task 15: Verificación final contra los criterios de aceptación del spec

**Files:** ninguno (solo verificación).

- [ ] **Step 1: Suite completa**

Run: `npx tsc --noEmit && pnpm lint && pnpm test && pnpm build`
Expected: los cuatro comandos terminan sin errores. `pnpm test` debe mostrar los tests nuevos de `esMembresiaVigente` (6) y `formatearBeneficio` (4) sumados a los ya existentes.

- [ ] **Step 2: Recorrido manual completo contra el spec (§11)**

Con `pnpm dev` corriendo, repasa cada criterio:

- [ ] `/miembros/login` permite iniciar sesión con número de membresía; rechaza número inválido o contraseña incorrecta con el mismo mensaje genérico en ambos casos.
- [ ] Un miembro con membresía vencida o suspendida no accede al portal; ve `/miembros/inactiva` (repite la prueba del Task 12 si no la dejaste corriendo).
- [ ] `/miembros` muestra todos los comercios/promociones activos sin filtros, y los acota correctamente con búsqueda y cada uno de los tres filtros, combinados entre sí.
- [ ] `/miembros/perfil` muestra los datos del miembro, su membresía vigente, y el QR con `numero_membresia` como payload (verifica escaneándolo con el celular si tienes uno a mano). Sin formulario de edición en ningún lado.
- [ ] El botón de soporte (WhatsApp) es visible en todas las pantallas de `/miembros/**` (home, perfil, inactiva) y abre el número correcto leído desde `configuracion`.
- [ ] Cierra sesión desde el header y confirma que vuelve a `/miembros/login`, y que intentar entrar a `/miembros` sin sesión redirige ahí (no a `/login`, el del admin).
- [ ] Con una segunda cuenta de miembro de prueba (si tienes una), confirma que cada quien solo ve su propio perfil/membresía — esto ya se verificó a nivel de política RLS antes de este plan, pero vale confirmarlo también end-to-end con el login real.
- [ ] Entra a `/admin` con una cuenta de `super_admin`/`empleado` y confirma que **no** hay ninguna regresión (el login admin, la navegación y las páginas existentes siguen funcionando exactamente igual que antes de este plan).

- [ ] **Step 3: Actualizar `docs/ROADMAP.md`**

Marca el Portal de Miembros como hecho en la sección "Fases posteriores" y la tabla de cobertura de RF (§4 y §5 del ROADMAP), siguiendo el mismo formato que las fases anteriores (con enlaces a este plan y al spec).

- [ ] **Step 4: Commit**

```bash
git add docs/ROADMAP.md
git commit -m "docs: marcar el Portal de Miembros como completo en el ROADMAP"
```
