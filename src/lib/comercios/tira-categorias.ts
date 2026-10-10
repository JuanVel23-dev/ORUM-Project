import { normalizarNombre } from './iconos-categoria'

/*
  LA TIRA DE CATEGORÍAS DEL DIRECTORIO  ·  qué cabe y qué se busca
  ---------------------------------------------------------------------------
  Funciones puras de `CategoriasDirectorio`: la tira enseña las primeras
  categorías en dos filas y deja el resto para la ventana «Ver más», que
  además busca por nombre.
*/

/** Cuántas categorías enseña la tira antes de «Ver más» (sin contar «Todas»). */
export const LIMITE_TIRA = 24

type ConNombre = { id: number | null; nombre: string; activa: boolean }

/**
 * Las opciones que salen en la tira y cuántas se quedan fuera.
 *
 * Salen «Todas», las primeras `limite` y —aunque caigan después del corte—
 * las que estén ELEGIDAS: un filtro puesto que no se ve es un filtro que no
 * se sabe quitar.
 */
export function repartirTira<T extends ConNombre>(
  opciones: readonly T[],
  limite: number = LIMITE_TIRA,
): { visibles: T[]; ocultas: number } {
  let contadas = 0
  const visibles: T[] = []
  for (const o of opciones) {
    if (o.id === null) {
      visibles.push(o)
      continue
    }
    contadas += 1
    if (contadas <= limite || o.activa) visibles.push(o)
  }
  return { visibles, ocultas: opciones.length - visibles.length }
}

/**
 * Filtra por nombre, sin distinguir mayúsculas ni tildes. Cada palabra de la
 * búsqueda tiene que aparecer («salud bell» encuentra «Salud y Belleza»).
 * Con la búsqueda vacía devuelve todas; buscando, «Todas» no sale: no es una
 * categoría que se pueda encontrar.
 */
export function buscarCategorias<T extends ConNombre>(opciones: readonly T[], busqueda: string): T[] {
  const palabras = normalizarNombre(busqueda).split(/\s+/).filter(Boolean)
  if (palabras.length === 0) return [...opciones]
  return opciones.filter((o) => {
    if (o.id === null) return false
    const nombre = normalizarNombre(o.nombre)
    return palabras.every((p) => nombre.includes(p))
  })
}
