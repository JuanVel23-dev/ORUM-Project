/**
 * Qué entra en cada estantería del catálogo, y sobre todo **cuándo no entra
 * ninguna**.
 *
 * Una estantería que repite la rejilla entera no comprime nada: la estorba. Y
 * un carrusel esconde contenido detrás de un gesto que mucha gente nunca hace,
 * así que en una pantalla cuyo propósito es descubrir, mal puesto REDUCE el
 * descubrimiento. De ahí los umbrales: son la condición para que deslizar sea
 * un atajo y no un peaje.
 *
 * Regla que estas funciones no pueden garantizar por sí solas y que la página
 * debe respetar: **nada alcanzable solo deslizando**. Todo lo que sale en una
 * estantería sale también en la rejilla, en la misma página. Por eso las
 * cabeceras no llevan "Ver todos": no habría a dónde ir que no fuera esta
 * misma URL, y un enlace que no lleva a ninguna parte es peor que ninguno.
 *
 * Funciones puras: entran datos, salen datos. Sin `Date.now()` dentro —la
 * fecha se recibe— para que se puedan probar.
 */

/** Mínimo de comercios en el resultado para que "Nuevos en el club" aparezca. */
export const MINIMO_CATALOGO_NOVEDADES = 8

/** De esos, cuántos tienen que ser realmente recientes. */
export const MINIMO_RECIENTES = 4

/** Hasta cuándo un comercio cuenta como "nuevo". */
export const DIAS_NOVEDAD = 90

/** Mínimo de promociones vigentes para que "Beneficios del momento" aparezca. */
export const MINIMO_PROMOCIONES_DESTACADAS = 3

/** Y en cuántos comercios distintos deben estar repartidas. */
export const MINIMO_COMERCIOS_CON_PROMOCION = 2

/** Ninguna estantería muestra más de esto. */
export const TOPE_ESTANTERIA = 10

const MS_POR_DIA = 24 * 60 * 60 * 1000

type ConFecha = { createdAt: string | null }
type ConPromociones = { promociones: unknown[] }

/**
 * "Nuevos en el club": los comercios más recientes, de más a menos.
 *
 * Devuelve lista vacía —o sea, la estantería no se renderiza— si el catálogo
 * es corto o si no hay novedades de verdad. Por debajo de
 * `MINIMO_CATALOGO_NOVEDADES` la rejilla completa cabe en dos pantallazos, y un
 * atajo hacia algo que ya está a un dedo de distancia no es un atajo.
 *
 * Es la única curaduría que este producto puede ofrecer con honestidad:
 * "Destacados" no existe porque ninguna tabla tiene columna de destacado,
 * orden ni prioridad, y ordenar por `id` no es destacar, es "insertado antes".
 */
export function seleccionarNovedades<T extends ConFecha>(comercios: T[], ahora: Date): T[] {
  if (comercios.length < MINIMO_CATALOGO_NOVEDADES) return []

  const corte = ahora.getTime() - DIAS_NOVEDAD * MS_POR_DIA
  const recientes = comercios.filter((c) => marcaDeTiempo(c.createdAt) >= corte)
  if (recientes.length < MINIMO_RECIENTES) return []

  return [...comercios]
    .sort((a, b) => marcaDeTiempo(b.createdAt) - marcaDeTiempo(a.createdAt))
    .slice(0, TOPE_ESTANTERIA)
}

/**
 * "Beneficios del momento": los comercios que hoy tienen algo que ofrecer.
 *
 * Con menos de `MINIMO_PROMOCIONES_DESTACADAS` promociones, o concentradas en
 * un solo comercio, la estantería sería una tarjeta y media: eso ya lo enseña
 * la rejilla mejor.
 */
export function seleccionarBeneficiosDelMomento<T extends ConPromociones>(
  comercios: T[],
): T[] {
  const conPromociones = comercios.filter((c) => c.promociones.length > 0)
  if (conPromociones.length < MINIMO_COMERCIOS_CON_PROMOCION) return []

  const total = conPromociones.reduce((suma, c) => suma + c.promociones.length, 0)
  if (total < MINIMO_PROMOCIONES_DESTACADAS) return []

  return conPromociones.slice(0, TOPE_ESTANTERIA)
}

/**
 * `created_at` llega como `timestamptz` de Postgres, no como fecha civil: se
 * interpreta como instante, no se recorta a 'YYYY-MM-DD'. Una fila sin fecha
 * —o con una ilegible— se trata como la más antigua posible en vez de romper
 * la ordenación con un `NaN`, que en un comparador deja el array en un orden
 * arbitrario y silencioso.
 */
function marcaDeTiempo(valor: string | null): number {
  if (!valor) return Number.NEGATIVE_INFINITY
  const ms = new Date(valor).getTime()
  return Number.isNaN(ms) ? Number.NEGATIVE_INFINITY : ms
}
