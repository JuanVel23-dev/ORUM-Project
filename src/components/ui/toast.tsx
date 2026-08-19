'use client'

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import { createPortal } from 'react-dom'
import { animate } from 'motion'
import { AlertTriangle, CheckCircle2, Info, X, XCircle } from 'lucide-react'
import {
  SPRING_UI,
  amortiguarBorde,
  prefiereMovimientoReducido,
  proyectarMomento,
} from '@/lib/shared/motion'
import { useHidratado } from '../use-hidratado'
import styles from './toast.module.css'

export type ToastTone = 'info' | 'success' | 'warning' | 'danger'

export type ToastOptions = {
  title: string
  description?: string
  tone?: ToastTone
  /** Milisegundos hasta el cierre automático. `0` lo deja fijo. */
  duration?: number
  action?: { label: string; onClick: () => void }
}

type ToastItem = ToastOptions & { id: number }

const ICONO = {
  info: Info,
  success: CheckCircle2,
  warning: AlertTriangle,
  danger: XCircle,
} as const

const ToastContext = createContext<{
  toast: (options: ToastOptions) => void
} | null>(null)

export function useToast() {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error('useToast debe usarse dentro de <ToastProvider>')
  return ctx
}

/* ========================================================================== */

export function ToastProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<ToastItem[]>([])
  const siguienteId = useRef(0)

  const cerrar = useCallback((id: number) => {
    setItems((previos) => previos.filter((t) => t.id !== id))
  }, [])

  const toast = useCallback((options: ToastOptions) => {
    const id = siguienteId.current++
    setItems((previos) => [...previos, { ...options, id }])
  }, [])

  const valor = useMemo(() => ({ toast }), [toast])

  return (
    <ToastContext.Provider value={valor}>
      {children}
      <Viewport items={items} onCerrar={cerrar} />
    </ToastContext.Provider>
  )
}

function Viewport({
  items,
  onCerrar,
}: {
  items: ToastItem[]
  onCerrar: (id: number) => void
}) {
  // El portal necesita un nodo del DOM, que no existe en el servidor. Se
  // consulta el estado de hidratación en vez de ramificar por `typeof
  // document`: esa rama haría que servidor y cliente rindieran árboles
  // distintos y React abortaría la hidratación.
  const hidratado = useHidratado()
  if (!hidratado) return null

  return createPortal(
    <div
      className={styles.viewport}
      // `polite` no interrumpe lo que el lector esté diciendo. Los errores
      // graves de verdad son un `Alert` en la página, no un toast.
      role="region"
      aria-live="polite"
      aria-label="Notificaciones"
    >
      {items.map((item) => (
        <Toast key={item.id} item={item} onCerrar={() => onCerrar(item.id)} />
      ))}
    </div>,
    document.body,
  )
}

/* ========================================================================== */

/** Fracción del ancho a partir de la cual el gesto descarta el toast. */
const UMBRAL_DESCARTE = 0.4

function Toast({ item, onCerrar }: { item: ToastItem; onCerrar: () => void }) {
  const ref = useRef<HTMLDivElement>(null)
  const temporizador = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Historial corto de posiciones: hace falta la VELOCIDAD al soltar, no solo
  // el punto final. Sin ella el descarte se sentiría como un corte.
  const historial = useRef<Array<{ x: number; t: number }>>([])
  const arrastrando = useRef(false)
  const inicioX = useRef(0)

  const Icono = ICONO[item.tone ?? 'info']
  const duracion = item.duration ?? 5000

  const programarCierre = useCallback(() => {
    if (duracion <= 0) return
    temporizador.current = setTimeout(onCerrar, duracion)
  }, [duracion, onCerrar])

  const cancelarCierre = useCallback(() => {
    if (temporizador.current) {
      clearTimeout(temporizador.current)
      temporizador.current = null
    }
  }, [])

  // Entrada + cierre automático, montados sobre el nodo real.
  const montar = useCallback(
    (nodo: HTMLDivElement | null) => {
      ref.current = nodo
      if (!nodo) {
        cancelarCierre()
        return
      }

      if (prefiereMovimientoReducido()) {
        animate(nodo, { opacity: [0, 1] }, { duration: 0.2 })
      } else {
        animate(
          nodo,
          { opacity: [0, 1], transform: ['translateX(16px) scale(0.96)', 'none'] },
          SPRING_UI,
        )
      }

      programarCierre()
    },
    [cancelarCierre, programarCierre],
  )

  const alBajar = (e: React.PointerEvent<HTMLDivElement>) => {
    if (e.button !== 0) return
    const nodo = ref.current
    if (!nodo) return

    arrastrando.current = true
    inicioX.current = e.clientX
    historial.current = [{ x: e.clientX, t: performance.now() }]

    // Con captura el seguimiento continúa aunque el puntero salga del toast.
    nodo.setPointerCapture(e.pointerId)
    cancelarCierre()
  }

  const alMover = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!arrastrando.current) return
    const nodo = ref.current
    if (!nodo) return

    const delta = e.clientX - inicioX.current
    historial.current.push({ x: e.clientX, t: performance.now() })
    if (historial.current.length > 6) historial.current.shift()

    // Hacia la derecha sigue el dedo 1:1; hacia la izquierda hay resistencia
    // progresiva, porque por ahí no se descarta.
    const x = delta >= 0 ? delta : amortiguarBorde(delta, nodo.offsetWidth)

    nodo.style.transform = `translateX(${x}px)`
    nodo.style.opacity = String(Math.max(0, 1 - Math.abs(x) / (nodo.offsetWidth * 0.9)))
  }

  const alSoltar = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!arrastrando.current) return
    arrastrando.current = false

    const nodo = ref.current
    if (!nodo) return
    nodo.releasePointerCapture(e.pointerId)

    const delta = e.clientX - inicioX.current
    const ancho = nodo.offsetWidth

    // Velocidad sobre la ventana reciente, no sobre todo el gesto: lo que
    // importa es cómo iba el dedo al final.
    const primero = historial.current[0]
    const ultimo = historial.current[historial.current.length - 1]
    const dt = Math.max(1, ultimo.t - primero.t)
    const velocidad = ((ultimo.x - primero.x) / dt) * 1000

    // Se descarta según A DÓNDE IBA el gesto, no dónde se soltó. Así un flick
    // corto pero rápido descarta, como en iOS.
    const destinoProyectado = delta + proyectarMomento(velocidad)

    if (destinoProyectado > ancho * UMBRAL_DESCARTE) {
      animate(
        nodo,
        { transform: `translateX(${ancho + 40}px)`, opacity: 0 },
        // La velocidad del dedo se traspasa a la animación: sin costura entre
        // arrastrar y animar.
        { type: 'spring', bounce: 0, duration: 0.3, velocity: velocidad },
      ).finished.then(onCerrar, onCerrar)
      return
    }

    animate(nodo, { transform: 'translateX(0px)', opacity: 1 }, SPRING_UI)
    programarCierre()
  }

  return (
    <div
      ref={montar}
      className={[styles.toast, styles[item.tone ?? 'info']].join(' ')}
      onPointerDown={alBajar}
      onPointerMove={alMover}
      onPointerUp={alSoltar}
      onPointerCancel={alSoltar}
      // Al pasar el ratón por encima se congela la cuenta atrás: leer no
      // debería ser una carrera contra el temporizador.
      onMouseEnter={cancelarCierre}
      onMouseLeave={programarCierre}
    >
      <Icono className={styles.icono} aria-hidden="true" />

      <div className={styles.cuerpo}>
        <span className={styles.titulo}>{item.title}</span>
        {item.description && (
          <span className={styles.descripcion}>{item.description}</span>
        )}
        {item.action && (
          <button
            type="button"
            className={styles.accion}
            onClick={() => {
              item.action?.onClick()
              onCerrar()
            }}
          >
            {item.action.label}
          </button>
        )}
      </div>

      <button
        type="button"
        className={styles.cerrar}
        onClick={onCerrar}
        aria-label="Cerrar notificación"
      >
        <X className={styles.cerrarIcono} aria-hidden="true" />
      </button>
    </div>
  )
}
