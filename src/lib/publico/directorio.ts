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

/** Tope de categorías a la vez: una URL manipulada no puede pedir mil. */
const MAX_CATEGORIAS = 30

export type FiltrosDirectorio = {
  /** Texto libre, ya recortado. Cadena vacía = sin búsqueda. */
  q: string
  /**
   * Categorías elegidas, sin repetir y en orden ascendente (así la misma
   * selección da siempre la misma URL). Vacía = todas. Desde el 30/09/2026
   * se pueden elegir VARIAS (encargo del propietario).
   */
  categoriaIds: number[]
  ciudadId: number | null
  orden: OrdenDirectorio
  /**
   * Solo los favoritos del socio (`?favoritos=1`). En el directorio público
   * no hay favoritos y el parámetro no tiene efecto.
   */
  soloFavoritos: boolean
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
 * Las categorías de la URL. Acepta la lista con comas (`?categoria_id=3,7`,
 * la forma que escriben los enlaces) y el parámetro repetido
 * (`?categoria_id=3&categoria_id=7`, la que envía un formulario), y también
 * el id suelto de antes: un enlace viejo sigue funcionando. Lo que no es un
 * id se ignora.
 */
function leerCategorias(valor: string | string[] | undefined): number[] {
  const crudos = (Array.isArray(valor) ? valor : [valor ?? '']).flatMap((v) => v.split(','))
  const ids = new Set<number>()
  for (const c of crudos) {
    const id = idOnulo(c.trim())
    if (id !== null) ids.add(id)
  }
  return [...ids].sort((a, b) => a - b).slice(0, MAX_CATEGORIAS)
}

/**
 * Enciende la categoría si estaba apagada y la apaga si estaba encendida.
 * Devuelve la lista nueva, ordenada; no toca la de entrada.
 */
export function alternarCategoria(ids: readonly number[], id: number): number[] {
  const nuevas = ids.includes(id) ? ids.filter((x) => x !== id) : [...ids, id]
  return nuevas.sort((a, b) => a - b)
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
    categoriaIds: leerCategorias(params.categoria_id),
    ciudadId: idOnulo(primero(params.ciudad_id)),
    orden: orden === 'za' ? 'za' : ORDEN_POR_DEFECTO,
    soloFavoritos: primero(params.favoritos) === '1',
  }
}

/**
 * Los filtros como parámetros de URL, sin los que están en su valor por
 * defecto. Así la URL del directorio sin filtros es `/explorar` a secas.
 */
export function parametrosDirectorio(filtros: FiltrosDirectorio): Record<string, string> {
  const params: Record<string, string> = {}
  if (filtros.q) params.q = filtros.q
  if (filtros.categoriaIds.length > 0) params.categoria_id = filtros.categoriaIds.join(',')
  if (filtros.ciudadId !== null) params.ciudad_id = String(filtros.ciudadId)
  if (filtros.orden !== ORDEN_POR_DEFECTO) params.orden = filtros.orden
  if (filtros.soloFavoritos) params.favoritos = '1'
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
  /** Dónde vive el directorio: `/explorar` (público) o `/miembros` (socio). */
  base: string = '/explorar',
): string {
  const consulta = new URLSearchParams(parametrosDirectorio({ ...filtros, ...cambios }))
    .toString()
    // La coma de la lista de categorías se queda legible en la URL.
    .replace(/%2C/g, ',')
  return consulta ? `${base}?${consulta}` : base
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
 * que espera quien los va sumando para acotar. DENTRO de las categorías, O:
 * «Café» y «Restaurante» enseña los dos tipos de comercio.
 */
export function filtrarDirectorio<T extends ComercioFiltrable>(
  comercios: readonly T[],
  filtros: FiltrosDirectorio,
): T[] {
  const busqueda = normalizarNombre(filtros.q)

  const filtrados = comercios.filter(
    (c) =>
      (filtros.categoriaIds.length === 0 ||
        (c.categoriaId !== null && filtros.categoriaIds.includes(c.categoriaId))) &&
      (filtros.ciudadId === null || c.ciudadIds.includes(filtros.ciudadId)) &&
      casaBusqueda(c, busqueda),
  )

  const signo = filtros.orden === 'za' ? -1 : 1
  return filtrados.sort((a, b) => signo * compararNombres(a.nombre, b.nombre))
}

/** ¿Hay algún filtro puesto? Decide el texto del estado vacío. */
export function hayFiltros(filtros: FiltrosDirectorio): boolean {
  return (
    Boolean(filtros.q) ||
    filtros.categoriaIds.length > 0 ||
    filtros.ciudadId !== null ||
    filtros.soloFavoritos
  )
}

/**
 * Solo los comercios que el socio marcó con el corazón, conservando el orden
 * de la lista (el que ya decidió «Ordenar»). Se aplica DESPUÉS de
 * `filtrarDirectorio`: los favoritos se combinan con Y con los demás filtros.
 */
export function filtrarFavoritos<T extends { id: number }>(
  comercios: readonly T[],
  idsFavoritos: readonly number[],
): T[] {
  const favoritos = new Set(idsFavoritos)
  return comercios.filter((c) => favoritos.has(c.id))
}
