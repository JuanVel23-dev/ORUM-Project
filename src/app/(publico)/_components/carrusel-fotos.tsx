'use client'

import { useEffect, useState } from 'react'
import { Pause, Play } from 'lucide-react'
import { useMediaQuery } from '@/components/use-media-query'
import type { FotoPublica } from '@/lib/publico/datos-publicos'
import estilos from './carrusel-fotos.module.css'

/*
  EL CARRUSEL DE «QUÉ ES ORUM»  ·  fotos reales que se relevan solas
  ---------------------------------------------------------------------------
  Fundido cruzado entre portadas de comercios aliados, una cada
  `INTERVALO_MS`. Solo `opacity`: todas las fotos están apiladas en la misma
  caja y la activa sube a 1, así que no se recalcula layout en ningún
  fotograma.

  WCAG 2.2.2 (PAUSAR, DETENER, OCULTAR). Todo lo que se mueve solo más de
  cinco segundos necesita un control para pararlo. Por eso:
    · Hay un botón de pausa VISIBLE, no solo el hover: en táctil no existe.
    · Se detiene mientras el ratón está encima o el foco está dentro —quien
      está mirando una foto no quiere que se la cambien—.
    · Con `prefers-reduced-motion` NO arranca: el visitante puede pasar las
      fotos con los puntos, pero nada se mueve sin que lo pida.

  Los puntos son botones de verdad: saltan a una foto y dicen cuál es la
  actual con `aria-current`. Cuando el carrusel está parado, el cambio se
  anuncia (`aria-live="polite"`); mientras rota solo, no, o el lector
  hablaría cada cuatro segundos sin que nadie se lo pidiera.

  Hidratar esto es barato: una sola raíz de cliente con un temporizador. Las
  imágenes son `<img>` normales que el servidor ya pintó.
*/

const INTERVALO_MS = 4500

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

  const total = fotos.length
  const rotando = total > 1 && !pausadoPorUsuario && !enfocado && !reducirMovimiento

  useEffect(() => {
    if (!rotando) return
    const temporizador = window.setInterval(() => {
      setActual((i) => (i + 1) % total)
    }, INTERVALO_MS)
    return () => window.clearInterval(temporizador)
  }, [rotando, total])

  if (total === 0) return null

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
    >
      <div className={estilos.fotos} aria-live={rotando ? 'off' : 'polite'}>
        {fotos.map((foto, i) => (
          // eslint-disable-next-line @next/next/no-img-element -- URL externa arbitraria, no un asset local
          <img
            key={foto.url}
            src={foto.url}
            alt={foto.alt}
            className={estilos.foto}
            data-activa={i === actual}
            aria-hidden={i !== actual}
            loading={i === 0 ? 'eager' : 'lazy'}
            decoding="async"
          />
        ))}
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
