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
