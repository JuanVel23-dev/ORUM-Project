'use client'

import { useCallback, useEffect, useRef, type CSSProperties, type ReactNode } from 'react'
import { animate } from 'motion'
import { X } from 'lucide-react'
import { SPRING_UI, prefiereMovimientoReducido } from '@/lib/motion'
import { Button } from './button'
import styles from './modal.module.css'

/*
  Construido sobre `<dialog>` nativo a propósito. El elemento aporta de serie
  focus trap, capa superior, bloqueo del fondo, cierre con Escape y el
  pseudo-elemento ::backdrop. Reimplementar todo eso a mano es justo donde
  viven los bugs de accesibilidad de los modales caseros.
*/

type Props = {
  open: boolean
  onClose: () => void
  title?: string
  description?: string
  /** Botonera inferior. En móvil se apila invertida (la acción principal arriba). */
  footer?: ReactNode
  /** Ancho máximo del diálogo. */
  width?: string
  /** Oculta la X. Úsalo solo si el pie ya ofrece una salida clara. */
  hideClose?: boolean
  children?: ReactNode
}

export function Modal({
  open,
  onClose,
  title,
  description,
  footer,
  width = '480px',
  hideClose = false,
  children,
}: Props) {
  const ref = useRef<HTMLDialogElement>(null)
  const cerrando = useRef(false)

  /** Anima la salida y solo entonces cierra de verdad el diálogo. */
  const cerrarConAnimacion = useCallback(() => {
    const dialogo = ref.current
    if (!dialogo || cerrando.current) return
    cerrando.current = true

    const fin = () => {
      dialogo.close()
      cerrando.current = false
    }

    if (prefiereMovimientoReducido()) {
      animate(dialogo, { opacity: 0 }, { duration: 0.15 }).finished.then(fin, fin)
      return
    }

    // Sale por el MISMO camino por el que entró (spec §5.4): encogiendo hacia
    // su centro. Entrar de una forma y salir de otra desorienta.
    animate(
      dialogo,
      { opacity: 0, transform: 'scale(0.96)' },
      { duration: 0.18, ease: [0.7, 0, 0.84, 0] },
    ).finished.then(fin, fin)
  }, [])

  useEffect(() => {
    const dialogo = ref.current
    if (!dialogo) return

    if (open) {
      if (!dialogo.open) dialogo.showModal()

      if (prefiereMovimientoReducido()) {
        animate(dialogo, { opacity: [0, 1] }, { duration: 0.15 })
      } else {
        animate(
          dialogo,
          { opacity: [0, 1], transform: ['scale(0.96)', 'scale(1)'] },
          SPRING_UI,
        )
      }
    } else if (dialogo.open) {
      cerrarConAnimacion()
    }
  }, [open, cerrarConAnimacion])

  // Escape dispara `cancel`. Se intercepta para que el cierre lo decida React
  // (vía onClose) y no el navegador saltándose la animación.
  const alCancelar = (e: React.SyntheticEvent<HTMLDialogElement>) => {
    e.preventDefault()
    onClose()
  }

  // Clic fuera del contenido = clic sobre el propio <dialog>, que ocupa solo
  // la caja del panel; el área restante es el ::backdrop.
  const alPulsar = (e: React.MouseEvent<HTMLDialogElement>) => {
    if (e.target === ref.current) onClose()
  }

  const tieneCabecera = Boolean(title || description || !hideClose)

  return (
    <dialog
      ref={ref}
      className={styles.dialog}
      style={{ '--ancho': width } as CSSProperties}
      onCancel={alCancelar}
      onClick={alPulsar}
      aria-labelledby={title ? 'modal-titulo' : undefined}
    >
      <div className={styles.contenido}>
        {tieneCabecera && (
          <div className={styles.cabecera}>
            <div className={styles.textos}>
              {title && (
                <h2 className={styles.titulo} id="modal-titulo">
                  {title}
                </h2>
              )}
              {description && <p className={styles.descripcion}>{description}</p>}
            </div>

            {!hideClose && (
              <button
                type="button"
                className={styles.cerrar}
                onClick={onClose}
                aria-label="Cerrar"
              >
                <X className={styles.cerrarIcono} aria-hidden="true" />
              </button>
            )}
          </div>
        )}

        {children && (
          <div
            className={[styles.cuerpo, !tieneCabecera && styles.cuerpoSinCabecera]
              .filter(Boolean)
              .join(' ')}
          >
            {children}
          </div>
        )}

        {footer && <div className={styles.pie}>{footer}</div>}
      </div>
    </dialog>
  )
}

/* ========================================================================== */

type ConfirmProps = {
  open: boolean
  onClose: () => void
  onConfirm: () => void
  title: string
  description?: string
  confirmLabel?: string
  cancelLabel?: string
  /** Usa el botón rojo. Reserva `true` para lo que no se puede deshacer. */
  destructive?: boolean
  loading?: boolean
}

/**
 * Confirmación para acciones destructivas e irreversibles.
 *
 * Usarlo de más entrena a la gente a aceptar sin leer, y entonces deja de
 * proteger de nada. Si la acción se puede deshacer, es mejor ejecutarla y
 * ofrecer "Deshacer" en un toast.
 */
export function ConfirmDialog({
  open,
  onClose,
  onConfirm,
  title,
  description,
  confirmLabel = 'Confirmar',
  cancelLabel = 'Cancelar',
  destructive = false,
  loading = false,
}: ConfirmProps) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      title={title}
      description={description}
      width="420px"
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={loading}>
            {cancelLabel}
          </Button>
          <Button
            variant={destructive ? 'danger' : 'primary'}
            onClick={onConfirm}
            loading={loading}
          >
            {confirmLabel}
          </Button>
        </>
      }
    />
  )
}
