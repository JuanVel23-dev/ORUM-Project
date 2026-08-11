'use client'

import { useRouter } from 'next/navigation'
import type { ReactNode } from 'react'
import { Overlay } from '@/components/ui/overlay'
import type { Detent } from '@/components/ui/sheet'

/**
 * Envoltorio de una ruta interceptada.
 *
 * Next intercepta la navegación cuando se llega desde la pantalla de origen y
 * renderiza este contenido POR ENCIMA, sin desmontar la lista de detrás. La
 * URL sí cambia, así que:
 *
 * - El botón "atrás" del navegador cierra el overlay. Es lo que la gente ya
 *   espera, y sale gratis.
 * - Compartir o recargar la URL entra por la ruta normal, a pantalla
 *   completa. Un enlace directo nunca se rompe.
 *
 * Cerrar es `router.back()` y no `push` a la lista: así no se acumula
 * historial y se conserva la posición de scroll de donde se venía.
 */
export function OverlayRuta({
  title,
  description,
  footer,
  width,
  detent,
  children,
}: {
  title?: string
  description?: string
  footer?: ReactNode
  width?: string
  detent?: Detent
  children?: ReactNode
}) {
  const router = useRouter()

  return (
    <Overlay
      open
      onClose={() => router.back()}
      title={title}
      description={description}
      footer={footer}
      width={width}
      detent={detent}
    >
      {children}
    </Overlay>
  )
}
