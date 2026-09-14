'use client'

import { useEffect, useRef, type ReactNode } from 'react'
import { animate } from 'motion'
import { SPRING_POP, prefiereMovimientoReducido } from '@/lib/shared/motion'

/**
 * El carnet APARECE.
 *
 * `SPRING_POP` (bounce 0.2) es exactamente el caso para el que se creó: algo
 * que llega por encima. En navegación y en cambios de dato el rebote sigue
 * prohibido; aquí celebra la llegada del objeto que el socio vino a ver.
 *
 * POR QUÉ IMPERATIVO Y EN UN EFECTO, y no `<motion.div initial={…}>`:
 * `initial` se serializa en el HTML del servidor, así que sin JavaScript —o
 * con la hidratación caída— el carnet se quedaría en `opacity: 0` para
 * siempre. Es la pantalla que se enseña en la caja: no puede depender de que
 * el cliente arranque. Partiendo del estado final y animando desde el
 * inicial, el peor caso es que no haya animación. Es el mismo patrón que usan
 * `modal.tsx` y `sheet.tsx`.
 *
 * Movimiento reducido no es «sin feedback»: el carnet sigue entrando, por
 * opacidad, sin desplazamiento ni escala (lo vestibular).
 */
export function CarnetAparece({
  className,
  children,
}: {
  className?: string
  children: ReactNode
}) {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const el = ref.current
    if (!el) return

    if (prefiereMovimientoReducido()) {
      animate(el, { opacity: [0, 1] }, { duration: 0.2 })
      return
    }

    // Solo `transform` y `opacity`: nada que recalcule layout por fotograma.
    animate(
      el,
      {
        opacity: [0, 1],
        transform: ['scale(0.97) translateY(10px)', 'scale(1) translateY(0px)'],
      },
      SPRING_POP,
    )
  }, [])

  return (
    <div ref={ref} className={className}>
      {children}
    </div>
  )
}
