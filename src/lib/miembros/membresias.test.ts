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
