# Fase 4 — Métricas y trazabilidad — Plan de implementación

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Agregar la bitácora de actividad de miembros (RF-19) y el dashboard de métricas en `/admin`, usando las tablas `bitacora_actividad` y `ventas` que ya existen en Supabase pero no se usan todavía.

**Architecture:** Mismo patrón de Fases 1-3: Server Components para lectura (con `requireRol`), Server Actions `'use server'` para escritura, `createAdminClient()` (service role) para todo acceso a datos. La bitácora se escribe desde las 3 acciones ya existentes en `miembros/actions.ts` vía un helper centralizado en `src/lib/bitacora.ts`. Las agregaciones del dashboard (agrupar/sumar) se hacen en funciones puras de `src/lib/metricas.ts`, no en SQL, porque PostgREST no hace `GROUP BY` cómodo — el filtrado por fecha sí se hace en la query.

**Tech Stack:** Next.js 16 (App Router, Server Actions), React 19, Supabase (`@supabase/supabase-js`), TypeScript, Vitest.

## Global Constraints

- No hay migraciones SQL: `bitacora_actividad` y `ventas` ya existen en Supabase con las columnas necesarias (spec sección 5 / 11).
- La bitácora se limita a `entidad = 'miembro'` en esta fase (spec D1) — no se instrumenta nada de comercios, promociones ni usuarios internos.
- Escribir en la bitácora es *best-effort*: si el `insert` falla, se loguea el error a consola y la operación principal (alta/edición/renovación) se completa igual (spec D2).
- `/admin/bitacora` y `/admin/metricas` exigen `requireRol('super_admin')` (spec D5); el historial dentro de la ficha del miembro hereda el permiso ya existente de esa página (`super_admin`, `empleado`).
- Las agregaciones (agrupar/sumar) van en funciones puras testeadas con Vitest; las server actions y páginas se verifican manualmente, igual que en Fases 1-3.
- Las métricas de `ventas` (por comercio, y uso por miembro/comercio) mostrarán estado vacío hasta que exista la Herramienta para Comercios — no es un bug, es el comportamiento esperado (spec D4).

---

## Task 1: Extender `database.types.ts` con `bitacora_actividad` y `ventas`

**Files:**
- Modify: `src/lib/supabase/database.types.ts`

**Interfaces:**
- Produces: tipo `MetodoRegistroVenta`, y las entradas de `Database['public']['Tables']` para `bitacora_actividad` y `ventas`, usadas por todas las tareas siguientes.

Esquema real confirmado vía PostgREST (API REST de Supabase, no el `Esquema_BD.txt`, que está truncado):

- `bitacora_actividad`: `id, actor_id (uuid, nullable), accion (text, NOT NULL), entidad (text, NOT NULL), entidad_id (bigint, nullable), datos_anteriores (jsonb, nullable), datos_nuevos (jsonb, nullable), fecha_hora (timestamptz, default now())`.
- `ventas`: `id, miembro_id (bigint, NOT NULL), membresia_id (bigint, nullable), sucursal_id (bigint, NOT NULL), promocion_id (bigint, nullable), valor_compra (numeric, NOT NULL), valor_descuento (numeric, default 0), valor_final (numeric, NOT NULL), metodo_registro (enum 'qr'|'numero', NOT NULL), registrada_por_perfil (uuid, nullable), fecha_hora (timestamptz, default now()), created_at (timestamptz, default now())`.

- [ ] **Step 1: Agregar el tipo `MetodoRegistroVenta` junto a `TipoBeneficioCodigo`**

En `src/lib/supabase/database.types.ts`, ubicar esta línea (cerca del inicio del archivo):

```ts
/** Códigos de tipo_beneficio tal como están en la tabla `tipos_beneficio`. */
export type TipoBeneficioCodigo = 'porcentaje' | 'dos_por_uno' | 'monto_fijo' | 'regalo'
```

Justo debajo, agregar:

```ts

/** Valores del enum `metodo_registro_venta`. */
export type MetodoRegistroVenta = 'qr' | 'numero'
```

- [ ] **Step 2: Agregar las dos tablas al final de `Tables`, antes del cierre**

Ubicar el final de la definición de `promociones` (la última tabla del archivo) y el cierre de `Tables`:

```ts
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
    }
    Views: Record<string, never>
```

Reemplazar por (se agregan `bitacora_actividad` y `ventas` entre el cierre de `promociones` y el cierre de `Tables`):

```ts
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
      bitacora_actividad: {
        Row: {
          id: number
          actor_id: string | null
          accion: string
          entidad: string
          entidad_id: number | null
          datos_anteriores: Record<string, unknown> | null
          datos_nuevos: Record<string, unknown> | null
          fecha_hora: Timestamp
        }
        Insert: {
          id?: number
          actor_id?: string | null
          accion: string
          entidad: string
          entidad_id?: number | null
          datos_anteriores?: Record<string, unknown> | null
          datos_nuevos?: Record<string, unknown> | null
          fecha_hora?: Timestamp
        }
        Update: Partial<Database['public']['Tables']['bitacora_actividad']['Insert']>
        Relationships: []
      }
      ventas: {
        Row: {
          id: number
          miembro_id: number
          membresia_id: number | null
          sucursal_id: number
          promocion_id: number | null
          valor_compra: number
          valor_descuento: number
          valor_final: number
          metodo_registro: MetodoRegistroVenta
          registrada_por_perfil: string | null
          fecha_hora: Timestamp
          created_at: Timestamp
        }
        Insert: {
          id?: number
          miembro_id: number
          membresia_id?: number | null
          sucursal_id: number
          promocion_id?: number | null
          valor_compra: number
          valor_descuento?: number
          valor_final: number
          metodo_registro: MetodoRegistroVenta
          registrada_por_perfil?: string | null
          fecha_hora?: Timestamp
          created_at?: Timestamp
        }
        Update: Partial<Database['public']['Tables']['ventas']['Insert']>
        Relationships: []
      }
    }
    Views: Record<string, never>
```

- [ ] **Step 3: Verificar que el proyecto sigue compilando**

Run: `npx tsc --noEmit`
Expected: sin errores.

- [ ] **Step 4: Commit**

```bash
git add src/lib/supabase/database.types.ts
git commit -m "types: agregar bitacora_actividad y ventas"
```

---

## Task 2: `src/lib/bitacora.ts` — resumen legible + escritura de eventos

**Files:**
- Create: `src/lib/bitacora.ts`
- Create: `src/lib/bitacora.test.ts`

**Interfaces:**
- Consumes: `createAdminClient` (`@/lib/supabase/admin`), tipos de Task 1.
- Produces: `resumirEventoBitacora(accion, datosAnteriores, datosNuevos): string` y `registrarActividad(admin, input): Promise<void>` con `RegistrarActividadInput`, usados por Tasks 4, 5 y 6.

- [ ] **Step 1: Escribir las pruebas primero (solo para la función pura)**

Crear `src/lib/bitacora.test.ts`:

```ts
import { describe, it, expect } from 'vitest'
import { resumirEventoBitacora } from './bitacora'

describe('resumirEventoBitacora — alta', () => {
  it('arma el resumen con plan y precio', () => {
    const texto = resumirEventoBitacora('alta', null, { plan_nombre: 'Oro', precio_pagado: 50000 })
    expect(texto).toBe('Miembro registrado — plan Oro, $50000')
  })

  it('usa (vacío) si falta el dato', () => {
    const texto = resumirEventoBitacora('alta', null, {})
    expect(texto).toBe('Miembro registrado — plan (vacío), $(vacío)')
  })
})

describe('resumirEventoBitacora — renovacion', () => {
  it('arma el resumen con plan y fecha de fin', () => {
    const texto = resumirEventoBitacora('renovacion', null, {
      plan_nombre: 'Oro',
      fecha_inicio: '2026-08-01',
      fecha_fin: '2027-08-01',
      precio_pagado: 50000,
    })
    expect(texto).toBe('Membresía renovada — plan Oro, vence 2027-08-01')
  })
})

describe('resumirEventoBitacora — edicion', () => {
  it('lista los campos que cambiaron', () => {
    const texto = resumirEventoBitacora(
      'edicion',
      { nombres: 'Ana', apellidos: 'Ruiz', telefono: '3001234567' },
      { nombres: 'Ana', apellidos: 'Ruiz Gómez', telefono: '3001234567' },
    )
    expect(texto).toBe('Datos editados — apellidos')
  })

  it('lista varios campos separados por coma', () => {
    const texto = resumirEventoBitacora(
      'edicion',
      { telefono: '3001234567', direccion: 'Calle 1' },
      { telefono: '3009999999', direccion: 'Calle 2' },
    )
    expect(texto).toBe('Datos editados — teléfono, dirección')
  })

  it('indica cuando no detecta cambios', () => {
    const texto = resumirEventoBitacora('edicion', { nombres: 'Ana' }, { nombres: 'Ana' })
    expect(texto).toBe('Datos editados (sin cambios detectados)')
  })

  it('funciona con datos_anteriores nulo', () => {
    const texto = resumirEventoBitacora('edicion', null, { nombres: 'Ana' })
    expect(texto).toBe('Datos editados — nombres')
  })
})

describe('resumirEventoBitacora — acción desconocida', () => {
  it('cae en un texto genérico', () => {
    expect(resumirEventoBitacora('otra_cosa', null, null)).toBe('Evento: otra_cosa')
  })
})
```

- [ ] **Step 2: Ejecutar las pruebas para confirmar que fallan**

Run: `npx vitest run src/lib/bitacora.test.ts`
Expected: FAIL — `Cannot find module './bitacora'` (el archivo aún no existe).

- [ ] **Step 3: Implementar `src/lib/bitacora.ts`**

```ts
import { createAdminClient } from './supabase/admin'

type Admin = ReturnType<typeof createAdminClient>

export type DatosEvento = Record<string, unknown> | null

const ETIQUETAS_CAMPO: Record<string, string> = {
  nombres: 'nombres',
  apellidos: 'apellidos',
  cedula: 'cédula',
  telefono: 'teléfono',
  direccion: 'dirección',
  ciudad_id: 'ciudad',
}

function formatearValor(valor: unknown): string {
  if (valor === null || valor === undefined || valor === '') return '(vacío)'
  return String(valor)
}

/**
 * Arma el texto legible de un evento de bitácora, reutilizado tanto en la
 * ficha del miembro como en el listado global (`/admin/bitacora`).
 */
export function resumirEventoBitacora(
  accion: string,
  datosAnteriores: DatosEvento,
  datosNuevos: DatosEvento,
): string {
  if (accion === 'alta') {
    const n = datosNuevos ?? {}
    return `Miembro registrado — plan ${formatearValor(n.plan_nombre)}, $${formatearValor(n.precio_pagado)}`
  }

  if (accion === 'renovacion') {
    const n = datosNuevos ?? {}
    return `Membresía renovada — plan ${formatearValor(n.plan_nombre)}, vence ${formatearValor(n.fecha_fin)}`
  }

  if (accion === 'edicion') {
    const antes = datosAnteriores ?? {}
    const despues = datosNuevos ?? {}
    const cambios = Object.keys(despues)
      .filter((campo) => antes[campo] !== despues[campo])
      .map((campo) => ETIQUETAS_CAMPO[campo] ?? campo)
    if (cambios.length === 0) return 'Datos editados (sin cambios detectados)'
    return `Datos editados — ${cambios.join(', ')}`
  }

  return `Evento: ${accion}`
}

export type RegistrarActividadInput = {
  actorId: string | null
  accion: string
  entidadId: number
  datosAnteriores?: DatosEvento
  datosNuevos?: DatosEvento
}

/**
 * Escribe un evento en `bitacora_actividad` para un miembro (`entidad` fijo).
 * Best-effort: si el insert falla, se loguea el error a consola pero nunca se
 * propaga — la auditoría no debe bloquear la operación principal que la
 * dispara (alta/edición/renovación de un miembro).
 */
export async function registrarActividad(admin: Admin, input: RegistrarActividadInput): Promise<void> {
  const { error } = await admin.from('bitacora_actividad').insert({
    actor_id: input.actorId,
    accion: input.accion,
    entidad: 'miembro',
    entidad_id: input.entidadId,
    datos_anteriores: input.datosAnteriores ?? null,
    datos_nuevos: input.datosNuevos ?? null,
  })
  if (error) {
    console.error('No se pudo registrar el evento en bitacora_actividad:', error.message)
  }
}
```

- [ ] **Step 4: Ejecutar las pruebas de nuevo para confirmar que pasan**

Run: `npx vitest run src/lib/bitacora.test.ts`
Expected: PASS (8 pruebas).

- [ ] **Step 5: Verificar tipos**

Run: `npx tsc --noEmit`
Expected: sin errores.

- [ ] **Step 6: Commit**

```bash
git add src/lib/bitacora.ts src/lib/bitacora.test.ts
git commit -m "feat: bitacora de actividad (resumen + registro de eventos)"
```

---

## Task 3: `src/lib/metricas.ts` — funciones puras de agregación

**Files:**
- Create: `src/lib/metricas.ts`
- Create: `src/lib/metricas.test.ts`

**Interfaces:**
- Produces: `rangoUltimosDias`, `agruparMembresiasPorEmpleado`, `agruparVentasPorComercio`, `agruparVentasPorMiembroYComercio`, y sus tipos (`ResumenEmpleado`, `ResumenComercio`, `ResumenUsoMiembro`), usados por Task 7 (dashboard).

- [ ] **Step 1: Escribir las pruebas primero**

Crear `src/lib/metricas.test.ts`:

```ts
import { describe, it, expect } from 'vitest'
import {
  rangoUltimosDias,
  agruparMembresiasPorEmpleado,
  agruparVentasPorComercio,
  agruparVentasPorMiembroYComercio,
} from './metricas'

describe('rangoUltimosDias', () => {
  it('calcula desde/hasta en formato YYYY-MM-DD', () => {
    const rango = rangoUltimosDias(30, new Date('2026-07-31T12:00:00Z'))
    expect(rango).toEqual({ desde: '2026-07-01', hasta: '2026-07-31' })
  })

  it('cruza el límite de año correctamente', () => {
    const rango = rangoUltimosDias(10, new Date('2026-01-05T00:00:00Z'))
    expect(rango).toEqual({ desde: '2025-12-26', hasta: '2026-01-05' })
  })
})

describe('agruparMembresiasPorEmpleado', () => {
  const empleados = [
    { id: 1, nombres: 'Ana', apellidos: 'Ruiz' },
    { id: 2, nombres: 'Luis', apellidos: 'Pardo' },
  ]

  it('agrupa cantidad y monto por empleado', () => {
    const resultado = agruparMembresiasPorEmpleado(
      [
        { vendido_por: 1, precio_pagado: 50000 },
        { vendido_por: 1, precio_pagado: 30000 },
        { vendido_por: 2, precio_pagado: 20000 },
      ],
      empleados,
    )
    expect(resultado).toEqual([
      { empleadoId: 1, nombre: 'Ana Ruiz', cantidad: 2, monto: 80000 },
      { empleadoId: 2, nombre: 'Luis Pardo', cantidad: 1, monto: 20000 },
    ])
  })

  it('agrupa vendido_por null bajo "Super admin"', () => {
    const resultado = agruparMembresiasPorEmpleado(
      [{ vendido_por: null, precio_pagado: 40000 }],
      empleados,
    )
    expect(resultado).toEqual([{ empleadoId: null, nombre: 'Super admin', cantidad: 1, monto: 40000 }])
  })

  it('devuelve arreglo vacío sin membresías', () => {
    expect(agruparMembresiasPorEmpleado([], empleados)).toEqual([])
  })
})

describe('agruparVentasPorComercio', () => {
  const sucursales = [
    { id: 10, comercio_id: 100 },
    { id: 11, comercio_id: 200 },
  ]
  const comercios = [
    { id: 100, nombre: 'Restaurante A' },
    { id: 200, nombre: 'Tienda B' },
  ]

  it('agrupa cantidad, monto y descuento por comercio, ordenado desc por cantidad', () => {
    const resultado = agruparVentasPorComercio(
      [
        { sucursal_id: 10, miembro_id: 1, valor_final: 18000, valor_descuento: 2000 },
        { sucursal_id: 10, miembro_id: 2, valor_final: 9000, valor_descuento: 1000 },
        { sucursal_id: 11, miembro_id: 1, valor_final: 5000, valor_descuento: 500 },
      ],
      sucursales,
      comercios,
    )
    expect(resultado).toEqual([
      { comercioId: 100, nombre: 'Restaurante A', cantidad: 2, montoTotal: 27000, descuentoTotal: 3000 },
      { comercioId: 200, nombre: 'Tienda B', cantidad: 1, montoTotal: 5000, descuentoTotal: 500 },
    ])
  })

  it('devuelve arreglo vacío sin ventas', () => {
    expect(agruparVentasPorComercio([], sucursales, comercios)).toEqual([])
  })
})

describe('agruparVentasPorMiembroYComercio', () => {
  const sucursales = [{ id: 10, comercio_id: 100 }]
  const comercios = [{ id: 100, nombre: 'Restaurante A' }]
  const miembros = [{ id: 1, nombres: 'Juan', apellidos: 'Pérez' }]

  it('cuenta veces por par miembro+comercio', () => {
    const resultado = agruparVentasPorMiembroYComercio(
      [
        { sucursal_id: 10, miembro_id: 1, valor_final: 1000, valor_descuento: 0 },
        { sucursal_id: 10, miembro_id: 1, valor_final: 2000, valor_descuento: 0 },
      ],
      sucursales,
      comercios,
      miembros,
    )
    expect(resultado).toEqual([
      { miembroId: 1, miembroNombre: 'Juan Pérez', comercioId: 100, comercioNombre: 'Restaurante A', veces: 2 },
    ])
  })

  it('limita a los primeros 20, ordenados desc por veces', () => {
    const ventas = Array.from({ length: 25 }, (_, i) => ({
      sucursal_id: 10,
      miembro_id: i + 1,
      valor_final: 1000,
      valor_descuento: 0,
    }))
    // Duplicar las ventas del miembro 1 para que quede primero.
    ventas.push({ sucursal_id: 10, miembro_id: 1, valor_final: 1000, valor_descuento: 0 })

    const miembrosAmpliados = Array.from({ length: 25 }, (_, i) => ({
      id: i + 1,
      nombres: `M${i + 1}`,
      apellidos: '',
    }))

    const resultado = agruparVentasPorMiembroYComercio(ventas, sucursales, comercios, miembrosAmpliados)
    expect(resultado).toHaveLength(20)
    expect(resultado[0]).toMatchObject({ miembroId: 1, veces: 2 })
  })

  it('ignora ventas de sucursales desconocidas', () => {
    const resultado = agruparVentasPorMiembroYComercio(
      [{ sucursal_id: 999, miembro_id: 1, valor_final: 1000, valor_descuento: 0 }],
      sucursales,
      comercios,
      miembros,
    )
    expect(resultado).toEqual([])
  })
})
```

- [ ] **Step 2: Ejecutar las pruebas para confirmar que fallan**

Run: `npx vitest run src/lib/metricas.test.ts`
Expected: FAIL — `Cannot find module './metricas'` (el archivo aún no existe).

- [ ] **Step 3: Implementar `src/lib/metricas.ts`**

```ts
function formatearFechaISO(fecha: Date): string {
  return fecha.toISOString().slice(0, 10)
}

/** Rango [hoy - dias, hoy] en formato 'YYYY-MM-DD', para el filtro por defecto del dashboard. */
export function rangoUltimosDias(dias: number, hoy: Date = new Date()): { desde: string; hasta: string } {
  const hasta = formatearFechaISO(hoy)
  const desdeDate = new Date(hoy)
  desdeDate.setUTCDate(desdeDate.getUTCDate() - dias)
  const desde = formatearFechaISO(desdeDate)
  return { desde, hasta }
}

export type MembresiaVenta = {
  vendido_por: number | null
  precio_pagado: number
}
export type EmpleadoInfo = { id: number; nombres: string; apellidos: string }
export type ResumenEmpleado = {
  empleadoId: number | null
  nombre: string
  cantidad: number
  monto: number
}

/** Agrupa membresías vendidas por empleado (`vendido_por = null` → "Super admin"). */
export function agruparMembresiasPorEmpleado(
  membresias: MembresiaVenta[],
  empleados: EmpleadoInfo[],
): ResumenEmpleado[] {
  const nombreEmpleado = new Map(empleados.map((e) => [e.id, `${e.nombres} ${e.apellidos}`.trim()]))
  const acumulado = new Map<number | null, { cantidad: number; monto: number }>()

  for (const m of membresias) {
    const clave = m.vendido_por
    const actual = acumulado.get(clave) ?? { cantidad: 0, monto: 0 }
    actual.cantidad += 1
    actual.monto += m.precio_pagado
    acumulado.set(clave, actual)
  }

  return Array.from(acumulado.entries())
    .map(([empleadoId, { cantidad, monto }]) => ({
      empleadoId,
      nombre: empleadoId === null ? 'Super admin' : (nombreEmpleado.get(empleadoId) ?? `Empleado #${empleadoId}`),
      cantidad,
      monto,
    }))
    .sort((a, b) => b.cantidad - a.cantidad)
}

export type VentaRegistro = {
  sucursal_id: number
  miembro_id: number
  valor_final: number
  valor_descuento: number
}
export type SucursalInfo = { id: number; comercio_id: number }
export type ComercioInfo = { id: number; nombre: string }
export type MiembroInfo = { id: number; nombres: string; apellidos: string }

export type ResumenComercio = {
  comercioId: number
  nombre: string
  cantidad: number
  montoTotal: number
  descuentoTotal: number
}

/** Agrupa ventas por comercio (vía `sucursal_id → comercio_id`). */
export function agruparVentasPorComercio(
  ventas: VentaRegistro[],
  sucursales: SucursalInfo[],
  comercios: ComercioInfo[],
): ResumenComercio[] {
  const comercioDeSucursal = new Map(sucursales.map((s) => [s.id, s.comercio_id]))
  const nombreComercio = new Map(comercios.map((c) => [c.id, c.nombre]))
  const acumulado = new Map<number, { cantidad: number; montoTotal: number; descuentoTotal: number }>()

  for (const v of ventas) {
    const comercioId = comercioDeSucursal.get(v.sucursal_id)
    if (comercioId === undefined) continue
    const actual = acumulado.get(comercioId) ?? { cantidad: 0, montoTotal: 0, descuentoTotal: 0 }
    actual.cantidad += 1
    actual.montoTotal += v.valor_final
    actual.descuentoTotal += v.valor_descuento
    acumulado.set(comercioId, actual)
  }

  return Array.from(acumulado.entries())
    .map(([comercioId, { cantidad, montoTotal, descuentoTotal }]) => ({
      comercioId,
      nombre: nombreComercio.get(comercioId) ?? `Comercio #${comercioId}`,
      cantidad,
      montoTotal,
      descuentoTotal,
    }))
    .sort((a, b) => b.cantidad - a.cantidad)
}

export type ResumenUsoMiembro = {
  miembroId: number
  miembroNombre: string
  comercioId: number
  comercioNombre: string
  veces: number
}

/** Agrupa ventas por par miembro+comercio ("cuántas veces usó su membresía ahí"), top 20. */
export function agruparVentasPorMiembroYComercio(
  ventas: VentaRegistro[],
  sucursales: SucursalInfo[],
  comercios: ComercioInfo[],
  miembros: MiembroInfo[],
): ResumenUsoMiembro[] {
  const comercioDeSucursal = new Map(sucursales.map((s) => [s.id, s.comercio_id]))
  const nombreComercio = new Map(comercios.map((c) => [c.id, c.nombre]))
  const nombreMiembro = new Map(miembros.map((m) => [m.id, `${m.nombres} ${m.apellidos}`.trim()]))
  const acumulado = new Map<string, { miembroId: number; comercioId: number; veces: number }>()

  for (const v of ventas) {
    const comercioId = comercioDeSucursal.get(v.sucursal_id)
    if (comercioId === undefined) continue
    const clave = `${v.miembro_id}:${comercioId}`
    const actual = acumulado.get(clave) ?? { miembroId: v.miembro_id, comercioId, veces: 0 }
    actual.veces += 1
    acumulado.set(clave, actual)
  }

  return Array.from(acumulado.values())
    .map(({ miembroId, comercioId, veces }) => ({
      miembroId,
      miembroNombre: nombreMiembro.get(miembroId) ?? `Miembro #${miembroId}`,
      comercioId,
      comercioNombre: nombreComercio.get(comercioId) ?? `Comercio #${comercioId}`,
      veces,
    }))
    .sort((a, b) => b.veces - a.veces)
    .slice(0, 20)
}
```

- [ ] **Step 4: Ejecutar las pruebas de nuevo para confirmar que pasan**

Run: `npx vitest run src/lib/metricas.test.ts`
Expected: PASS (10 pruebas).

- [ ] **Step 5: Verificar tipos**

Run: `npx tsc --noEmit`
Expected: sin errores.

- [ ] **Step 6: Commit**

```bash
git add src/lib/metricas.ts src/lib/metricas.test.ts
git commit -m "feat: funciones puras de agregacion para el dashboard de metricas"
```

---

## Task 4: Instrumentar `miembros/actions.ts` con `registrarActividad`

**Files:**
- Modify: `src/app/admin/miembros/actions.ts`

**Interfaces:**
- Consumes: `registrarActividad`, `RegistrarActividadInput` (Task 2).

- [ ] **Step 1: Agregar el import**

Ubicar los imports al inicio del archivo:

```ts
'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createAdminClient } from '@/lib/supabase/admin'
import { getPerfilActual, type PerfilActual } from '@/lib/auth'
import { generarPassword } from '@/lib/password'
import {
  generarNumeroMembresia,
  calcularFechaFin,
  calcularFechaInicioRenovacion,
} from '@/lib/membresias'
```

Reemplazar por:

```ts
'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createAdminClient } from '@/lib/supabase/admin'
import { getPerfilActual, type PerfilActual } from '@/lib/auth'
import { generarPassword } from '@/lib/password'
import { registrarActividad } from '@/lib/bitacora'
import {
  generarNumeroMembresia,
  calcularFechaFin,
  calcularFechaInicioRenovacion,
} from '@/lib/membresias'
```

- [ ] **Step 2: `registrarMiembro` — incluir `nombre` del plan y registrar el evento "alta"**

Ubicar (dentro de `registrarMiembro`):

```ts
  // 3) Plan activo y no eliminado.
  const { data: plan } = await admin
    .from('planes_membresia')
    .select('id, duracion_meses, activo')
    .eq('id', plan_id)
    .is('deleted_at', null)
    .maybeSingle()
  if (!plan || !plan.activo) return { error: 'El plan seleccionado no existe o está inactivo.' }
```

Reemplazar por:

```ts
  // 3) Plan activo y no eliminado.
  const { data: plan } = await admin
    .from('planes_membresia')
    .select('id, nombre, duracion_meses, activo')
    .eq('id', plan_id)
    .is('deleted_at', null)
    .maybeSingle()
  if (!plan || !plan.activo) return { error: 'El plan seleccionado no existe o está inactivo.' }
```

Ubicar el final de la función:

```ts
  if (errMembresia) {
    await revertir()
    return { error: `No se pudo registrar la membresía: ${errMembresia.message}` }
  }

  revalidatePath('/admin/miembros')
  return { ok: true, numero, password, nombre: `${nombres} ${apellidos}`.trim() }
}
```

Reemplazar por:

```ts
  if (errMembresia) {
    await revertir()
    return { error: `No se pudo registrar la membresía: ${errMembresia.message}` }
  }

  await registrarActividad(admin, {
    actorId: actor.userId,
    accion: 'alta',
    entidadId: miembroId,
    datosNuevos: {
      nombres,
      apellidos,
      cedula,
      plan_nombre: plan.nombre,
      precio_pagado,
    },
  })

  revalidatePath('/admin/miembros')
  return { ok: true, numero, password, nombre: `${nombres} ${apellidos}`.trim() }
}
```

- [ ] **Step 3: `renovarMembresia` — incluir `nombre` del plan y registrar el evento "renovacion"**

Ubicar (dentro de `renovarMembresia`):

```ts
  const { data: plan } = await admin
    .from('planes_membresia')
    .select('id, duracion_meses, activo')
    .eq('id', plan_id)
    .is('deleted_at', null)
    .maybeSingle()
  if (!plan || !plan.activo) return { error: 'El plan seleccionado no existe o está inactivo.' }
```

Reemplazar por:

```ts
  const { data: plan } = await admin
    .from('planes_membresia')
    .select('id, nombre, duracion_meses, activo')
    .eq('id', plan_id)
    .is('deleted_at', null)
    .maybeSingle()
  if (!plan || !plan.activo) return { error: 'El plan seleccionado no existe o está inactivo.' }
```

Ubicar el final de la función:

```ts
  if (vigente) {
    const { error: errVencer } = await admin
      .from('membresias')
      .update({ estado: 'vencida' })
      .eq('id', vigente.id)
    if (errVencer) {
      await admin.from('membresias').delete().eq('id', nueva.id)
      return { error: `No se pudo completar la renovación: ${errVencer.message}` }
    }
  }

  revalidatePath('/admin/miembros')
  revalidatePath(`/admin/miembros/${miembro_id}`)
  return {}
}
```

Reemplazar por:

```ts
  if (vigente) {
    const { error: errVencer } = await admin
      .from('membresias')
      .update({ estado: 'vencida' })
      .eq('id', vigente.id)
    if (errVencer) {
      await admin.from('membresias').delete().eq('id', nueva.id)
      return { error: `No se pudo completar la renovación: ${errVencer.message}` }
    }
  }

  await registrarActividad(admin, {
    actorId: actor.userId,
    accion: 'renovacion',
    entidadId: miembro_id,
    datosNuevos: {
      plan_nombre: plan.nombre,
      fecha_inicio,
      fecha_fin,
      precio_pagado,
    },
  })

  revalidatePath('/admin/miembros')
  revalidatePath(`/admin/miembros/${miembro_id}`)
  return {}
}
```

- [ ] **Step 4: `editarMiembro` — snapshot antes del cambio y registrar el evento "edicion"**

Ubicar (dentro de `editarMiembro`):

```ts
  const admin = createAdminClient()

  // Cédula única, excluyendo al propio miembro.
  const { data: cedulaExiste } = await admin
```

Reemplazar por:

```ts
  const admin = createAdminClient()

  // Snapshot antes de editar, para la bitácora.
  const { data: miembroAntes } = await admin
    .from('miembros')
    .select('nombres, apellidos, cedula, telefono, direccion, ciudad_id')
    .eq('id', miembroId)
    .maybeSingle()

  // Cédula única, excluyendo al propio miembro.
  const { data: cedulaExiste } = await admin
```

Ubicar:

```ts
  const { error } = await admin
    .from('miembros')
    .update({ nombres, apellidos, cedula, telefono, direccion, ciudad_id })
    .eq('id', miembroId)
  if (error) return { error: `No se pudieron guardar los cambios: ${error.message}` }

  // Correo (vía Auth), sólo si cambió. El formato ya se validó arriba.
```

Reemplazar por:

```ts
  const { error } = await admin
    .from('miembros')
    .update({ nombres, apellidos, cedula, telefono, direccion, ciudad_id })
    .eq('id', miembroId)
  if (error) return { error: `No se pudieron guardar los cambios: ${error.message}` }

  await registrarActividad(admin, {
    actorId: actor.userId,
    accion: 'edicion',
    entidadId: miembroId,
    datosAnteriores: miembroAntes,
    datosNuevos: { nombres, apellidos, cedula, telefono, direccion, ciudad_id },
  })

  // Correo (vía Auth), sólo si cambió. El formato ya se validó arriba.
```

- [ ] **Step 5: Verificar tipos**

Run: `npx tsc --noEmit`
Expected: sin errores.

- [ ] **Step 6: Verificación manual**

Run: `pnpm dev`, entrar como `super_admin` o `empleado`.

1. Registrar un miembro nuevo desde `/admin/miembros/nuevo`.
2. Confirmar en Supabase (Table Editor → `bitacora_actividad`) que apareció una fila con `entidad = 'miembro'`, `accion = 'alta'`, `entidad_id` = el id del miembro recién creado, y `datos_nuevos` con nombres/apellidos/cédula/plan/precio.
3. Editar ese miembro (cambiar el teléfono) y confirmar una fila `accion = 'edicion'` con `datos_anteriores`/`datos_nuevos` reflejando el cambio.
4. Renovar su membresía y confirmar una fila `accion = 'renovacion'`.

Expected: las 3 acciones se completan con éxito (igual que antes de este cambio) y cada una deja su fila correspondiente en `bitacora_actividad`.

- [ ] **Step 7: Commit**

```bash
git add src/app/admin/miembros/actions.ts
git commit -m "feat: registrar bitacora de actividad en alta, edicion y renovacion de miembros"
```

---

## Task 5: Sección "Historial de actividad" en la ficha del miembro

**Files:**
- Modify: `src/app/admin/miembros/[id]/page.tsx`

**Interfaces:**
- Consumes: `resumirEventoBitacora` (Task 2).

- [ ] **Step 1: Escribir el archivo completo con la nueva sección**

El archivo completo queda así (agrega el import, la consulta a `bitacora_actividad` dentro del `Promise.all` existente, la resolución de correos de los actores, y la sección "Historial de actividad" entre "Historial de membresías" y el formulario de renovación):

```tsx
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { requireRol } from '@/lib/auth'
import { createAdminClient } from '@/lib/supabase/admin'
import { resumirEventoBitacora } from '@/lib/bitacora'
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

      <h2 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '0.75rem' }}>Historial de actividad</h2>
      {!eventos || eventos.length === 0 ? (
        <div className="orum-card" style={{ marginBottom: '1.25rem' }}>
          <p className="orum-muted">Aún no hay eventos registrados para este miembro.</p>
        </div>
      ) : (
        <div className="orum-card" style={{ overflowX: 'auto', padding: 0, marginBottom: '1.25rem' }}>
          <table className="orum-table">
            <thead>
              <tr><th>Fecha</th><th>Acción</th><th>Detalle</th><th>Registrado por</th></tr>
            </thead>
            <tbody>
              {eventos.map((e) => (
                <tr key={e.id}>
                  <td>{new Date(e.fecha_hora).toLocaleString('es-CO')}</td>
                  <td><span className="orum-badge orum-badge--on">{e.accion}</span></td>
                  <td>{resumirEventoBitacora(e.accion, e.datos_anteriores, e.datos_nuevos)}</td>
                  <td className="orum-muted">{e.actor_id ? (correoActor.get(e.actor_id) ?? '—') : '—'}</td>
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

- [ ] **Step 2: Verificar tipos**

Run: `npx tsc --noEmit`
Expected: sin errores.

- [ ] **Step 3: Verificación manual**

Run: `pnpm dev`, abrir la ficha del miembro editado/renovado en Task 4 (`/admin/miembros/[id]`).
Expected: aparece la sección "Historial de actividad" debajo de "Historial de membresías", mostrando las filas de alta/edición/renovación en orden cronológico descendente, con el texto de `resumirEventoBitacora` y el correo de quien hizo cada cambio.

- [ ] **Step 4: Commit**

```bash
git add "src/app/admin/miembros/[id]/page.tsx"
git commit -m "feat: seccion de historial de actividad en la ficha del miembro"
```

---

## Task 6: Listado global `/admin/bitacora`

**Files:**
- Create: `src/app/admin/bitacora/page.tsx`

**Interfaces:**
- Consumes: `resumirEventoBitacora` (Task 2).

- [ ] **Step 1: Crear la página**

Crear `src/app/admin/bitacora/page.tsx`:

```tsx
import Link from 'next/link'
import { requireRol } from '@/lib/auth'
import { createAdminClient } from '@/lib/supabase/admin'
import { resumirEventoBitacora } from '@/lib/bitacora'

export const metadata = { title: 'Bitácora · ORUM' }

export default async function BitacoraPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; desde?: string; hasta?: string; accion?: string }>
}) {
  await requireRol('super_admin')
  const { q, desde, hasta, accion } = await searchParams
  const busqueda = (q ?? '').trim()

  const admin = createAdminClient()

  // Si hay búsqueda por miembro, primero resolvemos qué miembros calzan.
  let miembroIds: number[] | null = null
  if (busqueda) {
    const { data: miembrosCoincidentes } = await admin
      .from('miembros')
      .select('id')
      .is('deleted_at', null)
      .or(
        `nombres.ilike.%${busqueda}%,apellidos.ilike.%${busqueda}%,cedula.ilike.%${busqueda}%,numero_membresia.ilike.%${busqueda}%`,
      )
    miembroIds = (miembrosCoincidentes ?? []).map((m) => m.id)
  }

  let query = admin
    .from('bitacora_actividad')
    .select('id, actor_id, entidad_id, accion, datos_anteriores, datos_nuevos, fecha_hora')
    .eq('entidad', 'miembro')
    .order('fecha_hora', { ascending: false })

  if (miembroIds) query = query.in('entidad_id', miembroIds.length > 0 ? miembroIds : [-1])
  if (desde) query = query.gte('fecha_hora', `${desde} 00:00:00`)
  if (hasta) query = query.lte('fecha_hora', `${hasta} 23:59:59`)
  if (accion) query = query.eq('accion', accion)

  const { data: eventos } = await query

  const idsMiembros = Array.from(
    new Set((eventos ?? []).map((e) => e.entidad_id).filter((idMiembro): idMiembro is number => idMiembro !== null)),
  )
  const { data: miembrosInfo } =
    idsMiembros.length > 0
      ? await admin.from('miembros').select('id, nombres, apellidos').in('id', idsMiembros)
      : { data: [] as { id: number; nombres: string; apellidos: string }[] }
  const nombreMiembro = new Map((miembrosInfo ?? []).map((m) => [m.id, `${m.nombres} ${m.apellidos}`.trim()]))

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

  return (
    <div>
      <h1 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '1.25rem' }}>Bitácora de actividad</h1>

      <form
        method="get"
        className="orum-card"
        style={{ marginBottom: '1.25rem', display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}
      >
        <input
          type="text"
          name="q"
          className="orum-input"
          placeholder="Buscar miembro (nombre, cédula, número)…"
          defaultValue={busqueda}
          style={{ flex: 2, minWidth: 220 }}
        />
        <input type="date" name="desde" className="orum-input" defaultValue={desde ?? ''} style={{ flex: 1, minWidth: 140 }} />
        <input type="date" name="hasta" className="orum-input" defaultValue={hasta ?? ''} style={{ flex: 1, minWidth: 140 }} />
        <select name="accion" className="orum-select" defaultValue={accion ?? ''} style={{ flex: 1, minWidth: 140 }}>
          <option value="">Todas las acciones</option>
          <option value="alta">Alta</option>
          <option value="edicion">Edición</option>
          <option value="renovacion">Renovación</option>
        </select>
        <button type="submit" className="orum-button orum-button--secondary">Filtrar</button>
      </form>

      {!eventos || eventos.length === 0 ? (
        <div className="orum-card">
          <p className="orum-muted">No hay eventos que coincidan con los filtros.</p>
        </div>
      ) : (
        <div className="orum-card" style={{ overflowX: 'auto', padding: 0 }}>
          <table className="orum-table">
            <thead>
              <tr><th>Fecha</th><th>Miembro</th><th>Acción</th><th>Detalle</th><th>Registrado por</th></tr>
            </thead>
            <tbody>
              {eventos.map((e) => (
                <tr key={e.id}>
                  <td>{new Date(e.fecha_hora).toLocaleString('es-CO')}</td>
                  <td>
                    {e.entidad_id ? (
                      <Link href={`/admin/miembros/${e.entidad_id}`}>
                        {nombreMiembro.get(e.entidad_id) ?? `Miembro #${e.entidad_id}`}
                      </Link>
                    ) : (
                      '—'
                    )}
                  </td>
                  <td><span className="orum-badge orum-badge--on">{e.accion}</span></td>
                  <td>{resumirEventoBitacora(e.accion, e.datos_anteriores, e.datos_nuevos)}</td>
                  <td className="orum-muted">{e.actor_id ? (correoActor.get(e.actor_id) ?? '—') : '—'}</td>
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

- [ ] **Step 3: Verificación manual**

Run: `pnpm dev`, entrar como `super_admin`, navegar a `http://localhost:3000/admin/bitacora`.
Expected: lista los eventos generados en Task 4, con el nombre del miembro enlazando a su ficha. Probar el filtro `q` con el nombre/cédula del miembro, el filtro de fechas (`desde`/`hasta`) y el filtro `accion`, combinados y por separado. Probar también con un usuario `empleado`: debe rechazar el acceso (redirige a `/login?error=sin_permiso`).

- [ ] **Step 4: Commit**

```bash
git add src/app/admin/bitacora/page.tsx
git commit -m "feat: listado global de bitacora de actividad"
```

---

## Task 7: Dashboard `/admin/metricas`

**Files:**
- Create: `src/app/admin/metricas/page.tsx`

**Interfaces:**
- Consumes: `rangoUltimosDias`, `agruparMembresiasPorEmpleado`, `agruparVentasPorComercio`, `agruparVentasPorMiembroYComercio` (Task 3).

- [ ] **Step 1: Crear la página**

Crear `src/app/admin/metricas/page.tsx`:

```tsx
import { requireRol } from '@/lib/auth'
import { createAdminClient } from '@/lib/supabase/admin'
import {
  rangoUltimosDias,
  agruparMembresiasPorEmpleado,
  agruparVentasPorComercio,
  agruparVentasPorMiembroYComercio,
} from '@/lib/metricas'

export const metadata = { title: 'Métricas · ORUM' }

export default async function MetricasPage({
  searchParams,
}: {
  searchParams: Promise<{ desde?: string; hasta?: string }>
}) {
  await requireRol('super_admin')
  const { desde: desdeParam, hasta: hastaParam } = await searchParams
  const defecto = rangoUltimosDias(30)
  const desde = desdeParam || defecto.desde
  const hasta = hastaParam || defecto.hasta

  const admin = createAdminClient()

  const [
    { data: miembrosNuevos },
    { data: membresiasVendidas },
    { data: empleados },
    { data: ventas },
    { data: sucursales },
    { data: comercios },
    { data: miembros },
  ] = await Promise.all([
    admin
      .from('miembros')
      .select('id')
      .gte('fecha_registro', `${desde} 00:00:00`)
      .lte('fecha_registro', `${hasta} 23:59:59`),
    admin.from('membresias').select('vendido_por, precio_pagado').gte('fecha_inicio', desde).lte('fecha_inicio', hasta),
    admin.from('empleados').select('id, nombres, apellidos').is('deleted_at', null),
    admin
      .from('ventas')
      .select('sucursal_id, miembro_id, valor_final, valor_descuento')
      .gte('fecha_hora', `${desde} 00:00:00`)
      .lte('fecha_hora', `${hasta} 23:59:59`),
    admin.from('sucursales').select('id, comercio_id'),
    admin.from('comercios').select('id, nombre'),
    admin.from('miembros').select('id, nombres, apellidos'),
  ])

  const porEmpleado = agruparMembresiasPorEmpleado(membresiasVendidas ?? [], empleados ?? [])
  const porComercio = agruparVentasPorComercio(ventas ?? [], sucursales ?? [], comercios ?? [])
  const porMiembroComercio = agruparVentasPorMiembroYComercio(ventas ?? [], sucursales ?? [], comercios ?? [], miembros ?? [])

  return (
    <div>
      <h1 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '1.25rem' }}>Métricas</h1>

      <form
        method="get"
        className="orum-card"
        style={{ marginBottom: '1.25rem', display: 'flex', gap: '0.75rem', alignItems: 'flex-end' }}
      >
        <div className="orum-field" style={{ marginBottom: 0 }}>
          <label className="orum-label" htmlFor="desde">Desde</label>
          <input id="desde" type="date" name="desde" className="orum-input" defaultValue={desde} />
        </div>
        <div className="orum-field" style={{ marginBottom: 0 }}>
          <label className="orum-label" htmlFor="hasta">Hasta</label>
          <input id="hasta" type="date" name="hasta" className="orum-input" defaultValue={hasta} />
        </div>
        <button type="submit" className="orum-button orum-button--secondary">Filtrar</button>
      </form>

      <div className="orum-card" style={{ marginBottom: '1.25rem' }}>
        <p className="orum-muted" style={{ marginBottom: '0.25rem' }}>Miembros nuevos en el periodo</p>
        <p style={{ fontSize: '2rem', fontWeight: 700 }}>{miembrosNuevos?.length ?? 0}</p>
      </div>

      <h2 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '0.75rem' }}>Membresías vendidas por empleado</h2>
      {porEmpleado.length === 0 ? (
        <div className="orum-card" style={{ marginBottom: '1.25rem' }}>
          <p className="orum-muted">No hay membresías vendidas en este periodo.</p>
        </div>
      ) : (
        <div className="orum-card" style={{ overflowX: 'auto', padding: 0, marginBottom: '1.25rem' }}>
          <table className="orum-table">
            <thead><tr><th>Empleado</th><th>Vendidas</th><th>Monto total</th></tr></thead>
            <tbody>
              {porEmpleado.map((r) => (
                <tr key={r.empleadoId ?? 'super_admin'}>
                  <td>{r.nombre}</td>
                  <td>{r.cantidad}</td>
                  <td>${r.monto.toLocaleString('es-CO')}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <h2 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '0.75rem' }}>Ventas por comercio</h2>
      {porComercio.length === 0 ? (
        <div className="orum-card" style={{ marginBottom: '1.25rem' }}>
          <p className="orum-muted">Aún no hay ventas registradas en este periodo.</p>
        </div>
      ) : (
        <div className="orum-card" style={{ overflowX: 'auto', padding: 0, marginBottom: '1.25rem' }}>
          <table className="orum-table">
            <thead><tr><th>Comercio</th><th># Ventas</th><th>Monto total</th><th>Descuento total</th></tr></thead>
            <tbody>
              {porComercio.map((r) => (
                <tr key={r.comercioId}>
                  <td>{r.nombre}</td>
                  <td>{r.cantidad}</td>
                  <td>${r.montoTotal.toLocaleString('es-CO')}</td>
                  <td>${r.descuentoTotal.toLocaleString('es-CO')}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <h2 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '0.75rem' }}>Uso de membresía por miembro y comercio</h2>
      {porMiembroComercio.length === 0 ? (
        <div className="orum-card">
          <p className="orum-muted">Aún no hay ventas registradas en este periodo.</p>
        </div>
      ) : (
        <div className="orum-card" style={{ overflowX: 'auto', padding: 0 }}>
          <table className="orum-table">
            <thead><tr><th>Miembro</th><th>Comercio</th><th>Veces usada</th></tr></thead>
            <tbody>
              {porMiembroComercio.map((r) => (
                <tr key={`${r.miembroId}-${r.comercioId}`}>
                  <td>{r.miembroNombre}</td>
                  <td>{r.comercioNombre}</td>
                  <td>{r.veces}</td>
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

- [ ] **Step 3: Verificación manual**

Run: `pnpm dev`, entrar como `super_admin`, navegar a `http://localhost:3000/admin/metricas`.
Expected: la tarjeta "Miembros nuevos" y la tabla "Membresías vendidas por empleado" muestran datos reales (contra los miembros/membresías ya creados en pruebas anteriores). "Ventas por comercio" y "Uso de membresía por miembro y comercio" muestran el mensaje de estado vacío (no hay ventas todavía). Cambiar el rango de fechas y confirmar que las cifras se recalculan. Probar con un usuario `empleado`: debe rechazar el acceso.

- [ ] **Step 4: Commit**

```bash
git add src/app/admin/metricas/page.tsx
git commit -m "feat: dashboard de metricas"
```

---

## Task 8: Nav — links "Bitácora" y "Métricas"

**Files:**
- Modify: `src/app/admin/layout.tsx`

- [ ] **Step 1: Agregar los links al menú**

Ubicar:

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

Reemplazar por:

```tsx
        <nav style={{ display: 'flex', gap: '1rem', flex: 1 }}>
          <Link href="/admin">Inicio</Link>
          <Link href="/admin/miembros">Miembros</Link>
          {esSuperAdmin && <Link href="/admin/comercios">Comercios</Link>}
          {esSuperAdmin && <Link href="/admin/usuarios">Usuarios</Link>}
          {esSuperAdmin && <Link href="/admin/planes">Planes</Link>}
          {esSuperAdmin && <Link href="/admin/bitacora">Bitácora</Link>}
          {esSuperAdmin && <Link href="/admin/metricas">Métricas</Link>}
          <Link href="/admin/cuenta/password">Mi contraseña</Link>
        </nav>
```

- [ ] **Step 2: Verificación manual**

Run: `pnpm dev`. Iniciar sesión como `super_admin`: confirmar que "Bitácora" y "Métricas" aparecen en el menú y llevan a las páginas correctas. Iniciar sesión como `empleado`: confirmar que esos dos links **no** aparecen.

- [ ] **Step 3: Commit**

```bash
git add src/app/admin/layout.tsx
git commit -m "feat: agregar Bitacora y Metricas al menu admin"
```

---

## Task 9: Verificación final y cierre de fase

**Files:**
- Modify: `docs/ROADMAP.md`

- [ ] **Step 1: Correr toda la suite de pruebas**

Run: `pnpm test`
Expected: todos los tests pasan, incluidos los nuevos de `bitacora.test.ts` y `metricas.test.ts`.

- [ ] **Step 2: Verificar tipos y build de producción**

Run: `npx tsc --noEmit`
Expected: sin errores.

Run: `pnpm build`
Expected: build exitoso sin errores.

- [ ] **Step 3: Repasar los criterios de aceptación del spec**

Contra `docs/superpowers/specs/2026-07-31-fase4-metricas-trazabilidad-design.md` sección 10, confirmar manualmente cada uno (ya cubiertos en las verificaciones manuales de Tasks 4-8):

- [ ] Alta/edición/renovación de un miembro generan su fila en `bitacora_actividad` sin bloquear la operación principal.
- [ ] La ficha del miembro muestra su historial de actividad en orden cronológico con texto legible.
- [ ] `/admin/bitacora` lista eventos de todos los miembros y los filtros funcionan combinados.
- [ ] `/admin/metricas` calcula correctamente miembros nuevos y membresías vendidas por empleado.
- [ ] `/admin/metricas` muestra estado vacío (no error) en las métricas de `ventas`.
- [ ] Un `empleado` no puede acceder a `/admin/bitacora` ni `/admin/metricas`.

- [ ] **Step 4: Actualizar el ROADMAP**

En `docs/ROADMAP.md`, cambiar el encabezado de la Fase 4 de `🔄` a `✅` y agregar un resumen de lo entregado, siguiendo el mismo formato usado para las Fases 2 y 3 (ver esas secciones como referencia). Actualizar también la tabla de RF (sección 5): marcar `RF-19` como `✅`. Actualizar la fecha de "Última actualización" al día en que se complete esta verificación.

- [ ] **Step 5: Commit**

```bash
git add docs/ROADMAP.md
git commit -m "docs: cerrar Fase 4 (metricas y trazabilidad) en el ROADMAP"
```
