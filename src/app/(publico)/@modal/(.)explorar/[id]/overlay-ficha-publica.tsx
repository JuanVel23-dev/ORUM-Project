'use client'

import { useRouter } from 'next/navigation'
import type { ReactNode } from 'react'
import { Overlay } from '@/components/ui/overlay'

/*
  EL ENVOLTORIO DE CLIENTE DE LA FICHA PÚBLICA INTERCEPTADA
  ---------------------------------------------------------------------------
  Mismo patrón que `miembros/(portal)/@modal/(.)comercios/[id]/overlay-ficha`.

  Cerrar es `router.back()`, no `router.push('/explorar')`: la ficha llegó por
  una navegación real, y retroceder es lo que conserva gratis el scroll y los
  filtros de la lista. `push` apilaría una entrada nueva y el gesto atrás del
  sistema devolvería a la ficha recién cerrada.

  Sin `title`: el `h1` con el nombre del comercio vive dentro de la ficha.
  `ariaLabel` le da nombre al diálogo sin pintarlo dos veces.
*/
export function OverlayFichaPublica({ children }: { children: ReactNode }) {
  const router = useRouter()

  return (
    <Overlay
      open
      onClose={() => router.back()}
      ariaLabel="Ficha del comercio"
      width="640px"
      detent="large"
    >
      {children}
    </Overlay>
  )
}
