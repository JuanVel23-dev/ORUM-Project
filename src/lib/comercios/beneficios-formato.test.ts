import { describe, it, expect } from 'vitest'
import { formatearBeneficio } from './beneficios-formato'

describe('formatearBeneficio', () => {
  it('porcentaje', () => {
    expect(formatearBeneficio('porcentaje', 20)).toBe('20% de descuento')
  })

  it('monto_fijo', () => {
    expect(formatearBeneficio('monto_fijo', 15000)).toBe('$15.000 de descuento')
  })

  it('dos_por_uno', () => {
    expect(formatearBeneficio('dos_por_uno', null)).toBe('2x1')
  })

  it('regalo', () => {
    expect(formatearBeneficio('regalo', null)).toBe('Regalo')
  })
})
