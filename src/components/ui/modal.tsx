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

/*
  LA PÁGINA DE DETRÁS NO DESPLAZA mientras haya un diálogo abierto. `showModal`
  la deja inerte, pero NO le quita el desplazamiento: con el carnet abierto en
  el teléfono, arrastrar movía el catálogo por debajo. Un contador, porque los
  diálogos se apilan (el carnet sobre la ficha): el fondo se suelta al cerrar
  el último. El relleno compensa la barra de desplazamiento que desaparece,
  para que la página no dé un salto lateral en escritorio.
*/
let bloqueos = 0
let previo = { overflow: '', paddingRight: '' }

function bloquearFondo(): () => void {
  const raiz = document.documentElement
  if (bloqueos === 0) {
    previo = { overflow: raiz.style.overflow, paddingRight: raiz.style.paddingRight }
    const barra = window.innerWidth - raiz.clientWidth
    raiz.style.overflow = 'hidden'
    if (barra > 0) raiz.style.paddingRight = `${barra}px`
  }
  bloqueos += 1

  let suelto = false
  return () => {
    if (suelto) return
    suelto = true
    bloqueos -= 1
    if (bloqueos === 0) {
      raiz.style.overflow = previo.overflow
      raiz.style.paddingRight = previo.paddingRight
    }
  }
}

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
  /**
   * El contenido ES la superficie: sin panel, sin cabecera, sin X ni relleno.
   * Quien lo usa pinta su propio fondo y su propia salida (el carnet del
   * socio, que es la ventana entera y lleva la X dentro). Se conservan el
   * `<dialog>` nativo, el velo, Escape, el clic fuera y las animaciones.
   */
  desnudo?: boolean
  /** Clase extra del `<dialog>` (p. ej. un `::backdrop` propio del visor de fotos). */
  className?: string
  /**
   * `false` para una ventana con un formulario a medio llenar que no debe
   * perderse por un toque en el velo (la venta en la caja): solo la cierran
   * su propia X y Escape. Por defecto, pulsar fuera cierra.
   */
  cerrarAlPulsarFuera?: boolean
  /**
   * Escape (y el «atrás» de Android) en una ventana con PASOS: vuelve un paso
   * en vez de cerrarla (el ajuste de una imagen en «Mi negocio» vuelve a la
   * rejilla). Sin él, Escape llama a `onClose`.
   */
  onAtras?: () => void
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
  desnudo = false,
  className,
  cerrarAlPulsarFuera = true,
  onAtras,
  children,
}: Props) {
  const ref = useRef<HTMLDialogElement>(null)
  const cerrando = useRef(false)
  /** Lo que React quiere AHORA; lo consulta el final de una salida en vuelo. */
  const quiereAbierto = useRef(open)
  /** Cada salida lleva su turno: una salida vieja no cierra por una nueva. */
  const turno = useRef(0)
  /** Dónde empezó la pulsación: ver `alPulsar`. */
  const pulsacionEnFondo = useRef(false)

  /** Anima la salida y solo entonces cierra de verdad el diálogo. */
  const cerrarConAnimacion = useCallback(() => {
    const dialogo = ref.current
    if (!dialogo || cerrando.current) return
    cerrando.current = true
    const miTurno = ++turno.current

    // Marca el cierre para que el ::backdrop se desvanezca a la vez que el
    // panel. Es un pseudo-elemento: solo CSS puede animarlo.
    dialogo.classList.add(styles.cerrando)

    /*
      Si mientras salía se volvió a abrir (cerrar y pulsar «Carnet» en el
      mismo cuarto de segundo), esta salida ya NO cierra. Antes cerraba
      igual: el `<dialog>` quedaba cerrado con `open` en `true`, y como el
      estado no cambiaba, ningún clic posterior volvía a abrirlo.
    */
    const fin = () => {
      if (turno.current !== miTurno || quiereAbierto.current) return
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
    quiereAbierto.current = open

    if (open) {
      // Reabierto a media salida: esa salida queda anulada (ver `fin`).
      if (cerrando.current) {
        turno.current += 1
        cerrando.current = false
        dialogo.classList.remove(styles.cerrando)
      }
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

  // El fondo, quieto mientras esté abierto (y se suelta al desmontar).
  useEffect(() => {
    if (!open) return
    return bloquearFondo()
  }, [open])

  /*
    SOLO LOS EVENTOS DE ESTE DIÁLOGO (04/10/2026). En el DOM, `cancel` y
    `close` de un `<dialog>` no burbujean; en React SÍ: React los reparte por
    todo el árbol de componentes, de hijo a padre. Y llegan dos que no son de
    esta ventana:

      · El `cancel` de un `<input type="file">` (Chrome 113+), que se dispara
        al cerrar el selector de archivos sin elegir nada — y ese sí burbujea
        también en el DOM. Cancelar el selector cerraba la ventana entera:
        «Mi negocio», «Mi foto», la imagen de un comercio en administración.
      · El `cancel` y el `close` de un diálogo ANIDADO: la confirmación de
        «Quitar» dentro de «Mi negocio», el visor de fotos dentro de la ficha.
        Cerrar el de arriba cerraba también el de abajo.

    Por eso los dos manejadores miran que el evento sea del propio diálogo.
  */
  const esDeEsteDialogo = (e: React.SyntheticEvent<HTMLDialogElement>) =>
    e.target === e.currentTarget

  // Escape dispara `cancel`. Se intercepta para que el cierre lo decida React
  // (vía onClose, u `onAtras` si la ventana tiene pasos) y no el navegador
  // saltándose la animación.
  const alCancelar = (e: React.SyntheticEvent<HTMLDialogElement>) => {
    if (!esDeEsteDialogo(e)) return
    e.preventDefault()
    ;(onAtras ?? onClose)()
  }

  /*
    El navegador puede cerrar el diálogo por su cuenta, sin pasar por `cancel`
    (Chrome lo hace al segundo Escape o al segundo «atrás» de Android seguidos).
    Si React sigue creyéndolo abierto, se le avisa: si no, la ventana quedaba
    cerrada con el estado en «abierta» y no volvía a abrirse. Aquí va SIEMPRE
    a `onClose`, nunca a `onAtras`: el diálogo ya está cerrado de verdad.
  */
  const alCerrarNativo = (e: React.SyntheticEvent<HTMLDialogElement>) => {
    if (!esDeEsteDialogo(e)) return
    if (quiereAbierto.current) onClose()
  }

  // Clic fuera del contenido = clic sobre el propio <dialog>, que ocupa solo
  // la caja del panel; el área restante es el ::backdrop.
  //
  // Solo cuenta si la pulsación EMPEZÓ también fuera. Un arrastre que nace
  // dentro (mover la barra de zoom del editor de foto, seleccionar texto) y
  // se suelta sobre el velo produce un `click` cuyo destino es el diálogo, y
  // cerraba la ventana a mitad de la tarea.
  const alApretar = (e: React.PointerEvent<HTMLDialogElement>) => {
    pulsacionEnFondo.current = e.target === ref.current
  }
  const alPulsar = (e: React.MouseEvent<HTMLDialogElement>) => {
    const enFondo = pulsacionEnFondo.current
    pulsacionEnFondo.current = false
    if (cerrarAlPulsarFuera && e.target === ref.current && enFondo) onClose()
  }

  const tieneCabecera = Boolean(title || description || !hideClose)

  return (
    <dialog
      ref={ref}
      className={[styles.dialog, desnudo && styles.desnudo, className].filter(Boolean).join(' ')}
      style={{ '--ancho': width } as CSSProperties}
      onCancel={alCancelar}
      onClose={alCerrarNativo}
      onPointerDown={alApretar}
      onClick={alPulsar}
      aria-labelledby={title ? 'modal-titulo' : undefined}
      aria-label={!title && ariaLabel ? ariaLabel : undefined}
    >
      {desnudo ? (
        children
      ) : (
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
            /* El marco pinta la pista de «hay más abajo» de borde a borde,
               por encima de la barra del cuerpo (ver `modal.module.css`). */
            <div className={styles.marcoCuerpo}>
              <div
                /* La barra de desplazamiento con diseño (`globals.css`). */
                data-barra=""
                className={[styles.cuerpo, !tieneCabecera && styles.cuerpoSinCabecera]
                  .filter(Boolean)
                  .join(' ')}
              >
                {children}
              </div>
            </div>
          )}

          {footer && <div className={styles.pie}>{footer}</div>}
        </div>
      )}
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
