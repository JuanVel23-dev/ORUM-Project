import { describe, expect, it } from 'vitest'
import { buscarCategorias, repartirTira } from './tira-categorias'

const opcion = (id: number | null, nombre: string, activa = false) => ({ id, nombre, activa })

const lista = (n: number, activas: number[] = []) => [
  opcion(null, 'Todas', activas.length === 0),
  ...Array.from({ length: n }, (_, i) => opcion(i + 1, `Categoría ${i + 1}`, activas.includes(i + 1))),
]

describe('repartirTira', () => {
  it('con pocas categorías salen todas y no queda ninguna fuera', () => {
    const { visibles, ocultas } = repartirTira(lista(15), 24)
    expect(visibles).toHaveLength(16)
    expect(ocultas).toBe(0)
  })

  it('corta en el límite, sin contar «Todas»', () => {
    const { visibles, ocultas } = repartirTira(lista(40), 24)
    expect(visibles).toHaveLength(25)
    expect(visibles[0].id).toBeNull()
    expect(visibles.at(-1)?.id).toBe(24)
    expect(ocultas).toBe(16)
  })

  it('una elegida que cae tras el corte sigue a la vista', () => {
    const { visibles, ocultas } = repartirTira(lista(40, [33]), 24)
    expect(visibles.map((o) => o.id)).toContain(33)
    expect(ocultas).toBe(15)
  })
})

describe('buscarCategorias', () => {
  const opciones = [
    opcion(null, 'Todas'),
    opcion(1, 'Salud y Belleza'),
    opcion(2, 'Cafés'),
    opcion(3, 'Educación'),
  ]

  it('vacía o en blanco devuelve todas, con «Todas»', () => {
    expect(buscarCategorias(opciones, '')).toHaveLength(4)
    expect(buscarCategorias(opciones, '   ')).toHaveLength(4)
  })

  it('no distingue mayúsculas ni tildes', () => {
    expect(buscarCategorias(opciones, 'CAFE').map((o) => o.id)).toEqual([2])
    expect(buscarCategorias(opciones, 'educacion').map((o) => o.id)).toEqual([3])
  })

  it('cada palabra tiene que aparecer', () => {
    expect(buscarCategorias(opciones, 'salud bell').map((o) => o.id)).toEqual([1])
    expect(buscarCategorias(opciones, 'salud cafe')).toEqual([])
  })

  it('buscando, «Todas» no sale', () => {
    expect(buscarCategorias(opciones, 'tod')).toEqual([])
  })
})
