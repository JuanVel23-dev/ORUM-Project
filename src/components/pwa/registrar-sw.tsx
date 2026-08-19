'use client'

import { useEffect } from 'react'

/**
 * Registra el service worker en producción, y lo DESREGISTRA en desarrollo.
 *
 * La segunda parte no es paranoia: durante la Fase G un SW quedó registrado en
 * `localhost` y siguió sirviendo `/_next/static/*` desde su caché a través de
 * reinicios del servidor y borrados completos de `.next`. El síntoma era que
 * los cambios de CSS "no se aplicaban", con el fuente y el build correctos.
 *
 * La regla cache-first del SW asume que los assets llevan hash de contenido y
 * por tanto no pueden quedar obsoletos. Eso vale en producción, pero Turbopack
 * en desarrollo reescribe los chunks en la MISMA ruta. De ahí la limpieza
 * activa: si alguna vez quedó un SW registrado en dev, se elimina solo.
 */
export function RegistrarSW() {
  useEffect(() => {
    if (!('serviceWorker' in navigator)) return

    if (process.env.NODE_ENV !== 'production') {
      // Auto-saneamiento: deja el entorno de desarrollo limpio sin que nadie
      // tenga que descubrir el problema en las herramientas del navegador.
      void navigator.serviceWorker.getRegistrations().then(async (registros) => {
        if (registros.length === 0) return

        await Promise.all(registros.map((r) => r.unregister()))
        const nombres = await caches.keys()
        await Promise.all(
          nombres.filter((n) => n.startsWith('orum-')).map((n) => caches.delete(n)),
        )
        console.warn(
          '[pwa] Service worker de una sesión anterior desregistrado. Recarga para ver los assets frescos.',
        )
      })
      return
    }

    const registrar = () => {
      navigator.serviceWorker.register('/sw.js', { scope: '/' }).catch((error) => {
        // Un SW que no registra no debe romper la app: solo se pierden la
        // instalación y el modo sin conexión.
        console.error('[pwa] no se pudo registrar el service worker:', error)
      })
    }

    // Tras `load`, para no competir por ancho de banda con los recursos que la
    // primera pantalla necesita de verdad.
    if (document.readyState === 'complete') {
      registrar()
    } else {
      window.addEventListener('load', registrar, { once: true })
      return () => window.removeEventListener('load', registrar)
    }
  }, [])

  return null
}
