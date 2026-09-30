/*
  EL ENCUADRE DE LA FOTO DEL SOCIO  ·  funciones puras

  El editor de «Mi foto» deja mover, acercar y girar la imagen bajo un
  círculo. Toda la geometría vive aquí, sin DOM ni `canvas`, para poder
  probarla: es donde un error de signo deja un borde vacío en el carnet.

  UNA SOLA UNIDAD: el diámetro del círculo de recorte vale 1. El desplazamiento
  se guarda en esa unidad, así que no depende de cuántos píxeles mida el
  escenario —cambia con la pantalla— y la exportación a cualquier tamaño es la
  misma cuenta multiplicada.

  El modelo de la imagen, en el orden en que se aplica:
    1. Se escala a `escalaBase` (el lado corto mide justo el círculo: CUBRE).
    2. Se multiplica por el `zoom` (1 = cubrir; más, acercar).
    3. Se gira `giro` grados (múltiplos de 90).
    4. Se desplaza `x`, `y` desde el centro del círculo.
*/

export type Giro = 0 | 90 | 180 | 270

export type Encuadre = {
  /** Desplazamiento del centro de la imagen, en diámetros del círculo. */
  x: number
  y: number
  /** 1 = la imagen cubre el círculo justo; hasta `ZOOM_MAX`. */
  zoom: number
  giro: Giro
}

export const ZOOM_MIN = 1
export const ZOOM_MAX = 4

export const ENCUADRE_INICIAL: Encuadre = { x: 0, y: 0, zoom: 1, giro: 0 }

/** Escala (diámetros por píxel natural) a la que el lado corto cubre el círculo. */
export function escalaBase(ancho: number, alto: number): number {
  return 1 / Math.min(ancho, alto)
}

/** Ancho y alto de la imagen ya girada, en píxeles naturales. */
export function dimensionesGiradas(ancho: number, alto: number, giro: Giro) {
  return giro === 90 || giro === 270 ? { ancho: alto, alto: ancho } : { ancho, alto }
}

function acotar(valor: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, valor))
}

/**
 * El encuadre más cercano que deja el círculo CUBIERTO: la imagen nunca se
 * separa del borde, así que el carnet nunca sale con un hueco. Acota también
 * el zoom a su rango.
 */
export function limitarEncuadre(e: Encuadre, ancho: number, alto: number): Encuadre {
  const zoom = acotar(e.zoom, ZOOM_MIN, ZOOM_MAX)
  const g = dimensionesGiradas(ancho, alto, e.giro)
  const base = escalaBase(ancho, alto)
  const holguraX = Math.max(0, (g.ancho * base * zoom - 1) / 2)
  const holguraY = Math.max(0, (g.alto * base * zoom - 1) / 2)
  return {
    // `+ 0` convierte un −0 en 0: igual en pantalla, distinto en una prueba.
    x: acotar(e.x, -holguraX, holguraX) + 0,
    y: acotar(e.y, -holguraY, holguraY) + 0,
    zoom,
    giro: e.giro,
  }
}

/**
 * Cambia el zoom manteniendo quieto el centro del círculo: el desplazamiento
 * crece en la misma proporción que la imagen, así lo que estaba en el centro
 * sigue en el centro al acercar.
 */
export function conZoom(e: Encuadre, zoom: number, ancho: number, alto: number): Encuadre {
  const nuevo = acotar(zoom, ZOOM_MIN, ZOOM_MAX)
  const factor = nuevo / e.zoom
  return limitarEncuadre({ ...e, zoom: nuevo, x: e.x * factor, y: e.y * factor }, ancho, alto)
}

/**
 * Gira un cuarto de vuelta a la derecha (el sentido de `rotate()` en CSS,
 * con la y hacia abajo). El desplazamiento gira con la imagen, para que el
 * mismo detalle siga bajo el círculo.
 */
export function girar(e: Encuadre, ancho: number, alto: number): Encuadre {
  const giro = ((e.giro + 90) % 360) as Giro
  return limitarEncuadre({ ...e, giro, x: -e.y, y: e.x }, ancho, alto)
}
