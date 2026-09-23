/**
 * El TOP 10 DE DESCUENTOS DEL CLUB (encargo nº 13).
 *
 * Es GLOBAL, no personal: lo que más usa el club entero, igual para todos los
 * socios. No confundir con "Los que más usas", que sale de
 * `comercios_mas_usados(miembro_id)` y es privado de cada socio. Son dos
 * secciones distintas porque responden a dos preguntas distintas —«¿qué hace
 * la gente?» frente a «¿qué hago yo?»— y ninguna consulta puede servir a las
 * dos.
 *
 * Aquí solo vive la parte pura: normalizar las filas que devuelve la función
 * `top_descuentos`, descartar lo que no se puede pintar y decidir si la sección
 * merece existir. La consulta y la tolerancia al fallo viven en la página.
 */

import type { TipoBeneficioCodigo } from '@/lib/supabase/database.types'

/** Lo que devuelve `top_descuentos`, reducido a lo que esta capa necesita. */
export type FilaTopDescuento = {
  promocion_id: number
  titulo: string
  valor: number | null
  tipo_beneficio_id: number
  comercio_id: number
  comercio_nombre: string
  logo_url: string | null
  usos: number
}

/** Un descuento ya listo para pintar. */
export type TopDescuento = {
  promocionId: number
  titulo: string
  valor: number | null
  tipoCodigo: TipoBeneficioCodigo
  comercioId: number
  comercioNombre: string
  logoUrl: string | null
  usos: number
  /** Posición en el top, empezando en 1. Se pinta, así que se calcula una vez. */
  puesto: number
}

/** Cuántos pide el encargo. El nombre de la sección lo dice en voz alta. */
export const TOPE_TOP_DESCUENTOS = 10

/**
 * Mínimo para que la marquesina exista.
 *
 * TRES, y no uno. Una cinta que se desplaza sin parar con un solo elemento
 * dentro no es un top: es un elemento persiguiéndose a sí mismo, y el
 * movimiento —que es lo caro en accesibilidad— no compra nada. Por debajo del
 * mínimo la sección no se pinta y esos beneficios siguen estando en la ficha de
 * su comercio, que es donde de verdad se usan.
 */
export const MINIMO_TOP_DESCUENTOS = 3

/**
 * Convierte las filas crudas en algo pintable.
 *
 * Descarta, en este orden:
 *
 *  1. Filas sin `tipo_beneficio_id` conocido. `formatearBeneficio` necesita el
 *     CÓDIGO del tipo, no su id; sin él la píldora diría "undefined" delante
 *     del socio. Es el mismo descarte que ya hace el catálogo con sus
 *     promociones.
 *  2. Filas sin usos. `top_descuentos` no debería devolverlas, pero una función
 *     recién aplicada no es un contrato probado, y un "top" con ceros dentro
 *     miente sobre su criterio.
 *  3. Promociones repetidas. Defensa barata contra un `GROUP BY` mal escrito:
 *     el mismo beneficio dos veces en una cinta que da vueltas se lee como un
 *     fallo de la cinta, no de los datos.
 *
 * NO reordena: el orden lo decide la función de la base, que es la única que ve
 * las ventas de todos los socios. Reordenar aquí por `usos` daría lo mismo hoy
 * y taparía mañana un cambio de criterio del backend.
 */
export function prepararTopDescuentos(
  filas: readonly FilaTopDescuento[] | null | undefined,
  codigoTipo: ReadonlyMap<number, TipoBeneficioCodigo>,
  tope: number = TOPE_TOP_DESCUENTOS,
): TopDescuento[] {
  if (!filas || filas.length === 0) return []

  const vistas = new Set<number>()
  const salida: TopDescuento[] = []

  for (const f of filas) {
    if (salida.length >= tope) break

    const tipoCodigo = codigoTipo.get(f.tipo_beneficio_id)
    if (!tipoCodigo) continue
    if (!(f.usos > 0)) continue
    if (vistas.has(f.promocion_id)) continue
    vistas.add(f.promocion_id)

    salida.push({
      promocionId: f.promocion_id,
      titulo: f.titulo,
      valor: f.valor,
      tipoCodigo,
      comercioId: f.comercio_id,
      comercioNombre: f.comercio_nombre,
      logoUrl: f.logo_url,
      usos: f.usos,
      puesto: salida.length + 1,
    })
  }

  return salida
}

/** ¿Merece la pena mover algo en la pantalla por esto? */
export function mereceMarquesina(items: readonly TopDescuento[]): boolean {
  return items.length >= MINIMO_TOP_DESCUENTOS
}

/**
 * Cuánto tarda la cinta en dar una vuelta completa, en segundos.
 *
 * La velocidad tiene que ser CONSTANTE, no la duración: con una duración fija,
 * una cinta de tres elementos se arrastra y una de diez sale disparada. Lo que
 * el ojo juzga es px/s, así que se fija eso y se deriva el tiempo.
 *
 * Lenta a propósito (~22px/s de referencia). Una cinta rápida obliga a
 * perseguir el contenido, que es exactamente la queja que WCAG 2.2.2 recoge —y
 * por eso además se puede pausar—.
 */
export const VELOCIDAD_MARQUESINA_PX_S = 22

export function duracionMarquesinaSegundos(
  cantidad: number,
  anchoItemPx: number,
  velocidadPxPorSegundo: number = VELOCIDAD_MARQUESINA_PX_S,
): number {
  if (cantidad <= 0 || anchoItemPx <= 0 || velocidadPxPorSegundo <= 0) return 0
  return (cantidad * anchoItemPx) / velocidadPxPorSegundo
}
