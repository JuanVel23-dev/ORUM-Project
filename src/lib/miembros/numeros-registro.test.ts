import { describe, it, expect } from 'vitest'
import {
  expandirRango,
  esNumeroRegistroValido,
  MAX_NUMEROS_POR_CARGA,
} from './numeros-registro'

describe('esNumeroRegistroValido', () => {
  it('acepta exactamente 8 dígitos', () => {
    expect(esNumeroRegistroValido('00000042')).toBe(true)
  })

  it('rechaza menos de 8 dígitos', () => {
    expect(esNumeroRegistroValido('42')).toBe(false)
  })

  it('rechaza más de 8 dígitos', () => {
    expect(esNumeroRegistroValido('000000042')).toBe(false)
  })

  it('rechaza letras o guiones', () => {
    expect(esNumeroRegistroValido('ORUM-042')).toBe(false)
  })
})

describe('expandirRango', () => {
  it('expande un rango pequeño, con relleno a 8 dígitos', () => {
    expect(expandirRango('00000001', '00000004')).toEqual({
      ok: true,
      numeros: ['00000001', '00000002', '00000003', '00000004'],
    })
  })

  it('un rango de un solo número devuelve ese número', () => {
    expect(expandirRango('00000500', '00000500')).toEqual({
      ok: true,
      numeros: ['00000500'],
    })
  })

  it('no se deja engañar por los ceros a la izquierda (base 10, no octal)', () => {
    expect(expandirRango('00000008', '00000010')).toEqual({
      ok: true,
      numeros: ['00000008', '00000009', '00000010'],
    })
  })

  it('rechaza un extremo que no tiene 8 dígitos', () => {
    const r = expandirRango('1', '00000010')
    expect(r.ok).toBe(false)
  })

  it('rechaza cuando el inicio es mayor que el fin', () => {
    const r = expandirRango('00000010', '00000001')
    expect(r.ok).toBe(false)
  })

  it('rechaza un rango que supera el tope por carga', () => {
    const r = expandirRango('00000001', String(MAX_NUMEROS_POR_CARGA + 2).padStart(8, '0'))
    expect(r.ok).toBe(false)
  })

  it('acepta un rango que llega justo al tope', () => {
    const r = expandirRango('00000001', String(MAX_NUMEROS_POR_CARGA).padStart(8, '0'))
    expect(r.ok).toBe(true)
    if (r.ok) expect(r.numeros).toHaveLength(MAX_NUMEROS_POR_CARGA)
  })
})
