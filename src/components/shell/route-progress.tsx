'use client'

import { useEffect, useRef } from 'react'
import { usePathname, useSearchParams } from 'next/navigation'
import styles from './route-progress.module.css'

/*
  Barra fina de progreso de navegación.

  El App Router no expone eventos de router, así que el inicio se detecta
  interceptando clics sobre enlaces internos (en fase de captura, antes de que
  Next los gestione) y el final observando el cambio de ruta.

  Todo el estado vive en refs y se escribe directamente en el DOM: la barra se
  actualiza varias veces por segundo y no hay ninguna razón para que eso
  provoque re-renders de React. Es además el uso correcto de un efecto —
  sincronizar un sistema externo, el DOM, con lo que ocurre en la app.
*/

/** Por debajo de esto la navegación ya terminó; enseñar la barra sería ruido. */
const UMBRAL_MS = 150

export function RouteProgress() {
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const barraRef = useRef<HTMLDivElement>(null)
  const progresoRef = useRef<HTMLDivElement>(null)

  const retardo = useRef<ReturnType<typeof setTimeout> | null>(null)
  const avance = useRef<ReturnType<typeof setInterval> | null>(null)
  const ocultado = useRef<ReturnType<typeof setTimeout> | null>(null)
  const ancho = useRef(0)

  useEffect(() => {
    const pintar = () => {
      if (progresoRef.current) progresoRef.current.style.width = `${ancho.current}%`
    }

    const detenerTemporizadores = () => {
      if (retardo.current) clearTimeout(retardo.current)
      if (avance.current) clearInterval(avance.current)
      if (ocultado.current) clearTimeout(ocultado.current)
      retardo.current = null
      avance.current = null
      ocultado.current = null
    }

    const alPulsar = (e: MouseEvent) => {
      // Con modificador o botón secundario se abre en otra pestaña: aquí no
      // hay navegación que anunciar.
      if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) return

      const enlace = (e.target as HTMLElement | null)?.closest('a')
      if (!enlace) return

      const href = enlace.getAttribute('href')
      if (!href || enlace.target === '_blank' || enlace.hasAttribute('download')) return

      const destino = new URL(href, window.location.href)
      if (destino.origin !== window.location.origin) return

      const actual = window.location.pathname + window.location.search
      if (destino.pathname + destino.search === actual) return

      detenerTemporizadores()

      retardo.current = setTimeout(() => {
        barraRef.current?.setAttribute('data-visible', 'true')
        ancho.current = 12
        pintar()

        // Avance asintótico hacia el 90%: no sabemos cuánto falta, así que la
        // barra nunca llega sola al final. El 100% lo pone la llegada real.
        avance.current = setInterval(() => {
          ancho.current += (90 - ancho.current) * 0.18
          pintar()
        }, 240)
      }, UMBRAL_MS)
    }

    document.addEventListener('click', alPulsar, { capture: true })
    return () => {
      document.removeEventListener('click', alPulsar, { capture: true })
      detenerTemporizadores()
    }
  }, [])

  // La ruta cambió: la navegación terminó.
  useEffect(() => {
    if (retardo.current) clearTimeout(retardo.current)
    if (avance.current) clearInterval(avance.current)
    retardo.current = null
    avance.current = null

    const barra = barraRef.current
    const progreso = progresoRef.current
    if (!barra || !progreso) return

    // Si nunca llegó a mostrarse, no hay nada que rematar.
    if (barra.getAttribute('data-visible') !== 'true') return

    ancho.current = 100
    progreso.style.width = '100%'

    ocultado.current = setTimeout(() => {
      barra.setAttribute('data-visible', 'false')
      // Se reinicia tras el desvanecido para que no se vea rebobinar.
      ocultado.current = setTimeout(() => {
        ancho.current = 0
        progreso.style.width = '0%'
      }, 200)
    }, 220)

    return () => {
      if (ocultado.current) clearTimeout(ocultado.current)
    }
  }, [pathname, searchParams])

  return (
    <div ref={barraRef} className={styles.barra} data-visible="false" aria-hidden="true">
      <div ref={progresoRef} className={styles.progreso} />
    </div>
  )
}
