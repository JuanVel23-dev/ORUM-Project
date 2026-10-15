import { describe, expect, it } from 'vitest'
import {
  coincide,
  contarPorPestana,
  filtrar,
  leerOrden,
  leerPagina,
  leerPestana,
  ordenar,
  paginar,
  paginasVisibles,
  type FilaMiembro,
} from './listado'

const fila = (id: number, extra: Partial<FilaMiembro> = {}): FilaMiembro => ({
  id,
  numeroMembresia: `000${id}`,
  nombre: `Miembro ${id}`,
  cedula: `10${id}`,
  telefono: null,
  fotoUrl: null,
  plan: 'Anual',
  planId: 1,
  estado: { activa: true, diasRestantes: 200 },
  fechaFin: '2027-05-01',
  ...extra,
})

const filas: FilaMiembro[] = [
  fila(1),
  fila(2, { estado: { activa: true, diasRestantes: 5 }, fechaFin: '2026-10-20' }),
  fila(3, { estado: { activa: false, motivo: 'vencida' }, fechaFin: '2026-09-01', planId: 2 }),
  fila(4, { estado: null, fechaFin: null, plan: null, planId: null, nombre: 'Ángela Ruiz' }),
]

describe('leer parámetros', () => {
  it('lo desconocido cae en el valor por defecto', () => {
    expect(leerPestana('pronto')).toBe('pronto')
    expect(leerPestana('otra')).toBe('todos')
    expect(leerOrden(undefined)).toBe('recientes')
    expect(leerPagina('3')).toBe(3)
    expect(leerPagina('-1')).toBe(1)
    expect(leerPagina('x')).toBe(1)
  })
})

describe('contarPorPestana', () => {
  it('una vigente que vence pronto cuenta en las dos', () => {
    expect(contarPorPestana(filas)).toEqual({ todos: 4, vigentes: 2, pronto: 1, vencidas: 1, sin: 1 })
  })
})

describe('filtrar', () => {
  it('por pestaña, plan y búsqueda a la vez', () => {
    expect(filtrar(filas, { pestana: 'vigentes', busqueda: '', planId: null }).map((f) => f.id)).toEqual([1, 2])
    expect(filtrar(filas, { pestana: 'todos', busqueda: '', planId: 2 }).map((f) => f.id)).toEqual([3])
    expect(filtrar(filas, { pestana: 'sin', busqueda: 'angela', planId: null }).map((f) => f.id)).toEqual([4])
  })

  it('la búsqueda no distingue tildes y busca en la cédula y el número', () => {
    expect(coincide(filas[3], 'ÁNGELA')).toBe(true)
    expect(coincide(filas[0], '101')).toBe(true)
    expect(coincide(filas[0], '0001')).toBe(true)
    expect(coincide(filas[0], 'otro nombre')).toBe(false)
  })
})

describe('ordenar', () => {
  it('recientes primero por defecto', () => {
    expect(ordenar(filas, 'recientes').map((f) => f.id)).toEqual([4, 3, 2, 1])
  })

  it('por vencimiento, sin membresía al final', () => {
    expect(ordenar(filas, 'vencimiento').map((f) => f.id)).toEqual([3, 2, 1, 4])
  })

  it('no toca la lista original', () => {
    const antes = filas.map((f) => f.id)
    ordenar(filas, 'nombre')
    expect(filas.map((f) => f.id)).toEqual(antes)
  })
})

describe('paginar', () => {
  const muchas = Array.from({ length: 60 }, (_, i) => i + 1)

  it('corta la página pedida', () => {
    const p = paginar(muchas, 2, 25)
    expect(p.filas[0]).toBe(26)
    expect(p).toMatchObject({ pagina: 2, paginas: 3, total: 60, desde: 26, hasta: 50 })
  })

  it('una página fuera de rango va a la última', () => {
    expect(paginar(muchas, 99, 25).pagina).toBe(3)
  })

  it('sin filas: una página vacía', () => {
    expect(paginar([], 1)).toMatchObject({ pagina: 1, paginas: 1, total: 0, desde: 0, hasta: 0 })
  })
})

describe('paginasVisibles', () => {
  it('primera, última, la actual y sus vecinas, con saltos', () => {
    expect(paginasVisibles(1, 1)).toEqual([1])
    expect(paginasVisibles(5, 10)).toEqual([1, null, 4, 5, 6, null, 10])
    expect(paginasVisibles(2, 4)).toEqual([1, 2, 3, 4])
  })
})
