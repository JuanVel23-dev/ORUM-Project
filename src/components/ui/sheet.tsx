'use client'

import { useCallback, useEffect, useRef, type ReactNode } from 'react'
import { animate } from 'motion'
import { X } from 'lucide-react'
import {
  SPRING_SHEET,
  amortiguarBorde,
  prefiereMovimientoReducido,
  proyectarMomento,
} from '@/lib/shared/motion'
import styles from './sheet.module.css'

/**
 * Hoja inferior con *detents*, siguiendo las Human Interface Guidelines.
 *
 * Un detent es una altura donde la hoja descansa de forma natural. Apple
 * define dos: `medium` (≈ media pantalla) y `large` (completa). El medium
 * permite DIVULGACIÓN PROGRESIVA: se ve lo esencial sin perder de vista la
 * pantalla de detrás, y se arrastra hacia arriba solo si hace falta más.
 *
 * Criterio para elegir: `medium` cuando el contenido cabe y conviene seguir
 * viendo el fondo (confirmar una renovación); `large` cuando el contenido
 * solo es útil a pantalla completa (un formulario de diez campos).
 *
 * MECANISMO: el panel siempre mide la altura del detent grande; las alturas
 * intermedias son `translateY`. Todo el gesto se anima con `transform`, sin
 * recalcular layout ni reflowear el contenido al arrastrar.
 */

export type Detent = 'medium' | 'large'

/** Fracción de la altura del panel que ocupa el detent medio. */
const FRACCION_MEDIA = 0.55

/** Se descarta si el gesto proyecta por debajo de esta fracción visible. */
const UMBRAL_DESCARTE = 0.35

type Props = {
  open: boolean
  onClose: () => void
  title?: string
  description?: string
  footer?: ReactNode
  /**
   * Altura inicial. `medium` habilita además el arrastre hacia `large`.
   * Por defecto `large`: la mayoría de hojas de este panel son formularios.
   */
  detent?: Detent
  children?: ReactNode
}

export function Sheet({
  open,
  onClose,
  title,
  description,
  footer,
  detent = 'large',
  children,
}: Props) {
  const dialogRef = useRef<HTMLDialogElement>(null)
  const panelRef = useRef<HTMLDivElement>(null)
  const veloRef = useRef<HTMLDivElement>(null)

  const arrastrando = useRef(false)
  const inicioY = useRef(0)
  const offsetInicial = useRef(0)
  const offsetActual = useRef(0)
  const historial = useRef<Array<{ y: number; t: number }>>([])
  const cerrando = useRef(false)

  /** Posiciones de reposo, en px de desplazamiento hacia abajo desde `large`. */
  const detents = useCallback(() => {
    const alto = panelRef.current?.offsetHeight ?? 0
    const medio = alto * (1 - FRACCION_MEDIA)
    // En escritorio la hoja no tiene detent medio: es un panel, no un gesto.
    const hayMedio = window.innerWidth < 768 && detent === 'medium'
    return {
      alto,
      grande: 0,
      medio: hayMedio ? medio : 0,
      cerrado: alto,
      lista: hayMedio ? [0, medio] : [0],
    }
  }, [detent])

  /** Mueve el panel y sincroniza la opacidad del velo con lo que se ve. */
  const colocar = useCallback((offset: number) => {
    const panel = panelRef.current
    const velo = veloRef.current
    if (!panel) return

    offsetActual.current = offset
    panel.style.transform = `translateY(${offset}px)`

    if (velo) {
      const progreso = offset / (panel.offsetHeight || 1)
      // El velo se aclara conforme la hoja baja: el fondo "vuelve".
      velo.style.opacity = String(Math.max(0, 1 - progreso))
    }
  }, [])

  const cerrarConAnimacion = useCallback(
    (velocidad = 0) => {
      const dialogo = dialogRef.current
      const panel = panelRef.current
      if (!dialogo || !panel || cerrando.current) return
      cerrando.current = true

      const fin = () => {
        dialogo.close()
        panel.style.transform = ''
        cerrando.current = false
      }

      if (prefiereMovimientoReducido()) {
        animate(dialogo, { opacity: 0 }, { duration: 0.15 }).finished.then(fin, fin)
        return
      }

      if (veloRef.current) animate(veloRef.current, { opacity: 0 }, { duration: 0.25 })
      animate(
        panel,
        { transform: `translateY(${panel.offsetHeight}px)` },
        // La velocidad del dedo continúa en la animación: sin costura entre
        // arrastrar y animar.
        { type: 'spring', bounce: 0, duration: 0.32, velocity: velocidad },
      ).finished.then(fin, fin)
    },
    [],
  )

  useEffect(() => {
    const dialogo = dialogRef.current
    const panel = panelRef.current
    if (!dialogo || !panel) return

    if (open) {
      if (!dialogo.open) dialogo.showModal()
      dialogo.style.opacity = '1'

      const { medio } = detents()
      const destino = detent === 'medium' ? medio : 0

      if (prefiereMovimientoReducido()) {
        colocar(destino)
        animate(dialogo, { opacity: [0, 1] }, { duration: 0.15 })
      } else {
        // Entra desde abajo del todo hasta su detent.
        colocar(panel.offsetHeight)
        if (veloRef.current) animate(veloRef.current, { opacity: [0, 1] }, { duration: 0.25 })
        /*
          Forma de VALOR ÚNICO (`animate(desde, hasta, { onUpdate })`), no
          `animate(callback, keyframes, …)`: esa segunda forma no existe en
          motion 12 y fallaba en silencio —sin excepción y sin animación—, así
          que la hoja se abría y se quedaba en su posición cerrada, asomando
          solo el tirador. No saltó antes porque el gesto de la hoja nunca se
          había podido verificar en un dispositivo real.
        */
        animate(panel.offsetHeight, destino, {
          ...SPRING_SHEET,
          onUpdate: (v) => colocar(v),
        })
      }
    } else if (dialogo.open) {
      cerrarConAnimacion()
    }
  }, [open, detent, detents, colocar, cerrarConAnimacion])

  /* --- Gesto ------------------------------------------------------------- */

  const alBajar = (e: React.PointerEvent<HTMLDivElement>) => {
    if (e.button !== 0) return
    const panel = panelRef.current
    if (!panel) return

    arrastrando.current = true
    inicioY.current = e.clientY
    offsetInicial.current = offsetActual.current
    historial.current = [{ y: e.clientY, t: performance.now() }]

    panel.dataset.arrastrando = 'true'
    e.currentTarget.setPointerCapture(e.pointerId)
  }

  const alMover = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!arrastrando.current) return
    const panel = panelRef.current
    if (!panel) return

    const delta = e.clientY - inicioY.current
    historial.current.push({ y: e.clientY, t: performance.now() })
    if (historial.current.length > 6) historial.current.shift()

    let offset = offsetInicial.current + delta

    // Por encima del detent grande no hay nada: resistencia progresiva en vez
    // de tope duro. Un tope seco se lee como "se congeló"; la resistencia,
    // como "responde, pero aquí se acabó".
    if (offset < 0) offset = amortiguarBorde(offset, panel.offsetHeight)

    colocar(offset)
  }

  const alSoltar = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!arrastrando.current) return
    arrastrando.current = false

    const panel = panelRef.current
    if (!panel) return
    panel.dataset.arrastrando = 'false'
    e.currentTarget.releasePointerCapture(e.pointerId)

    // Velocidad sobre la ventana reciente del gesto: lo que importa es cómo
    // se movía el dedo justo antes de soltar, no el promedio del recorrido.
    const primero = historial.current[0]
    const ultimo = historial.current[historial.current.length - 1]
    const dt = Math.max(1, ultimo.t - primero.t)
    const velocidad = ((ultimo.y - primero.y) / dt) * 1000

    const { lista, cerrado } = detents()

    // Se decide por dónde IBA a parar el gesto, no por dónde se soltó. Eso es
    // lo que hace que un empujón corto y rápido cuente igual que uno largo.
    const proyectado = offsetActual.current + proyectarMomento(velocidad)

    if (proyectado > cerrado * UMBRAL_DESCARTE) {
      cerrarConAnimacion(velocidad)
      onClose()
      return
    }

    // Engancha al detent más cercano al punto proyectado.
    const destino = lista.reduce((mejor, punto) =>
      Math.abs(punto - proyectado) < Math.abs(mejor - proyectado) ? punto : mejor,
    )

    // Misma forma de valor único que en la apertura, por el mismo motivo.
    animate(offsetActual.current, destino, {
      type: 'spring',
      bounce: 0.2,
      duration: 0.4,
      velocity: velocidad,
      onUpdate: (v) => colocar(v),
    })
  }

  const alCancelar = (e: React.SyntheticEvent<HTMLDialogElement>) => {
    e.preventDefault()
    onClose()
  }

  return (
    <dialog ref={dialogRef} className={styles.dialog} onCancel={alCancelar}>
      <div ref={veloRef} className={styles.velo} onClick={onClose} aria-hidden="true" />

      <div
        ref={panelRef}
        className={styles.panel}
        role="document"
        aria-labelledby={title ? 'sheet-titulo' : undefined}
      >
        <div
          className={styles.agarre}
          onPointerDown={alBajar}
          onPointerMove={alMover}
          onPointerUp={alSoltar}
          onPointerCancel={alSoltar}
        >
          <div className={styles.tirador} aria-hidden="true" />
        </div>

        {(title || description) && (
          <div className={styles.cabecera}>
            <div className={styles.textos}>
              {title && (
                <h2 className={styles.titulo} id="sheet-titulo">
                  {title}
                </h2>
              )}
              {description && <p className={styles.descripcion}>{description}</p>}
            </div>
            <button
              type="button"
              className={styles.cerrar}
              onClick={onClose}
              aria-label="Cerrar"
            >
              <X className={styles.cerrarIcono} aria-hidden="true" />
            </button>
          </div>
        )}

        {children && <div className={styles.cuerpo}>{children}</div>}
        {footer && <div className={styles.pie}>{footer}</div>}
      </div>
    </dialog>
  )
}
