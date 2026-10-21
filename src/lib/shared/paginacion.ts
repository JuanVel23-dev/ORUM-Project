/*
  PAGINAR UNA LISTA  ·  puro
  ---------------------------------------------------------------------------
  Lo usan las listas del panel (miembros y las que vengan) y el componente
  `Paginacion`.
*/

/** Filas por página. */
export const FILAS_POR_PAGINA = 25

export type Pagina<T> = {
  filas: T[]
  pagina: number
  paginas: number
  total: number
  desde: number
  hasta: number
}

/** Corta una página; una página fuera de rango se lleva a la última. */
export function paginar<T>(filas: readonly T[], pagina: number, tam = FILAS_POR_PAGINA): Pagina<T> {
  const total = filas.length
  const paginas = Math.max(1, Math.ceil(total / tam))
  const actual = Math.min(Math.max(1, pagina), paginas)
  const inicio = (actual - 1) * tam
  const corte = filas.slice(inicio, inicio + tam)
  return {
    filas: corte,
    pagina: actual,
    paginas,
    total,
    desde: total === 0 ? 0 : inicio + 1,
    hasta: inicio + corte.length,
  }
}

/**
 * La página de una lista que se pide al servidor con `.range(inicio, fin)`
 * (sin tener todas las filas en memoria). Misma aritmética que `paginar`:
 * NaN, negativa o pasada del final se llevan a 1..última. `fin` es inclusivo,
 * como en PostgREST; con `total` 0 no hay filas y `fin` queda antes de `inicio`.
 */
export function rangoDePagina(total: number, pagina: number, tam = FILAS_POR_PAGINA) {
  const paginas = Math.max(1, Math.ceil(Math.max(0, total) / tam))
  const pedida = Number.isFinite(pagina) ? Math.trunc(pagina) : 1
  const actual = Math.min(Math.max(1, pedida), paginas)
  const inicio = (actual - 1) * tam
  const hasta = Math.min(total, inicio + tam)
  return {
    pagina: actual,
    paginas,
    total,
    inicio,
    fin: inicio + tam - 1,
    desde: total <= 0 ? 0 : inicio + 1,
    hasta: total <= 0 ? 0 : hasta,
  }
}

/**
 * Los números de página que se enseñan: la primera, la última, la actual y
 * sus vecinas; `null` es un salto («…»).
 */
export function paginasVisibles(actual: number, total: number): (number | null)[] {
  const conjunto = new Set([1, total, actual - 1, actual, actual + 1])
  const lista = [...conjunto].filter((n) => n >= 1 && n <= total).sort((a, b) => a - b)
  const salida: (number | null)[] = []
  for (const n of lista) {
    const anterior = salida[salida.length - 1]
    if (typeof anterior === 'number' && n - anterior > 1) salida.push(null)
    salida.push(n)
  }
  return salida
}
