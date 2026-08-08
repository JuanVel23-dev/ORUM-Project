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
