# Fase 3 — Comercios, sucursales y promociones — Plan de implementación

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Dar a los comercios aliados su propia sección administrativa (`/admin/comercios`) con CRUD completo de comercio, sucursales y promociones, y retirar la gestión de comercios de `/admin/usuarios`.

**Architecture:** Mismo patrón que Fases 1 y 2: Server Components para lectura (con `requireRol`), Server Actions `'use server'` para escritura (con verificación de rol al inicio de cada acción), `createAdminClient()` (service role) para todo acceso a datos, y componentes de formulario `'use client'` con `useActionState`. No hay tablas nuevas ni migraciones: `sucursales`, `promociones` y `tipos_beneficio` ya existen en Supabase (confirmado contra el esquema real vía la API REST de PostgREST, no solo `Esquema_BD.txt`, que está truncado a partir de la fila `sucursales`).

**Tech Stack:** Next.js 16 (App Router, Server Actions), React 19, Supabase (`@supabase/supabase-js`), TypeScript, Vitest.

## Global Constraints

- Solo `super_admin` accede a `/admin/comercios/**` (D3 del spec) — usar `requireRol('super_admin')` en cada página y una función `exigirSuperAdmin()` al inicio de cada server action, igual que en `planes/actions.ts`.
- `comercios.activo` (¿aliado activo?) y `perfiles.activo` (¿acceso a su cuenta?) son dos estados independientes que se alternan por separado en la ficha (D2).
- `nombre` de sucursal es obligatorio a nivel de app aunque la columna sea nullable en BD (D4).
- La validación de `promociones.valor` según `tipos_beneficio.codigo` vive en una función pura y testeable `validarValorPromocion` en `src/lib/promociones.ts` (D5), usada tanto en crear como en editar promoción.
- "Eliminar" sucursales/promociones se resuelve como desactivar (`activo = false`); no hay borrado físico ni se usa `deleted_at` en esta fase (igual que en `planes_membresia`).
- No se crean migraciones SQL. No se construye pantalla de gestión de `marcas`/`categorias`/`ciudades`/`tipos_beneficio` — son catálogos ya sembrados, se consumen por dropdown.
- Sigue el patrón exacto de Fases 1 y 2: pruebas automatizadas solo para funciones puras (como `src/lib/membresias.test.ts`); el resto (server actions, páginas) se verifica manualmente contra los criterios de aceptación del spec.

## Nota sobre datos semilla

Verifiqué contra Supabase (API REST) que `ciudades` tiene 1 fila, pero **`marcas` y `categorias` tienen 0 filas**. Como son campos opcionales en el formulario de comercio, esto no bloquea el desarrollo, pero los selects de marca/categoría estarán vacíos hasta que se siembre al menos una fila de cada uno directamente en Supabase (tarea previa #1 del spec, fuera del alcance de este plan porque no hay pantalla de gestión de catálogos). Antes de la verificación manual del Task 4, siembra manualmente una marca y una categoría en el dashboard de Supabase si quieres probar esos selects con datos.

---

## Task 1: Extender `database.types.ts` con `sucursales`, `promociones` y `tipos_beneficio`

**Files:**
- Modify: `src/lib/supabase/database.types.ts`

**Interfaces:**
- Produces: tipo `TipoBeneficioCodigo`, y las entradas de `Database['public']['Tables']` para `sucursales`, `promociones`, `tipos_beneficio`, usadas por todas las tareas siguientes.

Esquema real confirmado vía PostgREST (no el truncado de `Esquema_BD.txt`):

- `sucursales`: `id, comercio_id (NOT NULL), ciudad_id (NOT NULL), nombre, direccion, telefono` (estos 3 nullable en BD), `activo (default true), created_at, updated_at, deleted_at`.
- `promociones`: `id, comercio_id (NOT NULL), tipo_beneficio_id (NOT NULL), titulo (NOT NULL), descripcion, valor, fecha_inicio, fecha_fin, activo (default true), created_at, updated_at, deleted_at`.
- `tipos_beneficio`: `id, codigo (NOT NULL), nombre (NOT NULL), descripcion`. Filas sembradas: `porcentaje`, `dos_por_uno`, `monto_fijo`, `regalo`.

- [ ] **Step 1: Agregar el tipo `TipoBeneficioCodigo` junto a `RolCodigo`**

En `src/lib/supabase/database.types.ts`, justo después de la línea `export type RolCodigo = ...`:

```ts
/** Códigos de tipo_beneficio tal como están en la tabla `tipos_beneficio`. */
export type TipoBeneficioCodigo = 'porcentaje' | 'dos_por_uno' | 'monto_fijo' | 'regalo'
```

- [ ] **Step 2: Agregar las tres tablas al final de `Tables`, antes del cierre**

Insertar después de la definición de `membresias` (antes de `Views: Record<string, never>`):

```ts
      sucursales: {
        Row: {
          id: number
          comercio_id: number
          ciudad_id: number
          nombre: string | null
          direccion: string | null
          telefono: string | null
          activo: boolean
          created_at: Timestamp
          updated_at: Timestamp
          deleted_at: Timestamp | null
        }
        Insert: {
          id?: number
          comercio_id: number
          ciudad_id: number
          nombre?: string | null
          direccion?: string | null
          telefono?: string | null
          activo?: boolean
          created_at?: Timestamp
          updated_at?: Timestamp
          deleted_at?: Timestamp | null
        }
        Update: Partial<Database['public']['Tables']['sucursales']['Insert']>
        Relationships: []
      }
      tipos_beneficio: {
        Row: {
          id: number
          codigo: TipoBeneficioCodigo
          nombre: string
          descripcion: string | null
        }
        Insert: {
          id?: number
          codigo: TipoBeneficioCodigo
          nombre: string
          descripcion?: string | null
        }
        Update: Partial<Database['public']['Tables']['tipos_beneficio']['Insert']>
        Relationships: []
      }
      promociones: {
        Row: {
          id: number
          comercio_id: number
          tipo_beneficio_id: number
          titulo: string
          descripcion: string | null
          valor: number | null
          fecha_inicio: string | null
          fecha_fin: string | null
          activo: boolean
          created_at: Timestamp
          updated_at: Timestamp
          deleted_at: Timestamp | null
        }
        Insert: {
          id?: number
          comercio_id: number
          tipo_beneficio_id: number
          titulo: string
          descripcion?: string | null
          valor?: number | null
          fecha_inicio?: string | null
          fecha_fin?: string | null
          activo?: boolean
          created_at?: Timestamp
          updated_at?: Timestamp
          deleted_at?: Timestamp | null
        }
        Update: Partial<Database['public']['Tables']['promociones']['Insert']>
        Relationships: []
      }
```

- [ ] **Step 3: Verificar que el proyecto sigue compilando**

Run: `npx tsc --noEmit`
Expected: sin errores.

- [ ] **Step 4: Commit**

```bash
git add src/lib/supabase/database.types.ts
git commit -m "types: agregar sucursales, promociones y tipos_beneficio"
```

---

## Task 2: Función pura `validarValorPromocion` con pruebas (D5)

**Files:**
- Create: `src/lib/promociones.ts`
- Create: `src/lib/promociones.test.ts`

**Interfaces:**
- Consumes: `TipoBeneficioCodigo` (Task 1).
- Produces: `validarValorPromocion(tipoCodigo, valor): { ok: true } | { ok: false; error: string }`, usada por `crearPromocion`/`editarPromocion` en Task 7.

- [ ] **Step 1: Escribir las pruebas primero**

Crear `src/lib/promociones.test.ts`:

```ts
import { describe, it, expect } from 'vitest'
import { validarValorPromocion } from './promociones'

describe('validarValorPromocion — porcentaje', () => {
  it('acepta un porcentaje válido', () => {
    expect(validarValorPromocion('porcentaje', 20)).toEqual({ ok: true })
  })

  it('acepta exactamente 100', () => {
    expect(validarValorPromocion('porcentaje', 100)).toEqual({ ok: true })
  })

  it('rechaza sin valor', () => {
    expect(validarValorPromocion('porcentaje', null).ok).toBe(false)
  })

  it('rechaza 0', () => {
    expect(validarValorPromocion('porcentaje', 0).ok).toBe(false)
  })

  it('rechaza más de 100', () => {
    expect(validarValorPromocion('porcentaje', 100.01).ok).toBe(false)
  })

  it('rechaza negativos', () => {
    expect(validarValorPromocion('porcentaje', -5).ok).toBe(false)
  })
})

describe('validarValorPromocion — monto_fijo', () => {
  it('acepta un monto positivo', () => {
    expect(validarValorPromocion('monto_fijo', 15000)).toEqual({ ok: true })
  })

  it('rechaza sin valor', () => {
    expect(validarValorPromocion('monto_fijo', null).ok).toBe(false)
  })

  it('rechaza 0', () => {
    expect(validarValorPromocion('monto_fijo', 0).ok).toBe(false)
  })

  it('rechaza negativos', () => {
    expect(validarValorPromocion('monto_fijo', -1).ok).toBe(false)
  })
})

describe('validarValorPromocion — dos_por_uno y regalo', () => {
  it('acepta dos_por_uno sin valor', () => {
    expect(validarValorPromocion('dos_por_uno', null)).toEqual({ ok: true })
  })

  it('acepta regalo sin valor', () => {
    expect(validarValorPromocion('regalo', null)).toEqual({ ok: true })
  })

  it('rechaza dos_por_uno con valor', () => {
    expect(validarValorPromocion('dos_por_uno', 10).ok).toBe(false)
  })

  it('rechaza regalo con valor', () => {
    expect(validarValorPromocion('regalo', 1).ok).toBe(false)
  })
})
```

- [ ] **Step 2: Ejecutar las pruebas para confirmar que fallan**

Run: `npx vitest run src/lib/promociones.test.ts`
Expected: FAIL — `Cannot find module './promociones'` (el archivo aún no existe).

- [ ] **Step 3: Implementar `validarValorPromocion`**

Crear `src/lib/promociones.ts`:

```ts
import type { TipoBeneficioCodigo } from './supabase/database.types'

export type ResultadoValidacion = { ok: true } | { ok: false; error: string }

/**
 * Valida `promociones.valor` según el tipo de beneficio (D5):
 * - porcentaje: obligatorio, 0 < valor <= 100.
 * - monto_fijo: obligatorio, valor > 0.
 * - dos_por_uno / regalo: debe quedar vacío (null).
 */
export function validarValorPromocion(
  tipoCodigo: TipoBeneficioCodigo,
  valor: number | null,
): ResultadoValidacion {
  if (tipoCodigo === 'porcentaje') {
    if (valor === null || !Number.isFinite(valor)) {
      return { ok: false, error: 'El porcentaje de descuento es obligatorio para este tipo de promoción.' }
    }
    if (valor <= 0 || valor > 100) {
      return { ok: false, error: 'El porcentaje debe ser mayor a 0 y menor o igual a 100.' }
    }
    return { ok: true }
  }

  if (tipoCodigo === 'monto_fijo') {
    if (valor === null || !Number.isFinite(valor)) {
      return { ok: false, error: 'El monto del descuento es obligatorio para este tipo de promoción.' }
    }
    if (valor <= 0) {
      return { ok: false, error: 'El monto debe ser mayor a 0.' }
    }
    return { ok: true }
  }

  // dos_por_uno y regalo no llevan valor.
  if (valor !== null) {
    return { ok: false, error: 'Este tipo de promoción no debe tener un valor.' }
  }
  return { ok: true }
}
```

- [ ] **Step 4: Ejecutar las pruebas de nuevo para confirmar que pasan**

Run: `npx vitest run src/lib/promociones.test.ts`
Expected: PASS (17 pruebas).

- [ ] **Step 5: Commit**

```bash
git add src/lib/promociones.ts src/lib/promociones.test.ts
git commit -m "feat: validarValorPromocion segun tipo de beneficio (D5)"
```

---

## Task 3: Server actions de comercio (crear, editar, dos estados)

**Files:**
- Create: `src/app/admin/comercios/actions.ts`

**Interfaces:**
- Consumes: `createAdminClient` (`@/lib/supabase/admin`), `getPerfilActual` (`@/lib/auth`), `generarPassword` (`@/lib/password`).
- Produces: `crearComercio(prev, formData): Promise<CrearComercioState>`, `editarComercio(prev, formData): Promise<EditarComercioState>`, `cambiarEstadoComercio(formData): Promise<void>`, `cambiarEstadoAccesoComercio(formData): Promise<void>` — usadas por Tasks 4, 9, 10.

- [ ] **Step 1: Crear el archivo de acciones**

Crear `src/app/admin/comercios/actions.ts`:

```ts
'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createAdminClient } from '@/lib/supabase/admin'
import { getPerfilActual } from '@/lib/auth'
import { generarPassword } from '@/lib/password'

/** Verifica que quien ejecuta la acción sea super_admin. */
async function exigirSuperAdmin(): Promise<boolean> {
  const actor = await getPerfilActual()
  return !!actor && actor.activo && actor.rolCodigo === 'super_admin'
}

export type CrearComercioState = {
  error?: string
  ok?: boolean
  email?: string
  password?: string
}

/** Lee y valida los campos comunes de un comercio desde el formulario. */
function leerCamposComercio(formData: FormData) {
  const nombre = String(formData.get('nombre') ?? '').trim()
  const descripcion = String(formData.get('descripcion') ?? '').trim() || null
  const marcaRaw = String(formData.get('marca_id') ?? '').trim()
  const categoriaRaw = String(formData.get('categoria_id') ?? '').trim()
  const logo_url = String(formData.get('logo_url') ?? '').trim() || null
  return {
    nombre,
    descripcion,
    marca_id: marcaRaw ? Number(marcaRaw) : null,
    categoria_id: categoriaRaw ? Number(categoriaRaw) : null,
    logo_url,
  }
}

/**
 * Crea un comercio: cuenta de Auth (correo + contraseña autogenerada, mostrada
 * una sola vez) → upsert de `perfiles` (rol comercio) → insert en `comercios`.
 * Si algo falla, se revierte lo anterior.
 */
export async function crearComercio(
  _prev: CrearComercioState,
  formData: FormData,
): Promise<CrearComercioState> {
  if (!(await exigirSuperAdmin())) return { error: 'No tienes permiso para realizar esta acción.' }

  const email = String(formData.get('correo') ?? '').trim().toLowerCase()
  if (!email || !email.includes('@')) return { error: 'Ingresa un correo electrónico válido.' }

  const campos = leerCamposComercio(formData)
  if (!campos.nombre) return { error: 'El nombre del comercio es obligatorio.' }

  const admin = createAdminClient()

  const { data: rol } = await admin.from('roles').select('id').eq('codigo', 'comercio').single()
  if (!rol) return { error: 'No se encontró el rol "comercio" en la base de datos.' }

  const password = generarPassword()

  const { data: creado, error: errAuth } = await admin.auth.admin.createUser({
    email,
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

  const revertir = async () => {
    await admin.from('perfiles').delete().eq('id', userId)
    await admin.auth.admin.deleteUser(userId)
  }

  const { error: errPerfil } = await admin
    .from('perfiles')
    .upsert({ id: userId, rol_id: rol.id, activo: true }, { onConflict: 'id' })
  if (errPerfil) {
    await revertir()
    return { error: `No se pudo crear el perfil: ${errPerfil.message}` }
  }

  const { error: errComercio } = await admin.from('comercios').insert({
    perfil_id: userId,
    nombre: campos.nombre,
    descripcion: campos.descripcion,
    marca_id: campos.marca_id,
    categoria_id: campos.categoria_id,
    logo_url: campos.logo_url,
    activo: true,
  })
  if (errComercio) {
    await revertir()
    return { error: `No se pudo registrar el comercio: ${errComercio.message}` }
  }

  revalidatePath('/admin/comercios')
  return { ok: true, email, password }
}

export type EditarComercioState = { error?: string }

/** Edita nombre, descripción, marca, categoría, logo_url y (si cambió) el correo. */
export async function editarComercio(
  _prev: EditarComercioState,
  formData: FormData,
): Promise<EditarComercioState> {
  if (!(await exigirSuperAdmin())) return { error: 'No tienes permiso para realizar esta acción.' }

  const id = Number(formData.get('id'))
  const perfilId = String(formData.get('perfil_id') ?? '')
  if (!Number.isInteger(id) || id < 1) return { error: 'Falta el identificador del comercio.' }

  const campos = leerCamposComercio(formData)
  if (!campos.nombre) return { error: 'El nombre del comercio es obligatorio.' }

  const admin = createAdminClient()

  const { error } = await admin
    .from('comercios')
    .update({
      nombre: campos.nombre,
      descripcion: campos.descripcion,
      marca_id: campos.marca_id,
      categoria_id: campos.categoria_id,
      logo_url: campos.logo_url,
    })
    .eq('id', id)
  if (error) return { error: `No se pudieron guardar los cambios: ${error.message}` }

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

  revalidatePath('/admin/comercios')
  revalidatePath(`/admin/comercios/${id}`)
  redirect(`/admin/comercios/${id}`)
}

/** Activa o desactiva el comercio como aliado (`comercios.activo`, D2). */
export async function cambiarEstadoComercio(formData: FormData): Promise<void> {
  if (!(await exigirSuperAdmin())) redirect('/login?error=sin_permiso')

  const id = Number(formData.get('id'))
  const activar = String(formData.get('activar') ?? '') === 'true'
  if (!Number.isInteger(id) || id < 1) redirect('/admin/comercios')

  const admin = createAdminClient()
  await admin.from('comercios').update({ activo: activar }).eq('id', id)

  revalidatePath('/admin/comercios')
  revalidatePath(`/admin/comercios/${id}`)
  redirect(`/admin/comercios/${id}`)
}

/** Activa o desactiva el acceso a la cuenta del comercio (`perfiles.activo`, D2). */
export async function cambiarEstadoAccesoComercio(formData: FormData): Promise<void> {
  if (!(await exigirSuperAdmin())) redirect('/login?error=sin_permiso')

  const id = Number(formData.get('id'))
  const perfilId = String(formData.get('perfil_id') ?? '')
  const activar = String(formData.get('activar') ?? '') === 'true'
  if (!Number.isInteger(id) || id < 1 || !perfilId) redirect('/admin/comercios')

  const admin = createAdminClient()
  await admin.from('perfiles').update({ activo: activar }).eq('id', perfilId)

  revalidatePath('/admin/comercios')
  revalidatePath(`/admin/comercios/${id}`)
  redirect(`/admin/comercios/${id}`)
}
```

- [ ] **Step 2: Verificar tipos**

Run: `npx tsc --noEmit`
Expected: sin errores (todavía no hay páginas que las usen, pero el archivo debe compilar solo).

- [ ] **Step 3: Commit**

```bash
git add src/app/admin/comercios/actions.ts
git commit -m "feat: server actions de comercio (crear, editar, dos estados)"
```

---

## Task 4: Lista y creación de comercios (`/admin/comercios`, `/admin/comercios/nuevo`)

**Files:**
- Create: `src/app/admin/comercios/page.tsx`
- Create: `src/app/admin/comercios/comercio-form.tsx`
- Create: `src/app/admin/comercios/nuevo/page.tsx`

**Interfaces:**
- Consumes: `crearComercio`, `CrearComercioState` (Task 3).

- [ ] **Step 1: Lista con búsqueda por nombre**

Crear `src/app/admin/comercios/page.tsx`:

```tsx
import Link from 'next/link'
import { requireRol } from '@/lib/auth'
import { createAdminClient } from '@/lib/supabase/admin'

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
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 700 }}>Comercios</h1>
        <Link href="/admin/comercios/nuevo" className="orum-button">+ Crear comercio</Link>
      </div>

      <form method="get" className="orum-card" style={{ marginBottom: '1.25rem', display: 'flex', gap: '0.75rem' }}>
        <input
          type="text"
          name="q"
          className="orum-input"
          placeholder="Buscar por nombre…"
          defaultValue={busqueda}
        />
        <button type="submit" className="orum-button orum-button--secondary">Buscar</button>
      </form>

      {!comercios || comercios.length === 0 ? (
        <div className="orum-card">
          <p className="orum-muted">
            {busqueda ? 'Ningún comercio coincide con la búsqueda.' : 'Aún no hay comercios. Crea el primero.'}
          </p>
        </div>
      ) : (
        <div className="orum-card" style={{ overflowX: 'auto', padding: 0 }}>
          <table className="orum-table">
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
                    <span className={`orum-badge ${c.activo ? 'orum-badge--on' : 'orum-badge--off'}`}>
                      {c.activo ? 'Activo' : 'Inactivo'}
                    </span>
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    <Link href={`/admin/comercios/${c.id}`} className="orum-button orum-button--secondary">
                      Ver ficha
                    </Link>
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

- [ ] **Step 2: Formulario de creación (con pantalla de contraseña, patrón de `usuario-form.tsx`)**

Crear `src/app/admin/comercios/comercio-form.tsx`:

```tsx
'use client'

import { useActionState, useState } from 'react'
import Link from 'next/link'
import { crearComercio, type CrearComercioState } from './actions'

type Opcion = { id: number; nombre: string }

const estadoInicial: CrearComercioState = {}

export function ComercioForm({ marcas, categorias }: { marcas: Opcion[]; categorias: Opcion[] }) {
  const [state, formAction, pending] = useActionState(crearComercio, estadoInicial)
  const [copiado, setCopiado] = useState(false)

  if (state.ok && state.password) {
    return (
      <div className="orum-card">
        <p className="orum-alert orum-alert--success">✓ Comercio creado correctamente.</p>
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
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <input
              className="orum-input"
              readOnly
              value={state.password}
              style={{ fontFamily: 'var(--font-geist-mono, monospace)' }}
            />
            <button
              type="button"
              className="orum-button orum-button--secondary"
              onClick={() => {
                navigator.clipboard?.writeText(state.password ?? '')
                setCopiado(true)
                setTimeout(() => setCopiado(false), 2000)
              }}
            >
              {copiado ? '¡Copiado!' : 'Copiar'}
            </button>
          </div>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1rem' }}>
          <Link href="/admin/comercios" className="orum-button">Ir a la lista</Link>
          <Link href="/admin/comercios/nuevo" className="orum-button orum-button--secondary">Crear otro</Link>
        </div>
      </div>
    )
  }

  return (
    <form action={formAction} className="orum-card">
      {state.error && <p className="orum-alert orum-alert--error" role="alert">{state.error}</p>}

      <div className="orum-field">
        <label className="orum-label" htmlFor="correo">Correo electrónico (para iniciar sesión)</label>
        <input id="correo" name="correo" type="email" className="orum-input" required />
      </div>

      <div className="orum-field">
        <label className="orum-label" htmlFor="nombre">Nombre del comercio</label>
        <input id="nombre" name="nombre" className="orum-input" required />
      </div>

      <div className="orum-field">
        <label className="orum-label" htmlFor="descripcion">Descripción (opcional)</label>
        <input id="descripcion" name="descripcion" className="orum-input" />
      </div>

      <div style={{ display: 'flex', gap: '0.75rem' }}>
        <div className="orum-field" style={{ flex: 1 }}>
          <label className="orum-label" htmlFor="marca_id">Marca (opcional)</label>
          <select id="marca_id" name="marca_id" className="orum-select" defaultValue="">
            <option value="">— Sin marca —</option>
            {marcas.map((m) => <option key={m.id} value={m.id}>{m.nombre}</option>)}
          </select>
        </div>
        <div className="orum-field" style={{ flex: 1 }}>
          <label className="orum-label" htmlFor="categoria_id">Categoría (opcional)</label>
          <select id="categoria_id" name="categoria_id" className="orum-select" defaultValue="">
            <option value="">— Sin categoría —</option>
            {categorias.map((c) => <option key={c.id} value={c.id}>{c.nombre}</option>)}
          </select>
        </div>
      </div>

      <div className="orum-field">
        <label className="orum-label" htmlFor="logo_url">URL del logo (opcional)</label>
        <input id="logo_url" name="logo_url" className="orum-input" placeholder="https://…" />
      </div>

      <p className="orum-muted" style={{ fontSize: '0.85rem', marginBottom: '1rem' }}>
        El sistema generará una contraseña segura automáticamente y te la mostrará al terminar.
      </p>

      <div style={{ display: 'flex', gap: '0.75rem' }}>
        <button type="submit" className="orum-button" disabled={pending}>
          {pending ? 'Creando…' : 'Crear comercio'}
        </button>
        <Link href="/admin/comercios" className="orum-button orum-button--secondary">Cancelar</Link>
      </div>
    </form>
  )
}
```

- [ ] **Step 3: Página de creación**

Crear `src/app/admin/comercios/nuevo/page.tsx`:

```tsx
import Link from 'next/link'
import { requireRol } from '@/lib/auth'
import { createAdminClient } from '@/lib/supabase/admin'
import { ComercioForm } from '../comercio-form'

export const metadata = { title: 'Crear comercio · ORUM' }

export default async function NuevoComercioPage() {
  await requireRol('super_admin')

  const admin = createAdminClient()
  const [{ data: marcas }, { data: categorias }] = await Promise.all([
    admin.from('marcas').select('id, nombre').order('nombre'),
    admin.from('categorias').select('id, nombre').order('nombre'),
  ])

  return (
    <div style={{ maxWidth: 560 }}>
      <Link href="/admin/comercios" className="orum-muted" style={{ fontSize: '0.9rem' }}>
        ← Volver a comercios
      </Link>
      <h1 style={{ fontSize: '1.5rem', fontWeight: 700, margin: '0.5rem 0 1.25rem' }}>Crear comercio</h1>
      <ComercioForm marcas={marcas ?? []} categorias={categorias ?? []} />
    </div>
  )
}
```

- [ ] **Step 4: Verificación manual**

Run: `pnpm dev`, abrir sesión como `super_admin`, navegar a `http://localhost:3000/admin/comercios/nuevo`.
Expected: el formulario carga; al enviarlo con correo y nombre válidos, se crea el comercio, se muestra la contraseña una sola vez, y "Ir a la lista" lleva a `/admin/comercios` mostrando el nuevo registro. Probar también con correo repetido → mensaje de error claro sin crear nada (revisar en Supabase que no quedó un usuario Auth huérfano).

- [ ] **Step 5: Commit**

```bash
git add src/app/admin/comercios/page.tsx src/app/admin/comercios/comercio-form.tsx src/app/admin/comercios/nuevo/page.tsx
git commit -m "feat: lista y creacion de comercios"
```

---

## Task 5: Server actions de sucursales

**Files:**
- Create: `src/app/admin/comercios/sucursales-actions.ts`

**Interfaces:**
- Produces: `crearSucursal`, `editarSucursal`, `SucursalState`, `cambiarEstadoSucursal` — usadas por Tasks 6 y 9.

- [ ] **Step 1: Crear el archivo de acciones**

Crear `src/app/admin/comercios/sucursales-actions.ts`:

```ts
'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createAdminClient } from '@/lib/supabase/admin'
import { getPerfilActual } from '@/lib/auth'

async function exigirSuperAdmin(): Promise<boolean> {
  const actor = await getPerfilActual()
  return !!actor && actor.activo && actor.rolCodigo === 'super_admin'
}

export type SucursalState = { error?: string }

/** Lee y valida los campos de sucursal. `nombre` obligatorio en app (D4). */
function leerCamposSucursal(formData: FormData):
  | { ok: true; nombre: string; direccion: string | null; telefono: string | null; ciudad_id: number }
  | { ok: false; error: string } {
  const nombre = String(formData.get('nombre') ?? '').trim()
  if (!nombre) return { ok: false, error: 'El nombre de la sucursal es obligatorio.' }

  const ciudadRaw = String(formData.get('ciudad_id') ?? '').trim()
  const ciudad_id = Number(ciudadRaw)
  if (!Number.isInteger(ciudad_id) || ciudad_id < 1) return { ok: false, error: 'Selecciona una ciudad.' }

  return {
    ok: true,
    nombre,
    direccion: String(formData.get('direccion') ?? '').trim() || null,
    telefono: String(formData.get('telefono') ?? '').trim() || null,
    ciudad_id,
  }
}

export async function crearSucursal(_prev: SucursalState, formData: FormData): Promise<SucursalState> {
  if (!(await exigirSuperAdmin())) return { error: 'No tienes permiso para realizar esta acción.' }

  const comercioId = Number(formData.get('comercio_id'))
  if (!Number.isInteger(comercioId) || comercioId < 1) return { error: 'Falta el identificador del comercio.' }

  const campos = leerCamposSucursal(formData)
  if (!campos.ok) return { error: campos.error }

  const admin = createAdminClient()
  const { error } = await admin.from('sucursales').insert({
    comercio_id: comercioId,
    nombre: campos.nombre,
    direccion: campos.direccion,
    telefono: campos.telefono,
    ciudad_id: campos.ciudad_id,
    activo: true,
  })
  if (error) return { error: `No se pudo crear la sucursal: ${error.message}` }

  revalidatePath(`/admin/comercios/${comercioId}`)
  redirect(`/admin/comercios/${comercioId}`)
}

export async function editarSucursal(_prev: SucursalState, formData: FormData): Promise<SucursalState> {
  if (!(await exigirSuperAdmin())) return { error: 'No tienes permiso para realizar esta acción.' }

  const id = Number(formData.get('id'))
  const comercioId = Number(formData.get('comercio_id'))
  if (!Number.isInteger(id) || id < 1) return { error: 'Falta el identificador de la sucursal.' }

  const campos = leerCamposSucursal(formData)
  if (!campos.ok) return { error: campos.error }

  const admin = createAdminClient()
  const { error } = await admin
    .from('sucursales')
    .update({
      nombre: campos.nombre,
      direccion: campos.direccion,
      telefono: campos.telefono,
      ciudad_id: campos.ciudad_id,
    })
    .eq('id', id)
  if (error) return { error: `No se pudieron guardar los cambios: ${error.message}` }

  revalidatePath(`/admin/comercios/${comercioId}`)
  redirect(`/admin/comercios/${comercioId}`)
}

/** Activa o desactiva una sucursal (`sucursales.activo`). */
export async function cambiarEstadoSucursal(formData: FormData): Promise<void> {
  if (!(await exigirSuperAdmin())) redirect('/login?error=sin_permiso')

  const id = Number(formData.get('id'))
  const comercioId = Number(formData.get('comercio_id'))
  const activar = String(formData.get('activar') ?? '') === 'true'
  if (!Number.isInteger(id) || id < 1) redirect('/admin/comercios')

  const admin = createAdminClient()
  await admin.from('sucursales').update({ activo: activar }).eq('id', id)

  revalidatePath(`/admin/comercios/${comercioId}`)
  redirect(`/admin/comercios/${comercioId}`)
}
```

- [ ] **Step 2: Verificar tipos**

Run: `npx tsc --noEmit`
Expected: sin errores.

- [ ] **Step 3: Commit**

```bash
git add src/app/admin/comercios/sucursales-actions.ts
git commit -m "feat: server actions de sucursales"
```

---

## Task 6: UI de sucursales (`nueva`, `[sucursalId]/editar`)

**Files:**
- Create: `src/app/admin/comercios/[id]/sucursales/sucursal-form.tsx`
- Create: `src/app/admin/comercios/[id]/sucursales/nueva/page.tsx`
- Create: `src/app/admin/comercios/[id]/sucursales/[sucursalId]/editar/page.tsx`

**Interfaces:**
- Consumes: `crearSucursal`, `editarSucursal`, `SucursalState` (Task 5).

- [ ] **Step 1: Formulario compartido (mismo patrón que `PlanForm`: un componente, acción según si hay `sucursal` inicial)**

Crear `src/app/admin/comercios/[id]/sucursales/sucursal-form.tsx`:

```tsx
'use client'

import { useActionState } from 'react'
import Link from 'next/link'
import { crearSucursal, editarSucursal, type SucursalState } from '../../sucursales-actions'

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
      {state.error && <p className="orum-alert orum-alert--error" role="alert">{state.error}</p>}

      <input type="hidden" name="comercio_id" value={comercioId} />
      {sucursal && <input type="hidden" name="id" value={sucursal.id} />}

      <div className="orum-field">
        <label className="orum-label" htmlFor="nombre">Nombre</label>
        <input id="nombre" name="nombre" className="orum-input" required defaultValue={sucursal?.nombre} />
      </div>

      <div className="orum-field">
        <label className="orum-label" htmlFor="direccion">Dirección (opcional)</label>
        <input id="direccion" name="direccion" className="orum-input" defaultValue={sucursal?.direccion ?? ''} />
      </div>

      <div style={{ display: 'flex', gap: '0.75rem' }}>
        <div className="orum-field" style={{ flex: 1 }}>
          <label className="orum-label" htmlFor="telefono">Teléfono (opcional)</label>
          <input id="telefono" name="telefono" className="orum-input" defaultValue={sucursal?.telefono ?? ''} />
        </div>
        <div className="orum-field" style={{ flex: 1 }}>
          <label className="orum-label" htmlFor="ciudad_id">Ciudad</label>
          <select
            id="ciudad_id"
            name="ciudad_id"
            className="orum-select"
            required
            defaultValue={sucursal?.ciudad_id ?? ''}
          >
            <option value="">— Selecciona una ciudad —</option>
            {ciudades.map((c) => <option key={c.id} value={c.id}>{c.nombre}</option>)}
          </select>
        </div>
      </div>

      <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.5rem' }}>
        <button type="submit" className="orum-button" disabled={pending}>
          {pending ? 'Guardando…' : sucursal ? 'Guardar cambios' : 'Crear sucursal'}
        </button>
        <Link href={`/admin/comercios/${comercioId}`} className="orum-button orum-button--secondary">Cancelar</Link>
      </div>
    </form>
  )
}
```

- [ ] **Step 2: Página de creación**

Crear `src/app/admin/comercios/[id]/sucursales/nueva/page.tsx`:

```tsx
import { notFound } from 'next/navigation'
import { requireRol } from '@/lib/auth'
import { createAdminClient } from '@/lib/supabase/admin'
import { SucursalForm } from '../sucursal-form'

export const metadata = { title: 'Nueva sucursal · ORUM' }

export default async function NuevaSucursalPage({ params }: { params: Promise<{ id: string }> }) {
  await requireRol('super_admin')
  const { id } = await params
  const comercioId = Number(id)

  const admin = createAdminClient()
  const [{ data: comercio }, { data: ciudades }] = await Promise.all([
    admin.from('comercios').select('id').eq('id', comercioId).is('deleted_at', null).maybeSingle(),
    admin.from('ciudades').select('id, nombre').order('nombre'),
  ])
  if (!comercio) notFound()

  return (
    <div>
      <h1 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '1.25rem' }}>Nueva sucursal</h1>
      <SucursalForm comercioId={comercioId} ciudades={ciudades ?? []} />
    </div>
  )
}
```

- [ ] **Step 3: Página de edición**

Crear `src/app/admin/comercios/[id]/sucursales/[sucursalId]/editar/page.tsx`:

```tsx
import { notFound } from 'next/navigation'
import { requireRol } from '@/lib/auth'
import { createAdminClient } from '@/lib/supabase/admin'
import { SucursalForm } from '../../sucursal-form'

export const metadata = { title: 'Editar sucursal · ORUM' }

export default async function EditarSucursalPage({
  params,
}: {
  params: Promise<{ id: string; sucursalId: string }>
}) {
  await requireRol('super_admin')
  const { id, sucursalId } = await params
  const comercioId = Number(id)

  const admin = createAdminClient()
  const [{ data: sucursal }, { data: ciudades }] = await Promise.all([
    admin
      .from('sucursales')
      .select('id, nombre, direccion, telefono, ciudad_id')
      .eq('id', Number(sucursalId))
      .eq('comercio_id', comercioId)
      .is('deleted_at', null)
      .maybeSingle(),
    admin.from('ciudades').select('id, nombre').order('nombre'),
  ])
  if (!sucursal) notFound()

  return (
    <div>
      <h1 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '1.25rem' }}>Editar sucursal</h1>
      <SucursalForm
        comercioId={comercioId}
        ciudades={ciudades ?? []}
        sucursal={{ ...sucursal, nombre: sucursal.nombre ?? '' }}
      />
    </div>
  )
}
```

- [ ] **Step 4: Verificación manual**

Esta tarea no se puede probar de punta a punta hasta que exista la ficha del comercio (Task 9) para navegar hasta aquí. Por ahora, verificar solo que compila.
Run: `npx tsc --noEmit`
Expected: sin errores. (La verificación funcional completa de crear/editar/listar sucursales se hace en Task 9, Step 4, una vez la ficha esté lista.)

- [ ] **Step 5: Commit**

```bash
git add "src/app/admin/comercios/[id]/sucursales"
git commit -m "feat: UI de creacion y edicion de sucursales"
```

---

## Task 7: Server actions de promociones (con validación D5)

**Files:**
- Create: `src/app/admin/comercios/promociones-actions.ts`

**Interfaces:**
- Consumes: `validarValorPromocion` (Task 2), `TipoBeneficioCodigo` (Task 1).
- Produces: `crearPromocion`, `editarPromocion`, `PromocionState`, `cambiarEstadoPromocion` — usadas por Tasks 8 y 9.

- [ ] **Step 1: Crear el archivo de acciones**

Crear `src/app/admin/comercios/promociones-actions.ts`:

```ts
'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createAdminClient } from '@/lib/supabase/admin'
import { getPerfilActual } from '@/lib/auth'
import { validarValorPromocion } from '@/lib/promociones'
import type { TipoBeneficioCodigo } from '@/lib/supabase/database.types'

async function exigirSuperAdmin(): Promise<boolean> {
  const actor = await getPerfilActual()
  return !!actor && actor.activo && actor.rolCodigo === 'super_admin'
}

export type PromocionState = { error?: string }

function leerCamposPromocion(formData: FormData):
  | {
      ok: true
      titulo: string
      descripcion: string | null
      tipo_beneficio_id: number
      valor: number | null
      fecha_inicio: string | null
      fecha_fin: string | null
    }
  | { ok: false; error: string } {
  const titulo = String(formData.get('titulo') ?? '').trim()
  if (!titulo) return { ok: false, error: 'El título de la promoción es obligatorio.' }

  const tipoRaw = String(formData.get('tipo_beneficio_id') ?? '').trim()
  const tipo_beneficio_id = Number(tipoRaw)
  if (!Number.isInteger(tipo_beneficio_id) || tipo_beneficio_id < 1) {
    return { ok: false, error: 'Selecciona un tipo de beneficio.' }
  }

  const valorRaw = String(formData.get('valor') ?? '').trim()
  const valor = valorRaw ? Number(valorRaw) : null
  if (valorRaw && !Number.isFinite(valor)) return { ok: false, error: 'El valor debe ser un número.' }

  return {
    ok: true,
    titulo,
    descripcion: String(formData.get('descripcion') ?? '').trim() || null,
    tipo_beneficio_id,
    valor,
    fecha_inicio: String(formData.get('fecha_inicio') ?? '').trim() || null,
    fecha_fin: String(formData.get('fecha_fin') ?? '').trim() || null,
  }
}

export async function crearPromocion(_prev: PromocionState, formData: FormData): Promise<PromocionState> {
  if (!(await exigirSuperAdmin())) return { error: 'No tienes permiso para realizar esta acción.' }

  const comercioId = Number(formData.get('comercio_id'))
  if (!Number.isInteger(comercioId) || comercioId < 1) return { error: 'Falta el identificador del comercio.' }

  const campos = leerCamposPromocion(formData)
  if (!campos.ok) return { error: campos.error }

  const admin = createAdminClient()

  const { data: tipo } = await admin
    .from('tipos_beneficio')
    .select('id, codigo')
    .eq('id', campos.tipo_beneficio_id)
    .maybeSingle()
  if (!tipo) return { error: 'El tipo de beneficio seleccionado no existe.' }

  const validacion = validarValorPromocion(tipo.codigo as TipoBeneficioCodigo, campos.valor)
  if (!validacion.ok) return { error: validacion.error }

  const { error } = await admin.from('promociones').insert({
    comercio_id: comercioId,
    tipo_beneficio_id: campos.tipo_beneficio_id,
    titulo: campos.titulo,
    descripcion: campos.descripcion,
    valor: campos.valor,
    fecha_inicio: campos.fecha_inicio,
    fecha_fin: campos.fecha_fin,
    activo: true,
  })
  if (error) return { error: `No se pudo crear la promoción: ${error.message}` }

  revalidatePath(`/admin/comercios/${comercioId}`)
  redirect(`/admin/comercios/${comercioId}`)
}

export async function editarPromocion(_prev: PromocionState, formData: FormData): Promise<PromocionState> {
  if (!(await exigirSuperAdmin())) return { error: 'No tienes permiso para realizar esta acción.' }

  const id = Number(formData.get('id'))
  const comercioId = Number(formData.get('comercio_id'))
  if (!Number.isInteger(id) || id < 1) return { error: 'Falta el identificador de la promoción.' }

  const campos = leerCamposPromocion(formData)
  if (!campos.ok) return { error: campos.error }

  const admin = createAdminClient()

  const { data: tipo } = await admin
    .from('tipos_beneficio')
    .select('id, codigo')
    .eq('id', campos.tipo_beneficio_id)
    .maybeSingle()
  if (!tipo) return { error: 'El tipo de beneficio seleccionado no existe.' }

  const validacion = validarValorPromocion(tipo.codigo as TipoBeneficioCodigo, campos.valor)
  if (!validacion.ok) return { error: validacion.error }

  const { error } = await admin
    .from('promociones')
    .update({
      tipo_beneficio_id: campos.tipo_beneficio_id,
      titulo: campos.titulo,
      descripcion: campos.descripcion,
      valor: campos.valor,
      fecha_inicio: campos.fecha_inicio,
      fecha_fin: campos.fecha_fin,
    })
    .eq('id', id)
  if (error) return { error: `No se pudieron guardar los cambios: ${error.message}` }

  revalidatePath(`/admin/comercios/${comercioId}`)
  redirect(`/admin/comercios/${comercioId}`)
}

/** Activa o desactiva una promoción (`promociones.activo`). */
export async function cambiarEstadoPromocion(formData: FormData): Promise<void> {
  if (!(await exigirSuperAdmin())) redirect('/login?error=sin_permiso')

  const id = Number(formData.get('id'))
  const comercioId = Number(formData.get('comercio_id'))
  const activar = String(formData.get('activar') ?? '') === 'true'
  if (!Number.isInteger(id) || id < 1) redirect('/admin/comercios')

  const admin = createAdminClient()
  await admin.from('promociones').update({ activo: activar }).eq('id', id)

  revalidatePath(`/admin/comercios/${comercioId}`)
  redirect(`/admin/comercios/${comercioId}`)
}
```

- [ ] **Step 2: Verificar tipos**

Run: `npx tsc --noEmit`
Expected: sin errores.

- [ ] **Step 3: Commit**

```bash
git add src/app/admin/comercios/promociones-actions.ts
git commit -m "feat: server actions de promociones con validacion D5"
```

---

## Task 8: UI de promociones (`nueva`, `[promoId]/editar`)

**Files:**
- Create: `src/app/admin/comercios/[id]/promociones/promocion-form.tsx`
- Create: `src/app/admin/comercios/[id]/promociones/nueva/page.tsx`
- Create: `src/app/admin/comercios/[id]/promociones/[promoId]/editar/page.tsx`

**Interfaces:**
- Consumes: `crearPromocion`, `editarPromocion`, `PromocionState` (Task 7).

- [ ] **Step 1: Formulario compartido — oculta el campo `valor` para `dos_por_uno`/`regalo` (UX que refleja D5; la validación real ocurre en el servidor)**

Crear `src/app/admin/comercios/[id]/promociones/promocion-form.tsx`:

```tsx
'use client'

import { useActionState, useState } from 'react'
import Link from 'next/link'
import { crearPromocion, editarPromocion, type PromocionState } from '../../promociones-actions'

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
      {state.error && <p className="orum-alert orum-alert--error" role="alert">{state.error}</p>}

      <input type="hidden" name="comercio_id" value={comercioId} />
      {promocion && <input type="hidden" name="id" value={promocion.id} />}

      <div className="orum-field">
        <label className="orum-label" htmlFor="titulo">Título</label>
        <input id="titulo" name="titulo" className="orum-input" required defaultValue={promocion?.titulo} />
      </div>

      <div className="orum-field">
        <label className="orum-label" htmlFor="descripcion">Descripción (opcional)</label>
        <input id="descripcion" name="descripcion" className="orum-input" defaultValue={promocion?.descripcion ?? ''} />
      </div>

      <div className="orum-field">
        <label className="orum-label" htmlFor="tipo_beneficio_id">Tipo de beneficio</label>
        <select
          id="tipo_beneficio_id"
          name="tipo_beneficio_id"
          className="orum-select"
          required
          value={tipoId}
          onChange={(e) => setTipoId(e.target.value)}
        >
          {tipos.length === 0 && <option value="">— No hay tipos de beneficio —</option>}
          {tipos.map((t) => <option key={t.id} value={t.id}>{t.nombre}</option>)}
        </select>
      </div>

      {requiereValor && (
        <div className="orum-field">
          <label className="orum-label" htmlFor="valor">
            Valor {tipoSeleccionado?.codigo === 'porcentaje' ? '(porcentaje, 1-100)' : '(monto)'}
          </label>
          <input
            id="valor"
            name="valor"
            type="number"
            min="0"
            step="0.01"
            className="orum-input"
            defaultValue={promocion?.valor ?? ''}
          />
        </div>
      )}

      <div style={{ display: 'flex', gap: '0.75rem' }}>
        <div className="orum-field" style={{ flex: 1 }}>
          <label className="orum-label" htmlFor="fecha_inicio">Fecha de inicio (opcional)</label>
          <input id="fecha_inicio" name="fecha_inicio" type="date" className="orum-input" defaultValue={promocion?.fecha_inicio ?? ''} />
        </div>
        <div className="orum-field" style={{ flex: 1 }}>
          <label className="orum-label" htmlFor="fecha_fin">Fecha de fin (opcional)</label>
          <input id="fecha_fin" name="fecha_fin" type="date" className="orum-input" defaultValue={promocion?.fecha_fin ?? ''} />
        </div>
      </div>

      <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.5rem' }}>
        <button type="submit" className="orum-button" disabled={pending || tipos.length === 0}>
          {pending ? 'Guardando…' : promocion ? 'Guardar cambios' : 'Crear promoción'}
        </button>
        <Link href={`/admin/comercios/${comercioId}`} className="orum-button orum-button--secondary">Cancelar</Link>
      </div>
    </form>
  )
}
```

- [ ] **Step 2: Página de creación**

Crear `src/app/admin/comercios/[id]/promociones/nueva/page.tsx`:

```tsx
import { notFound } from 'next/navigation'
import { requireRol } from '@/lib/auth'
import { createAdminClient } from '@/lib/supabase/admin'
import { PromocionForm } from '../promocion-form'

export const metadata = { title: 'Nueva promoción · ORUM' }

export default async function NuevaPromocionPage({ params }: { params: Promise<{ id: string }> }) {
  await requireRol('super_admin')
  const { id } = await params
  const comercioId = Number(id)

  const admin = createAdminClient()
  const [{ data: comercio }, { data: tipos }] = await Promise.all([
    admin.from('comercios').select('id').eq('id', comercioId).is('deleted_at', null).maybeSingle(),
    admin.from('tipos_beneficio').select('id, codigo, nombre').order('id'),
  ])
  if (!comercio) notFound()

  return (
    <div>
      <h1 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '1.25rem' }}>Nueva promoción</h1>
      <PromocionForm comercioId={comercioId} tipos={tipos ?? []} />
    </div>
  )
}
```

- [ ] **Step 3: Página de edición**

Crear `src/app/admin/comercios/[id]/promociones/[promoId]/editar/page.tsx`:

```tsx
import { notFound } from 'next/navigation'
import { requireRol } from '@/lib/auth'
import { createAdminClient } from '@/lib/supabase/admin'
import { PromocionForm } from '../../promocion-form'

export const metadata = { title: 'Editar promoción · ORUM' }

export default async function EditarPromocionPage({
  params,
}: {
  params: Promise<{ id: string; promoId: string }>
}) {
  await requireRol('super_admin')
  const { id, promoId } = await params
  const comercioId = Number(id)

  const admin = createAdminClient()
  const [{ data: promocion }, { data: tipos }] = await Promise.all([
    admin
      .from('promociones')
      .select('id, titulo, descripcion, tipo_beneficio_id, valor, fecha_inicio, fecha_fin')
      .eq('id', Number(promoId))
      .eq('comercio_id', comercioId)
      .is('deleted_at', null)
      .maybeSingle(),
    admin.from('tipos_beneficio').select('id, codigo, nombre').order('id'),
  ])
  if (!promocion) notFound()

  return (
    <div>
      <h1 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '1.25rem' }}>Editar promoción</h1>
      <PromocionForm comercioId={comercioId} tipos={tipos ?? []} promocion={promocion} />
    </div>
  )
}
```

- [ ] **Step 4: Verificación de tipos**

Run: `npx tsc --noEmit`
Expected: sin errores. (Verificación funcional completa en Task 9, Step 4, junto con sucursales.)

- [ ] **Step 5: Commit**

```bash
git add "src/app/admin/comercios/[id]/promociones"
git commit -m "feat: UI de creacion y edicion de promociones"
```

---

## Task 9: Ficha del comercio (`/admin/comercios/[id]`)

**Files:**
- Create: `src/app/admin/comercios/[id]/page.tsx`

**Interfaces:**
- Consumes: `cambiarEstadoComercio`, `cambiarEstadoAccesoComercio` (Task 3); `cambiarEstadoSucursal` (Task 5); `cambiarEstadoPromocion` (Task 7).

- [ ] **Step 1: Crear la ficha**

Crear `src/app/admin/comercios/[id]/page.tsx`:

```tsx
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { requireRol } from '@/lib/auth'
import { createAdminClient } from '@/lib/supabase/admin'
import { cambiarEstadoComercio, cambiarEstadoAccesoComercio } from '../actions'
import { cambiarEstadoSucursal } from '../sucursales-actions'
import { cambiarEstadoPromocion } from '../promociones-actions'

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
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 700 }}>{comercio.nombre}</h1>
        <Link href={`/admin/comercios/${comercio.id}/editar`} className="orum-button orum-button--secondary">
          Editar datos
        </Link>
      </div>

      <div className="orum-card" style={{ marginBottom: '1.25rem' }}>
        <p><strong>Correo:</strong> {correo}</p>
        <p><strong>Descripción:</strong> {comercio.descripcion ?? '—'}</p>
        <p><strong>Marca:</strong> {marca?.nombre ?? '—'}</p>
        <p><strong>Categoría:</strong> {categoria?.nombre ?? '—'}</p>

        <div style={{ display: 'flex', gap: '1.5rem', marginTop: '0.75rem', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span className={`orum-badge ${comercio.activo ? 'orum-badge--on' : 'orum-badge--off'}`}>
              {comercio.activo ? 'Aliado activo' : 'Aliado inactivo'}
            </span>
            <form action={cambiarEstadoComercio}>
              <input type="hidden" name="id" value={comercio.id} />
              <input type="hidden" name="activar" value={comercio.activo ? 'false' : 'true'} />
              <button type="submit" className={`orum-button ${comercio.activo ? 'orum-button--danger' : ''}`}>
                {comercio.activo ? 'Desactivar aliado' : 'Activar aliado'}
              </button>
            </form>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span className={`orum-badge ${perfilActivo ? 'orum-badge--on' : 'orum-badge--off'}`}>
              {perfilActivo ? 'Acceso activo' : 'Acceso desactivado'}
            </span>
            <form action={cambiarEstadoAccesoComercio}>
              <input type="hidden" name="id" value={comercio.id} />
              <input type="hidden" name="perfil_id" value={comercio.perfil_id ?? ''} />
              <input type="hidden" name="activar" value={perfilActivo ? 'false' : 'true'} />
              <button type="submit" className={`orum-button ${perfilActivo ? 'orum-button--danger' : ''}`}>
                {perfilActivo ? 'Desactivar acceso' : 'Activar acceso'}
              </button>
            </form>
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
        <h2 style={{ fontSize: '1.2rem', fontWeight: 700 }}>Sucursales</h2>
        <Link href={`/admin/comercios/${comercio.id}/sucursales/nueva`} className="orum-button orum-button--secondary">
          + Nueva sucursal
        </Link>
      </div>
      {!sucursales || sucursales.length === 0 ? (
        <div className="orum-card" style={{ marginBottom: '1.25rem' }}>
          <p className="orum-muted">Este comercio aún no tiene sucursales.</p>
        </div>
      ) : (
        <div className="orum-card" style={{ overflowX: 'auto', padding: 0, marginBottom: '1.25rem' }}>
          <table className="orum-table">
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
                    <span className={`orum-badge ${s.activo ? 'orum-badge--on' : 'orum-badge--off'}`}>
                      {s.activo ? 'Activa' : 'Inactiva'}
                    </span>
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                      <Link
                        href={`/admin/comercios/${comercio.id}/sucursales/${s.id}/editar`}
                        className="orum-button orum-button--secondary"
                      >
                        Editar
                      </Link>
                      <form action={cambiarEstadoSucursal}>
                        <input type="hidden" name="id" value={s.id} />
                        <input type="hidden" name="comercio_id" value={comercio.id} />
                        <input type="hidden" name="activar" value={s.activo ? 'false' : 'true'} />
                        <button type="submit" className={`orum-button ${s.activo ? 'orum-button--danger' : ''}`}>
                          {s.activo ? 'Desactivar' : 'Activar'}
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

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
        <h2 style={{ fontSize: '1.2rem', fontWeight: 700 }}>Promociones</h2>
        <Link href={`/admin/comercios/${comercio.id}/promociones/nueva`} className="orum-button orum-button--secondary">
          + Nueva promoción
        </Link>
      </div>
      {!promociones || promociones.length === 0 ? (
        <div className="orum-card">
          <p className="orum-muted">Este comercio aún no tiene promociones.</p>
        </div>
      ) : (
        <div className="orum-card" style={{ overflowX: 'auto', padding: 0 }}>
          <table className="orum-table">
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
                    <span className={`orum-badge ${p.activo ? 'orum-badge--on' : 'orum-badge--off'}`}>
                      {p.activo ? 'Activa' : 'Inactiva'}
                    </span>
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                      <Link
                        href={`/admin/comercios/${comercio.id}/promociones/${p.id}/editar`}
                        className="orum-button orum-button--secondary"
                      >
                        Editar
                      </Link>
                      <form action={cambiarEstadoPromocion}>
                        <input type="hidden" name="id" value={p.id} />
                        <input type="hidden" name="comercio_id" value={comercio.id} />
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

- [ ] **Step 2: Verificar tipos**

Run: `npx tsc --noEmit`
Expected: sin errores.

- [ ] **Step 3: Commit**

```bash
git add "src/app/admin/comercios/[id]/page.tsx"
git commit -m "feat: ficha de comercio con sucursales y promociones"
```

- [ ] **Step 4: Verificación manual de punta a punta (comercio + sucursales + promociones)**

Run: `pnpm dev`, entrar como `super_admin`, ir a `/admin/comercios`, abrir la ficha del comercio creado en Task 4.
Expected, en orden:
1. La ficha muestra correo, descripción, marca/categoría (`—` si no se asignaron), y dos badges de estado con sus botones.
2. Click en "Desactivar aliado" → el badge cambia a "Aliado inactivo" y el botón pasa a "Activar aliado"; verificar en Supabase que `comercios.activo = false` y que `perfiles.activo` **no cambió**. Reactivarlo.
3. Click en "Desactivar acceso" → verificar que solo `perfiles.activo` cambió, `comercios.activo` no. Reactivarlo.
4. "+ Nueva sucursal" → crear una con nombre, ciudad (obligatoria) y sin dirección/teléfono → debe crearse y volver a la ficha listándola.
5. Intentar crear una sucursal sin nombre → error claro, no se crea.
6. Editar la sucursal, cambiar el nombre → se refleja en la lista. Desactivarla y reactivarla desde la ficha.
7. "+ Nueva promoción" con tipo `porcentaje`: dejar `valor` vacío → error claro (D5). Poner `150` → error claro. Poner `20` → se crea.
8. Nueva promoción con tipo `dos_por_uno`: el campo de valor no aparece en el formulario; se crea sin valor.
9. Editar una promoción, cambiar el tipo de `porcentaje` a `dos_por_uno` sin quitar el valor manualmente (el campo desaparece del formulario al cambiar el select, así que no se envía) → se guarda con `valor = null`.
10. Desactivar/activar una promoción desde la ficha.

Si algún paso falla, corregir antes de continuar.

---

## Task 10: Edición de datos del comercio (`/admin/comercios/[id]/editar`)

**Files:**
- Create: `src/app/admin/comercios/[id]/editar/editar-comercio-form.tsx`
- Create: `src/app/admin/comercios/[id]/editar/page.tsx`

**Interfaces:**
- Consumes: `editarComercio`, `EditarComercioState` (Task 3).

- [ ] **Step 1: Formulario de edición**

Crear `src/app/admin/comercios/[id]/editar/editar-comercio-form.tsx`:

```tsx
'use client'

import { useActionState } from 'react'
import Link from 'next/link'
import { editarComercio, type EditarComercioState } from '../../actions'

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
      {state.error && <p className="orum-alert orum-alert--error" role="alert">{state.error}</p>}

      <input type="hidden" name="id" value={comercio.id} />
      <input type="hidden" name="perfil_id" value={comercio.perfil_id ?? ''} />
      <input type="hidden" name="correo_original" value={comercio.correo} />

      <div className="orum-field">
        <label className="orum-label" htmlFor="correo">Correo electrónico</label>
        <input
          id="correo"
          name="correo"
          type="email"
          className="orum-input"
          defaultValue={comercio.correo === '—' ? '' : comercio.correo}
        />
      </div>

      <div className="orum-field">
        <label className="orum-label" htmlFor="nombre">Nombre</label>
        <input id="nombre" name="nombre" className="orum-input" required defaultValue={comercio.nombre} />
      </div>

      <div className="orum-field">
        <label className="orum-label" htmlFor="descripcion">Descripción (opcional)</label>
        <input id="descripcion" name="descripcion" className="orum-input" defaultValue={comercio.descripcion ?? ''} />
      </div>

      <div style={{ display: 'flex', gap: '0.75rem' }}>
        <div className="orum-field" style={{ flex: 1 }}>
          <label className="orum-label" htmlFor="marca_id">Marca (opcional)</label>
          <select id="marca_id" name="marca_id" className="orum-select" defaultValue={comercio.marca_id ?? ''}>
            <option value="">— Sin marca —</option>
            {marcas.map((m) => <option key={m.id} value={m.id}>{m.nombre}</option>)}
          </select>
        </div>
        <div className="orum-field" style={{ flex: 1 }}>
          <label className="orum-label" htmlFor="categoria_id">Categoría (opcional)</label>
          <select id="categoria_id" name="categoria_id" className="orum-select" defaultValue={comercio.categoria_id ?? ''}>
            <option value="">— Sin categoría —</option>
            {categorias.map((c) => <option key={c.id} value={c.id}>{c.nombre}</option>)}
          </select>
        </div>
      </div>

      <div className="orum-field">
        <label className="orum-label" htmlFor="logo_url">URL del logo (opcional)</label>
        <input id="logo_url" name="logo_url" className="orum-input" defaultValue={comercio.logo_url ?? ''} placeholder="https://…" />
      </div>

      <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.5rem' }}>
        <button type="submit" className="orum-button" disabled={pending}>
          {pending ? 'Guardando…' : 'Guardar cambios'}
        </button>
        <Link href={`/admin/comercios/${comercio.id}`} className="orum-button orum-button--secondary">Cancelar</Link>
      </div>
    </form>
  )
}
```

- [ ] **Step 2: Página de edición**

Crear `src/app/admin/comercios/[id]/editar/page.tsx`:

```tsx
import { notFound } from 'next/navigation'
import { requireRol } from '@/lib/auth'
import { createAdminClient } from '@/lib/supabase/admin'
import { EditarComercioForm } from './editar-comercio-form'

export const metadata = { title: 'Editar comercio · ORUM' }

export default async function EditarComercioPage({ params }: { params: Promise<{ id: string }> }) {
  await requireRol('super_admin')
  const { id } = await params
  const comercioId = Number(id)

  const admin = createAdminClient()
  const [{ data: comercio }, { data: marcas }, { data: categorias }] = await Promise.all([
    admin
      .from('comercios')
      .select('id, perfil_id, nombre, descripcion, marca_id, categoria_id, logo_url')
      .eq('id', comercioId)
      .is('deleted_at', null)
      .maybeSingle(),
    admin.from('marcas').select('id, nombre').order('nombre'),
    admin.from('categorias').select('id, nombre').order('nombre'),
  ])
  if (!comercio) notFound()

  let correo = '—'
  if (comercio.perfil_id) {
    const { data: authUser } = await admin.auth.admin.getUserById(comercio.perfil_id)
    correo = authUser.user?.email ?? '—'
  }

  return (
    <div style={{ maxWidth: 560 }}>
      <h1 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '1.25rem' }}>Editar comercio</h1>
      <EditarComercioForm comercio={{ ...comercio, correo }} marcas={marcas ?? []} categorias={categorias ?? []} />
    </div>
  )
}
```

- [ ] **Step 3: Verificación manual**

Run: `pnpm dev`, desde la ficha del comercio click en "Editar datos", cambiar nombre/descripción/marca/categoría/logo_url y guardar.
Expected: redirige a la ficha con los cambios reflejados. Cambiar el correo a uno distinto → se actualiza (verificar que el login con el nuevo correo funciona). Dejar el correo igual → no debe intentar actualizarlo (evita error espurio de "correo en uso" por el propio usuario).

- [ ] **Step 4: Commit**

```bash
git add "src/app/admin/comercios/[id]/editar"
git commit -m "feat: edicion de datos del comercio"
```

---

## Task 11: Navegación — agregar "Comercios" al menú admin

**Files:**
- Modify: `src/app/admin/layout.tsx:33-39`

**Interfaces:**
- Consumes: ninguna nueva (solo enlaza a rutas ya creadas).

- [ ] **Step 1: Agregar el enlace, visible solo para `super_admin`**

En `src/app/admin/layout.tsx`, dentro del `<nav>`, agregar el enlace a Comercios antes del de Usuarios:

```tsx
        <nav style={{ display: 'flex', gap: '1rem', flex: 1 }}>
          <Link href="/admin">Inicio</Link>
          <Link href="/admin/miembros">Miembros</Link>
          {esSuperAdmin && <Link href="/admin/comercios">Comercios</Link>}
          {esSuperAdmin && <Link href="/admin/usuarios">Usuarios</Link>}
          {esSuperAdmin && <Link href="/admin/planes">Planes</Link>}
          <Link href="/admin/cuenta/password">Mi contraseña</Link>
        </nav>
```

- [ ] **Step 2: Verificación manual**

Run: `pnpm dev`, entrar como `super_admin` → el menú muestra "Comercios" entre "Miembros" y "Usuarios". Entrar como `empleado` → "Comercios" no aparece (igual que "Usuarios" y "Planes" hoy).

- [ ] **Step 3: Commit**

```bash
git add src/app/admin/layout.tsx
git commit -m "feat: agregar Comercios al menu admin"
```

---

## Task 12: Reducir `/admin/usuarios` a solo empleados/administradores

**Files:**
- Modify: `src/app/admin/usuarios/actions.ts`
- Modify: `src/app/admin/usuarios/page.tsx`
- Modify: `src/app/admin/usuarios/nuevo/usuario-form.tsx`
- Modify: `src/app/admin/usuarios/nuevo/page.tsx`
- Modify: `src/app/admin/usuarios/[id]/editar/editar-form.tsx`
- Modify: `src/app/admin/usuarios/[id]/editar/page.tsx`

**Interfaces:**
- No cambia ninguna interfaz consumida por otras secciones (usuarios es una hoja del árbol de rutas).

Esta tarea reescribe cada archivo completo (son pequeños) en lugar de parchear branch por branch, para no dejar ramas muertas de comercio a medio quitar.

- [ ] **Step 1: `actions.ts` — quitar el tipo `comercio` y la rama `datosComercio`**

Reemplazar el contenido completo de `src/app/admin/usuarios/actions.ts`:

```ts
'use server'

import { revalidatePath } from 'next/cache'
import { generarPassword } from '@/lib/password'
import { redirect } from 'next/navigation'
import { createAdminClient } from '@/lib/supabase/admin'
import { getPerfilActual } from '@/lib/auth'
import type { RolCodigo } from '@/lib/supabase/database.types'

/** Tipos de usuario que el admin puede crear en esta sección. */
type TipoUsuario = 'super_admin' | 'empleado'
const TIPOS_VALIDOS: TipoUsuario[] = ['super_admin', 'empleado']

export type CrearUsuarioState = {
  error?: string
  ok?: boolean
  email?: string
  password?: string
}

/** Verifica que quien ejecuta la acción sea super_admin. */
async function exigirSuperAdmin(): Promise<string | null> {
  const actor = await getPerfilActual()
  if (!actor || !actor.activo || actor.rolCodigo !== 'super_admin') {
    return null
  }
  return actor.userId
}

/**
 * Crea un usuario (empleado o administrador).
 * Flujo: crear usuario en Auth → upsert de `perfiles` → insertar en `empleados`.
 * Si algo falla, se revierte para no dejar datos a medias.
 */
export async function crearUsuario(
  _prev: CrearUsuarioState,
  formData: FormData
): Promise<CrearUsuarioState> {
  if (!(await exigirSuperAdmin())) {
    return { error: 'No tienes permiso para realizar esta acción.' }
  }

  const tipo = String(formData.get('tipo') ?? '') as TipoUsuario
  const email = String(formData.get('email') ?? '').trim().toLowerCase()

  if (!TIPOS_VALIDOS.includes(tipo)) return { error: 'Selecciona un tipo de usuario válido.' }
  if (!email || !email.includes('@')) return { error: 'Ingresa un correo electrónico válido.' }

  const admin = createAdminClient()

  const { data: rol } = await admin
    .from('roles')
    .select('id')
    .eq('codigo', tipo as RolCodigo)
    .single()
  if (!rol) return { error: `No se encontró el rol "${tipo}" en la base de datos.` }

  const nombres = String(formData.get('nombres') ?? '').trim()
  const apellidos = String(formData.get('apellidos') ?? '').trim()
  const cedula = String(formData.get('cedula') ?? '').trim()
  if (!nombres || !apellidos) return { error: 'Nombres y apellidos son obligatorios.' }
  if (!cedula) return { error: 'La cédula es obligatoria.' }

  // La cédula es el identificador de negocio: no se puede repetir.
  const { data: yaExiste } = await admin
    .from('empleados')
    .select('id')
    .eq('cedula', cedula)
    .is('deleted_at', null)
    .maybeSingle()
  if (yaExiste) return { error: `Ya existe un empleado registrado con la cédula ${cedula}.` }

  const datosEmpleado = {
    nombres,
    apellidos,
    cedula,
    telefono: String(formData.get('telefono') ?? '').trim() || null,
  }

  const password = generarPassword()

  const { data: creado, error: errAuth } = await admin.auth.admin.createUser({
    email,
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

  const revertir = async () => {
    await admin.from('perfiles').delete().eq('id', userId)
    await admin.auth.admin.deleteUser(userId)
  }

  const { error: errPerfil } = await admin
    .from('perfiles')
    .upsert({ id: userId, rol_id: rol.id, activo: true }, { onConflict: 'id' })
  if (errPerfil) {
    await revertir()
    return { error: `No se pudo crear el perfil: ${errPerfil.message}` }
  }

  const { error: errEmpleado } = await admin
    .from('empleados')
    .insert({ perfil_id: userId, ...datosEmpleado })
  if (errEmpleado) {
    await revertir()
    return { error: `No se pudo registrar el empleado: ${errEmpleado.message}` }
  }

  revalidatePath('/admin/usuarios')
  return { ok: true, email, password }
}

export type EditarUsuarioState = { error?: string }

/**
 * Edita los datos de un empleado/administrador y, opcionalmente, su correo de
 * acceso. No cambia el rol. El identificador interno (perfil_id / UUID) nunca cambia.
 */
export async function editarUsuario(
  _prev: EditarUsuarioState,
  formData: FormData
): Promise<EditarUsuarioState> {
  if (!(await exigirSuperAdmin())) {
    return { error: 'No tienes permiso para realizar esta acción.' }
  }

  const perfilId = String(formData.get('perfil_id') ?? '')
  if (!perfilId) return { error: 'Falta el identificador del usuario.' }

  const admin = createAdminClient()

  const nombres = String(formData.get('nombres') ?? '').trim()
  const apellidos = String(formData.get('apellidos') ?? '').trim()
  const cedula = String(formData.get('cedula') ?? '').trim()
  if (!nombres || !apellidos) return { error: 'Nombres y apellidos son obligatorios.' }
  if (!cedula) return { error: 'La cédula es obligatoria.' }

  // Unicidad de cédula, excluyendo al propio usuario que se edita.
  const { data: yaExiste } = await admin
    .from('empleados')
    .select('id')
    .eq('cedula', cedula)
    .is('deleted_at', null)
    .neq('perfil_id', perfilId)
    .maybeSingle()
  if (yaExiste) return { error: `Ya existe otro empleado con la cédula ${cedula}.` }

  const { error } = await admin
    .from('empleados')
    .update({
      nombres,
      apellidos,
      cedula,
      telefono: String(formData.get('telefono') ?? '').trim() || null,
    })
    .eq('perfil_id', perfilId)
  if (error) return { error: `No se pudieron guardar los cambios: ${error.message}` }

  const email = String(formData.get('email') ?? '').trim().toLowerCase()
  const emailOriginal = String(formData.get('email_original') ?? '').trim().toLowerCase()
  if (email && email !== emailOriginal) {
    if (!email.includes('@')) return { error: 'El correo electrónico no es válido.' }
    const { error: errEmail } = await admin.auth.admin.updateUserById(perfilId, {
      email,
      email_confirm: true,
    })
    if (errEmail) {
      const msg = /already been registered|already registered|exists/i.test(errEmail.message)
        ? 'Ese correo ya está en uso por otro usuario.'
        : `No se pudo actualizar el correo: ${errEmail.message}`
      return { error: msg }
    }
  }

  revalidatePath('/admin/usuarios')
  redirect('/admin/usuarios')
}

/** Activa o desactiva el acceso de un usuario (perfiles.activo). */
export async function cambiarEstadoAcceso(formData: FormData): Promise<void> {
  if (!(await exigirSuperAdmin())) redirect('/login?error=sin_permiso')

  const perfilId = String(formData.get('perfil_id') ?? '')
  const activar = String(formData.get('activar') ?? '') === 'true'
  if (!perfilId) redirect('/admin/usuarios')

  const admin = createAdminClient()
  await admin.from('perfiles').update({ activo: activar }).eq('id', perfilId)

  revalidatePath('/admin/usuarios')
  redirect('/admin/usuarios')
}
```

- [ ] **Step 2: `page.tsx` — quitar la consulta y el listado de `comercios`**

Reemplazar el contenido completo de `src/app/admin/usuarios/page.tsx`:

```tsx
import Link from 'next/link'
import { requireRol } from '@/lib/auth'
import { createAdminClient } from '@/lib/supabase/admin'
import { cambiarEstadoAcceso } from './actions'

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
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '1.25rem',
        }}
      >
        <h1 style={{ fontSize: '1.5rem', fontWeight: 700 }}>Usuarios</h1>
        <Link href="/admin/usuarios/nuevo" className="orum-button">
          + Crear usuario
        </Link>
      </div>

      {filas.length === 0 ? (
        <div className="orum-card">
          <p className="orum-muted">Aún no hay usuarios registrados. Crea el primero.</p>
        </div>
      ) : (
        <div className="orum-card" style={{ overflowX: 'auto', padding: 0 }}>
          <table className="orum-table">
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
                    <span className={`orum-badge ${f.activo ? 'orum-badge--on' : 'orum-badge--off'}`}>
                      {f.activo ? 'Activo' : 'Inactivo'}
                    </span>
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                      <Link
                        href={`/admin/usuarios/${f.perfilId}/editar`}
                        className="orum-button orum-button--secondary"
                      >
                        Editar
                      </Link>
                      <form action={cambiarEstadoAcceso}>
                        <input type="hidden" name="perfil_id" value={f.perfilId} />
                        <input type="hidden" name="activar" value={f.activo ? 'false' : 'true'} />
                        <button
                          type="submit"
                          className={`orum-button ${f.activo ? 'orum-button--danger' : ''}`}
                        >
                          {f.activo ? 'Desactivar' : 'Activar'}
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

- [ ] **Step 3: `usuario-form.tsx` — quitar la opción "comercio" y sus campos**

Reemplazar el contenido completo de `src/app/admin/usuarios/nuevo/usuario-form.tsx`:

```tsx
'use client'

import { useActionState, useState } from 'react'
import Link from 'next/link'
import { crearUsuario, type CrearUsuarioState } from '../actions'

const estadoInicial: CrearUsuarioState = {}

export function UsuarioForm() {
  const [state, formAction, pending] = useActionState(crearUsuario, estadoInicial)
  const [tipo, setTipo] = useState<'empleado' | 'super_admin'>('empleado')
  const [copiado, setCopiado] = useState(false)

  // Pantalla de éxito: mostramos la contraseña generada UNA sola vez.
  if (state.ok && state.password) {
    return (
      <div className="orum-card">
        <p className="orum-alert orum-alert--success">✓ Usuario creado correctamente.</p>
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
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <input
              className="orum-input"
              readOnly
              value={state.password}
              style={{ fontFamily: 'var(--font-geist-mono, monospace)' }}
            />
            <button
              type="button"
              className="orum-button orum-button--secondary"
              onClick={() => {
                navigator.clipboard?.writeText(state.password ?? '')
                setCopiado(true)
                setTimeout(() => setCopiado(false), 2000)
              }}
            >
              {copiado ? '¡Copiado!' : 'Copiar'}
            </button>
          </div>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1rem' }}>
          <Link href="/admin/usuarios" className="orum-button">
            Ir a la lista
          </Link>
          <Link href="/admin/usuarios/nuevo" className="orum-button orum-button--secondary">
            Crear otro
          </Link>
        </div>
      </div>
    )
  }

  return (
    <form action={formAction} className="orum-card">
      {state.error && (
        <p className="orum-alert orum-alert--error" role="alert">
          {state.error}
        </p>
      )}

      <div className="orum-field">
        <label className="orum-label" htmlFor="tipo">
          Tipo de usuario
        </label>
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
      </div>

      <div className="orum-field">
        <label className="orum-label" htmlFor="email">
          Correo electrónico (para iniciar sesión)
        </label>
        <input id="email" name="email" type="email" className="orum-input" required />
      </div>

      <div style={{ display: 'flex', gap: '0.75rem' }}>
        <div className="orum-field" style={{ flex: 1 }}>
          <label className="orum-label" htmlFor="nombres">
            Nombres
          </label>
          <input id="nombres" name="nombres" className="orum-input" required />
        </div>
        <div className="orum-field" style={{ flex: 1 }}>
          <label className="orum-label" htmlFor="apellidos">
            Apellidos
          </label>
          <input id="apellidos" name="apellidos" className="orum-input" required />
        </div>
      </div>
      <div className="orum-field">
        <label className="orum-label" htmlFor="cedula">
          Cédula
        </label>
        <input id="cedula" name="cedula" className="orum-input" required />
      </div>
      <div className="orum-field">
        <label className="orum-label" htmlFor="telefono">
          Teléfono (opcional)
        </label>
        <input id="telefono" name="telefono" className="orum-input" />
      </div>

      <p className="orum-muted" style={{ fontSize: '0.85rem', marginBottom: '1rem' }}>
        El sistema generará una contraseña segura automáticamente y te la mostrará al terminar.
      </p>

      <div style={{ display: 'flex', gap: '0.75rem' }}>
        <button type="submit" className="orum-button" disabled={pending}>
          {pending ? 'Creando…' : 'Crear usuario'}
        </button>
        <Link href="/admin/usuarios" className="orum-button orum-button--secondary">
          Cancelar
        </Link>
      </div>
    </form>
  )
}
```

Nota: de paso corrige el `<a>` de "Crear otro" a `<Link>`, mismo defecto que ya tenías pendiente de arreglar en `miembro-form.tsx` (visto en tu diff local sin commitear).

- [ ] **Step 4: `nuevo/page.tsx` — quitar el fetch de marcas/categorias**

Reemplazar el contenido completo de `src/app/admin/usuarios/nuevo/page.tsx`:

```tsx
import { requireRol } from '@/lib/auth'
import { UsuarioForm } from './usuario-form'

export const metadata = { title: 'Crear usuario · ORUM' }

export default async function NuevoUsuarioPage() {
  await requireRol('super_admin')

  return (
    <div style={{ maxWidth: 560 }}>
      <h1 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '1.25rem' }}>
        Crear usuario
      </h1>
      <UsuarioForm />
    </div>
  )
}
```

- [ ] **Step 5: `editar-form.tsx` — quitar la rama de comercio**

Reemplazar el contenido completo de `src/app/admin/usuarios/[id]/editar/editar-form.tsx`:

```tsx
'use client'

import { useActionState } from 'react'
import Link from 'next/link'
import { editarUsuario, type EditarUsuarioState } from '../../actions'

const estadoInicial: EditarUsuarioState = {}

type Props = {
  perfilId: string
  email: string
  empleado: { nombres: string; apellidos: string; cedula: string | null; telefono: string | null }
}

export function EditarForm({ perfilId, email, empleado }: Props) {
  const [state, formAction, pending] = useActionState(editarUsuario, estadoInicial)

  return (
    <form action={formAction} className="orum-card">
      {state.error && (
        <p className="orum-alert orum-alert--error" role="alert">
          {state.error}
        </p>
      )}

      <input type="hidden" name="perfil_id" value={perfilId} />
      <input type="hidden" name="email_original" value={email} />

      <div className="orum-field">
        <label className="orum-label" htmlFor="email">
          Correo de acceso
        </label>
        <input
          id="email"
          name="email"
          type="email"
          className="orum-input"
          defaultValue={email}
          required
        />
      </div>

      <div style={{ display: 'flex', gap: '0.75rem' }}>
        <div className="orum-field" style={{ flex: 1 }}>
          <label className="orum-label" htmlFor="nombres">
            Nombres
          </label>
          <input
            id="nombres"
            name="nombres"
            className="orum-input"
            defaultValue={empleado.nombres}
            required
          />
        </div>
        <div className="orum-field" style={{ flex: 1 }}>
          <label className="orum-label" htmlFor="apellidos">
            Apellidos
          </label>
          <input
            id="apellidos"
            name="apellidos"
            className="orum-input"
            defaultValue={empleado.apellidos}
            required
          />
        </div>
      </div>
      <div className="orum-field">
        <label className="orum-label" htmlFor="cedula">
          Cédula
        </label>
        <input
          id="cedula"
          name="cedula"
          className="orum-input"
          defaultValue={empleado.cedula ?? ''}
          required
        />
      </div>
      <div className="orum-field">
        <label className="orum-label" htmlFor="telefono">
          Teléfono (opcional)
        </label>
        <input
          id="telefono"
          name="telefono"
          className="orum-input"
          defaultValue={empleado.telefono ?? ''}
        />
      </div>

      <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.5rem' }}>
        <button type="submit" className="orum-button" disabled={pending}>
          {pending ? 'Guardando…' : 'Guardar cambios'}
        </button>
        <Link href="/admin/usuarios" className="orum-button orum-button--secondary">
          Cancelar
        </Link>
      </div>
    </form>
  )
}
```

- [ ] **Step 6: `[id]/editar/page.tsx` — quitar la consulta a `comercios`**

Reemplazar el contenido completo de `src/app/admin/usuarios/[id]/editar/page.tsx`:

```tsx
import { notFound } from 'next/navigation'
import { requireRol } from '@/lib/auth'
import { createAdminClient } from '@/lib/supabase/admin'
import { EditarForm } from './editar-form'

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

      <EditarForm perfilId={perfilId} email={email} empleado={empleado} />
    </div>
  )
}
```

Nota: este archivo usa `Link`, así que necesita `import Link from 'next/link'` — agrégalo al inicio del archivo junto a los demás imports (arriba se omitió el import por brevedad del bloque anterior; inclúyelo).

- [ ] **Step 7: Verificar tipos**

Run: `npx tsc --noEmit`
Expected: sin errores.

- [ ] **Step 8: Verificación manual**

Run: `pnpm dev`, entrar como `super_admin`, ir a `/admin/usuarios`.
Expected: la lista solo muestra empleados/admins (sin comercios, aunque existan filas viejas en `comercios` con `perfil_id`, esas no aparecen). "Crear usuario" ya no ofrece la opción "Comercio aliado". Crear un empleado nuevo funciona igual que antes. Editar un empleado existente funciona igual que antes.

- [ ] **Step 9: Commit**

```bash
git add src/app/admin/usuarios
git commit -m "refactor: reducir /admin/usuarios a solo empleados y administradores"
```

---

## Task 13: Verificación final contra los criterios de aceptación del spec

**Files:** ninguno (solo verificación).

- [ ] **Step 1: Suite completa**

Run: `pnpm test && npx tsc --noEmit && pnpm lint`
Expected: todo verde.

- [ ] **Step 2: Repasar uno por uno los criterios de aceptación (spec sección 11)**

Con el servidor corriendo (`pnpm dev`) y sesión de `super_admin`:

- [ ] Crear un comercio (cuenta + datos) en un solo flujo; la contraseña se muestra una sola vez.
- [ ] La ficha permite alternar `comercios.activo` y `perfiles.activo` de forma independiente (confirmado en Task 9, Step 4).
- [ ] Editar nombre, descripción, marca, categoría, logo_url y correo del comercio.
- [ ] Crear, editar y activar/desactivar sucursales de un comercio, con ciudad obligatoria.
- [ ] Crear, editar y activar/desactivar promociones de un comercio.
- [ ] Una promoción `porcentaje`/`monto_fijo` sin `valor` (o inválido) se rechaza con mensaje claro; una `dos_por_uno`/`regalo` con `valor` también se rechaza.
- [ ] `/admin/usuarios` ya no ofrece crear comercios ni los lista; los empleados/admins existentes siguen funcionando igual que antes.

- [ ] **Step 3: Si algo falla, volver a la tarea correspondiente y corregir antes de dar la fase por cerrada.**

No hay commit en esta tarea salvo que se hagan correcciones (en cuyo caso, commitear esas correcciones puntuales con su propio mensaje descriptivo).
