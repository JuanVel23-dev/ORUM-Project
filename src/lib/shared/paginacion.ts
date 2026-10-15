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
