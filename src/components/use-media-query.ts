'use client'

import { useCallback, useSyncExternalStore } from 'react'

/**
 * Consulta una media query desde React.
 *
 * Se lee como store externo por la misma razón que el tema: el snapshot de
 * servidor está definido y no hay desajuste de hidratación ni renders en
 * cascada.
 *
 * En el servidor devuelve `false`. Es seguro para el uso que se le da aquí
 * —decidir entre diálogo y hoja— porque los overlays solo aparecen tras una
 * interacción, cuando la hidratación ya terminó.
 */
export function useMediaQuery(consulta: string): boolean {
  const suscribir = useCallback(
    (alCambiar: () => void) => {
      const mq = window.matchMedia(consulta)
      mq.addEventListener('change', alCambiar)
      return () => mq.removeEventListener('change', alCambiar)
    },
    [consulta],
  )

  const leer = useCallback(() => window.matchMedia(consulta).matches, [consulta])
  const leerEnServidor = useCallback(() => false, [])

  return useSyncExternalStore(suscribir, leer, leerEnServidor)
}

/** Punto de corte del sistema: por encima hay ratón, por debajo hay pulgar. */
export const ESCRITORIO = '(min-width: 768px)'
