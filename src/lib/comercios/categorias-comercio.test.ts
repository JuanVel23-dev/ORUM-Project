import { describe, expect, it } from 'vitest'
import {
  leerFilasCategoria,
  revisarFilasCategoria,
  type FilaCategoriaComercio,
} from './categorias-comercio'

const fila = (categoriaId: number, subcategoriaId: number | null = null): FilaCategoriaComercio => ({
  categoriaId,
  subcategoriaId,
})

describe('revisarFilasCategoria', () => {
  const sinSubcategorias = new Map<number, number>()

  it('exige al menos una categoría', () => {
    expect(revisarFilasCategoria([], sinSubcategorias)).toBe('Elige al menos una categoría.')
  })

  it('no admite más de 3 categorías', () => {
    expect(
      revisarFilasCategoria([fila(1), fila(2), fila(3), fila(4)], sinSubcategorias),
    ).toBe('Un comercio puede tener hasta 3 categorías.')
  })

  it('no admite una categoría repetida', () => {
    expect(revisarFilasCategoria([fila(1), fila(1)], sinSubcategorias)).toBe(
      'No repitas la misma categoría.',
    )
  })

  it('rechaza un id que no es válido', () => {
    expect(revisarFilasCategoria([fila(NaN)], sinSubcategorias)).toBe(
      'Una de las categorías no es válida.',
    )
  })

  it('rechaza una subcategoría de otra categoría', () => {
    expect(revisarFilasCategoria([fila(1, 9)], new Map([[9, 2]]))).toBe(
      'La subcategoría no pertenece a la categoría elegida.',
    )
  })

  it('rechaza una subcategoría que no existe', () => {
    expect(revisarFilasCategoria([fila(1, 9)], sinSubcategorias)).toBe(
      'La subcategoría no pertenece a la categoría elegida.',
    )
  })

  it('acepta una subcategoría de su categoría', () => {
    expect(revisarFilasCategoria([fila(1, 9)], new Map([[9, 1]]))).toBeNull()
  })

  it('acepta tres categorías, una sin subcategoría', () => {
    expect(
      revisarFilasCategoria([fila(1, 9), fila(2), fila(3, 7)], new Map([[9, 1], [7, 3]])),
    ).toBeNull()
  })
})

describe('leerFilasCategoria', () => {
  it('empareja por posición y descarta las filas sin categoría', () => {
    expect(leerFilasCategoria(['1', '', '2'], ['4', '5', ''])).toEqual([
      fila(1, 4),
      fila(2, null),
    ])
  })

  it('marca como inválida una fila cuyo id no es un entero positivo', () => {
    const filas = leerFilasCategoria(['abc', '-3', '1.5'], ['', '', ''])
    expect(filas).toHaveLength(3)
    expect(filas.every((f) => Number.isNaN(f.categoriaId))).toBe(true)
  })

  it('una subcategoría ilegible se trata como inválida y no como ausente', () => {
    const [f] = leerFilasCategoria(['2'], ['xx'])
    expect(f.categoriaId).toBe(2)
    expect(Number.isNaN(f.subcategoriaId)).toBe(true)
  })

  it('devuelve una fila con subcategoría ausente cuando falta el segundo arreglo', () => {
    expect(leerFilasCategoria(['2'], [])).toEqual([fila(2, null)])
  })
})
