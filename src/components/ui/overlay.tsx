'use client'

import type { ReactNode } from 'react'
import { ESCRITORIO, useMediaQuery } from '@/components/use-media-query'
import { Modal } from './modal'
import { Sheet, type Detent } from './sheet'

/**
 * Contenido que aparece POR ENCIMA, con dos caras según el dispositivo.
 *
 * - **Escritorio:** diálogo centrado. Hay ratón y espacio de sobra; el centro
 *   de la pantalla es donde mira el ojo tras hacer clic.
 * - **Móvil:** hoja inferior con detents. Nace en la zona del pulgar, se
 *   arrastra y se descarta con un gesto, y deja ver el fondo.
 *
 * No son dos componentes: es uno con dos presentaciones. Quien lo usa escribe
 * el contenido una vez y no piensa en el dispositivo.
 *
 * Existe para no navegar. Un formulario de dos campos no merece una página
 * entera: sacaba al usuario de su contexto, perdía la posición de scroll de la
 * lista y costaba dos navegaciones (ir y volver) en lugar de cero.
 */

type Props = {
  open: boolean
  onClose: () => void
  title?: string
  description?: string
  footer?: ReactNode
  /** Ancho del diálogo en escritorio. */
  width?: string
  /**
   * Altura inicial de la hoja en móvil. Según la HIG: `medium` cuando el
   * contenido cabe y conviene seguir viendo el fondo; `large` cuando solo es
   * útil a pantalla completa.
   */
  detent?: Detent
  children?: ReactNode
}

export function Overlay({
  open,
  onClose,
  title,
  description,
  footer,
  width,
  detent = 'large',
  children,
}: Props) {
  const enEscritorio = useMediaQuery(ESCRITORIO)

  if (enEscritorio) {
    return (
      <Modal
        open={open}
        onClose={onClose}
        title={title}
        description={description}
        footer={footer}
        width={width}
      >
        {children}
      </Modal>
    )
  }

  return (
    <Sheet
      open={open}
      onClose={onClose}
      title={title}
      description={description}
      footer={footer}
      detent={detent}
    >
      {children}
    </Sheet>
  )
}
