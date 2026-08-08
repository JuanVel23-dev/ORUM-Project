# Reorganización — Paso 6: Bitácora y Métricas con el kit — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Migrate `bitacora` and `metricas` to the `src/components/ui/` kit. Spec §7 step 6.

**Architecture:** Unlike every module migrated so far, these two routes have **no `*-form.tsx` to move** — each is a single `page.tsx` with a read-only filter form and one or more tables. Only the JSX inside each `page.tsx` changes, adopting `PageHeader`, `DataTable`, `EmptyState`, and `Badge` for visual consistency with the rest of the admin, per spec §7 step 6: "estas páginas no tienen `_components` que mover... pero sí adoptan el kit."

**Tech Stack:** Next.js 16 (App Router, Server Components), TypeScript, React 19, pnpm.

## Global Constraints

- **Zero visual/behavioral change**, same as every prior step.
- Depends on Pasos 3-5 already being applied (kit exists; `comercios`, `miembros`, `planes`, `usuarios`, `cuenta` already migrated).
- **The filter forms in both pages are NOT `SearchForm`.** `SearchForm` models one specific pattern: a single text input + "Buscar" button. Both `bitacora` (text + 2 dates + a select, `flexWrap: 'wrap'`) and `metricas` (2 dates with `alignItems: 'flex-end'` and per-field `marginBottom: 0` overrides) are richer, module-specific filter forms — forcing them into `SearchForm` would require bolting on unrelated fields/props. Left inline, same reasoning as `comercios`/`miembros` one-off blocks that don't cleanly fit a kit component (spec §9).
- Plain `<Link href=.../>` with no `className` (e.g. the member name link in the bitácora table) is **not** `LinkButton` — `LinkButton` always applies `orum-button` classes, which would visually turn a plain text link into a button. Left as a plain `Link`.
- No automated UI tests exist (spec §8) — verification per task is `tsc --noEmit` + `pnpm lint` + `pnpm build`, plus your manual visual check.
- **Single commit policy:** this whole reorganization lands as one commit at the very end — do not commit after this plan or after any task in it.

---

### Task 1: Migrate `bitacora/page.tsx`

**Files:**
- Modify: `src/app/admin/bitacora/page.tsx`

**Interfaces:**
- Consumes: `Badge`, `DataTable`, `EmptyState`, `PageHeader` from `@/components/ui`.
- **`PageHeader` decision:** the page's `<h1 style={{fontSize:'1.5rem',fontWeight:700,marginBottom:'1.25rem'}}>` has no action and no back-link — exact match for `PageHeader`'s `h1` default. Uses `PageHeader`.

- [ ] **Step 1: Rewrite `src/app/admin/bitacora/page.tsx` to use the kit**

Replace the full file with:

```tsx
import Link from 'next/link'
import { requireRol } from '@/lib/auth/auth'
import { createAdminClient } from '@/lib/supabase/admin'
import { resumirEventoBitacora } from '@/lib/bitacora/bitacora'
import { Badge, DataTable, EmptyState, PageHeader } from '@/components/ui'

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

  // Sanear caracteres especiales de PostgREST (comas, paréntesis y comodines)
  // para que una búsqueda con puntuación —p. ej. "Pérez, Juan"— no rompa la consulta.
  const termino = busqueda.replace(/[,()%*\\]/g, ' ').trim()

  // Si hay búsqueda por miembro, primero resolvemos qué miembros calzan.
  let miembroIds: number[] | null = null
  if (termino) {
    const { data: miembrosCoincidentes } = await admin
      .from('miembros')
      .select('id')
      .is('deleted_at', null)
      .or(
        `nombres.ilike.%${termino}%,apellidos.ilike.%${termino}%,cedula.ilike.%${termino}%,numero_membresia.ilike.%${termino}%`,
      )
      .limit(100)
    miembroIds = (miembrosCoincidentes ?? []).map((m) => m.id)
  }

  let query = admin
    .from('bitacora_actividad')
    .select('id, actor_id, entidad_id, accion, datos_anteriores, datos_nuevos, fecha_hora')
    .eq('entidad', 'miembro')
    .order('fecha_hora', { ascending: false })
    .limit(200)

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
      <PageHeader title="Bitácora de actividad" />

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
        <EmptyState>
          {busqueda || desde || hasta || accion
            ? 'Ningún evento coincide con los filtros aplicados.'
            : 'Aún no hay eventos registrados.'}
        </EmptyState>
      ) : (
        <DataTable>
          <thead>
            <tr><th>Fecha</th><th>Miembro</th><th>Acción</th><th>Detalle</th><th>Registrado por</th></tr>
          </thead>
          <tbody>
            {eventos.map((e) => (
              <tr key={e.id}>
                <td>{new Date(e.fecha_hora).toLocaleString('es-CO', { timeZone: 'America/Bogota' })}</td>
                <td>
                  {e.entidad_id ? (
                    <Link href={`/admin/miembros/${e.entidad_id}`}>
                      {nombreMiembro.get(e.entidad_id) ?? `Miembro #${e.entidad_id}`}
                    </Link>
                  ) : (
                    '—'
                  )}
                </td>
                <td><Badge tone="on">{e.accion}</Badge></td>
                <td>{resumirEventoBitacora(e.accion, e.datos_anteriores, e.datos_nuevos)}</td>
                <td className="orum-muted">{e.actor_id ? (correoActor.get(e.actor_id) ?? '—') : '—'}</td>
              </tr>
            ))}
          </tbody>
        </DataTable>
      )}
    </div>
  )
}
```

- [ ] **Step 2: Verify**

```bash
pnpm exec tsc --noEmit
pnpm lint
pnpm build
```

- [ ] **Step 3: Manual visual check**

`/admin/bitacora` — filter by search text, date range, and acción; confirm the member name still links to `/admin/miembros/[id]` as a plain text link (not a button).

Do not commit yet — see "Single commit policy" in Global Constraints.

---

### Task 2: Migrate `metricas/page.tsx`

**Files:**
- Modify: `src/app/admin/metricas/page.tsx`

**Interfaces:**
- Consumes: `DataTable`, `EmptyState`, `PageHeader` from `@/components/ui`.
- **`PageHeader` decision:** page title and both section `h2`s are plain, no-action, standard-margin headings — all use `PageHeader` (`h1` for the page title, `as="h2"` for each of the three section headers).

- [ ] **Step 1: Rewrite `src/app/admin/metricas/page.tsx` to use the kit**

Replace the full file with:

```tsx
import { requireRol } from '@/lib/auth/auth'
import { createAdminClient } from '@/lib/supabase/admin'
import {
  rangoUltimosDias,
  agruparMembresiasPorEmpleado,
  agruparVentasPorComercio,
  agruparVentasPorMiembroYComercio,
} from '@/lib/metricas/metricas'
import { DataTable, EmptyState, PageHeader } from '@/components/ui'

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
    { count: miembrosNuevosCount },
    { data: membresiasVendidas },
    { data: empleados },
    { data: ventas },
    { data: sucursales },
    { data: comercios },
    { data: miembros },
  ] = await Promise.all([
    admin
      .from('miembros')
      .select('id', { count: 'exact', head: true })
      .is('deleted_at', null)
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
    admin.from('miembros').select('id, nombres, apellidos').is('deleted_at', null),
  ])

  const porEmpleado = agruparMembresiasPorEmpleado(membresiasVendidas ?? [], empleados ?? [])
  const porComercio = agruparVentasPorComercio(ventas ?? [], sucursales ?? [], comercios ?? [])
  const porMiembroComercio = agruparVentasPorMiembroYComercio(ventas ?? [], sucursales ?? [], comercios ?? [], miembros ?? [])

  return (
    <div>
      <PageHeader title="Métricas" />

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
        <p style={{ fontSize: '2rem', fontWeight: 700 }}>{miembrosNuevosCount ?? 0}</p>
      </div>

      <PageHeader as="h2" title="Membresías vendidas por empleado" />
      {porEmpleado.length === 0 ? (
        <EmptyState marginBottom="1.25rem">No hay membresías vendidas en este periodo.</EmptyState>
      ) : (
        <DataTable marginBottom="1.25rem">
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
        </DataTable>
      )}

      <PageHeader as="h2" title="Ventas por comercio" />
      {porComercio.length === 0 ? (
        <EmptyState marginBottom="1.25rem">Aún no hay ventas registradas en este periodo.</EmptyState>
      ) : (
        <DataTable marginBottom="1.25rem">
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
        </DataTable>
      )}

      <PageHeader as="h2" title="Uso de membresía por miembro y comercio" />
      {porMiembroComercio.length === 0 ? (
        <EmptyState>Aún no hay ventas registradas en este periodo.</EmptyState>
      ) : (
        <DataTable>
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
        </DataTable>
      )}
    </div>
  )
}
```

- [ ] **Step 2: Verify**

```bash
pnpm exec tsc --noEmit
pnpm lint
pnpm build
```

- [ ] **Step 3: Manual visual check**

`/admin/metricas` with the default 30-day range and with a custom `desde`/`hasta` range; confirm all three tables (and their empty states, if the period has no data).

Do not commit yet — see "Single commit policy" in Global Constraints.

---

## Acceptance check (maps to spec §10)

- [ ] `bitacora` and `metricas` use the kit (`PageHeader`, `DataTable`, `EmptyState`) per spec §10's explicit checklist item, even though neither had files to reorganize.
- [ ] `tsc --noEmit`, `pnpm lint`, and `pnpm build` pass clean after every task.
- [ ] User has visually confirmed both pages look and function identically to before.

## Next steps

Plan for `admin/layout.tsx` (spec §7 step 7, the final step) is not written yet — write it next. After that, spec §10's full acceptance checklist can be run end-to-end and the single final commit made.
