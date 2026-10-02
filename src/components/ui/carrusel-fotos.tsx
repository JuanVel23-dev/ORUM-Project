'use client'

import { useEffect, useRef, useState, type CSSProperties, type KeyboardEvent, type PointerEvent } from 'react'
import { Pause, Play } from 'lucide-react'
import { useMediaQuery } from '@/components/use-media-query'
import type { FotoPublica } from '@/lib/publico/datos-publicos'
import estilos from './carrusel-fotos.module.css'

/*
  EL CARRUSEL DE «QUÉ ES ORUM»  ·  fotos reales que se relevan solas
  ---------------------------------------------------------------------------
  Portadas de comercios aliados, una cada `INTERVALO_MS`.

  SE ARRASTRA (02/10/2026, encargo: «que se pueda desplazar con el dedo en el
  móvil y con el ratón en el PC»). Por eso dejó de ser un fundido cruzado y
  es un CARRIL: las fotos van en fila y se mueve el carril entero con
  `transform` (sin recalcular layout). Las reglas de gesto del proyecto:

    · Seguimiento 1:1 mientras el dedo está abajo, sin transición que lo
      retrase.
    · Al soltar se decide por DÓNDE IBA el gesto (desplazamiento + velocidad
      proyectada), no solo por dónde se soltó: un golpe corto y rápido pasa
      de foto igual que un arrastre largo.
    · Resistencia elástica pasados los extremos.
    · En táctil, un gesto VERTICAL sigue siendo de la página
      (`touch-action: pan-y`): solo el horizontal mueve las fotos, y se
      decide en los primeros píxeles.

  WCAG 2.2.2 (PAUSAR, DETENER, OCULTAR): botón de pausa visible; se detiene
  con el ratón encima, con el foco dentro y mientras se arrastra; con
  `prefers-reduced-motion` no arranca solo y los cambios no se deslizan.

  Los puntos son botones de verdad (`aria-current`), las flechas ← → pasan
  de foto con el foco dentro, y el cambio se anuncia solo cuando el carrusel
  está parado (`aria-live`).
*/

const INTERVALO_MS = 4500
/** Píxeles antes de decidir si el gesto es horizontal (carrusel) o vertical (página). */
const UMBRAL_DECISION = 8
/** Fracción del ancho que tiene que alcanzar el gesto proyectado para cambiar de foto. */
const UMBRAL_CAMBIO = 0.2
/** Cuánto «empuja» la velocidad: ms de inercia que se suman al desplazamiento. */
const PROYECCION_MS = 180
/** Resistencia pasados los extremos: el carril avanza un tercio de lo que se arrastra. */
const RESISTENCIA = 0.35

type Gesto = {
  id: number
  x0: number
  y0: number
  x: number
  t: number
  velocidad: number
  /** `null` mientras no se sabe si el gesto es horizontal o vertical. */
  horizontal: boolean | null
}

type Props = {
  fotos: FotoPublica[]
  /** Nombre accesible del carrusel, que debe decir QUÉ fotos son. */
  etiqueta: string
  className?: string
}

export function CarruselFotos({ fotos, etiqueta, className }: Props) {
  const reducirMovimiento = useMediaQuery('(prefers-reduced-motion: reduce)')
  const [actual, setActual] = useState(0)
  const [pausadoPorUsuario, setPausadoPorUsuario] = useState(false)
  const [enfocado, setEnfocado] = useState(false)
  const [desplazamiento, setDesplazamiento] = useState(0)
  const [arrastrando, setArrastrando] = useState(false)
  const gesto = useRef<Gesto | null>(null)

  const total = fotos.length
  const rotando =
    total > 1 && !pausadoPorUsuario && !enfocado && !arrastrando && !reducirMovimiento

  useEffect(() => {
    if (!rotando) return
    const temporizador = window.setInterval(() => {
      setActual((i) => (i + 1) % total)
    }, INTERVALO_MS)
    return () => window.clearInterval(temporizador)
  }, [rotando, total])

  if (total === 0) return null

  /* --- Arrastrar ---------------------------------------------------------- */

  function alApretar(e: PointerEvent<HTMLDivElement>) {
    if (total < 2 || (e.pointerType === 'mouse' && e.button !== 0)) return
    gesto.current = {
      id: e.pointerId,
      x0: e.clientX,
      y0: e.clientY,
      x: e.clientX,
      t: e.timeStamp,
      velocidad: 0,
      horizontal: null,
    }
  }

  function alMover(e: PointerEvent<HTMLDivElement>) {
    const g = gesto.current
    if (!g || g.id !== e.pointerId) return
    const dx = e.clientX - g.x0
    const dy = e.clientY - g.y0

    if (g.horizontal === null) {
      if (Math.abs(dx) < UMBRAL_DECISION && Math.abs(dy) < UMBRAL_DECISION) return
      g.horizontal = Math.abs(dx) > Math.abs(dy)
      if (!g.horizontal) {
        // Vertical: es de la página. Se suelta el gesto.
        gesto.current = null
        return
      }
      e.currentTarget.setPointerCapture(e.pointerId)
      setArrastrando(true)
    }

    // Velocidad suavizada (px/ms) para proyectar al soltar.
    const dt = Math.max(1, e.timeStamp - g.t)
    g.velocidad = 0.8 * ((e.clientX - g.x) / dt) + 0.2 * g.velocidad
    g.x = e.clientX
    g.t = e.timeStamp

    // Pasado un extremo, el carril se resiste.
    const fuera = (actual === 0 && dx > 0) || (actual === total - 1 && dx < 0)
    setDesplazamiento(fuera ? dx * RESISTENCIA : dx)
  }

  function alSoltar(e: PointerEvent<HTMLDivElement>) {
    const g = gesto.current
    gesto.current = null
    if (!g || g.id !== e.pointerId || !g.horizontal) return

    const ancho = e.currentTarget.clientWidth || 1
    const proyectado = e.clientX - g.x0 + g.velocidad * PROYECCION_MS
    if (proyectado < -ancho * UMBRAL_CAMBIO && actual < total - 1) setActual(actual + 1)
    else if (proyectado > ancho * UMBRAL_CAMBIO && actual > 0) setActual(actual - 1)

    setDesplazamiento(0)
    setArrastrando(false)
  }

  function alCancelar() {
    gesto.current = null
    setDesplazamiento(0)
    setArrastrando(false)
  }

  function alTeclear(e: KeyboardEvent<HTMLDivElement>) {
    if (total < 2) return
    if (e.key === 'ArrowRight') {
      e.preventDefault()
      setActual((i) => (i + 1) % total)
    } else if (e.key === 'ArrowLeft') {
      e.preventDefault()
      setActual((i) => (i - 1 + total) % total)
    }
  }

  return (
    <div
      className={[estilos.carrusel, className].filter(Boolean).join(' ')}
      role="group"
      aria-roledescription="carrusel"
      aria-label={etiqueta}
      onMouseEnter={() => setEnfocado(true)}
      onMouseLeave={() => setEnfocado(false)}
      onFocus={() => setEnfocado(true)}
      onBlur={(e) => {
        // Solo cuando el foco sale del carrusel entero, no al pasar entre sus botones.
        if (!e.currentTarget.contains(e.relatedTarget as Node | null)) setEnfocado(false)
      }}
      onKeyDown={alTeclear}
    >
      <div
        className={estilos.fotos}
        aria-live={rotando ? 'off' : 'polite'}
        data-arrastrable={total > 1 || undefined}
        onPointerDown={alApretar}
        onPointerMove={alMover}
        onPointerUp={alSoltar}
        onPointerCancel={alCancelar}
      >
        {/* El carril: `--indice` y `--desplazamiento` son lo único dinámico
            que se inyecta por `style`. */}
        <div
          className={estilos.pista}
          data-arrastrando={arrastrando || undefined}
          style={
            {
              '--indice': actual,
              '--desplazamiento': `${desplazamiento}px`,
            } as CSSProperties
          }
        >
          {fotos.map((foto, i) => (
            // eslint-disable-next-line @next/next/no-img-element -- URL externa arbitraria, no un asset local
            <img
              key={foto.url}
              src={foto.url}
              alt={foto.alt}
              className={estilos.foto}
              aria-hidden={i !== actual}
              draggable={false}
              loading={i === 0 ? 'eager' : 'lazy'}
              decoding="async"
            />
          ))}
        </div>
      </div>

      {total > 1 && (
        <div className={estilos.controles}>
          <button
            type="button"
            className={estilos.pausa}
            onClick={() => setPausadoPorUsuario((p) => !p)}
            aria-label={pausadoPorUsuario ? 'Reanudar las fotos' : 'Pausar las fotos'}
          >
            {pausadoPorUsuario ? (
              <Play size={14} aria-hidden="true" />
            ) : (
              <Pause size={14} aria-hidden="true" />
            )}
          </button>

          <div className={estilos.puntos}>
            {fotos.map((foto, i) => (
              <button
                key={foto.url}
                type="button"
                className={estilos.punto}
                onClick={() => setActual(i)}
                aria-label={`Foto ${i + 1} de ${total}`}
                aria-current={i === actual ? 'true' : undefined}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
