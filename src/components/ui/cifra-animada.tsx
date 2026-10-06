'use client'

import { useEffect, useRef } from 'react'
import { animate } from 'motion'
import { EASE_OUT, prefiereMovimientoReducido } from '@/lib/shared/motion'

/*
  LA CIFRA QUE CUENTA  ·  de cero al total, una vez al entrar
  ---------------------------------------------------------------------------
  Nació en «Mis movimientos» (el total ahorrado del socio) y subió aquí el
  04/10/2026, cuando la empezó a usar también el acuse de venta de la caja:
  dos rutas, un componente.

  El número sube de 0 al total con salida decelerada mientras lo que lo
  contiene aparece.

  · Se pinta el valor FINAL: sin JavaScript se ve la cifra correcta.
  · Se escribe en el nodo, sin re-render, con la forma de valor único de
    `motion` (`animate(desde, hasta, { onUpdate })`).
  · Con movimiento reducido no cuenta: la cifra está y punto.
  · Decorativa para el lector de pantalla (`aria-hidden`): el valor real lo
    dice un texto aparte, que no cambia cuarenta veces por segundo.
*/
export function CifraAnimada({
  valor,
  duracion = 1.1,
  retardo = 0.2,
}: {
  valor: number
  /** Segundos que tarda en llegar al total. */
  duracion?: number
  /** Segundos antes de empezar a contar: para acompasarla con su entrada. */
  retardo?: number
}) {
  const ref = useRef<HTMLSpanElement>(null)

  useEffect(() => {
    const nodo = ref.current
    if (!nodo || valor <= 0 || prefiereMovimientoReducido()) return

    const final = valor.toLocaleString('es-CO')
    nodo.textContent = '0'
    const control = animate(0, valor, {
      duration: duracion,
      delay: retardo,
      ease: EASE_OUT,
      onUpdate: (v) => {
        nodo.textContent = Math.round(v).toLocaleString('es-CO')
      },
      onComplete: () => {
        nodo.textContent = final
      },
    })

    return () => {
      control.stop()
      nodo.textContent = final
    }
  }, [valor, duracion, retardo])

  return (
    <span ref={ref} aria-hidden="true">
      {valor.toLocaleString('es-CO')}
    </span>
  )
}
