'use client'

import { useCallback, useEffect, useRef, type CSSProperties, type ReactNode } from 'react'
import estilos from './revelar.module.css'

/*
  ENTRADA AL DESPLAZAR  ·  el escaparate se ve UNA VEZ por visitante
  ---------------------------------------------------------------------------
  El criterio de Emil Kowalski que la v4 adoptó es la frecuencia: lo que se ve
  cientos de veces al día no se anima nunca; lo que se ve una sola vez puede
  deleitar. Esta página es el extremo de esa escala —alguien que todavía no es
  socio y que decide en segundos—, así que es el sitio del producto donde el
  movimiento rinde más.

  POR QUÉ NO HAY `useState`.
  El componente no tiene estado de React: el observador escribe `data-visible`
  directamente sobre el nodo y el CSS hace el resto. Cero re-renderizados, cero
  hidratación de los hijos —que siguen siendo Server Components pasados como
  `children`— y ninguna cascada de la que `useSyncExternalStore` tendría que
  protegernos. Es una transición del DOM, no estado de la aplicación.

  EL PELIGRO REAL: QUEDARSE INVISIBLE.
  El estado inicial es «oculto», y si el JavaScript no llega nunca, la página
  entera se queda en blanco. Es el fallo más caro imaginable justo aquí. La red
  de seguridad es doble:

    1. Todo el estado oculto de los módulos que usan esto vive dentro de
       `@media (scripting: enabled)`. Sin JavaScript —o en un navegador que no
       conozca la consulta, donde el bloque entero se descarta— el contenido se
       pinta visible y sin animación. Es la degradación correcta en los dos
       sentidos.
    2. Si `IntersectionObserver` no existe, se revela de inmediato en el
       montaje sin observar nada.

  MOVIMIENTO REDUCIDO. Lo resuelve el CSS, no este archivo: se retira el
  desplazamiento y queda la opacidad, que `globals.css` además comprime a
  0,01ms. Aparecer no marea; viajar sí.
*/

type Props = {
  children: ReactNode
  /**
   * Clases del consumidor. Se añaden a la del modo, no lo sustituyen.
   */
  className?: string
  /**
   * `bloque` — el propio contenedor entra como una sola pieza. Es el caso
   * normal: un encabezado, un párrafo, una tarjeta de cierre.
   *
   * `contenedor` — el contenedor no se mueve y son sus descendientes los que
   * entran escalonados. El módulo del consumidor escribe esas reglas contra
   * `[data-visible='false'] .suClase`, porque solo él sabe QUÉ hijos escalonar
   * (`Carril` interpone su propia sección entre este nodo y las tarjetas).
   */
  modo?: 'bloque' | 'contenedor'
  /**
   * Retardo propio, en milisegundos. Para encadenar dos bloques hermanos que
   * entran a la vez en el viewport. Dentro de la banda 30–80ms de la v4.
   */
  retardo?: number
}

/**
 * Porcentaje del alto del viewport que el elemento debe haber entrado antes de
 * revelarse. Sin este recorte la entrada empieza cuando asoma el primer píxel
 * y el visitante ve la animación por el rabillo del ojo, nunca de frente.
 */
const MARGEN_INFERIOR = '-12%'

export function Revelar({ children, className, modo = 'bloque', retardo }: Props) {
  const nodoRef = useRef<HTMLElement | null>(null)

  /* Ref de callback y no `useRef` a secas: así el mismo componente serviría
     para otra etiqueta sin pelearse con el tipo concreto del elemento. */
  const asignarRef = useCallback((nodo: HTMLElement | null) => {
    nodoRef.current = nodo
  }, [])

  useEffect(() => {
    const nodo = nodoRef.current
    if (!nodo) return

    const revelar = () => {
      nodo.setAttribute('data-visible', 'true')
    }

    // Navegador sin observador: se revela y no se anima. Nunca se queda oculto.
    if (typeof IntersectionObserver === 'undefined') {
      revelar()
      return
    }

    const observador = new IntersectionObserver(
      (entradas) => {
        for (const entrada of entradas) {
          if (!entrada.isIntersecting) continue
          revelar()
          /* Se deja de observar en cuanto entra: la entrada ocurre una vez y
             re-animar al volver a subir convierte el deleite en un tic. */
          observador.disconnect()
        }
      },
      { rootMargin: `0px 0px ${MARGEN_INFERIOR} 0px`, threshold: 0.05 },
    )

    observador.observe(nodo)
    return () => observador.disconnect()
  }, [])

  const clases = [modo === 'bloque' ? estilos.bloque : estilos.contenedor, className]
    .filter(Boolean)
    .join(' ')

  return (
    <div
      ref={asignarRef}
      className={clases}
      data-visible="false"
      /* Token dinámico: el único uso de `style` que la norma admite —inyectar
         un valor, nunca maquetar—. */
      style={
        retardo ? ({ '--retardo': `${retardo}ms` } as CSSProperties) : undefined
      }
    >
      {children}
    </div>
  )
}
