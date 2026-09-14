import { describe, it, expect } from 'vitest'
import {
  seleccionarNovedades,
  seleccionarBeneficiosDelMomento,
  seleccionarDestacados,
  apoyoDestacados,
  MINIMO_CATALOGO_NOVEDADES,
  MINIMO_RECIENTES,
  DIAS_NOVEDAD,
  MINIMO_PROMOCIONES_DESTACADAS,
  MINIMO_COMERCIOS_CON_PROMOCION,
  TOPE_ESTANTERIA,
  MINIMO_DESTACADOS,
  TOPE_DESTACADOS,
} from './estanterias'

const MS_POR_DIA = 24 * 60 * 60 * 1000
const AHORA = new Date('2026-09-13T12:00:00Z')

function haceDias(dias: number): string {
  return new Date(AHORA.getTime() - dias * MS_POR_DIA).toISOString()
}

function comercio(id: number, createdAt: string | null) {
  return { id, createdAt }
}

function conPromos(id: number, cantidad: number) {
  return { id, promociones: Array.from({ length: cantidad }, (_, i) => ({ id: i })) }
}

describe('seleccionarNovedades — umbral de catálogo (≥8) y de recientes (≥4)', () => {
  it('con 7 comercios (uno menos del umbral) no hay estantería, aunque todos sean recientes', () => {
    const comercios = Array.from({ length: 7 }, (_, i) => comercio(i, haceDias(1)))
    expect(seleccionarNovedades(comercios, AHORA)).toEqual([])
  })

  it('con exactamente 8 comercios y exactamente 4 recientes, la estantería aparece (con el catálogo entero, no solo los recientes)', () => {
    const recientes = Array.from({ length: 4 }, (_, i) => comercio(i, haceDias(1)))
    const viejos = Array.from({ length: 4 }, (_, i) => comercio(i + 4, haceDias(200)))
    const resultado = seleccionarNovedades([...recientes, ...viejos], AHORA)
    // El umbral de "recientes" solo decide si la estantería se muestra; el
    // contenido es el catálogo completo ordenado por fecha, no el subconjunto
    // reciente — así una estantería de "novedades" puede seguir enseñando algo
    // más antiguo detrás de las nuevas, en vez de cortarse en seco en 4.
    expect(resultado).toHaveLength(8)
  })

  it('con exactamente 8 comercios pero solo 3 recientes (uno menos del mínimo), no hay estantería', () => {
    const recientes = Array.from({ length: 3 }, (_, i) => comercio(i, haceDias(1)))
    const viejos = Array.from({ length: 5 }, (_, i) => comercio(i + 3, haceDias(200)))
    expect(seleccionarNovedades([...recientes, ...viejos], AHORA)).toEqual([])
  })

  it('con 9 comercios y 4 recientes, devuelve el catálogo completo con las más nuevas primero', () => {
    const recientes = [comercio(1, haceDias(3)), comercio(2, haceDias(1)), comercio(3, haceDias(2))]
    const cuarto = comercio(4, haceDias(0))
    const viejos = Array.from({ length: 5 }, (_, i) => comercio(i + 5, haceDias(200)))
    const resultado = seleccionarNovedades([...recientes, cuarto, ...viejos], AHORA)
    expect(resultado.map((c) => c.id)).toEqual([4, 2, 3, 1, 5, 6, 7, 8, 9])
  })

  it(`un comercio con exactamente ${DIAS_NOVEDAD} días cuenta como reciente (corte inclusivo)`, () => {
    const enElBorde = Array.from({ length: MINIMO_RECIENTES }, (_, i) =>
      comercio(i, haceDias(DIAS_NOVEDAD)),
    )
    const relleno = Array.from(
      { length: MINIMO_CATALOGO_NOVEDADES - MINIMO_RECIENTES },
      (_, i) => comercio(i + 100, haceDias(500)),
    )
    const resultado = seleccionarNovedades([...enElBorde, ...relleno], AHORA)
    expect(resultado).toHaveLength(MINIMO_CATALOGO_NOVEDADES)
  })

  it(`un comercio a ${DIAS_NOVEDAD + 1} días ya no cuenta como reciente`, () => {
    const fuera = Array.from({ length: MINIMO_RECIENTES }, (_, i) =>
      comercio(i, haceDias(DIAS_NOVEDAD + 1)),
    )
    const relleno = Array.from(
      { length: MINIMO_CATALOGO_NOVEDADES - MINIMO_RECIENTES },
      (_, i) => comercio(i + 100, haceDias(500)),
    )
    expect(seleccionarNovedades([...fuera, ...relleno], AHORA)).toEqual([])
  })

  it(`nunca devuelve más de TOPE_ESTANTERIA (${TOPE_ESTANTERIA})`, () => {
    const comercios = Array.from({ length: 12 }, (_, i) => comercio(i, haceDias(i)))
    expect(seleccionarNovedades(comercios, AHORA)).toHaveLength(TOPE_ESTANTERIA)
  })

  it('createdAt null o ilegible se trata como el más antiguo, no rompe el orden con NaN', () => {
    const comercios = [
      comercio(1, null),
      comercio(2, 'fecha-invalida'),
      comercio(3, haceDias(1)),
      comercio(4, haceDias(2)),
      comercio(5, haceDias(3)),
      comercio(6, haceDias(4)),
      comercio(7, haceDias(5)),
      comercio(8, haceDias(6)),
    ]
    const resultado = seleccionarNovedades(comercios, AHORA)
    expect(resultado.map((c) => c.id)).toEqual([3, 4, 5, 6, 7, 8, 1, 2])
  })
})

describe('seleccionarBeneficiosDelMomento — ≥2 comercios y ≥3 promociones en total', () => {
  it('un solo comercio con muchas promociones no basta: hace falta repartir en ≥2 comercios', () => {
    expect(seleccionarBeneficiosDelMomento([conPromos(1, 5)])).toEqual([])
  })

  it('dos comercios pero solo 2 promociones en total (uno menos del mínimo): no hay estantería', () => {
    expect(seleccionarBeneficiosDelMomento([conPromos(1, 1), conPromos(2, 1)])).toEqual([])
  })

  it('dos comercios con 3 promociones en total exactas: aparece', () => {
    const resultado = seleccionarBeneficiosDelMomento([conPromos(1, 1), conPromos(2, 2)])
    expect(resultado.map((c) => c.id)).toEqual([1, 2])
  })

  it('los comercios sin promociones no cuentan ni para el umbral ni para el resultado', () => {
    const resultado = seleccionarBeneficiosDelMomento([
      conPromos(1, 2),
      conPromos(2, 1),
      conPromos(3, 0),
    ])
    expect(resultado.map((c) => c.id)).toEqual([1, 2])
  })

  it(`nunca devuelve más de TOPE_ESTANTERIA (${TOPE_ESTANTERIA})`, () => {
    const comercios = Array.from({ length: 12 }, (_, i) => conPromos(i, 1))
    expect(seleccionarBeneficiosDelMomento(comercios)).toHaveLength(TOPE_ESTANTERIA)
  })

  it(`umbral exacto: MINIMO_COMERCIOS_CON_PROMOCION=${MINIMO_COMERCIOS_CON_PROMOCION}, MINIMO_PROMOCIONES_DESTACADAS=${MINIMO_PROMOCIONES_DESTACADAS}`, () => {
    // Un comercio menos que el mínimo de comercios, aunque el total de promociones sobre.
    const comercios = [conPromos(1, MINIMO_PROMOCIONES_DESTACADAS)]
    expect(seleccionarBeneficiosDelMomento(comercios)).toEqual([])
  })
})

function presentable(opts: {
  id: number
  logoUrl: string | null
  promociones?: number
  descripcion?: string | null
  createdAt?: string | null
  nombre?: string
}) {
  return {
    id: opts.id,
    logoUrl: opts.logoUrl,
    promociones: Array.from({ length: opts.promociones ?? 0 }, (_, i) => ({ id: i })),
    descripcion: opts.descripcion ?? null,
    createdAt: opts.createdAt ?? haceDias(1),
    nombre: opts.nombre ?? `Comercio ${opts.id}`,
  }
}

describe('seleccionarDestacados — filtro de logo, orden de tres niveles y tope', () => {
  it(`con menos de MINIMO_DESTACADOS (${MINIMO_DESTACADOS}) presentables, la portada no se renderiza`, () => {
    const comercios = [
      presentable({ id: 1, logoUrl: 'x.png' }),
      presentable({ id: 2, logoUrl: 'y.png' }),
    ]
    expect(seleccionarDestacados(comercios)).toEqual([])
  })

  it('los comercios sin logo se excluyen del todo, aunque tengan beneficio', () => {
    const comercios = [
      presentable({ id: 1, logoUrl: null, promociones: 3 }),
      presentable({ id: 2, logoUrl: 'y.png' }),
      presentable({ id: 3, logoUrl: 'z.png' }),
      presentable({ id: 4, logoUrl: 'w.png' }),
    ]
    const resultado = seleccionarDestacados(comercios)
    expect(resultado.map((c) => c.id)).not.toContain(1)
    expect(resultado).toHaveLength(3)
  })

  it('un logo de solo espacios cuenta como ausente (defensa ante logo_url en crudo)', () => {
    const comercios = [
      presentable({ id: 1, logoUrl: '   ' }),
      presentable({ id: 2, logoUrl: 'y.png' }),
      presentable({ id: 3, logoUrl: 'z.png' }),
    ]
    expect(seleccionarDestacados(comercios)).toEqual([])
  })

  it('nivel 1 (con beneficio) siempre antes que nivel 2 (con descripción) y nivel 3 (el resto)', () => {
    const comercios = [
      presentable({ id: 1, logoUrl: 'a.png' }), // nivel 3
      presentable({ id: 2, logoUrl: 'b.png', descripcion: 'Algo' }), // nivel 2
      presentable({ id: 3, logoUrl: 'c.png', promociones: 1 }), // nivel 1
    ]
    const resultado = seleccionarDestacados(comercios)
    expect(resultado.map((c) => c.id)).toEqual([3, 2, 1])
  })

  it('dentro del nivel 1, más beneficios primero', () => {
    const comercios = [
      presentable({ id: 1, logoUrl: 'a.png', promociones: 1 }),
      presentable({ id: 2, logoUrl: 'b.png', promociones: 3 }),
      presentable({ id: 3, logoUrl: 'c.png', promociones: 2 }),
    ]
    const resultado = seleccionarDestacados(comercios)
    expect(resultado.map((c) => c.id)).toEqual([2, 3, 1])
  })

  it('a igualdad de nivel y beneficios, desempata por createdAt descendente', () => {
    const comercios = [
      presentable({ id: 1, logoUrl: 'a.png', createdAt: haceDias(10) }),
      presentable({ id: 2, logoUrl: 'b.png', createdAt: haceDias(1) }),
      presentable({ id: 3, logoUrl: 'c.png', createdAt: haceDias(5) }),
    ]
    const resultado = seleccionarDestacados(comercios)
    expect(resultado.map((c) => c.id)).toEqual([2, 3, 1])
  })

  it('a igualdad total, desempata por nombre ascendente (localeCompare es), no por id', () => {
    const misma = haceDias(1)
    const comercios = [
      presentable({ id: 1, logoUrl: 'a.png', createdAt: misma, nombre: 'Zapatería' }),
      presentable({ id: 2, logoUrl: 'b.png', createdAt: misma, nombre: 'Árbol Café' }),
      presentable({ id: 3, logoUrl: 'c.png', createdAt: misma, nombre: 'Bakery' }),
    ]
    const resultado = seleccionarDestacados(comercios)
    // 'Árbol' ordena junto a la A con collation es-ES, antes que 'Bakery' y 'Zapatería'.
    expect(resultado.map((c) => c.id)).toEqual([2, 3, 1])
  })

  it(`nunca devuelve más de TOPE_DESTACADOS (${TOPE_DESTACADOS})`, () => {
    const comercios = Array.from({ length: 8 }, (_, i) =>
      presentable({ id: i, logoUrl: `logo-${i}.png` }),
    )
    expect(seleccionarDestacados(comercios)).toHaveLength(TOPE_DESTACADOS)
  })
})

describe('apoyoDestacados — el copy dice la verdad del criterio', () => {
  it('variante A: hay al menos un destacado con beneficio', () => {
    const destacados = [{ promociones: [{}] }, { promociones: [] }]
    expect(apoyoDestacados(destacados, 10)).toBe('Empezamos por los que hoy tienen beneficio')
  })

  it('variante B: sin beneficios y los destacados son todo el resultado', () => {
    const destacados = [{ promociones: [] }, { promociones: [] }]
    expect(apoyoDestacados(destacados, 2)).toBe('Por ahora son todos, y seguimos sumando')
  })

  it('variante C: sin beneficios y queda más catálogo debajo', () => {
    const destacados = [{ promociones: [] }, { promociones: [] }]
    expect(apoyoDestacados(destacados, 10)).toBe('Aliados para conocer, y el resto está abajo')
  })
})
