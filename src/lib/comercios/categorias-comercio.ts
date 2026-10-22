/*
  LAS CATEGORÍAS DE UN COMERCIO  ·  puro (21/10/2026)
  ---------------------------------------------------------------------------
  Un comercio tiene de 1 a 3 categorías y, en cada una, una subcategoría
  opcional. Aquí vive la lectura del formulario y su revisión; el servidor es
  quien decide, el formulario solo avisa antes.
*/

export const MAX_CATEGORIAS_COMERCIO = 3

export type FilaCategoriaComercio = {
  categoriaId: number
  subcategoriaId: number | null
}

/** Id positivo, o `NaN` si el texto no lo es: la fila queda marcada como inválida. */
function idOInvalido(texto: string): number {
  const n = Number(texto)
  return Number.isInteger(n) && n > 0 ? n : NaN
}

/**
 * Las filas del formulario: `formData.getAll('categoria_id')` y
 * `getAll('subcategoria_id')`, emparejadas por posición. Una fila sin
 * categoría se descarta (es una fila vacía del formulario); un id ilegible
 * llega como `NaN` para que `revisarFilasCategoria` lo rechace.
 */
export function leerFilasCategoria(
  categoriaIds: readonly string[],
  subcategoriaIds: readonly string[],
): FilaCategoriaComercio[] {
  const filas: FilaCategoriaComercio[] = []
  categoriaIds.forEach((crudaCategoria, i) => {
    const categoria = crudaCategoria.trim()
    if (!categoria) return
    const subcategoria = (subcategoriaIds[i] ?? '').trim()
    filas.push({
      categoriaId: idOInvalido(categoria),
      subcategoriaId: subcategoria ? idOInvalido(subcategoria) : null,
    })
  })
  return filas
}

/**
 * El mensaje de lo que falla, o `null` si las filas valen.
 * `categoriaDeSubcategoria`: de qué categoría es cada subcategoría que existe.
 */
export function revisarFilasCategoria(
  filas: readonly FilaCategoriaComercio[],
  categoriaDeSubcategoria: ReadonlyMap<number, number>,
): string | null {
  if (filas.length === 0) return 'Elige al menos una categoría.'
  if (filas.length > MAX_CATEGORIAS_COMERCIO) {
    return `Un comercio puede tener hasta ${MAX_CATEGORIAS_COMERCIO} categorías.`
  }
  if (filas.some((f) => Number.isNaN(f.categoriaId) || Number.isNaN(f.subcategoriaId))) {
    return 'Una de las categorías no es válida.'
  }
  if (new Set(filas.map((f) => f.categoriaId)).size !== filas.length) {
    return 'No repitas la misma categoría.'
  }
  for (const f of filas) {
    if (f.subcategoriaId !== null && categoriaDeSubcategoria.get(f.subcategoriaId) !== f.categoriaId) {
      return 'La subcategoría no pertenece a la categoría elegida.'
    }
  }
  return null
}
