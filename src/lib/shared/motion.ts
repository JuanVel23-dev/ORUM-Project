/**
 * Utilidades de movimiento de ORUM.
 *
 * Las curvas y duraciones CSS viven en `src/styles/tokens.css` y sirven para
 * lo NO gestual (hover, color, aparición simple). Este módulo cubre lo que CSS
 * no puede hacer: resortes interrumpibles, traspaso de velocidad y proyección
 * de momento.
 *
 * Referencia: spec §5 (Designing Fluid Interfaces, WWDC 2018).
 */

/**
 * Preset de resorte.
 *
 * Estructuralmente compatible con `Transition` de `motion`, pero definido aquí
 * para que la Fase A no dependa todavía del paquete (se instala en B1).
 *
 * Apple no parametriza con masa/rigidez/amortiguación, sino con dos valores
 * humanos: cuánto rebota y cuánto tarda en llegar. `bounce` y `duration` son
 * el equivalente en la web.
 */
export type SpringPreset = {
  readonly type: 'spring'
  /** 0 = críticamente amortiguado (sin overshoot). >0 = rebota. */
  readonly bounce: number
  /** Segundos hasta asentarse. No es una duración fija: un resorte no la tiene. */
  readonly duration: number
}

/**
 * Por defecto para toda la UI. Críticamente amortiguado: llega y se queda.
 *
 * El rebote se gana, no se regala: un menú que solo apareció no debe rebotar.
 * Rebote gratuito se lee como juguete, no como lujo.
 */
export const SPRING_UI: SpringPreset = {
  type: 'spring',
  bounce: 0,
  duration: 0.35,
}

/** Reposicionar un elemento (mover, reordenar). */
export const SPRING_MOVE: SpringPreset = {
  type: 'spring',
  bounce: 0,
  duration: 0.4,
}

/** Hojas y drawers. */
export const SPRING_SHEET: SpringPreset = {
  type: 'spring',
  bounce: 0.2,
  duration: 0.35,
}

/** Tras un gesto con momento (flick, lanzamiento). Aquí el rebote sí se ganó. */
export const SPRING_FLICK: SpringPreset = {
  type: 'spring',
  bounce: 0.2,
  duration: 0.4,
}

/**
 * Tasa de deceleración por defecto, equivalente a la del scroll del sistema.
 * Usar 0.99 para un comportamiento más seco.
 */
export const DECELERACION_NORMAL = 0.998

/**
 * Proyecta dónde se detendría un elemento lanzado a `velocidad`, con la misma
 * deceleración exponencial que usa el scroll nativo.
 *
 * Se usa para elegir el destino de un gesto: al soltar NO se salta al punto de
 * anclaje más cercano a la posición actual, sino al más cercano a donde el
 * gesto *iba a llegar*. Eso es lo que hace que un flick se sienta como un
 * lanzamiento real y no como un salto.
 *
 * Nota: la fórmula de libro de texto `v²/(2·a)` NO es la que usa Apple; la
 * correcta es esta forma de decaimiento exponencial.
 *
 * @param velocidad     Velocidad al soltar, en px/s (con signo).
 * @param deceleracion  Entre 0 y 1, exclusivos. Mayor = se desliza más lejos.
 * @returns Desplazamiento adicional en px, con el mismo signo que la velocidad.
 */
export function proyectarMomento(
  velocidad: number,
  deceleracion: number = DECELERACION_NORMAL,
): number {
  return ((velocidad / 1000) * deceleracion) / (1 - deceleracion)
}

/**
 * Resistencia elástica en un borde (rubber-banding).
 *
 * En un límite no se frena en seco: se resiste cada vez más. Un tope duro se
 * lee como "se congeló"; la resistencia progresiva se lee como "responde, pero
 * aquí no hay más". El resultado tiende asintóticamente a `dimension`, así que
 * nunca se despega del todo.
 *
 * @param exceso     Cuánto se ha pasado del límite, en px (con signo).
 * @param dimension  Tamaño de referencia del contenedor, en px.
 * @param constante  Dureza. Más bajo = más rígido.
 * @returns Desplazamiento amortiguado que debe aplicarse, en px.
 */
export function amortiguarBorde(
  exceso: number,
  dimension: number,
  constante = 0.55,
): number {
  if (exceso === 0 || dimension <= 0) return 0
  return (exceso * dimension * constante) / (dimension + constante * Math.abs(exceso))
}

/**
 * Convierte una velocidad absoluta (px/s) en la velocidad relativa que esperan
 * algunas APIs de resorte, normalizando por la distancia que queda.
 *
 * `motion` acepta px/s directamente, así que esto solo hace falta al integrar
 * con APIs que piden valor normalizado.
 *
 * @returns 0 si no queda distancia, para no dividir por cero.
 */
export function velocidadRelativa(
  velocidad: number,
  actual: number,
  destino: number,
): number {
  const distancia = destino - actual
  if (distancia === 0) return 0
  return velocidad / distancia
}

/**
 * ¿El usuario pidió movimiento reducido?
 *
 * Movimiento reducido no significa "sin feedback": significa un equivalente no
 * vestibular (cross-fade en vez de desplazamiento, sin overshoot). Los
 * componentes usan esto para elegir variante, no para desactivarse.
 *
 * Devuelve `false` en el servidor, donde no hay preferencia que consultar.
 */
export function prefiereMovimientoReducido(): boolean {
  if (typeof window === 'undefined' || !window.matchMedia) return false
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches
}
