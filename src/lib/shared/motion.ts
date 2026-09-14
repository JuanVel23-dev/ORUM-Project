/**
 * Utilidades de movimiento de ORUM.
 *
 * Las curvas y duraciones CSS viven en `src/styles/tokens.css` y sirven para
 * lo NO gestual (hover, color, aparición simple). Este módulo cubre lo que CSS
 * no puede hacer: resortes interrumpibles, traspaso de velocidad y proyección
 * de momento.
 *
 * Referencia: dirección de arte v3 §3 (Designing Fluid Interfaces, WWDC 2018).
 *
 * LAS SIETE REGLAS, porque el preset correcto no sirve de nada aplicado mal:
 *
 *   1. RESPONDER EN `pointerdown`, NO EN `click`. En cuanto aparece latencia, la
 *      sensación de manipulación directa se cae por un precipicio. En CSS puro
 *      el equivalente es `:active`, que el navegador activa al APRETAR.
 *   2. RESORTES, NO DURACIONES. Por defecto críticamente amortiguado
 *      (`bounce: 0`, respuesta 0,3–0,4 s). El rebote se gana.
 *   3. INTERRUMPIBLE SIEMPRE. Se anima desde el valor EN PANTALLA, nunca desde
 *      el lógico, o al agarrar algo a medio camino se ve un salto. Para eso está
 *      `leerTransformEnPantalla`.
 *   4. ENTRADA Y SALIDA POR EL MISMO CAMINO, y ANCLADAS A SU ORIGEN: lo que nace
 *      de una tarjeta crece desde esa tarjeta (`origenDesde`), no desde el
 *      centro de la pantalla.
 *   5. MATERIALIZAR, NO FUNDIR. Una superficie translúcida entra animando
 *      desenfoque y escala A LA VEZ, para que se lea como un material que llega
 *      y no como una opacidad que sube (`SPRING_MATERIAL`, `pasosMaterial`).
 *   6. SOLO `transform` Y `opacity`. Única excepción: las View Transitions, que
 *      el navegador ejecuta sobre instantáneas en el compositor.
 *   7. `prefers-reduced-motion` NO ES «SIN FEEDBACK»: es el equivalente no
 *      vestibular. Fundido corto en vez de viaje, sin rebote, sin paralaje.
 *      Para eso está `transicionSegunPreferencia`.
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

/**
 * Aparecer por encima: overlay que entra, confirmación que se resuelve, tarjeta
 * que llega a una lista.
 *
 * Lleva rebote, y es la excepción que la dirección de arte v2 abrió a la regla
 * «el rebote se gana». Sigue habiendo una frontera, y está donde estaba: esto
 * es para algo que APARECE. En navegación entre pantallas y en cambios de
 * estado de un dato el rebote sigue prohibido — allí no celebra nada, solo
 * retrasa la lectura y hace dudar de si el valor terminó de cambiar.
 */
export const SPRING_POP: SpringPreset = {
  type: 'spring',
  bounce: 0.2,
  duration: 0.3,
}

/** Tras un gesto con momento (flick, lanzamiento). Aquí el rebote sí se ganó. */
export const SPRING_FLICK: SpringPreset = {
  type: 'spring',
  bounce: 0.2,
  duration: 0.4,
}

/**
 * MATERIALIZAR, NO FUNDIR (v3 §3.5).
 *
 * Para una superficie translúcida —la hoja, el modal, la tarjeta de acceso, el
 * cromo con `backdrop-filter`— que entra animando DESENFOQUE Y ESCALA A LA VEZ.
 *
 * Por qué no vale un fundido: una opacidad que sube se lee como un fantasma
 * apareciendo. Un material que llega tiene grosor, y el grosor se percibe en el
 * desenfoque de lo que hay detrás. Animar los dos juntos es lo que convierte
 * «apareció una caja» en «llegó una placa de vidrio».
 *
 * Sin rebote: un material pesado no rebota. Y algo más lento que `SPRING_UI`
 * porque el desenfoque necesita recorrido para leerse; a 0,3 s no da tiempo a
 * verlo ocurrir y vuelve a parecer un fundido.
 *
 * ⚠️ `filter: blur()` NO corre en el compositor y viola la regla 6 si se aplica
 * a una superficie grande en cada fotograma. Aquí se anima el `backdrop-filter`
 * del CROMO FIJO —una capa, ya promocionada— nunca filas de una lista.
 */
export const SPRING_MATERIAL: SpringPreset = {
  type: 'spring',
  bounce: 0,
  duration: 0.42,
}

/**
 * ACUSE DE PRESIÓN, en `pointerdown` (v3 §3.1).
 *
 * La ida y la vuelta NO son simétricas, y ahí está todo el efecto: al apretar,
 * el elemento se encoge YA —esperar aquí es lo que hace que una interfaz se
 * sienta muerta—; al soltar, vuelve con el resorte de su categoría.
 *
 * Es el gemelo en JS de `--dur-press` / `--escala-press` de `tokens.css`, que es
 * por donde pasa el 95 % de los casos. Este preset solo hace falta cuando el
 * acuse convive con otra animación del mismo elemento y CSS no puede componerlas.
 */
export const SPRING_PRESS: SpringPreset = {
  type: 'spring',
  bounce: 0,
  duration: 0.12,
}

/**
 * Transición tipo `motion` que NO es un resorte, para el equivalente no
 * vestibular de `prefers-reduced-motion`.
 *
 * No es «sin animación»: quitar el feedback deja al usuario sin saber si su
 * toque hizo algo. Es un fundido corto, sin viaje y sin sobreimpulso.
 */
export type TweenPreset = {
  readonly duration: number
  readonly ease: readonly [number, number, number, number]
}

/** `--ease-out` de `tokens.css`, en la forma que espera `motion`. */
export const EASE_OUT = [0.16, 1, 0.3, 1] as const

/** El fundido de movimiento reducido. 0,15 s: se percibe, no se sufre. */
export const TWEEN_REDUCIDO: TweenPreset = {
  duration: 0.15,
  ease: EASE_OUT,
}

/**
 * Elige entre el resorte y su equivalente no vestibular.
 *
 * Existe para que ningún componente vuelva a escribir
 * `if (prefiereMovimientoReducido()) { … } else { … }` con dos llamadas a
 * `animate` duplicadas: la rama de accesibilidad se olvida de actualizar cuando
 * se toca la otra, y el fallo solo lo ve quien tiene la preferencia puesta.
 *
 * El segundo parámetro se inyecta para poder probar la función sin DOM; en
 * producción se deja por defecto.
 */
export function transicionSegunPreferencia<T extends SpringPreset>(
  preset: T,
  reducido: boolean = prefiereMovimientoReducido(),
): T | TweenPreset {
  return reducido ? TWEEN_REDUCIDO : preset
}

/**
 * Un resorte sin rebote a partir de otro.
 *
 * `prefers-reduced-motion` retira el sobreimpulso aunque conserve el viaje
 * —el rebote es movimiento vestibular puro—, y hay gestos donde el viaje SÍ hay
 * que conservarlo porque es lo que el dedo está haciendo: una hoja arrastrada no
 * puede dejar de seguir al dedo por una preferencia.
 */
export function sinRebote<T extends SpringPreset>(preset: T): SpringPreset {
  return { type: 'spring', bounce: 0, duration: preset.duration }
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

/** Caja en coordenadas de viewport. Compatible con `DOMRect`, sin depender de él. */
export type Caja = {
  readonly left: number
  readonly top: number
  readonly width: number
  readonly height: number
}

/**
 * ANCLAR AL ORIGEN (v3 §3.4).
 *
 * Calcula el `transform-origin` que hace que una superficie crezca DESDE el
 * elemento que la abrió, y no desde su propio centro.
 *
 * Es la diferencia entre «apareció un panel» y «esta tarjeta se abrió»: sin
 * anclaje, la relación espacial entre lo que el dedo tocó y lo que salió se
 * pierde, y al cerrar no se sabe a dónde vuelve. Con anclaje, entrada y salida
 * recorren el mismo camino (regla 4) sin necesidad de animar posición.
 *
 * Devuelve el valor listo para `style.transformOrigin`, en píxeles relativos a
 * la esquina superior izquierda de `superficie`. Se permite que caiga FUERA de
 * la superficie (valores negativos o mayores que su tamaño): es exactamente lo
 * que debe ocurrir cuando el disparador está fuera del panel, y el navegador lo
 * admite.
 *
 * Función pura: recibe cajas, no elementos. Se prueba sin DOM.
 *
 * @param origen      Caja del elemento que disparó la apertura.
 * @param superficie  Caja de la superficie que se está animando.
 */
export function origenDesde(origen: Caja, superficie: Caja): string {
  const x = origen.left + origen.width / 2 - superficie.left
  const y = origen.top + origen.height / 2 - superficie.top
  return `${redondear(x)}px ${redondear(y)}px`
}

/** Medio píxel de precisión: más decimales no se ven y ensucian el DOM. */
function redondear(v: number): number {
  return Math.round(v * 2) / 2
}

/** Lo que hay pintado ahora mismo en un elemento. */
export type TransformEnPantalla = {
  readonly x: number
  readonly y: number
  readonly escala: number
}

/** Identidad: sin desplazamiento y a tamaño natural. */
export const TRANSFORM_IDENTIDAD: TransformEnPantalla = { x: 0, y: 0, escala: 1 }

/**
 * INTERRUMPIBLE SIEMPRE (v3 §3.3): lee la transformación que el elemento tiene
 * EN PANTALLA en este instante, no la que el componente cree que tiene.
 *
 * Por qué importa y no es un refinamiento: una animación en curso se puede
 * agarrar y revertir. Si al hacerlo se arranca desde el valor LÓGICO —el del
 * estado de React, que ya es el destino— el elemento salta al destino y vuelve,
 * y ese salto es visible aunque el resorte que lo sigue sea perfecto. Arrancar
 * desde lo que hay pintado es lo que hace que un gesto se sienta continuo.
 *
 * Devuelve la identidad si no hay DOM, si el navegador no trae `DOMMatrix`, o
 * si la matriz no se puede leer: nunca lanza. Un fallo aquí debe degradar a una
 * animación normal, jamás romper la interacción.
 */
export function leerTransformEnPantalla(
  elemento: Element | null | undefined,
): TransformEnPantalla {
  if (!elemento || typeof window === 'undefined') return TRANSFORM_IDENTIDAD
  if (typeof window.DOMMatrixReadOnly !== 'function') return TRANSFORM_IDENTIDAD

  const computado = window.getComputedStyle(elemento).transform
  if (!computado || computado === 'none') return TRANSFORM_IDENTIDAD

  try {
    const m = new window.DOMMatrixReadOnly(computado)
    // `a` es el factor de escala horizontal de la matriz 2D; `e`/`f`, la
    // traslación. Basta para lo que este sistema anima: mover y escalar.
    return { x: m.e, y: m.f, escala: m.a }
  } catch {
    return TRANSFORM_IDENTIDAD
  }
}

/**
 * MATERIALIZAR, NO FUNDIR (v3 §3.5): los fotogramas de entrada de una superficie
 * translúcida, para pasárselos a `animate` tal cual.
 *
 * Desenfoque y escala ocurren A LA VEZ y por eso se declaran juntos: si el blur
 * se resolviera antes que la escala, el ojo vería primero un cristal y luego una
 * caja creciendo, que son dos sucesos y no uno.
 *
 * Con movimiento reducido devuelve solo la opacidad: el desenfoque no es
 * vestibular, pero la escala sí, y sin escala el blur solo no dice nada.
 *
 * El segundo parámetro se inyecta para poder probar sin DOM.
 */
export function pasosMaterial(
  desenfoque = 12,
  reducido: boolean = prefiereMovimientoReducido(),
): Record<string, (string | number)[]> {
  if (reducido) return { opacity: [0, 1] }
  return {
    opacity: [0, 1],
    filter: [`blur(${desenfoque}px)`, 'blur(0px)'],
    transform: ['scale(0.96)', 'scale(1)'],
  }
}
