import { describe, it, expect } from 'vitest'
import { validarValorPromocion } from './promociones'

describe('validarValorPromocion — porcentaje', () => {
  it('acepta un porcentaje válido', () => {
    expect(validarValorPromocion('porcentaje', 20)).toEqual({ ok: true })
  })

  it('acepta exactamente 100', () => {
    expect(validarValorPromocion('porcentaje', 100)).toEqual({ ok: true })
  })

  it('rechaza sin valor', () => {
    expect(validarValorPromocion('porcentaje', null).ok).toBe(false)
  })

  it('rechaza 0', () => {
    expect(validarValorPromocion('porcentaje', 0).ok).toBe(false)
  })

  it('rechaza más de 100', () => {
    expect(validarValorPromocion('porcentaje', 100.01).ok).toBe(false)
  })

  it('rechaza negativos', () => {
    expect(validarValorPromocion('porcentaje', -5).ok).toBe(false)
  })
})

describe('validarValorPromocion — monto_fijo', () => {
  it('acepta un monto positivo', () => {
    expect(validarValorPromocion('monto_fijo', 15000)).toEqual({ ok: true })
  })

  it('rechaza sin valor', () => {
    expect(validarValorPromocion('monto_fijo', null).ok).toBe(false)
  })

  it('rechaza 0', () => {
    expect(validarValorPromocion('monto_fijo', 0).ok).toBe(false)
  })

  it('rechaza negativos', () => {
    expect(validarValorPromocion('monto_fijo', -1).ok).toBe(false)
  })
})

describe('validarValorPromocion — dos_por_uno y regalo', () => {
  it('acepta dos_por_uno sin valor', () => {
    expect(validarValorPromocion('dos_por_uno', null)).toEqual({ ok: true })
  })

  it('acepta regalo sin valor', () => {
    expect(validarValorPromocion('regalo', null)).toEqual({ ok: true })
  })

  it('rechaza dos_por_uno con valor', () => {
    expect(validarValorPromocion('dos_por_uno', 10).ok).toBe(false)
  })

  it('rechaza regalo con valor', () => {
    expect(validarValorPromocion('regalo', 1).ok).toBe(false)
  })
})
