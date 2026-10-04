'use client'

import { useEffect, useRef } from 'react'
import { animate } from 'motion'
import { EASE_OUT, prefiereMovimientoReducido } from '@/lib/shared/motion'

/*
  LA CIFRA QUE CUENTA  ·  de cero al total, una vez al entrar
  ---------------------------------------------------------------------------
  El total ahorrado es lo que el socio viene a ver, y es una pantalla que se
  visita de vez en cuando: aquí sí cabe un detalle (regla cero de frecuencia).
  El número sube de 0 al total con salida decelerada mientras la tarjeta
  aparece.

  · El servidor pinta el valor FINAL: sin JavaScript se ve la cifra correcta.
  · Se escribe en el nodo, sin re-render, con la forma de valor único de
    `motion` (`animate(desde, hasta, { onUpdate })`).
  · Con movimiento reducido no cuenta: la cifra está y punto.
  · Decorativa para el lector de pantalla (`aria-hidden`): el valor real lo
    dice un texto aparte, que no cambia cuarenta veces por segundo.
*/
export function CifraAnimada({ valor }: { valor: number }) {
  const ref = useRef<HTMLSpanElement>(null)

  useEffect(() => {
    const nodo = ref.current
    if (!nodo || valor <= 0 || prefiereMovimientoReducido()) return

    const final = valor.toLocaleString('es-CO')
    nodo.textContent = '0'
    const control = animate(0, valor, {
      duration: 1.1,
      delay: 0.2,
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
  }, [valor])

  return (
    <span ref={ref} aria-hidden="true">
      {valor.toLocaleString('es-CO')}
    </span>
  )
}
