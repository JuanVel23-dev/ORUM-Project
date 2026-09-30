import { describe, it, expect } from 'vitest'
import {
  alternarCategoria,
  filtrarFavoritos,
  compararNombres,
  filtrarDirectorio,
  hayFiltros,
  hrefDirectorio,
  leerFiltrosDirectorio,
  ordenarCategorias,
  type ComercioFiltrable,
  type FiltrosDirectorio,
} from './directorio'

const SIN_FILTROS: FiltrosDirectorio = {
  q: '',
  categoriaIds: [],
  ciudadId: null,
  orden: 'az',
  soloFavoritos: false,
}

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
    ).toEqual({ q: 'café', categoriaIds: [3], ciudadId: 7, orden: 'za', soloFavoritos: false })
  })

  it('lee varias categorías: con comas, repetidas, sin duplicados y ordenadas', () => {
    expect(leerFiltrosDirectorio({ categoria_id: '7,3,7' }).categoriaIds).toEqual([3, 7])
    expect(leerFiltrosDirectorio({ categoria_id: ['9', '2,x'] }).categoriaIds).toEqual([2, 9])
  })

  it('descarta ids que no son enteros positivos', () => {
    const f = leerFiltrosDirectorio({ categoria_id: 'abc', ciudad_id: '-2' })
    expect(f.categoriaIds).toEqual([])
    expect(f.ciudadId).toBeNull()
    expect(leerFiltrosDirectorio({ categoria_id: '1.5' }).categoriaIds).toEqual([])
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
    expect(hrefDirectorio(actuales, { categoriaIds: [5] })).toBe(
      '/explorar?q=pan&categoria_id=5&ciudad_id=2',
    )
  })

  it('varias categorías van en una lista legible con comas', () => {
    expect(hrefDirectorio(SIN_FILTROS, { categoriaIds: [3, 7] })).toBe(
      '/explorar?categoria_id=3,7',
    )
  })

  it('quitar un filtro lo saca de la URL', () => {
    const actuales = { ...SIN_FILTROS, categoriaIds: [5] }
    expect(hrefDirectorio(actuales, { categoriaIds: [] })).toBe('/explorar')
  })

  it('la misma URL sobre otra base (el directorio del socio en /miembros)', () => {
    expect(hrefDirectorio(SIN_FILTROS, {}, '/miembros')).toBe('/miembros')
    expect(hrefDirectorio({ ...SIN_FILTROS, q: 'pan' }, { ciudadId: 2 }, '/miembros')).toBe(
      '/miembros?q=pan&ciudad_id=2',
    )
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
    const f = { ...SIN_FILTROS, categoriaIds: [1], ciudadId: 1 }
    expect(nombres(filtrarDirectorio(lista, f))).toEqual(['Café 2'])
  })

  it('con varias categorías enseña los comercios de cualquiera de ellas', () => {
    const f = { ...SIN_FILTROS, categoriaIds: [2, 3] }
    expect(nombres(filtrarDirectorio(lista, f))).toEqual(['Ámbar Spa', 'Zapatería Luna'])
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

describe('alternarCategoria', () => {
  it('enciende la que falta y la deja ordenada', () => {
    expect(alternarCategoria([7], 3)).toEqual([3, 7])
  })

  it('apaga la que ya estaba', () => {
    expect(alternarCategoria([3, 7], 7)).toEqual([3])
  })

  it('no toca la lista de entrada', () => {
    const ids = [3]
    alternarCategoria(ids, 5)
    expect(ids).toEqual([3])
  })
})

describe('favoritos', () => {
  it('lee ?favoritos=1 y lo escribe de vuelta', () => {
    expect(leerFiltrosDirectorio({ favoritos: '1' }).soloFavoritos).toBe(true)
    expect(leerFiltrosDirectorio({ favoritos: 'si' }).soloFavoritos).toBe(false)
    expect(hrefDirectorio(SIN_FILTROS, { soloFavoritos: true }, '/miembros')).toBe(
      '/miembros?favoritos=1',
    )
  })

  it('cuenta como filtro para el estado vacío', () => {
    expect(hayFiltros({ ...SIN_FILTROS, soloFavoritos: true })).toBe(true)
  })

  it('deja solo los favoritos, en el orden de la lista', () => {
    const lista = [{ id: 3 }, { id: 1 }, { id: 2 }]
    expect(filtrarFavoritos(lista, [2, 3, 9])).toEqual([{ id: 3 }, { id: 2 }])
    expect(filtrarFavoritos(lista, [])).toEqual([])
  })
})
