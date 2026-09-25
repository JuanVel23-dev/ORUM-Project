import { describe, it, expect } from 'vitest'
import {
  compararNombres,
  filtrarDirectorio,
  hayFiltros,
  hrefDirectorio,
  leerFiltrosDirectorio,
  ordenarCategorias,
  type ComercioFiltrable,
  type FiltrosDirectorio,
} from './directorio'

const SIN_FILTROS: FiltrosDirectorio = { q: '', categoriaId: null, ciudadId: null, orden: 'az' }

function comercio(
  nombre: string,
  extra: Partial<ComercioFiltrable> = {},
): ComercioFiltrable {
  return {
    nombre,
    categoriaId: null,
    categoriaNombre: null,
    ciudadIds: [],
    ciudades: [],
    ...extra,
  }
}

describe('leerFiltrosDirectorio', () => {
  it('sin parámetros devuelve el directorio entero, de la A a la Z', () => {
    expect(leerFiltrosDirectorio({})).toEqual(SIN_FILTROS)
  })

  it('lee los cuatro filtros', () => {
    expect(
      leerFiltrosDirectorio({ q: '  café ', categoria_id: '3', ciudad_id: '7', orden: 'za' }),
    ).toEqual({ q: 'café', categoriaId: 3, ciudadId: 7, orden: 'za' })
  })

  it('descarta ids que no son enteros positivos', () => {
    const f = leerFiltrosDirectorio({ categoria_id: 'abc', ciudad_id: '-2' })
    expect(f.categoriaId).toBeNull()
    expect(f.ciudadId).toBeNull()
    expect(leerFiltrosDirectorio({ categoria_id: '1.5' }).categoriaId).toBeNull()
  })

  it('un orden desconocido cae al de por defecto', () => {
    expect(leerFiltrosDirectorio({ orden: 'precio' }).orden).toBe('az')
  })

  it('con parámetros repetidos se queda con el primero', () => {
    expect(leerFiltrosDirectorio({ q: ['uno', 'dos'] }).q).toBe('uno')
  })

  it('recorta una búsqueda desmesurada', () => {
    expect(leerFiltrosDirectorio({ q: 'x'.repeat(500) }).q).toHaveLength(80)
  })
})

describe('hrefDirectorio', () => {
  it('sin filtros es la ruta a secas', () => {
    expect(hrefDirectorio(SIN_FILTROS)).toBe('/explorar')
  })

  it('cambia un filtro y conserva los demás', () => {
    const actuales = { ...SIN_FILTROS, q: 'pan', ciudadId: 2 }
    expect(hrefDirectorio(actuales, { categoriaId: 5 })).toBe(
      '/explorar?q=pan&categoria_id=5&ciudad_id=2',
    )
  })

  it('quitar un filtro lo saca de la URL', () => {
    const actuales = { ...SIN_FILTROS, categoriaId: 5 }
    expect(hrefDirectorio(actuales, { categoriaId: null })).toBe('/explorar')
  })

  it('el orden por defecto no ensucia la URL', () => {
    expect(hrefDirectorio({ ...SIN_FILTROS, orden: 'za' }, { orden: 'az' })).toBe('/explorar')
    expect(hrefDirectorio(SIN_FILTROS, { orden: 'za' })).toBe('/explorar?orden=za')
  })
})

describe('compararNombres', () => {
  it('ordena los números por su valor, no por su primer dígito', () => {
    const nombres = ['Café 10', 'Café 2', 'Café 1']
    expect([...nombres].sort(compararNombres)).toEqual(['Café 1', 'Café 2', 'Café 10'])
  })

  it('no distingue mayúsculas ni tildes', () => {
    expect(compararNombres('arepa', 'Árbol')).toBeGreaterThan(0)
    expect(compararNombres('café', 'CAFE')).toBe(0)
  })
})

describe('filtrarDirectorio', () => {
  const lista = [
    comercio('Zapatería Luna', { categoriaId: 2, categoriaNombre: 'Ropa', ciudadIds: [1], ciudades: ['Bogotá'] }),
    comercio('Café 10', { categoriaId: 1, categoriaNombre: 'Café', ciudadIds: [2], ciudades: ['Medellín'] }),
    comercio('Café 2', { categoriaId: 1, categoriaNombre: 'Café', ciudadIds: [1, 2], ciudades: ['Bogotá', 'Medellín'] }),
    comercio('Ámbar Spa', { categoriaId: 3, categoriaNombre: 'Spa', ciudadIds: [1], ciudades: ['Bogotá'] }),
  ]

  const nombres = (xs: ComercioFiltrable[]) => xs.map((x) => x.nombre)

  it('sin filtros ordena de la A a la Z, con números naturales y sin tildes', () => {
    expect(nombres(filtrarDirectorio(lista, SIN_FILTROS))).toEqual([
      'Ámbar Spa',
      'Café 2',
      'Café 10',
      'Zapatería Luna',
    ])
  })

  it('de la Z a la A invierte el orden', () => {
    expect(nombres(filtrarDirectorio(lista, { ...SIN_FILTROS, orden: 'za' }))).toEqual([
      'Zapatería Luna',
      'Café 10',
      'Café 2',
      'Ámbar Spa',
    ])
  })

  it('filtra por categoría y por ciudad a la vez', () => {
    const f = { ...SIN_FILTROS, categoriaId: 1, ciudadId: 1 }
    expect(nombres(filtrarDirectorio(lista, f))).toEqual(['Café 2'])
  })

  it('la búsqueda casa con el nombre, sin tildes ni mayúsculas', () => {
    expect(nombres(filtrarDirectorio(lista, { ...SIN_FILTROS, q: 'ZAPATERIA' }))).toEqual([
      'Zapatería Luna',
    ])
  })

  it('la búsqueda casa con la categoría y con la ciudad', () => {
    expect(nombres(filtrarDirectorio(lista, { ...SIN_FILTROS, q: 'spa' }))).toEqual(['Ámbar Spa'])
    expect(nombres(filtrarDirectorio(lista, { ...SIN_FILTROS, q: 'medellin' }))).toEqual([
      'Café 2',
      'Café 10',
    ])
  })

  it('no muta la lista de entrada', () => {
    const copia = [...lista]
    filtrarDirectorio(lista, { ...SIN_FILTROS, orden: 'za' })
    expect(lista).toEqual(copia)
  })
})

describe('ordenarCategorias', () => {
  it('ordena alfabéticamente y deja «Otros» al final', () => {
    const cats = ['Spa', 'Otros', 'Café', 'Alimentos saludables'].map((nombre, id) => ({ id, nombre }))
    expect(ordenarCategorias(cats).map((c) => c.nombre)).toEqual([
      'Alimentos saludables',
      'Café',
      'Spa',
      'Otros',
    ])
  })
})

describe('hayFiltros', () => {
  it('el orden no cuenta como filtro', () => {
    expect(hayFiltros({ ...SIN_FILTROS, orden: 'za' })).toBe(false)
    expect(hayFiltros({ ...SIN_FILTROS, q: 'x' })).toBe(true)
    expect(hayFiltros({ ...SIN_FILTROS, ciudadId: 1 })).toBe(true)
  })
})
