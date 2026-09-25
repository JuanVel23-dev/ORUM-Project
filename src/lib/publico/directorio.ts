import { normalizarNombre } from '../comercios/iconos-categoria'

/* ==========================================================================
   EL DIRECTORIO PÚBLICO  ·  filtrar y ordenar, sin tocar la base
   --------------------------------------------------------------------------
   Funciones puras: reciben la lista de comercios que ya leyó
   `datos-publicos.ts` y los parámetros de la URL, y devuelven lo que se pinta.

   POR QUÉ SE FILTRA EN EL SERVIDOR Y NO EN LA CONSULTA. El directorio muestra
   como mucho unos cientos de comercios, y la búsqueda casa contra tres cosas
   —nombre, categoría y ciudad— que viven en tres tablas. Traducirlo a
   PostgREST obligaría a una vista o a tres consultas encadenadas; filtrar la
   lista ya cargada cuesta microsegundos y se puede probar sin base de datos.

   Y POR QUÉ LOS FILTROS VIVEN EN LA URL, que es la convención del repositorio:
   funciona sin JavaScript, se comparte por WhatsApp y sobrevive a un refresco.
   ========================================================================== */

export type OrdenDirectorio = 'az' | 'za'

export const ORDEN_POR_DEFECTO: OrdenDirectorio = 'az'

export const ETIQUETAS_ORDEN: Record<OrdenDirectorio, string> = {
  az: 'A-Z',
  za: 'Z-A',
}

/** Tope de la búsqueda libre. Una cadena más larga no casa con ningún nombre. */
const MAX_BUSQUEDA = 80

export type FiltrosDirectorio = {
  /** Texto libre, ya recortado. Cadena vacía = sin búsqueda. */
  q: string
  categoriaId: number | null
  ciudadId: number | null
  orden: OrdenDirectorio
}

/** Lo mínimo que el filtro necesita saber de un comercio. */
export type ComercioFiltrable = {
  nombre: string
  categoriaId: number | null
  categoriaNombre: string | null
  ciudadIds: number[]
  ciudades: string[]
}

type ParametrosCrudos = Record<string, string | string[] | undefined>

/** Primer valor de un parámetro que puede venir repetido (`?q=a&q=b`). */
function primero(valor: string | string[] | undefined): string {
  if (Array.isArray(valor)) return valor[0] ?? ''
  return valor ?? ''
}

/** Id positivo, o `null`. Entrada no confiable: llega de la URL. */
function idOnulo(valor: string): number | null {
  const n = Number(valor)
  return Number.isInteger(n) && n > 0 ? n : null
}

/**
 * Los filtros del directorio a partir de los `searchParams` de la página.
 *
 * Nunca lanza: un parámetro que no se entiende se trata como ausente. Una URL
 * mal copiada debe mostrar el directorio entero, no un error.
 */
export function leerFiltrosDirectorio(params: ParametrosCrudos): FiltrosDirectorio {
  const orden = primero(params.orden)
  return {
    q: primero(params.q).trim().slice(0, MAX_BUSQUEDA),
    categoriaId: idOnulo(primero(params.categoria_id)),
    ciudadId: idOnulo(primero(params.ciudad_id)),
    orden: orden === 'za' ? 'za' : ORDEN_POR_DEFECTO,
  }
}

/**
 * Los filtros como parámetros de URL, sin los que están en su valor por
 * defecto. Así la URL del directorio sin filtros es `/explorar` a secas.
 */
export function parametrosDirectorio(filtros: FiltrosDirectorio): Record<string, string> {
  const params: Record<string, string> = {}
  if (filtros.q) params.q = filtros.q
  if (filtros.categoriaId !== null) params.categoria_id = String(filtros.categoriaId)
  if (filtros.ciudadId !== null) params.ciudad_id = String(filtros.ciudadId)
  if (filtros.orden !== ORDEN_POR_DEFECTO) params.orden = filtros.orden
  return params
}

/**
 * URL del directorio con los filtros actuales y los cambios pedidos.
 *
 * Cada enlace de la pantalla —una categoría, una ciudad, un orden— cambia UNA
 * cosa y conserva el resto: elegir ciudad no puede borrar lo que el visitante
 * acababa de escribir en el buscador.
 */
export function hrefDirectorio(
  filtros: FiltrosDirectorio,
  cambios: Partial<FiltrosDirectorio> = {},
): string {
  const consulta = new URLSearchParams(
    parametrosDirectorio({ ...filtros, ...cambios }),
  ).toString()
  return consulta ? `/explorar?${consulta}` : '/explorar'
}

/**
 * Compara dos nombres como los lee una persona: sin distinguir mayúsculas ni
 * tildes, y con los números en su orden NUMÉRICO («Café 2» antes que
 * «Café 10»), que es lo que pidió el propietario al ordenar de la A a la Z.
 */
const colador = new Intl.Collator('es', { numeric: true, sensitivity: 'base' })

export function compararNombres(a: string, b: string): number {
  return colador.compare(a, b)
}

/**
 * Categorías en orden alfabético, con «Otros» (u «Otras») siempre al final:
 * es el cajón de sastre, y en mitad de la rejilla —entre «Masajes» y
 * «Restaurante»— se lee como una categoría más.
 */
export function ordenarCategorias<T extends { nombre: string }>(categorias: readonly T[]): T[] {
  const esResto = (nombre: string) => /^otr[oa]s?$/.test(normalizarNombre(nombre))
  return [...categorias].sort(
    (a, b) =>
      Number(esResto(a.nombre)) - Number(esResto(b.nombre)) ||
      compararNombres(a.nombre, b.nombre),
  )
}

/** ¿Casa el comercio con la búsqueda libre? Nombre, categoría o ciudad. */
function casaBusqueda(comercio: ComercioFiltrable, busqueda: string): boolean {
  if (!busqueda) return true
  const campos = [comercio.nombre, comercio.categoriaNombre ?? '', ...comercio.ciudades]
  return campos.some((campo) => normalizarNombre(campo).includes(busqueda))
}

/**
 * Filtra y ordena el directorio. No muta la lista de entrada.
 *
 * Los tres filtros se combinan con Y: categoría Y ciudad Y búsqueda. Es lo
 * que espera quien los va sumando para acotar.
 */
export function filtrarDirectorio<T extends ComercioFiltrable>(
  comercios: readonly T[],
  filtros: FiltrosDirectorio,
): T[] {
  const busqueda = normalizarNombre(filtros.q)

  const filtrados = comercios.filter(
    (c) =>
      (filtros.categoriaId === null || c.categoriaId === filtros.categoriaId) &&
      (filtros.ciudadId === null || c.ciudadIds.includes(filtros.ciudadId)) &&
      casaBusqueda(c, busqueda),
  )

  const signo = filtros.orden === 'za' ? -1 : 1
  return filtrados.sort((a, b) => signo * compararNombres(a.nombre, b.nombre))
}

/** ¿Hay algún filtro puesto? Decide el texto del estado vacío. */
export function hayFiltros(filtros: FiltrosDirectorio): boolean {
  return Boolean(filtros.q) || filtros.categoriaId !== null || filtros.ciudadId !== null
}
