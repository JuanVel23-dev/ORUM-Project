/*
  EL ENCUADRE EN UN MARCO CUALQUIERA  ·  funciones puras (04/10/2026)
  ---------------------------------------------------------------------------
  `encuadre.ts` resuelve la foto del socio: un círculo, y la imagen siempre lo
  CUBRE. Cuando el comercio empezó a subir su logotipo y sus fotos hicieron
  falta dos cosas que aquel módulo no sabe hacer, y no se le añadieron para
  no tocar una geometría ya probada y en producción:

    · UN MARCO QUE NO ES CUADRADO. Las fotos del negocio van a 16:9.
    · ALEJAR HASTA QUE QUEPA. Un logotipo apaisado no se puede «cubrir» sin
      cortarle las letras: tiene que poder verse ENTERO, con aire alrededor.

  Mismo modelo y mismas unidades que `encuadre.ts`, generalizados:

    UNA SOLA UNIDAD: el ANCHO del marco vale 1. Su alto vale `proporcion`
    (1 en un cuadrado, 9/16 en un apaisado). El desplazamiento se guarda en
    esa unidad —en los dos ejes—, así que no depende de cuántos píxeles mida
    el escenario y la exportación a cualquier tamaño es la misma cuenta.

    El modelo de la imagen, en el orden en que se aplica:
      1. Se escala a `escalaCubrir`: la imagen YA GIRADA tapa el marco justo.
      2. Se multiplica por el `zoom` (1 = cubrir; menos, alejar; más, acercar).
      3. Se gira `giro` grados (múltiplos de 90).
      4. Se desplaza `x`, `y` desde el centro del marco.

  La diferencia con el círculo, que no es obvia: la escala de «cubrir»
  depende del GIRO. En un cuadrado el lado corto es el mismo girado o sin
  girar; en un marco apaisado, una foto vertical girada 90° pasa a cubrirlo
  con otra escala. Por eso aquí todas las funciones reciben el giro.
*/

import { ZOOM_MAX, dimensionesGiradas, type Encuadre, type Giro } from './encuadre'

export type Marco = {
  /** Alto del marco en anchos de marco: 1 = cuadrado; 9/16 = apaisado 16:9. */
  proporcion: number
  /**
   * `true`: se puede alejar hasta que la imagen QUEPA entera, con margen (un
   * logotipo). `false`: el marco siempre queda cubierto (una fotografía).
   */
  permiteContener?: boolean
  /**
   * El marco se enseña como CÍRCULO (el logotipo, en `ComercioLogo`). Cambia
   * qué es «caber entero»: en un círculo no basta con que la imagen quepa en
   * el cuadrado —las esquinas se le saldrían por la curva—; tiene que caber su
   * DIAGONAL. Solo tiene sentido con `proporcion: 1`.
   */
  circular?: boolean
}

/**
 * Cuánto más se puede alejar un logotipo, pasado el punto en que cabe justo:
 * al 80 % queda con aire alrededor, que es como se ve bien dentro del círculo.
 */
const MARGEN_AL_CONTENER = 0.8

function acotar(valor: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, valor))
}

/** Escala (anchos de marco por píxel natural) a la que la imagen girada CUBRE el marco. */
export function escalaCubrir(ancho: number, alto: number, giro: Giro, proporcion: number): number {
  const g = dimensionesGiradas(ancho, alto, giro)
  return Math.max(1 / g.ancho, proporcion / g.alto)
}

/**
 * El zoom (≤ 1) al que la imagen girada CABE entera en el marco, justa. En un
 * marco circular, cabe su diagonal: un logotipo apaisado que solo cupiera en
 * el cuadrado saldría con las puntas cortadas por el círculo.
 */
export function zoomQueContiene(
  ancho: number,
  alto: number,
  giro: Giro,
  proporcion: number,
  circular = false,
): number {
  const g = dimensionesGiradas(ancho, alto, giro)
  const contener = circular
    ? 1 / Math.hypot(g.ancho, g.alto)
    : Math.min(1 / g.ancho, proporcion / g.alto)
  return contener / escalaCubrir(ancho, alto, giro, proporcion)
}

/** Lo más que se puede alejar en este marco: 1 si siempre cubre. */
export function zoomMinimo(ancho: number, alto: number, giro: Giro, marco: Marco): number {
  if (!marco.permiteContener) return 1
  return zoomQueContiene(ancho, alto, giro, marco.proporcion, marco.circular) * MARGEN_AL_CONTENER
}

/**
 * De dónde se parte al abrir una imagen. Una fotografía, cubriendo el marco.
 * Un logotipo, ENTERO: abrirlo recortado obligaría a alejarlo cada vez, y lo
 * primero que se quiere ver es que está todo.
 *
 * `comoSeVe`: la imagen YA está publicada y se abre para retocarla. Entonces
 * arranca como se ve hoy, no «entera en el círculo»: la placa enseña el
 * logotipo con `object-fit: contain` en su caja CUADRADA, así que uno que ya
 * se ajustó aquí (cuadrado) se abre a zoom 1, tal cual. Arrancar por la
 * diagonal lo encogería un poco cada vez que se abre y se guarda sin tocar.
 */
export function encuadreInicialEnMarco(
  ancho: number,
  alto: number,
  marco: Marco,
  comoSeVe = false,
): Encuadre {
  const zoom = marco.permiteContener
    ? zoomQueContiene(ancho, alto, 0, marco.proporcion, marco.circular && !comoSeVe)
    : 1
  return { x: 0, y: 0, zoom, giro: 0 }
}

/**
 * El encuadre más cercano que respeta el marco. En el eje donde la imagen es
 * MAYOR que el marco, no se separa del borde (no deja hueco). En el eje donde
 * es menor —solo pasa al alejar un logotipo— se queda centrada: no hay nada
 * que encuadrar, y dejarla moverse la pegaría a un lado sin motivo.
 */
export function limitarEnMarco(e: Encuadre, ancho: number, alto: number, marco: Marco): Encuadre {
  const zoom = acotar(e.zoom, zoomMinimo(ancho, alto, e.giro, marco), ZOOM_MAX)
  const g = dimensionesGiradas(ancho, alto, e.giro)
  const escala = escalaCubrir(ancho, alto, e.giro, marco.proporcion) * zoom
  const holguraX = Math.max(0, (g.ancho * escala - 1) / 2)
  const holguraY = Math.max(0, (g.alto * escala - marco.proporcion) / 2)
  return {
    // `+ 0` convierte un −0 en 0: igual en pantalla, distinto en una prueba.
    x: acotar(e.x, -holguraX, holguraX) + 0,
    y: acotar(e.y, -holguraY, holguraY) + 0,
    zoom,
    giro: e.giro,
  }
}

/**
 * Cambia el zoom manteniendo quieto el centro del marco: el desplazamiento
 * crece en la misma proporción que la imagen.
 */
export function zoomEnMarco(
  e: Encuadre,
  zoom: number,
  ancho: number,
  alto: number,
  marco: Marco,
): Encuadre {
  const nuevo = acotar(zoom, zoomMinimo(ancho, alto, e.giro, marco), ZOOM_MAX)
  const factor = nuevo / e.zoom
  return limitarEnMarco({ ...e, zoom: nuevo, x: e.x * factor, y: e.y * factor }, ancho, alto, marco)
}

/**
 * Gira un cuarto de vuelta a la derecha. El desplazamiento gira con la
 * imagen. El `zoom` se conserva como NÚMERO, pero su significado cambia con
 * el giro (es relativo a «cubrir», y cubrir depende del giro): `limitarEnMarco`
 * lo devuelve a su rango si el giro lo dejó fuera.
 */
export function girarEnMarco(e: Encuadre, ancho: number, alto: number, marco: Marco): Encuadre {
  const giro = ((e.giro + 90) % 360) as Giro
  return limitarEnMarco({ ...e, giro, x: -e.y, y: e.x }, ancho, alto, marco)
}
