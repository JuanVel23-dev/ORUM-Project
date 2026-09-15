'use client'

import { useCallback, useEffect, useRef, type CSSProperties, type ReactNode } from 'react'
import { animate } from 'motion'
import { X } from 'lucide-react'
import {
  SPRING_UI,
  TWEEN_REDUCIDO,
  leerTransformEnPantalla,
  prefiereMovimientoReducido,
  salidaDe,
  transicionSegunPreferencia,
} from '@/lib/shared/motion'
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
  /** Nombre accesible del diálogo cuando NO hay `title` visible. */
  ariaLabel?: string
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
  ariaLabel,
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

    // Marca el cierre para que el ::backdrop se desvanezca a la vez que el
    // panel. Es un pseudo-elemento: solo CSS puede animarlo.
    dialogo.classList.add(styles.cerrando)

    const fin = () => {
      dialogo.close()
      dialogo.classList.remove(styles.cerrando)
      cerrando.current = false
    }

    if (prefiereMovimientoReducido()) {
      animate(dialogo, { opacity: 0 }, TWEEN_REDUCIDO).finished.then(fin, fin)
      return
    }

    /*
      Sale por el MISMO camino por el que entró (spec §5.4): encogiendo hacia
      su centro. Entrar de una forma y salir de otra desorienta.

      v4 §5: aquí había una curva ESCRITA A MANO, `[0.7, 0, 0.84, 0]`, que es
      un `ease-in` — la única curva que esta dirección prohíbe en interfaz,
      porque empieza lenta justo en el instante en que el usuario más mira. Y
      además era un literal, así que no se veía en ninguna búsqueda de tokens.
      Ahora es el mismo resorte de la entrada recortado por `salidaDe()`: mismo
      carácter, ~0,20 s en vez de 0,30, sin rebote. La salida es más rápida que
      la entrada, que es la regla 3.
    */
    animate(
      dialogo,
      { opacity: 0, transform: 'scale(0.96)' },
      salidaDe(SPRING_UI),
    ).finished.then(fin, fin)
  }, [])

  useEffect(() => {
    const dialogo = ref.current
    if (!dialogo) return

    if (open) {
      if (!dialogo.open) dialogo.showModal()

      /*
        INTERRUMPIBLE (v3 §3.3): se arranca desde lo que HAY PINTADO, no desde
        un 0.96 fijo. Si el diálogo se reabre mientras todavía se estaba
        encogiendo al cerrarse, partir del valor lógico lo haría saltar a 0.96
        antes de crecer — y ese salto se ve, por bueno que sea el resorte que
        viene después.
      */
      const { escala } = leerTransformEnPantalla(dialogo)
      const desde = escala > 0 && escala < 1 ? escala : 0.96

      const reducido = prefiereMovimientoReducido()
      animate(
        dialogo,
        reducido
          ? { opacity: [0, 1] }
          : { opacity: [0, 1], transform: [`scale(${desde})`, 'scale(1)'] },
        transicionSegunPreferencia(SPRING_UI, reducido),
      )
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
      aria-label={!title && ariaLabel ? ariaLabel : undefined}
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
