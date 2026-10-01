import type { CSSProperties } from 'react'

/*
  LAS CLASES DE ANIMACIÓN DE LA FACHADA, en un solo sitio
  ---------------------------------------------------------------------------
  Las animaciones viven en `globals.css` (`.revelar-vista` y sus variantes,
  `.entrada-carga`); esto solo decide QUÉ clase le toca a cada pieza, para
  que ningún componente escriba a mano el ciclo del escalonado.

  Regla de uso: van en ENVOLTORIOS, nunca en un elemento que se levanta al
  apuntar (`Button`, las tarjetas). Una animación con `fill: both` fija su
  `translate` final y le ganaría al `translate` del hover: el botón dejaría
  de levantarse sin que nada fallara a la vista.
*/

/** Revelado al desplazar, en los dos sentidos. */
export const REVELAR = 'revelar-vista'

/** Entra desde la izquierda (columna de texto de una sección a dos columnas). */
export const REVELAR_IZQ = 'revelar-vista revelar-izq'

/** Entra desde la derecha (la columna de imagen o de tarjetas). */
export const REVELAR_DER = 'revelar-vista revelar-der'

/**
 * Revelado escalonado para piezas de una misma fila: la primera entra, la
 * segunda un poco después, la tercera después, y el ciclo vuelve a empezar.
 * Ciclo de tres, no de N: con cinco tarjetas en fila, la quinta llegaría
 * tarde y se leería como lentitud (el tope de `CLAUDE.md` para escalonar).
 */
export function revelarEscalonado(indice: number): string {
  const paso = indice % 3
  return paso === 0 ? REVELAR : `${REVELAR} revelar-paso-${paso + 1}`
}

/** Clase de la entrada al cargar la página. */
export const ENTRADA = 'entrada-carga'

/**
 * El retardo de la entrada al cargar, como token inyectado —el único uso de
 * `style` que la norma admite—. El paso sale de `--escalonado` (40 ms) y se
 * multiplica, así que cambiar el token cambia el ritmo de toda la portada.
 */
export function retardoEntrada(orden: number): CSSProperties {
  return { '--retardo-entrada': `calc(var(--escalonado) * ${orden * 2})` } as CSSProperties
}
