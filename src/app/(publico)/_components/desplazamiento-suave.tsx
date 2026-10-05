'use client'

import { useEffect } from 'react'
import { prefiereMovimientoReducido } from '@/lib/shared/motion'

/*
  EL DESPLAZAMIENTO HASTA UNA SECCIÓN  ·  05/10/2026
  ---------------------------------------------------------------------------
  Encargo del propietario: «cuando elija alguna opción que me lleve a algún
  lado de la página, ponle una animación o efecto de desplazamiento». Las
  anclas de la cabecera y del menú (`/#nosotros`, `/#membresias`…) saltaban
  de golpe: Next coloca la página en el destino sin recorrido.

  UN SOLO ESCUCHADOR DELEGADO para toda la fachada, en vez de envolver cada
  enlace: la cabecera es un Server Component y sus anclas son `<Link>` reales
  (funcionan sin JavaScript y desde otras páginas). Aquí solo se intercepta
  el clic cuando el destino YA ESTÁ en la página que se está viendo.

  EN FASE DE CAPTURA, y no es un detalle: `<Link>` decide si navega mirando
  `defaultPrevented` en su propio `onClick`, que corre después. Cancelando
  antes, el enlace no navega (no hay salto) y su `onClick` sí se ejecuta (el
  menú se cierra).

  El alto de la cabecera fija lo descuenta el `scroll-margin` de cada
  sección (`publico.module.css`): `scrollIntoView` lo respeta.

  Con movimiento reducido el viaje se sustituye por el salto de siempre:
  un recorrido largo de página es justo lo que marea.
*/
export function DesplazamientoSuave() {
  useEffect(() => {
    const alPulsar = (e: MouseEvent) => {
      // Las formas de abrir en otra pestaña se respetan.
      if (e.defaultPrevented || e.button !== 0) return
      if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return

      const enlace = (e.target as Element | null)?.closest?.('a[href]')
      if (!(enlace instanceof HTMLAnchorElement) || enlace.target === '_blank') return

      const destino = new URL(enlace.href, window.location.href)
      // Solo anclas de ESTA página: misma ruta, con `#`.
      if (destino.origin !== window.location.origin) return
      if (destino.pathname !== window.location.pathname || destino.hash.length < 2) return

      const seccion = document.getElementById(decodeURIComponent(destino.hash.slice(1)))
      if (!seccion) return

      e.preventDefault()
      // La URL cambia igual: el enlace se puede copiar y «atrás» funciona.
      if (destino.hash !== window.location.hash) {
        window.history.pushState(null, '', destino.hash)
      }
      seccion.scrollIntoView({
        behavior: prefiereMovimientoReducido() ? 'auto' : 'smooth',
        block: 'start',
      })
    }

    document.addEventListener('click', alPulsar, true)
    return () => document.removeEventListener('click', alPulsar, true)
  }, [])

  return null
}
