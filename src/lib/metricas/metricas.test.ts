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
    // 15:00Z = 10:00 en America/Bogota (UTC-5), mismo día calendario en ambas
    // zonas horarias — evita ambigüedad de límite de día en la aserción.
    const rango = rangoUltimosDias(10, new Date('2026-01-05T15:00:00Z'))
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
