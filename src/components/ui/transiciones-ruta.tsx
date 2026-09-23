'use client'

import { useEffect, useRef } from 'react'
import { usePathname, useRouter } from 'next/navigation'

/*
  QUIEN DISPARA LA TRANSICIÓN DE RUTA
  ---------------------------------------------------------------------------
  El `view-transition-name` lo escriben la placa y el bloque de títulos. Eso
  por sí solo no anima nada en una navegación de cliente: alguien tiene que
  llamar a `document.startViewTransition`, y en Next 16.2.11 ese alguien no
  existe —`experimental.viewTransition` está en el esquema de configuración y
  ningún módulo del router lo lee—. Este componente es ese alguien.

  UNO POR PORTAL, con un ÚNICO escuchador delegado en captura. La alternativa
  —envolver cada tarjeta en un componente de cliente— hidrataría hasta cien
  raíces en el catálogo, que es justo el coste que no se puede pagar en el
  teléfono de gama media donde el socio usa esto.

  ── El baile con el router, que es la parte que no es obvia ─────────────────

  `document.startViewTransition(cb)` toma una instantánea del ANTES, ejecuta
  `cb`, y cuando `cb` termina toma la del DESPUÉS. Pero `router.push` no espera
  a que React pinte: devuelve de inmediato, así que la instantánea del después
  saldría idéntica a la del antes y no habría animación.

  Por eso `cb` devuelve una promesa que NO se resuelve hasta que `usePathname`
  cambia, que es la señal de que la ruta nueva ya está en el DOM.

  Y por eso hay un plazo máximo: si la navegación falla, se cancela o el
  destino no llega, sin él la promesa no se resolvería nunca y la página se
  quedaría CONGELADA bajo la instantánea del antes. Una transición rota tiene
  que degradar a un cambio seco, no a una pantalla muerta.
*/

/** Milisegundos que se espera a que la ruta nueva aparezca antes de rendirse. */
const PLAZO_MAXIMO = 1200

/**
 * Sale `true` en las rutas entre las que SÍ hay continuidad de objeto.
 *
 * HOY NO HAY NINGUNA, y es una decisión de diseño, no un olvido.
 *
 * El único par aprobado era catálogo ↔ ficha del comercio. Desde el 14/09/2026
 * la ficha se abre como OVERLAY sobre el catálogo, así que ese movimiento lo
 * hace ahora el propio overlay, naciendo de la tarjeta que se tocó. Y además ya
 * no podría hacerlo una View Transition: con la ficha encima, el catálogo sigue
 * montado detrás, los dos nombres estarían vivos por duplicado en el mismo
 * documento, y eso anula la transición entera en silencio.
 *
 * El mecanismo se conserva entero —y probado— porque el dictamen de qué pares
 * merecen transición sigue siendo válido y el día que aparezca uno solo hay que
 * nombrarlo aquí. Ver `.claude/docs/log/m5-view-transitions.md`.
 */
function esParAprobado(): boolean {
  return false
}

export function TransicionesDeRuta() {
  const router = useRouter()
  const ruta = usePathname()

  /* Resuelve la promesa que mantiene abierta la transición en curso. */
  const resolver = useRef<(() => void) | null>(null)

  // Cuando la ruta cambia, el DOM nuevo ya está: se cierra la transición.
  useEffect(() => {
    resolver.current?.()
    resolver.current = null
  }, [ruta])

  useEffect(() => {
    // Safari y Firefox todavía no la traen: ahí se navega como siempre.
    if (typeof document.startViewTransition !== 'function') return

    function alPulsar(evento: MouseEvent) {
      /* Se respetan todas las formas de abrir en otra pestaña. Robárselas para
         animar sería exactamente el tipo de captura que hace que la gente deje
         de confiar en los enlaces. */
      if (
        evento.defaultPrevented ||
        evento.button !== 0 ||
        evento.metaKey ||
        evento.ctrlKey ||
        evento.shiftKey ||
        evento.altKey
      ) {
        return
      }

      const destino = evento.target
      if (!(destino instanceof Element)) return

      const enlace = destino.closest('a[href]')
      if (!(enlace instanceof HTMLAnchorElement)) return
      if (enlace.target === '_blank' || enlace.hasAttribute('download')) return

      const url = new URL(enlace.href, location.href)
      if (url.origin !== location.origin) return

      // Solo los pares con continuidad real. Lo demás navega sin transición.
      if (!esParAprobado()) return

      // Si ya hay una en vuelo, se deja pasar la navegación tal cual: encadenar
      // dos transiciones deja la segunda instantánea tomada a mitad de la
      // primera, y el resultado es un parpadeo peor que no animar.
      if (resolver.current) return

      evento.preventDefault()

      const href = url.pathname + url.search

      document.startViewTransition(
        () =>
          new Promise<void>((listo) => {
            let cerrado = false
            const cerrar = () => {
              if (cerrado) return
              cerrado = true
              resolver.current = null
              listo()
            }

            resolver.current = cerrar
            setTimeout(cerrar, PLAZO_MAXIMO)
            router.push(href)
          }),
      )
    }

    document.addEventListener('click', alPulsar, true)
    return () => document.removeEventListener('click', alPulsar, true)
  }, [router])

  return null
}
