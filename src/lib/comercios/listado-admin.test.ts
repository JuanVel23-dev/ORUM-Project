import { describe, expect, it } from 'vitest'
import {
  contarPorPestanaComercio,
  filtrarComercios,
  leerPestanaComercio,
  type FilaComercio,
} from './listado-admin'

const fila = (f: Partial<FilaComercio>): FilaComercio => ({
  id: 1,
  nombre: 'Café Arábigo',
  logoUrl: null,
  categoriaId: 1,
  categoria: 'Cafés',
  activo: true,
  sucursales: 1,
  promociones: 1,
  ...f,
})

const FILAS = [
  fila({ id: 1 }),
  fila({ id: 2, nombre: 'Heladería Polo', categoriaId: 2, categoria: 'Heladerías', promociones: 0 }),
  fila({ id: 3, nombre: 'Asadero', categoriaId: 3, categoria: 'Restaurantes', activo: false }),
]

describe('lista de comercios del panel', () => {
  it('lee la pestaña y cae a «todos» si no la conoce', () => {
    expect(leerPestanaComercio('inactivos')).toBe('inactivos')
    expect(leerPestanaComercio('otra')).toBe('todos')
    expect(leerPestanaComercio(undefined)).toBe('todos')
  })

  it('cuenta por pestaña; «sin promociones» solo entre los activos', () => {
    expect(contarPorPestanaComercio(FILAS)).toEqual({
      todos: 3,
      activos: 2,
      'sin-promociones': 1,
      inactivos: 1,
    })
  })

  it('busca sin tildes, filtra por categoría y ordena por nombre', () => {
    const base = { pestana: 'todos' as const, categoriaId: null }
    expect(filtrarComercios(FILAS, { ...base, busqueda: 'cafe' }).map((f) => f.id)).toEqual([1])
    expect(filtrarComercios(FILAS, { ...base, busqueda: 'helader' }).map((f) => f.id)).toEqual([2])
    expect(filtrarComercios(FILAS, { ...base, busqueda: '', categoriaId: 3 }).map((f) => f.id)).toEqual([3])
    expect(filtrarComercios(FILAS, { ...base, busqueda: '' }).map((f) => f.nombre)).toEqual([
      'Asadero',
      'Café Arábigo',
      'Heladería Polo',
    ])
  })
})
