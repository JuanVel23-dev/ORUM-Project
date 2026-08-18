import { describe, it, expect } from 'vitest'
import { inicioDiaBogota, finDiaBogota } from './fecha'

describe('inicioDiaBogota', () => {
  it('agrega el offset -05:00 al inicio del día', () => {
    expect(inicioDiaBogota('2026-08-12')).toBe('2026-08-12T00:00:00-05:00')
  })
})

describe('finDiaBogota', () => {
  it('agrega el offset -05:00 al final del día', () => {
    expect(finDiaBogota('2026-08-12')).toBe('2026-08-12T23:59:59.999-05:00')
  })

  it('una venta hecha a las 22:15 hora Bogotá cae dentro del rango de "hoy"', () => {
    // 2026-08-12T22:15:00-05:00 == 2026-08-13T03:15:00Z (el bug original comparaba
    // esto contra '2026-08-12 23:59:59' interpretado en UTC, y lo excluía).
    const ventaUTC = new Date('2026-08-13T03:15:45.499Z')
    const limiteSuperior = new Date(finDiaBogota('2026-08-12'))
    expect(ventaUTC.getTime()).toBeLessThanOrEqual(limiteSuperior.getTime())
  })
})
