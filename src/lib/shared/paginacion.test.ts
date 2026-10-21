import { describe, expect, it } from 'vitest'
import { rangoDePagina } from './paginacion'

describe('rangoDePagina', () => {
  it('página 1', () => {
    expect(rangoDePagina(60, 1)).toMatchObject({ pagina: 1, paginas: 3, inicio: 0, fin: 24, desde: 1, hasta: 25 })
  })
  it('página intermedia', () => {
    expect(rangoDePagina(60, 2)).toMatchObject({ pagina: 2, inicio: 25, fin: 49, desde: 26, hasta: 50 })
  })
  it('última página parcial', () => {
    expect(rangoDePagina(60, 3)).toMatchObject({ pagina: 3, inicio: 50, desde: 51, hasta: 60 })
  })
  it('pasada del final: última', () => {
    expect(rangoDePagina(60, 99).pagina).toBe(3)
  })
  it('cero, negativa y NaN: primera', () => {
    expect(rangoDePagina(60, 0).pagina).toBe(1)
    expect(rangoDePagina(60, -4).pagina).toBe(1)
    expect(rangoDePagina(60, Number.NaN).pagina).toBe(1)
  })
  it('total 0', () => {
    expect(rangoDePagina(0, 5)).toMatchObject({ pagina: 1, paginas: 1, desde: 0, hasta: 0 })
  })
})
