# Fase 2 — Miembros y Membresías — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Permitir que un empleado o super_admin registre clientes (miembros) con su primera membresía, los busque/edite y renueve membresías, más el CRUD de planes de membresía; todo dentro del portal `/admin`.

**Architecture:** Se replica el patrón de la Fase 1: páginas como Server Components protegidas con `requireRol`; mutaciones en Server Actions (`actions.ts`) que usan `createAdminClient()` (service_role) para la Admin API de Auth; formularios como Client Components con `useActionState`. La lógica no trivial (generación del número de membresía, cálculo de fechas) se aísla en funciones puras testeadas con Vitest.

**Tech Stack:** Next.js 16 (App Router), React 19, TypeScript, Supabase (`@supabase/ssr`, `@supabase/supabase-js`), pnpm, Vitest (nuevo, solo para funciones puras).

## Global Constraints

- Gestor de paquetes: **pnpm** (nunca npm/yarn).
- El módulo `src/lib/supabase/admin.ts` (service_role) SOLO se importa desde Server Actions / Server Components, NUNCA desde un Client Component (`'use client'`).
- Roles (tabla `roles`): `super_admin`=1, `empleado`=2, `comercio`=3, `miembro`=4. Resolver el id por `codigo`, no hardcodear el número en inserts salvo donde el plan lo indique.
- Borrado lógico con `deleted_at` (nunca `DELETE` físico) en `planes_membresia` y `miembros`.
- Toda Server Action de mutación empieza verificando el rol del actor; si no cumple, devuelve error o redirige a `/login?error=sin_permiso` (según el patrón de Fase 1).
- Clases CSS existentes a reutilizar: `orum-card`, `orum-field`, `orum-label`, `orum-input`, `orum-select`, `orum-button`, `orum-button--secondary`, `orum-button--danger`, `orum-alert`, `orum-alert--error`, `orum-alert--success`, `orum-table`, `orum-badge`, `orum-badge--on`, `orum-badge--off`, `orum-muted`.
- Enums (confirmar en Task 1): `tipo_membresia` = `'nueva' | 'renovada'`; `estado_membresia` = `'activa' | 'vencida' | 'cancelada'`.
- Comando de verificación de tipos: `pnpm exec tsc --noEmit`. Build: `pnpm build`.

---

## Estructura de archivos

**Nuevos:**
- `src/lib/password.ts` — `generarPassword()` extraída de usuarios/actions (compartida).
- `src/lib/membresias.ts` — funciones puras: `generarNumeroMembresia`, `calcularFechaFin`, `calcularFechaInicioRenovacion`.
- `src/lib/membresias.test.ts` — pruebas Vitest de las funciones puras.
- `src/app/admin/planes/actions.ts` — `crearPlan`, `editarPlan`, `cambiarEstadoPlan`.
- `src/app/admin/planes/page.tsx` — lista de planes.
- `src/app/admin/planes/plan-form.tsx` — formulario reutilizable (crear/editar).
- `src/app/admin/planes/nuevo/page.tsx` — página crear plan.
- `src/app/admin/planes/[id]/editar/page.tsx` — página editar plan.
- `src/app/admin/miembros/actions.ts` — `registrarMiembro`, `editarMiembro`, `renovarMembresia`.
- `src/app/admin/miembros/page.tsx` — lista/búsqueda de miembros.
- `src/app/admin/miembros/miembro-form.tsx` — formulario de registro.
- `src/app/admin/miembros/nuevo/page.tsx` — página registrar miembro.
- `src/app/admin/miembros/[id]/page.tsx` — ficha del miembro + historial + renovar.
- `src/app/admin/miembros/[id]/renovar-form.tsx` — formulario de renovación.
- `src/app/admin/miembros/[id]/editar/page.tsx` — página editar datos.
- `src/app/admin/miembros/[id]/editar/editar-miembro-form.tsx` — formulario de edición.
- `vitest.config.ts` — configuración mínima de Vitest.

**Modificados:**
- `src/lib/supabase/database.types.ts` — agregar `planes_membresia`, `miembros`, `membresias` y enums.
- `src/app/admin/usuarios/actions.ts` — importar `generarPassword` desde `@/lib/password` (quitar la copia local).
- `src/app/admin/layout.tsx` — agregar enlaces "Miembros" y "Planes".
- `package.json` — devDependency `vitest` y script `test`.

---

### Task 1: Setup de BD (enums, restricciones) y tipos de TypeScript

**Files:**
- Modify: `src/lib/supabase/database.types.ts`

**Interfaces:**
- Produces: tipos `Database['public']['Tables']['planes_membresia' | 'miembros' | 'membresias']`, `Database['public']['Enums']['tipo_membresia' | 'estado_membresia']`, y el tipo exportado `Row<...>` para esas tablas.

- [ ] **Step 1: Confirmar enums y restricciones en Supabase (manual)**

En el editor SQL de Supabase, ejecutar para ver los valores reales de los enums:

```sql
select enum_range(null::tipo_membresia) as tipo, enum_range(null::estado_membresia) as estado;
```

Si los valores difieren de `{nueva,renovada}` y `{activa,vencida,cancelada}`, anotarlos y ajustar las uniones de tipo en el Step 3 y las constantes del resto del plan.

Luego asegurar las restricciones de unicidad (idempotentes):

```sql
create unique index if not exists miembros_numero_membresia_unica on miembros (numero_membresia);
create unique index if not exists miembros_cedula_unica on miembros (cedula) where deleted_at is null;
```

Verificar que exista al menos una ciudad para pruebas:

```sql
insert into ciudades (nombre, departamento)
select 'Bogotá', 'Cundinamarca'
where not exists (select 1 from ciudades);
```

- [ ] **Step 2: Escribir los enums en database.types.ts**

En `src/lib/supabase/database.types.ts`, reemplazar el bloque `Enums` (actualmente `[key: string]: never`) por:

```ts
    Enums: {
      tipo_membresia: 'nueva' | 'renovada'
      estado_membresia: 'activa' | 'vencida' | 'cancelada'
    }
```

Y agregar bajo el tipo `RolCodigo` un atajo:

```ts
/** Valores del enum `tipo_membresia`. */
export type TipoMembresia = 'nueva' | 'renovada'
/** Valores del enum `estado_membresia`. */
export type EstadoMembresia = 'activa' | 'vencida' | 'cancelada'
```

- [ ] **Step 3: Agregar las tablas nuevas a `Tables`**

Dentro de `Database['public']['Tables']`, después de `ciudades`, agregar:

```ts
      planes_membresia: {
        Row: {
          id: number
          nombre: string
          descripcion: string | null
          precio: number
          duracion_meses: number
          activo: boolean
          created_at: Timestamp
          updated_at: Timestamp
          deleted_at: Timestamp | null
        }
        Insert: {
          id?: number
          nombre: string
          descripcion?: string | null
          precio: number
          duracion_meses?: number
          activo?: boolean
          created_at?: Timestamp
          updated_at?: Timestamp
          deleted_at?: Timestamp | null
        }
        Update: Partial<Database['public']['Tables']['planes_membresia']['Insert']>
        Relationships: []
      }
      miembros: {
        Row: {
          id: number
          perfil_id: string | null
          codigo_publico: string
          numero_membresia: string
          nombres: string
          apellidos: string
          cedula: string
          telefono: string | null
          direccion: string | null
          ciudad_id: number | null
          registrado_por: number | null
          fecha_registro: Timestamp
          created_at: Timestamp
          updated_at: Timestamp
          deleted_at: Timestamp | null
        }
        Insert: {
          id?: number
          perfil_id?: string | null
          codigo_publico?: string
          numero_membresia: string
          nombres: string
          apellidos: string
          cedula: string
          telefono?: string | null
          direccion?: string | null
          ciudad_id?: number | null
          registrado_por?: number | null
          fecha_registro?: Timestamp
          created_at?: Timestamp
          updated_at?: Timestamp
          deleted_at?: Timestamp | null
        }
        Update: Partial<Database['public']['Tables']['miembros']['Insert']>
        Relationships: []
      }
      membresias: {
        Row: {
          id: number
          miembro_id: number
          plan_id: number
          tipo: Database['public']['Enums']['tipo_membresia']
          estado: Database['public']['Enums']['estado_membresia']
          fecha_inicio: string
          fecha_fin: string
          precio_pagado: number
          comprobante_url: string | null
          vendido_por: number | null
          membresia_anterior_id: number | null
          created_at: Timestamp
          updated_at: Timestamp
        }
        Insert: {
          id?: number
          miembro_id: number
          plan_id: number
          tipo: Database['public']['Enums']['tipo_membresia']
          estado?: Database['public']['Enums']['estado_membresia']
          fecha_inicio: string
          fecha_fin: string
          precio_pagado: number
          comprobante_url?: string | null
          vendido_por?: number | null
          membresia_anterior_id?: number | null
          created_at?: Timestamp
          updated_at?: Timestamp
        }
        Update: Partial<Database['public']['Tables']['membresias']['Insert']>
        Relationships: []
      }
```

- [ ] **Step 4: Verificar que compila**

Run: `pnpm exec tsc --noEmit`
Expected: sin errores (exit 0).

- [ ] **Step 5: Commit**

```bash
git add src/lib/supabase/database.types.ts
git commit -m "Fase 2: tipos de planes, miembros, membresias y enums"
```

---

### Task 2: Funciones puras de membresía + Vitest

**Files:**
- Modify: `package.json`
- Create: `vitest.config.ts`
- Create: `src/lib/membresias.ts`
- Test: `src/lib/membresias.test.ts`

**Interfaces:**
- Produces:
  - `generarNumeroMembresia(seq: number, aleatorio?: () => number): string` — 8 dígitos (4 secuenciales + 4 aleatorios).
  - `calcularFechaFin(fechaInicio: string, duracionMeses: number): string` — recibe/devuelve `'YYYY-MM-DD'`.
  - `calcularFechaInicioRenovacion(hoy: string, finVigente: string | null): string` — `'YYYY-MM-DD'`.

- [ ] **Step 1: Instalar Vitest y agregar script**

Run: `pnpm add -D vitest`

En `package.json`, dentro de `"scripts"`, agregar:

```json
    "test": "vitest run"
```

- [ ] **Step 2: Crear la configuración de Vitest**

Crear `vitest.config.ts`:

```ts
import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts'],
  },
})
```

- [ ] **Step 3: Escribir las pruebas (deben fallar)**

Crear `src/lib/membresias.test.ts`:

```ts
import { describe, it, expect } from 'vitest'
import {
  generarNumeroMembresia,
  calcularFechaFin,
  calcularFechaInicioRenovacion,
} from './membresias'

describe('generarNumeroMembresia', () => {
  it('produce 8 dígitos: 4 secuenciales + 4 aleatorios', () => {
    const n = generarNumeroMembresia(42, () => 7318)
    expect(n).toBe('00427318')
  })

  it('rellena la parte aleatoria con ceros a la izquierda', () => {
    const n = generarNumeroMembresia(1, () => 5)
    expect(n).toBe('00010005')
  })

  it('mantiene 8 dígitos cuando la secuencia tiene 4 cifras', () => {
    const n = generarNumeroMembresia(9999, () => 1234)
    expect(n).toBe('99991234')
  })
})

describe('calcularFechaFin', () => {
  it('suma meses en un caso simple', () => {
    expect(calcularFechaFin('2026-07-22', 1)).toBe('2026-08-22')
  })

  it('suma 12 meses (un año)', () => {
    expect(calcularFechaFin('2026-07-22', 12)).toBe('2027-07-22')
  })

  it('ajusta al último día cuando el mes destino es más corto', () => {
    expect(calcularFechaFin('2026-01-31', 1)).toBe('2026-02-28')
  })
})

describe('calcularFechaInicioRenovacion', () => {
  it('empieza el día siguiente al fin si la vigente aún no vence', () => {
    expect(calcularFechaInicioRenovacion('2026-07-22', '2026-08-10')).toBe('2026-08-11')
  })

  it('empieza hoy si la vigente ya venció', () => {
    expect(calcularFechaInicioRenovacion('2026-07-22', '2026-07-01')).toBe('2026-07-22')
  })

  it('empieza hoy si no hay membresía anterior', () => {
    expect(calcularFechaInicioRenovacion('2026-07-22', null)).toBe('2026-07-22')
  })
})
```

- [ ] **Step 4: Ejecutar y verificar que fallan**

Run: `pnpm test`
Expected: FAIL — `Failed to resolve import "./membresias"` / funciones no definidas.

- [ ] **Step 5: Implementar `src/lib/membresias.ts`**

```ts
import { randomInt } from 'node:crypto'

/**
 * Número de membresía de 8 dígitos: 4 secuenciales (orden del miembro) + 4
 * aleatorios. La parte secuencial identifica al miembro; la aleatoria evita que
 * sea adivinable. La unicidad se garantiza en BD (índice único) + reintento.
 *
 * @param seq        Correlativo del miembro (1, 2, 3, …).
 * @param aleatorio  Generador de la parte aleatoria (0–9999). Inyectable para pruebas.
 */
export function generarNumeroMembresia(
  seq: number,
  aleatorio: () => number = () => randomInt(0, 10000),
): string {
  const parteSeq = String(seq).padStart(4, '0').slice(-4)
  const parteRand = String(aleatorio() % 10000).padStart(4, '0')
  return parteSeq + parteRand
}

/** Suma `dias` a una fecha 'YYYY-MM-DD' y devuelve 'YYYY-MM-DD'. */
function sumarDias(fecha: string, dias: number): string {
  const [y, m, d] = fecha.split('-').map(Number)
  const base = new Date(Date.UTC(y, m - 1, d))
  base.setUTCDate(base.getUTCDate() + dias)
  return base.toISOString().slice(0, 10)
}

/**
 * Suma `duracionMeses` a `fechaInicio` ('YYYY-MM-DD'). Si el día no existe en el
 * mes destino (p. ej. 31 de enero + 1 mes), ajusta al último día de ese mes.
 */
export function calcularFechaFin(fechaInicio: string, duracionMeses: number): string {
  const [y, m, d] = fechaInicio.split('-').map(Number)
  const base = new Date(Date.UTC(y, m - 1, d))
  const objetivo = new Date(base)
  objetivo.setUTCMonth(objetivo.getUTCMonth() + duracionMeses)
  // Si el día se desbordó a otro mes, retroceder al último día del mes correcto.
  if (objetivo.getUTCDate() < d) {
    objetivo.setUTCDate(0)
  }
  return objetivo.toISOString().slice(0, 10)
}

/**
 * Fecha de inicio de una renovación: el día siguiente al fin de la membresía
 * vigente si aún no ha vencido (para no perder días pagados); si ya venció o no
 * hay anterior, empieza hoy. Todas las fechas en 'YYYY-MM-DD'.
 */
export function calcularFechaInicioRenovacion(hoy: string, finVigente: string | null): string {
  if (finVigente && finVigente >= hoy) {
    return sumarDias(finVigente, 1)
  }
  return hoy
}
```

- [ ] **Step 6: Ejecutar y verificar que pasan**

Run: `pnpm test`
Expected: PASS — 9 pruebas en verde.

- [ ] **Step 7: Commit**

```bash
git add package.json pnpm-lock.yaml vitest.config.ts src/lib/membresias.ts src/lib/membresias.test.ts
git commit -m "Fase 2: funciones puras de membresía (número y fechas) con Vitest"
```

---

### Task 3: Extraer `generarPassword` a un módulo compartido (DRY)

**Files:**
- Create: `src/lib/password.ts`
- Modify: `src/app/admin/usuarios/actions.ts`

**Interfaces:**
- Produces: `generarPassword(longitud?: number): string`.

- [ ] **Step 1: Crear `src/lib/password.ts`**

Mover la función tal cual está hoy en `usuarios/actions.ts`:

```ts
import { randomInt } from 'node:crypto'

/**
 * Genera una contraseña aleatoria segura, con al menos una minúscula, una
 * mayúscula, un número y un símbolo. Evita caracteres ambiguos (O/0, l/1).
 */
export function generarPassword(longitud = 14): string {
  const minus = 'abcdefghijkmnpqrstuvwxyz'
  const mayus = 'ABCDEFGHJKLMNPQRSTUVWXYZ'
  const nums = '23456789'
  const simbolos = '!@#$%*?-_'
  const todos = minus + mayus + nums + simbolos

  const elegir = (set: string) => set[randomInt(0, set.length)]

  const chars = [elegir(minus), elegir(mayus), elegir(nums), elegir(simbolos)]
  for (let i = chars.length; i < longitud; i++) chars.push(elegir(todos))

  for (let i = chars.length - 1; i > 0; i--) {
    const j = randomInt(0, i + 1)
    ;[chars[i], chars[j]] = [chars[j], chars[i]]
  }
  return chars.join('')
}
```

- [ ] **Step 2: Actualizar `usuarios/actions.ts` para importarla**

En `src/app/admin/usuarios/actions.ts`:
- Eliminar la definición local de `generarPassword` (líneas del bloque `function generarPassword...`).
- Eliminar el import `import { randomInt } from 'node:crypto'` si ya no se usa en el archivo.
- Agregar al inicio: `import { generarPassword } from '@/lib/password'`.

- [ ] **Step 3: Verificar tipos y build**

Run: `pnpm exec tsc --noEmit`
Expected: sin errores.

- [ ] **Step 4: Commit**

```bash
git add src/lib/password.ts src/app/admin/usuarios/actions.ts
git commit -m "Fase 2: extraer generarPassword a modulo compartido"
```

---

### Task 4: Planes — Server Actions

**Files:**
- Create: `src/app/admin/planes/actions.ts`

**Interfaces:**
- Consumes: `getPerfilActual` de `@/lib/auth`, `createAdminClient` de `@/lib/supabase/admin`.
- Produces:
  - `type PlanState = { error?: string }`
  - `crearPlan(_prev: PlanState, formData: FormData): Promise<PlanState>` (redirige a `/admin/planes` al éxito)
  - `editarPlan(_prev: PlanState, formData: FormData): Promise<PlanState>` (redirige a `/admin/planes` al éxito)
  - `cambiarEstadoPlan(formData: FormData): Promise<void>`

- [ ] **Step 1: Crear `src/app/admin/planes/actions.ts`**

```ts
'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createAdminClient } from '@/lib/supabase/admin'
import { getPerfilActual } from '@/lib/auth'

export type PlanState = { error?: string }

/** Verifica que quien ejecuta la acción sea super_admin. */
async function exigirSuperAdmin(): Promise<boolean> {
  const actor = await getPerfilActual()
  return !!actor && actor.activo && actor.rolCodigo === 'super_admin'
}

/** Lee y valida los campos comunes de un plan desde el formulario. */
function leerCampos(formData: FormData):
  | { ok: true; nombre: string; descripcion: string | null; precio: number; duracion: number }
  | { ok: false; error: string } {
  const nombre = String(formData.get('nombre') ?? '').trim()
  if (!nombre) return { ok: false, error: 'El nombre del plan es obligatorio.' }

  const precio = Number(formData.get('precio'))
  if (!Number.isFinite(precio) || precio < 0) {
    return { ok: false, error: 'El precio debe ser un número mayor o igual a 0.' }
  }

  const duracion = Number(formData.get('duracion_meses'))
  if (!Number.isInteger(duracion) || duracion < 1) {
    return { ok: false, error: 'La duración debe ser un número entero de meses (mínimo 1).' }
  }

  return {
    ok: true,
    nombre,
    descripcion: String(formData.get('descripcion') ?? '').trim() || null,
    precio,
    duracion,
  }
}

export async function crearPlan(_prev: PlanState, formData: FormData): Promise<PlanState> {
  if (!(await exigirSuperAdmin())) return { error: 'No tienes permiso para realizar esta acción.' }

  const campos = leerCampos(formData)
  if (!campos.ok) return { error: campos.error }

  const admin = createAdminClient()
  const { error } = await admin.from('planes_membresia').insert({
    nombre: campos.nombre,
    descripcion: campos.descripcion,
    precio: campos.precio,
    duracion_meses: campos.duracion,
    activo: true,
  })
  if (error) return { error: `No se pudo crear el plan: ${error.message}` }

  revalidatePath('/admin/planes')
  redirect('/admin/planes')
}

export async function editarPlan(_prev: PlanState, formData: FormData): Promise<PlanState> {
  if (!(await exigirSuperAdmin())) return { error: 'No tienes permiso para realizar esta acción.' }

  const id = Number(formData.get('id'))
  if (!Number.isInteger(id)) return { error: 'Falta el identificador del plan.' }

  const campos = leerCampos(formData)
  if (!campos.ok) return { error: campos.error }

  const admin = createAdminClient()
  const { error } = await admin
    .from('planes_membresia')
    .update({
      nombre: campos.nombre,
      descripcion: campos.descripcion,
      precio: campos.precio,
      duracion_meses: campos.duracion,
    })
    .eq('id', id)
  if (error) return { error: `No se pudieron guardar los cambios: ${error.message}` }

  revalidatePath('/admin/planes')
  redirect('/admin/planes')
}

/** Activa o desactiva un plan (planes_membresia.activo). */
export async function cambiarEstadoPlan(formData: FormData): Promise<void> {
  if (!(await exigirSuperAdmin())) redirect('/login?error=sin_permiso')

  const id = Number(formData.get('id'))
  const activar = String(formData.get('activar') ?? '') === 'true'
  if (!Number.isInteger(id)) redirect('/admin/planes')

  const admin = createAdminClient()
  await admin.from('planes_membresia').update({ activo: activar }).eq('id', id)

  revalidatePath('/admin/planes')
  redirect('/admin/planes')
}
```

- [ ] **Step 2: Verificar tipos**

Run: `pnpm exec tsc --noEmit`
Expected: sin errores.

- [ ] **Step 3: Commit**

```bash
git add src/app/admin/planes/actions.ts
git commit -m "Fase 2: server actions de planes de membresia"
```

---

### Task 5: Planes — Páginas (lista, nuevo, editar) y enlace de menú

**Files:**
- Create: `src/app/admin/planes/plan-form.tsx`
- Create: `src/app/admin/planes/page.tsx`
- Create: `src/app/admin/planes/nuevo/page.tsx`
- Create: `src/app/admin/planes/[id]/editar/page.tsx`
- Modify: `src/app/admin/layout.tsx`

**Interfaces:**
- Consumes: `crearPlan`, `editarPlan`, `cambiarEstadoPlan`, `PlanState` de `./actions`.

- [ ] **Step 1: Crear el formulario reutilizable `plan-form.tsx`**

```tsx
'use client'

import { useActionState } from 'react'
import Link from 'next/link'
import { crearPlan, editarPlan, type PlanState } from './actions'

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
      {state.error && (
        <p className="orum-alert orum-alert--error" role="alert">
          {state.error}
        </p>
      )}

      {plan && <input type="hidden" name="id" value={plan.id} />}

      <div className="orum-field">
        <label className="orum-label" htmlFor="nombre">Nombre</label>
        <input id="nombre" name="nombre" className="orum-input" required defaultValue={plan?.nombre} />
      </div>

      <div className="orum-field">
        <label className="orum-label" htmlFor="descripcion">Descripción (opcional)</label>
        <input
          id="descripcion"
          name="descripcion"
          className="orum-input"
          defaultValue={plan?.descripcion ?? ''}
        />
      </div>

      <div style={{ display: 'flex', gap: '0.75rem' }}>
        <div className="orum-field" style={{ flex: 1 }}>
          <label className="orum-label" htmlFor="precio">Precio</label>
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
        </div>
        <div className="orum-field" style={{ flex: 1 }}>
          <label className="orum-label" htmlFor="duracion_meses">Duración (meses)</label>
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
        </div>
      </div>

      <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.5rem' }}>
        <button type="submit" className="orum-button" disabled={pending}>
          {pending ? 'Guardando…' : plan ? 'Guardar cambios' : 'Crear plan'}
        </button>
        <Link href="/admin/planes" className="orum-button orum-button--secondary">
          Cancelar
        </Link>
      </div>
    </form>
  )
}
```

- [ ] **Step 2: Crear la lista `planes/page.tsx`**

```tsx
import Link from 'next/link'
import { requireRol } from '@/lib/auth'
import { createAdminClient } from '@/lib/supabase/admin'
import { cambiarEstadoPlan } from './actions'

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
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 700 }}>Planes de membresía</h1>
        <Link href="/admin/planes/nuevo" className="orum-button">+ Crear plan</Link>
      </div>

      {!planes || planes.length === 0 ? (
        <div className="orum-card">
          <p className="orum-muted">Aún no hay planes. Crea el primero para poder vender membresías.</p>
        </div>
      ) : (
        <div className="orum-card" style={{ overflowX: 'auto', padding: 0 }}>
          <table className="orum-table">
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
                    <span className={`orum-badge ${p.activo ? 'orum-badge--on' : 'orum-badge--off'}`}>
                      {p.activo ? 'Activo' : 'Inactivo'}
                    </span>
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                      <Link href={`/admin/planes/${p.id}/editar`} className="orum-button orum-button--secondary">
                        Editar
                      </Link>
                      <form action={cambiarEstadoPlan}>
                        <input type="hidden" name="id" value={p.id} />
                        <input type="hidden" name="activar" value={p.activo ? 'false' : 'true'} />
                        <button type="submit" className={`orum-button ${p.activo ? 'orum-button--danger' : ''}`}>
                          {p.activo ? 'Desactivar' : 'Activar'}
                        </button>
                      </form>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
```

- [ ] **Step 3: Crear `planes/nuevo/page.tsx`**

```tsx
import { requireRol } from '@/lib/auth'
import { PlanForm } from '../plan-form'

export const metadata = { title: 'Nuevo plan · ORUM' }

export default async function NuevoPlanPage() {
  await requireRol('super_admin')
  return (
    <div>
      <h1 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '1.25rem' }}>Nuevo plan</h1>
      <PlanForm />
    </div>
  )
}
```

- [ ] **Step 4: Crear `planes/[id]/editar/page.tsx`**

```tsx
import { notFound } from 'next/navigation'
import { requireRol } from '@/lib/auth'
import { createAdminClient } from '@/lib/supabase/admin'
import { PlanForm } from '../../plan-form'

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
      <h1 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '1.25rem' }}>Editar plan</h1>
      <PlanForm plan={plan} />
    </div>
  )
}
```

- [ ] **Step 5: Agregar los enlaces al menú en `layout.tsx`**

En `src/app/admin/layout.tsx`, dentro del `<nav>`, junto a los enlaces existentes, agregar "Miembros" (ambos roles) y "Planes" (solo super_admin). El `<nav>` queda así:

```tsx
        <nav style={{ display: 'flex', gap: '1rem', flex: 1 }}>
          <Link href="/admin">Inicio</Link>
          <Link href="/admin/miembros">Miembros</Link>
          {esSuperAdmin && <Link href="/admin/usuarios">Usuarios</Link>}
          {esSuperAdmin && <Link href="/admin/planes">Planes</Link>}
          <Link href="/admin/cuenta/password">Mi contraseña</Link>
        </nav>
```

- [ ] **Step 6: Verificar tipos y arrancar la app**

Run: `pnpm exec tsc --noEmit`
Expected: sin errores.

Verificación manual: `pnpm dev`, entrar como super_admin a `/admin/planes`, crear un plan ("Básico", precio 50000, 1 mes), editarlo, desactivarlo y reactivarlo. Confirmar que aparece en la lista.

- [ ] **Step 7: Commit**

```bash
git add src/app/admin/planes src/app/admin/layout.tsx
git commit -m "Fase 2: CRUD de planes de membresia (paginas y menu)"
```

---

### Task 6: Miembros — Action `registrarMiembro`

**Files:**
- Create: `src/app/admin/miembros/actions.ts`

**Interfaces:**
- Consumes: `getPerfilActual` (`@/lib/auth`), `createAdminClient` (`@/lib/supabase/admin`), `generarPassword` (`@/lib/password`), `generarNumeroMembresia`, `calcularFechaFin`, `calcularFechaInicioRenovacion` (`@/lib/membresias`).
- Produces:
  - `type RegistrarMiembroState = { error?: string; ok?: boolean; numero?: string; password?: string; nombre?: string }`
  - `registrarMiembro(_prev: RegistrarMiembroState, formData: FormData): Promise<RegistrarMiembroState>`
  - helpers **privados del módulo** `exigirEmpleadoOAdmin()`, `resolverEmpleadoId(admin, perfilId)`, `hoyISO()` (sin `export`; los reutilizan Tasks 8 y 9 porque amplían este mismo archivo).

- [ ] **Step 1: Crear `src/app/admin/miembros/actions.ts` con `registrarMiembro`**

```ts
'use server'

import { revalidatePath } from 'next/cache'
import { createAdminClient } from '@/lib/supabase/admin'
import { getPerfilActual, type PerfilActual } from '@/lib/auth'
import { generarPassword } from '@/lib/password'
import {
  generarNumeroMembresia,
  calcularFechaFin,
  calcularFechaInicioRenovacion,
} from '@/lib/membresias'

type Admin = ReturnType<typeof createAdminClient>

/** Devuelve el perfil del actor si es empleado o super_admin activo; si no, null. */
async function exigirEmpleadoOAdmin(): Promise<PerfilActual | null> {
  const actor = await getPerfilActual()
  if (!actor || !actor.activo) return null
  if (actor.rolCodigo !== 'empleado' && actor.rolCodigo !== 'super_admin') return null
  return actor
}

/** empleados.id del actor, o null si es super_admin sin fila en empleados (D5). */
async function resolverEmpleadoId(admin: Admin, perfilId: string): Promise<number | null> {
  const { data } = await admin
    .from('empleados')
    .select('id')
    .eq('perfil_id', perfilId)
    .is('deleted_at', null)
    .maybeSingle()
  return data?.id ?? null
}

export type RegistrarMiembroState = {
  error?: string
  ok?: boolean
  numero?: string
  password?: string
  nombre?: string
}

/** Fecha de hoy en formato 'YYYY-MM-DD' (zona del servidor). */
function hoyISO(): string {
  return new Date().toISOString().slice(0, 10)
}

/**
 * Registra un cliente (miembro) junto con su PRIMERA membresía (tipo=nueva).
 * Flujo: validar → crear usuario en Auth (correo real) → upsert perfil (rol
 * miembro) → insertar miembro (con número único, reintentando ante colisión) →
 * insertar membresía. Revierte todo si algún paso falla.
 */
export async function registrarMiembro(
  _prev: RegistrarMiembroState,
  formData: FormData,
): Promise<RegistrarMiembroState> {
  const actor = await exigirEmpleadoOAdmin()
  if (!actor) return { error: 'No tienes permiso para realizar esta acción.' }

  // 1) Leer y validar campos.
  const nombres = String(formData.get('nombres') ?? '').trim()
  const apellidos = String(formData.get('apellidos') ?? '').trim()
  const cedula = String(formData.get('cedula') ?? '').trim()
  const correo = String(formData.get('correo') ?? '').trim().toLowerCase()
  const telefono = String(formData.get('telefono') ?? '').trim() || null
  const direccion = String(formData.get('direccion') ?? '').trim() || null
  const ciudadRaw = String(formData.get('ciudad_id') ?? '').trim()
  const ciudad_id = ciudadRaw ? Number(ciudadRaw) : null
  const plan_id = Number(formData.get('plan_id'))
  const precio_pagado = Number(formData.get('precio_pagado'))

  if (!nombres || !apellidos) return { error: 'Nombres y apellidos son obligatorios.' }
  if (!cedula) return { error: 'La cédula es obligatoria.' }
  if (!correo || !correo.includes('@')) return { error: 'Ingresa un correo electrónico válido.' }
  if (!Number.isInteger(plan_id)) return { error: 'Selecciona un plan de membresía.' }
  if (!Number.isFinite(precio_pagado) || precio_pagado < 0) {
    return { error: 'El precio pagado debe ser un número mayor o igual a 0.' }
  }

  const admin = createAdminClient()

  // 2) Cédula única entre miembros no eliminados.
  const { data: cedulaExiste } = await admin
    .from('miembros')
    .select('id')
    .eq('cedula', cedula)
    .is('deleted_at', null)
    .maybeSingle()
  if (cedulaExiste) return { error: `Ya existe un miembro con la cédula ${cedula}.` }

  // 3) Plan activo y no eliminado.
  const { data: plan } = await admin
    .from('planes_membresia')
    .select('id, duracion_meses, activo')
    .eq('id', plan_id)
    .is('deleted_at', null)
    .maybeSingle()
  if (!plan || !plan.activo) return { error: 'El plan seleccionado no existe o está inactivo.' }

  // 4) Rol miembro.
  const { data: rolMiembro } = await admin.from('roles').select('id').eq('codigo', 'miembro').single()
  if (!rolMiembro) return { error: 'No se encontró el rol "miembro" en la base de datos.' }

  const empleadoId = await resolverEmpleadoId(admin, actor.userId)
  const password = generarPassword()

  // 5) Crear usuario en Auth con el correo real.
  const { data: creado, error: errAuth } = await admin.auth.admin.createUser({
    email: correo,
    password,
    email_confirm: true,
  })
  if (errAuth || !creado?.user) {
    const msg = /already been registered|already registered|exists/i.test(errAuth?.message ?? '')
      ? 'Ya existe un usuario con ese correo.'
      : `No se pudo crear el usuario: ${errAuth?.message ?? 'error desconocido'}`
    return { error: msg }
  }
  const userId = creado.user.id

  // Compensación ante fallos posteriores.
  const revertir = async () => {
    await admin.from('miembros').delete().eq('perfil_id', userId)
    await admin.from('perfiles').delete().eq('id', userId)
    await admin.auth.admin.deleteUser(userId)
  }

  // 6) Perfil (rol miembro).
  const { error: errPerfil } = await admin
    .from('perfiles')
    .upsert({ id: userId, rol_id: rolMiembro.id, activo: true }, { onConflict: 'id' })
  if (errPerfil) {
    await revertir()
    return { error: `No se pudo crear el perfil: ${errPerfil.message}` }
  }

  // 7) Insertar miembro con número único (reintentar ante colisión 23505).
  const { count } = await admin.from('miembros').select('id', { count: 'exact', head: true })
  const seq = (count ?? 0) + 1

  let numero = ''
  let miembroId: number | null = null
  for (let intento = 0; intento < 5; intento++) {
    numero = generarNumeroMembresia(seq)
    const { data: filaMiembro, error: errMiembro } = await admin
      .from('miembros')
      .insert({
        perfil_id: userId,
        numero_membresia: numero,
        nombres,
        apellidos,
        cedula,
        telefono,
        direccion,
        ciudad_id,
        registrado_por: empleadoId,
      })
      .select('id')
      .single()

    if (!errMiembro && filaMiembro) {
      miembroId = filaMiembro.id
      break
    }
    // 23505 = unique_violation (número repetido): reintentar con otra parte aleatoria.
    if (errMiembro && errMiembro.code !== '23505') {
      await revertir()
      return { error: `No se pudo registrar el miembro: ${errMiembro.message}` }
    }
  }
  if (miembroId === null) {
    await revertir()
    return { error: 'No se pudo generar un número de membresía único. Intenta de nuevo.' }
  }

  // 8) Primera membresía (nueva).
  const fecha_inicio = hoyISO()
  const fecha_fin = calcularFechaFin(fecha_inicio, plan.duracion_meses)
  const { error: errMembresia } = await admin.from('membresias').insert({
    miembro_id: miembroId,
    plan_id,
    tipo: 'nueva',
    estado: 'activa',
    fecha_inicio,
    fecha_fin,
    precio_pagado,
    vendido_por: empleadoId,
  })
  if (errMembresia) {
    await revertir()
    return { error: `No se pudo registrar la membresía: ${errMembresia.message}` }
  }

  revalidatePath('/admin/miembros')
  return { ok: true, numero, password, nombre: `${nombres} ${apellidos}`.trim() }
}
```

> **Importante (`'use server'`):** en este archivo, cada `export` debe ser una función async (server action) o un `export type`. Por eso `exigirEmpleadoOAdmin`, `resolverEmpleadoId` y `hoyISO` quedan como funciones **privadas del módulo** (sin `export`). Las Tasks 8 y 9 amplían **este mismo archivo**, así que las usan directamente sin importarlas. Las funciones puras `calcularFechaFin` y `calcularFechaInicioRenovacion` ya están importadas de `@/lib/membresias` en la cabecera y quedan disponibles para Task 8. No agregues re-exports de funciones síncronas.

- [ ] **Step 2: Verificar tipos**

Run: `pnpm exec tsc --noEmit`
Expected: sin errores.

- [ ] **Step 3: Commit**

```bash
git add src/app/admin/miembros/actions.ts
git commit -m "Fase 2: action registrarMiembro (cliente + primera membresia)"
```

---

### Task 7: Miembros — Registro (formulario + página) y lista/búsqueda

**Files:**
- Create: `src/app/admin/miembros/miembro-form.tsx`
- Create: `src/app/admin/miembros/nuevo/page.tsx`
- Create: `src/app/admin/miembros/page.tsx`

**Interfaces:**
- Consumes: `registrarMiembro`, `RegistrarMiembroState` de `../actions` / `./actions`.

- [ ] **Step 1: Crear `miembros/miembro-form.tsx`**

```tsx
'use client'

import { useActionState, useState } from 'react'
import Link from 'next/link'
import { registrarMiembro, type RegistrarMiembroState } from './actions'

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
        <p className="orum-alert orum-alert--success">✓ Miembro {state.nombre} registrado.</p>
        <p style={{ marginBottom: '0.75rem' }}>
          Entrega estos datos al cliente. La contraseña <strong>no se volverá a mostrar</strong>.
        </p>
        <div className="orum-field">
          <span className="orum-label">Número de membresía</span>
          <input className="orum-input" readOnly value={state.numero}
            style={{ fontFamily: 'var(--font-geist-mono, monospace)' }} />
        </div>
        <div className="orum-field">
          <span className="orum-label">Contraseña temporal</span>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <input className="orum-input" readOnly value={state.password}
              style={{ fontFamily: 'var(--font-geist-mono, monospace)' }} />
            <button type="button" className="orum-button orum-button--secondary"
              onClick={() => {
                navigator.clipboard?.writeText(state.password ?? '')
                setCopiado(true)
                setTimeout(() => setCopiado(false), 2000)
              }}>
              {copiado ? '¡Copiado!' : 'Copiar'}
            </button>
          </div>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1rem' }}>
          <Link href="/admin/miembros" className="orum-button">Ir a la lista</Link>
          <a href="/admin/miembros/nuevo" className="orum-button orum-button--secondary">Registrar otro</a>
        </div>
      </div>
    )
  }

  return (
    <form action={formAction} className="orum-card">
      {state.error && <p className="orum-alert orum-alert--error" role="alert">{state.error}</p>}

      <div style={{ display: 'flex', gap: '0.75rem' }}>
        <div className="orum-field" style={{ flex: 1 }}>
          <label className="orum-label" htmlFor="nombres">Nombres</label>
          <input id="nombres" name="nombres" className="orum-input" required />
        </div>
        <div className="orum-field" style={{ flex: 1 }}>
          <label className="orum-label" htmlFor="apellidos">Apellidos</label>
          <input id="apellidos" name="apellidos" className="orum-input" required />
        </div>
      </div>

      <div className="orum-field">
        <label className="orum-label" htmlFor="cedula">Cédula</label>
        <input id="cedula" name="cedula" className="orum-input" required />
      </div>

      <div className="orum-field">
        <label className="orum-label" htmlFor="correo">Correo electrónico</label>
        <input id="correo" name="correo" type="email" className="orum-input" required />
      </div>

      <div style={{ display: 'flex', gap: '0.75rem' }}>
        <div className="orum-field" style={{ flex: 1 }}>
          <label className="orum-label" htmlFor="telefono">Teléfono (opcional)</label>
          <input id="telefono" name="telefono" className="orum-input" />
        </div>
        <div className="orum-field" style={{ flex: 1 }}>
          <label className="orum-label" htmlFor="ciudad_id">Ciudad (opcional)</label>
          <select id="ciudad_id" name="ciudad_id" className="orum-select" defaultValue="">
            <option value="">— Sin ciudad —</option>
            {ciudades.map((c) => (
              <option key={c.id} value={c.id}>{c.nombre}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="orum-field">
        <label className="orum-label" htmlFor="direccion">Dirección (opcional)</label>
        <input id="direccion" name="direccion" className="orum-input" />
      </div>

      <hr style={{ border: 0, borderTop: '1px solid var(--orum-border)', margin: '1rem 0' }} />

      <div style={{ display: 'flex', gap: '0.75rem' }}>
        <div className="orum-field" style={{ flex: 1 }}>
          <label className="orum-label" htmlFor="plan_id">Plan de membresía</label>
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
              <option key={p.id} value={p.id}>{p.nombre} (${p.precio.toLocaleString('es-CO')})</option>
            ))}
          </select>
        </div>
        <div className="orum-field" style={{ flex: 1 }}>
          <label className="orum-label" htmlFor="precio_pagado">Precio pagado</label>
          <input id="precio_pagado" name="precio_pagado" type="number" min="0" step="0.01"
            className="orum-input" required value={precio} onChange={(e) => setPrecio(e.target.value)} />
        </div>
      </div>

      <p className="orum-muted" style={{ fontSize: '0.85rem', margin: '0.5rem 0 1rem' }}>
        Se generará el número de membresía y una contraseña segura; se mostrarán al terminar.
      </p>

      <div style={{ display: 'flex', gap: '0.75rem' }}>
        <button type="submit" className="orum-button" disabled={pending || planes.length === 0}>
          {pending ? 'Registrando…' : 'Registrar miembro'}
        </button>
        <Link href="/admin/miembros" className="orum-button orum-button--secondary">Cancelar</Link>
      </div>
    </form>
  )
}
```

- [ ] **Step 2: Crear `miembros/nuevo/page.tsx`**

```tsx
import { requireRol } from '@/lib/auth'
import { createAdminClient } from '@/lib/supabase/admin'
import { MiembroForm } from '../miembro-form'

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
      <h1 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '1.25rem' }}>Registrar miembro</h1>
      <MiembroForm ciudades={ciudades ?? []} planes={planes ?? []} />
    </div>
  )
}
```

- [ ] **Step 3: Crear la lista/búsqueda `miembros/page.tsx`**

```tsx
import Link from 'next/link'
import { requireRol } from '@/lib/auth'
import { createAdminClient } from '@/lib/supabase/admin'

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

  if (busqueda) {
    consulta = consulta.or(
      `numero_membresia.ilike.%${busqueda}%,cedula.ilike.%${busqueda}%,nombres.ilike.%${busqueda}%,apellidos.ilike.%${busqueda}%`,
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
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 700 }}>Miembros</h1>
        <Link href="/admin/miembros/nuevo" className="orum-button">+ Registrar miembro</Link>
      </div>

      <form method="get" className="orum-card" style={{ marginBottom: '1rem', display: 'flex', gap: '0.5rem' }}>
        <input name="q" className="orum-input" placeholder="Buscar por número, cédula o nombre" defaultValue={busqueda} />
        <button type="submit" className="orum-button orum-button--secondary">Buscar</button>
      </form>

      {!miembros || miembros.length === 0 ? (
        <div className="orum-card">
          <p className="orum-muted">
            {busqueda ? 'No se encontraron miembros con esa búsqueda.' : 'Aún no hay miembros registrados.'}
          </p>
        </div>
      ) : (
        <div className="orum-card" style={{ overflowX: 'auto', padding: 0 }}>
          <table className="orum-table">
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
                      <span className={`orum-badge ${vigente ? 'orum-badge--on' : 'orum-badge--off'}`}>
                        {vigente ? 'Activa' : 'Sin membresía activa'}
                      </span>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <Link href={`/admin/miembros/${m.id}`} className="orum-button orum-button--secondary">
                        Ver ficha
                      </Link>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
```

- [ ] **Step 4: Verificar tipos y probar manualmente**

Run: `pnpm exec tsc --noEmit`
Expected: sin errores.

Manual (`pnpm dev`): entrar como empleado o super_admin a `/admin/miembros/nuevo`, registrar un cliente eligiendo el plan creado en Task 5. Confirmar que aparece la pantalla con número de membresía + contraseña. Volver a `/admin/miembros`, ver el miembro con badge "Activa", y probar la búsqueda por cédula y por número. En Supabase, verificar que se crearon filas en `miembros`, `membresias` (tipo `nueva`, estado `activa`) y el usuario en Authentication.

- [ ] **Step 5: Commit**

```bash
git add src/app/admin/miembros/miembro-form.tsx src/app/admin/miembros/nuevo src/app/admin/miembros/page.tsx
git commit -m "Fase 2: registro de miembros y lista/busqueda"
```

---

### Task 8: Miembros — Ficha, historial y renovación

**Files:**
- Modify: `src/app/admin/miembros/actions.ts` (agregar `renovarMembresia`)
- Create: `src/app/admin/miembros/[id]/renovar-form.tsx`
- Create: `src/app/admin/miembros/[id]/page.tsx`

**Interfaces:**
- Consumes: `exigirEmpleadoOAdmin`, `resolverEmpleadoId`, `hoyISO`, `calcularFechaFin`, `calcularFechaInicioRenovacion` — todas ya presentes en `miembros/actions.ts` (definidas o importadas en Task 6). Como esta task **amplía el mismo archivo**, se usan directamente sin nuevos imports.
- Produces: `type RenovarState = { error?: string }`; `renovarMembresia(_prev: RenovarState, formData: FormData): Promise<RenovarState>`.

- [ ] **Step 1: Agregar `renovarMembresia` a `miembros/actions.ts`**

Añadir al final de `src/app/admin/miembros/actions.ts`:

```ts
export type RenovarState = { error?: string }

/**
 * Renueva la membresía de un miembro: crea una nueva (tipo=renovada) enlazada a
 * la vigente, marca la anterior como 'vencida' y deja solo una 'activa'.
 */
export async function renovarMembresia(
  _prev: RenovarState,
  formData: FormData,
): Promise<RenovarState> {
  const actor = await exigirEmpleadoOAdmin()
  if (!actor) return { error: 'No tienes permiso para realizar esta acción.' }

  const miembro_id = Number(formData.get('miembro_id'))
  const plan_id = Number(formData.get('plan_id'))
  const precio_pagado = Number(formData.get('precio_pagado'))
  if (!Number.isInteger(miembro_id)) return { error: 'Falta el identificador del miembro.' }
  if (!Number.isInteger(plan_id)) return { error: 'Selecciona un plan de membresía.' }
  if (!Number.isFinite(precio_pagado) || precio_pagado < 0) {
    return { error: 'El precio pagado debe ser un número mayor o igual a 0.' }
  }

  const admin = createAdminClient()

  const { data: plan } = await admin
    .from('planes_membresia')
    .select('id, duracion_meses, activo')
    .eq('id', plan_id)
    .is('deleted_at', null)
    .maybeSingle()
  if (!plan || !plan.activo) return { error: 'El plan seleccionado no existe o está inactivo.' }

  // Membresía vigente (activa), si existe.
  const { data: vigente } = await admin
    .from('membresias')
    .select('id, fecha_fin')
    .eq('miembro_id', miembro_id)
    .eq('estado', 'activa')
    .order('fecha_fin', { ascending: false })
    .limit(1)
    .maybeSingle()

  const empleadoId = await resolverEmpleadoId(admin, actor.userId)
  const fecha_inicio = calcularFechaInicioRenovacion(hoyISO(), vigente?.fecha_fin ?? null)
  const fecha_fin = calcularFechaFin(fecha_inicio, plan.duracion_meses)

  const { error: errNueva } = await admin.from('membresias').insert({
    miembro_id,
    plan_id,
    tipo: 'renovada',
    estado: 'activa',
    fecha_inicio,
    fecha_fin,
    precio_pagado,
    vendido_por: empleadoId,
    membresia_anterior_id: vigente?.id ?? null,
  })
  if (errNueva) return { error: `No se pudo registrar la renovación: ${errNueva.message}` }

  // La anterior pasa a 'vencida' para mantener una sola activa.
  if (vigente) {
    await admin.from('membresias').update({ estado: 'vencida' }).eq('id', vigente.id)
  }

  revalidatePath(`/admin/miembros/${miembro_id}`)
  return {}
}
```

- [ ] **Step 2: Crear `[id]/renovar-form.tsx`**

```tsx
'use client'

import { useActionState, useState } from 'react'
import { renovarMembresia, type RenovarState } from '../actions'

type PlanOpcion = { id: number; nombre: string; precio: number }

const estadoInicial: RenovarState = {}

export function RenovarForm({ miembroId, planes }: { miembroId: number; planes: PlanOpcion[] }) {
  const [state, formAction, pending] = useActionState(renovarMembresia, estadoInicial)
  const [precio, setPrecio] = useState<string>(planes[0] ? String(planes[0].precio) : '')

  return (
    <form action={formAction} className="orum-card">
      <h2 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '0.75rem' }}>Renovar / nueva membresía</h2>
      {state.error && <p className="orum-alert orum-alert--error" role="alert">{state.error}</p>}

      <input type="hidden" name="miembro_id" value={miembroId} />

      <div style={{ display: 'flex', gap: '0.75rem' }}>
        <div className="orum-field" style={{ flex: 1 }}>
          <label className="orum-label" htmlFor="plan_id">Plan</label>
          <select id="plan_id" name="plan_id" className="orum-select" required defaultValue={planes[0]?.id ?? ''}
            onChange={(e) => {
              const p = planes.find((x) => x.id === Number(e.target.value))
              if (p) setPrecio(String(p.precio))
            }}>
            {planes.length === 0 && <option value="">— No hay planes activos —</option>}
            {planes.map((p) => (
              <option key={p.id} value={p.id}>{p.nombre} (${p.precio.toLocaleString('es-CO')})</option>
            ))}
          </select>
        </div>
        <div className="orum-field" style={{ flex: 1 }}>
          <label className="orum-label" htmlFor="precio_pagado">Precio pagado</label>
          <input id="precio_pagado" name="precio_pagado" type="number" min="0" step="0.01"
            className="orum-input" required value={precio} onChange={(e) => setPrecio(e.target.value)} />
        </div>
      </div>

      <button type="submit" className="orum-button" disabled={pending || planes.length === 0}>
        {pending ? 'Registrando…' : 'Registrar renovación'}
      </button>
    </form>
  )
}
```

- [ ] **Step 3: Crear la ficha `[id]/page.tsx`**

```tsx
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { requireRol } from '@/lib/auth'
import { createAdminClient } from '@/lib/supabase/admin'
import { RenovarForm } from './renovar-form'

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

  const [{ data: membresias }, { data: planes }, { data: ciudad }] = await Promise.all([
    admin.from('membresias')
      .select('id, tipo, estado, fecha_inicio, fecha_fin, precio_pagado, plan_id')
      .eq('miembro_id', miembroId)
      .order('fecha_inicio', { ascending: false }),
    admin.from('planes_membresia').select('id, nombre, precio').eq('activo', true).is('deleted_at', null).order('nombre'),
    miembro.ciudad_id
      ? admin.from('ciudades').select('nombre').eq('id', miembro.ciudad_id).maybeSingle()
      : Promise.resolve({ data: null }),
  ])

  const nombrePlan = new Map((planes ?? []).map((p) => [p.id, p.nombre]))
  // Correo de Auth (informativo), como en la gestión de usuarios.
  let correo = '—'
  if (miembro.perfil_id) {
    const { data: authUser } = await admin.auth.admin.getUserById(miembro.perfil_id)
    correo = authUser.user?.email ?? '—'
  }

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 700 }}>{`${miembro.nombres} ${miembro.apellidos}`.trim()}</h1>
        <Link href={`/admin/miembros/${miembro.id}/editar`} className="orum-button orum-button--secondary">
          Editar datos
        </Link>
      </div>

      <div className="orum-card" style={{ marginBottom: '1.25rem' }}>
        <p><strong>Número de membresía:</strong> <span style={{ fontFamily: 'var(--font-geist-mono, monospace)' }}>{miembro.numero_membresia}</span></p>
        <p><strong>Cédula:</strong> {miembro.cedula}</p>
        <p><strong>Correo:</strong> {correo}</p>
        <p><strong>Teléfono:</strong> {miembro.telefono ?? '—'}</p>
        <p><strong>Dirección:</strong> {miembro.direccion ?? '—'}</p>
        <p><strong>Ciudad:</strong> {ciudad?.nombre ?? '—'}</p>
      </div>

      <h2 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '0.75rem' }}>Historial de membresías</h2>
      {!membresias || membresias.length === 0 ? (
        <div className="orum-card" style={{ marginBottom: '1.25rem' }}>
          <p className="orum-muted">Este miembro no tiene membresías registradas.</p>
        </div>
      ) : (
        <div className="orum-card" style={{ overflowX: 'auto', padding: 0, marginBottom: '1.25rem' }}>
          <table className="orum-table">
            <thead>
              <tr><th>Plan</th><th>Tipo</th><th>Estado</th><th>Inicio</th><th>Fin</th><th>Precio</th></tr>
            </thead>
            <tbody>
              {membresias.map((m) => (
                <tr key={m.id}>
                  <td>{nombrePlan.get(m.plan_id) ?? `Plan #${m.plan_id}`}</td>
                  <td>{m.tipo}</td>
                  <td>
                    <span className={`orum-badge ${m.estado === 'activa' ? 'orum-badge--on' : 'orum-badge--off'}`}>
                      {m.estado}
                    </span>
                  </td>
                  <td>{m.fecha_inicio}</td>
                  <td>{m.fecha_fin}</td>
                  <td>${m.precio_pagado.toLocaleString('es-CO')}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <RenovarForm miembroId={miembro.id} planes={planes ?? []} />
    </div>
  )
}
```

- [ ] **Step 4: Verificar tipos y probar manualmente**

Run: `pnpm exec tsc --noEmit`
Expected: sin errores.

Manual: abrir la ficha de un miembro, confirmar datos + historial (1 membresía "nueva/activa"). Renovar eligiendo un plan; confirmar que ahora hay 2 filas: la anterior "vencida" y la nueva "renovada/activa", y que la nueva empieza el día siguiente al fin de la anterior.

- [ ] **Step 5: Commit**

```bash
git add src/app/admin/miembros/actions.ts src/app/admin/miembros/[id]/renovar-form.tsx src/app/admin/miembros/[id]/page.tsx
git commit -m "Fase 2: ficha de miembro, historial y renovacion"
```

---

### Task 9: Miembros — Editar datos del cliente

**Files:**
- Modify: `src/app/admin/miembros/actions.ts` (agregar `editarMiembro`)
- Create: `src/app/admin/miembros/[id]/editar/editar-miembro-form.tsx`
- Create: `src/app/admin/miembros/[id]/editar/page.tsx`

**Interfaces:**
- Consumes: `exigirEmpleadoOAdmin` (de `./actions`), `createAdminClient`.
- Produces: `type EditarMiembroState = { error?: string }`; `editarMiembro(_prev: EditarMiembroState, formData: FormData): Promise<EditarMiembroState>`.

- [ ] **Step 1: Agregar el import de `redirect` a la cabecera**

En el bloque de imports (arriba) de `src/app/admin/miembros/actions.ts`, junto a `import { revalidatePath } from 'next/cache'`, agregar:

```ts
import { redirect } from 'next/navigation'
```

- [ ] **Step 2: Agregar `editarMiembro` al final de `miembros/actions.ts`**

```ts
export type EditarMiembroState = { error?: string }

/**
 * Edita los datos de un miembro (no cambia número ni perfil_id/UUID). El correo
 * se actualiza vía Admin API sólo si cambió.
 */
export async function editarMiembro(
  _prev: EditarMiembroState,
  formData: FormData,
): Promise<EditarMiembroState> {
  const actor = await exigirEmpleadoOAdmin()
  if (!actor) return { error: 'No tienes permiso para realizar esta acción.' }

  const miembroId = Number(formData.get('miembro_id'))
  const perfilId = String(formData.get('perfil_id') ?? '')
  if (!Number.isInteger(miembroId)) return { error: 'Falta el identificador del miembro.' }

  const nombres = String(formData.get('nombres') ?? '').trim()
  const apellidos = String(formData.get('apellidos') ?? '').trim()
  const cedula = String(formData.get('cedula') ?? '').trim()
  const telefono = String(formData.get('telefono') ?? '').trim() || null
  const direccion = String(formData.get('direccion') ?? '').trim() || null
  const ciudadRaw = String(formData.get('ciudad_id') ?? '').trim()
  const ciudad_id = ciudadRaw ? Number(ciudadRaw) : null
  if (!nombres || !apellidos) return { error: 'Nombres y apellidos son obligatorios.' }
  if (!cedula) return { error: 'La cédula es obligatoria.' }

  const admin = createAdminClient()

  // Cédula única, excluyendo al propio miembro.
  const { data: cedulaExiste } = await admin
    .from('miembros')
    .select('id')
    .eq('cedula', cedula)
    .is('deleted_at', null)
    .neq('id', miembroId)
    .maybeSingle()
  if (cedulaExiste) return { error: `Ya existe otro miembro con la cédula ${cedula}.` }

  const { error } = await admin
    .from('miembros')
    .update({ nombres, apellidos, cedula, telefono, direccion, ciudad_id })
    .eq('id', miembroId)
  if (error) return { error: `No se pudieron guardar los cambios: ${error.message}` }

  // Correo (vía Auth), sólo si cambió.
  const correo = String(formData.get('correo') ?? '').trim().toLowerCase()
  const correoOriginal = String(formData.get('correo_original') ?? '').trim().toLowerCase()
  if (perfilId && correo && correo !== correoOriginal) {
    if (!correo.includes('@')) return { error: 'El correo electrónico no es válido.' }
    const { error: errCorreo } = await admin.auth.admin.updateUserById(perfilId, {
      email: correo,
      email_confirm: true,
    })
    if (errCorreo) {
      const msg = /already been registered|already registered|exists/i.test(errCorreo.message)
        ? 'Ese correo ya está en uso por otro usuario.'
        : `No se pudo actualizar el correo: ${errCorreo.message}`
      return { error: msg }
    }
  }

  revalidatePath(`/admin/miembros/${miembroId}`)
  redirect(`/admin/miembros/${miembroId}`)
}
```

- [ ] **Step 3: Crear `[id]/editar/editar-miembro-form.tsx`**

```tsx
'use client'

import { useActionState } from 'react'
import Link from 'next/link'
import { editarMiembro, type EditarMiembroState } from '../../actions'

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
      {state.error && <p className="orum-alert orum-alert--error" role="alert">{state.error}</p>}

      <input type="hidden" name="miembro_id" value={miembro.id} />
      <input type="hidden" name="perfil_id" value={miembro.perfil_id ?? ''} />
      <input type="hidden" name="correo_original" value={miembro.correo} />

      <div style={{ display: 'flex', gap: '0.75rem' }}>
        <div className="orum-field" style={{ flex: 1 }}>
          <label className="orum-label" htmlFor="nombres">Nombres</label>
          <input id="nombres" name="nombres" className="orum-input" required defaultValue={miembro.nombres} />
        </div>
        <div className="orum-field" style={{ flex: 1 }}>
          <label className="orum-label" htmlFor="apellidos">Apellidos</label>
          <input id="apellidos" name="apellidos" className="orum-input" required defaultValue={miembro.apellidos} />
        </div>
      </div>

      <div className="orum-field">
        <label className="orum-label" htmlFor="cedula">Cédula</label>
        <input id="cedula" name="cedula" className="orum-input" required defaultValue={miembro.cedula} />
      </div>

      <div className="orum-field">
        <label className="orum-label" htmlFor="correo">Correo electrónico</label>
        <input id="correo" name="correo" type="email" className="orum-input" defaultValue={miembro.correo === '—' ? '' : miembro.correo} />
      </div>

      <div style={{ display: 'flex', gap: '0.75rem' }}>
        <div className="orum-field" style={{ flex: 1 }}>
          <label className="orum-label" htmlFor="telefono">Teléfono (opcional)</label>
          <input id="telefono" name="telefono" className="orum-input" defaultValue={miembro.telefono ?? ''} />
        </div>
        <div className="orum-field" style={{ flex: 1 }}>
          <label className="orum-label" htmlFor="ciudad_id">Ciudad (opcional)</label>
          <select id="ciudad_id" name="ciudad_id" className="orum-select" defaultValue={miembro.ciudad_id ?? ''}>
            <option value="">— Sin ciudad —</option>
            {ciudades.map((c) => (
              <option key={c.id} value={c.id}>{c.nombre}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="orum-field">
        <label className="orum-label" htmlFor="direccion">Dirección (opcional)</label>
        <input id="direccion" name="direccion" className="orum-input" defaultValue={miembro.direccion ?? ''} />
      </div>

      <div style={{ display: 'flex', gap: '0.75rem' }}>
        <button type="submit" className="orum-button" disabled={pending}>
          {pending ? 'Guardando…' : 'Guardar cambios'}
        </button>
        <Link href={`/admin/miembros/${miembro.id}`} className="orum-button orum-button--secondary">Cancelar</Link>
      </div>
    </form>
  )
}
```

- [ ] **Step 4: Crear `[id]/editar/page.tsx`**

```tsx
import { notFound } from 'next/navigation'
import { requireRol } from '@/lib/auth'
import { createAdminClient } from '@/lib/supabase/admin'
import { EditarMiembroForm } from './editar-miembro-form'

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
      <h1 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '1.25rem' }}>Editar miembro</h1>
      <EditarMiembroForm miembro={{ ...miembro, correo }} ciudades={ciudades ?? []} />
    </div>
  )
}
```

- [ ] **Step 5: Verificar tipos y probar manualmente**

Run: `pnpm exec tsc --noEmit`
Expected: sin errores.

Manual: desde la ficha, "Editar datos", cambiar teléfono/dirección y el correo; guardar; confirmar que la ficha refleja los cambios y que el correo nuevo aparece. Probar que una cédula duplicada de otro miembro se rechaza.

- [ ] **Step 6: Commit**

```bash
git add src/app/admin/miembros/actions.ts "src/app/admin/miembros/[id]/editar"
git commit -m "Fase 2: edicion de datos del miembro"
```

---

## Verificación final

- [ ] `pnpm test` → todas las pruebas en verde.
- [ ] `pnpm exec tsc --noEmit` → sin errores.
- [ ] `pnpm build` → build exitoso.
- [ ] Recorrido manual completo (criterios de aceptación de la spec, sección 10): planes CRUD; registro de miembro con número + contraseña; rechazo de cédula/correo duplicados; ficha con historial; renovación (anterior→vencida, nueva→activa); autoría `registrado_por`/`vendido_por`; rollback ante fallo (p. ej. intentar registrar con un correo ya existente y confirmar que no queda miembro huérfano).
