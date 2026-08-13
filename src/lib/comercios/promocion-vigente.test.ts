import { describe, it, expect } from 'vitest'
import { esPromocionVigente } from './promocion-vigente'

describe('esPromocionVigente', () => {
  it('vigente: activa sin fechas límite', () => {
    expect(esPromocionVigente(true, null, null, '2026-08-12')).toBe(true)
  })

  it('no vigente: inactiva aunque las fechas sean válidas', () => {
    expect(esPromocionVigente(false, '2026-01-01', '2026-12-31', '2026-08-12')).toBe(false)
  })

  it('vigente: dentro del rango de fechas', () => {
    expect(esPromocionVigente(true, '2026-08-01', '2026-08-31', '2026-08-12')).toBe(true)
  })

  it('no vigente: antes de la fecha de inicio', () => {
    expect(esPromocionVigente(true, '2026-09-01', null, '2026-08-12')).toBe(false)
  })

  it('no vigente: después de la fecha de fin', () => {
    expect(esPromocionVigente(true, null, '2026-08-01', '2026-08-12')).toBe(false)
  })

  it('vigente: hoy es exactamente la fecha de fin', () => {
    expect(esPromocionVigente(true, null, '2026-08-12', '2026-08-12')).toBe(true)
  })
})
