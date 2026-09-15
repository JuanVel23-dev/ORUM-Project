import { describe, it, expect } from 'vitest'
import { formatearBeneficio, formatearBeneficioCorto } from './beneficios-formato'

describe('formatearBeneficio', () => {
  it('porcentaje', () => {
    expect(formatearBeneficio('porcentaje', 20)).toBe('20% de descuento')
  })

  it('porcentaje con valor null', () => {
    expect(formatearBeneficio('porcentaje', null)).toBe('0% de descuento')
  })

  it('monto_fijo', () => {
    expect(formatearBeneficio('monto_fijo', 15000)).toBe('$15.000 de descuento')
  })

  it('monto_fijo con valor null', () => {
    expect(formatearBeneficio('monto_fijo', null)).toBe('$0 de descuento')
  })

  it('dos_por_uno', () => {
    expect(formatearBeneficio('dos_por_uno', null)).toBe('2x1')
  })

  it('regalo', () => {
    expect(formatearBeneficio('regalo', null)).toBe('Regalo')
  })
})

describe('formatearBeneficioCorto', () => {
  it('deja la cifra sola: el contexto de la tarjeta dice el resto', () => {
    expect(formatearBeneficioCorto('porcentaje', 20)).toBe('20%')
  })

  it('agrupa los miles en formato colombiano, sin la frase', () => {
    expect(formatearBeneficioCorto('monto_fijo', 50000)).toBe('$50.000')
  })

  it('los beneficios que ya eran cortos no cambian', () => {
    expect(formatearBeneficioCorto('dos_por_uno', null)).toBe('2x1')
    expect(formatearBeneficioCorto('regalo', null)).toBe('Regalo')
  })

  it('un valor nulo no imprime «null»', () => {
    expect(formatearBeneficioCorto('porcentaje', null)).toBe('0%')
    expect(formatearBeneficioCorto('monto_fijo', null)).toBe('$0')
  })
})
