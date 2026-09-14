'use client'

import { useRouter } from 'next/navigation'
import type { ReactNode } from 'react'
import { Overlay } from '@/components/ui/overlay'

/*
  EL ENVOLTORIO DE CLIENTE DE LA FICHA INTERCEPTADA
  ---------------------------------------------------------------------------
  Existe solo para dos cosas que un Server Component no puede hacer: mantener
  abierto el overlay y saber qué significa «cerrar».

  ── Cerrar es `router.back()`, no `router.push('/miembros')` ────────────────

  La ficha llegó aquí por una navegación real, así que la forma de deshacerla es
  retroceder. `push` apilaría una entrada nueva en el historial y el gesto atrás
  del sistema devolvería a la ficha que el socio acaba de cerrar — el bucle
  clásico de los modales mal montados.

  Y retroceder es además lo que conserva gratis el scroll y los filtros del
  catálogo, que viven en la URL.

  ── Por qué `detent="large"` ────────────────────────────────────────────────

  La ficha trae beneficios, sedes y acciones: en `medium` habría que desplazar
  desde el primer instante, y entonces la hoja a media altura solo sirve para
  robar espacio. Aquí la tarea del momento es leer la ficha entera.

  El `Overlay` resuelve las dos caras —diálogo centrado en escritorio, hoja
  inferior con gesto en móvil— así que aquí no se decide el dispositivo.
*/
export function OverlayFicha({ children }: { children: ReactNode }) {
  const router = useRouter()

  return (
    <Overlay
      open
      onClose={() => router.back()}
      /*
        Sin `title`: el `h1` con el nombre del comercio ya vive dentro de la
        ficha, y repetirlo en el cromo del overlay lo diría dos veces al lector
        de pantalla y lo pintaría dos veces en la hoja. El overlay queda
        etiquetado por su contenido.
      */
      width="720px"
      detent="large"
    >
      {children}
    </Overlay>
  )
}
