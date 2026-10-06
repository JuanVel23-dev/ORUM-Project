import { describe, it, expect } from 'vitest'
import { inicioDiaBogota, finDiaBogota, horaBogota, saludoPorHora, sumarDiasISO } from './fecha'

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

describe('sumarDiasISO', () => {
  it('suma días dentro del mismo mes', () => {
    expect(sumarDiasISO('2026-10-04', 30)).toBe('2026-11-03')
  })

  it('cruza fin de año y años bisiestos', () => {
    expect(sumarDiasISO('2026-12-20', 15)).toBe('2027-01-04')
    expect(sumarDiasISO('2028-02-28', 1)).toBe('2028-02-29')
  })

  it('resta con días negativos', () => {
    expect(sumarDiasISO('2026-03-01', -1)).toBe('2026-02-28')
  })
})

describe('horaBogota', () => {
  it('lee la hora en Bogotá, no en UTC', () => {
    // 03:15 UTC son las 22:15 del día anterior en Bogotá.
    expect(horaBogota(new Date('2026-08-13T03:15:00Z'))).toBe(22)
    expect(horaBogota(new Date('2026-08-13T05:00:00Z'))).toBe(0)
  })
})

describe('saludoPorHora', () => {
  it('cambia en las 5, las 12 y las 19', () => {
    expect(saludoPorHora(4)).toBe('Buenas noches')
    expect(saludoPorHora(5)).toBe('Buenos días')
    expect(saludoPorHora(11)).toBe('Buenos días')
    expect(saludoPorHora(12)).toBe('Buenas tardes')
    expect(saludoPorHora(18)).toBe('Buenas tardes')
    expect(saludoPorHora(19)).toBe('Buenas noches')
  })
})
