'use client'

import { useRouter } from 'next/navigation'
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  type ReactNode,
} from 'react'
import { Overlay } from '@/components/ui/overlay'
import type { Detent } from '@/components/ui/sheet'

/**
 * Envoltorio de una ruta interceptada.
 *
 * Next intercepta la navegación cuando se llega desde la pantalla de origen y
 * renderiza este contenido POR ENCIMA, sin desmontar la lista de detrás. La
 * URL sí cambia, así que:
 *
 * - El botón "atrás" del navegador cierra el overlay. Es lo que la gente ya
 *   espera, y sale gratis.
 * - Compartir o recargar la URL entra por la ruta normal, a pantalla
 *   completa. Un enlace directo nunca se rompe.
 *
 * Cerrar es SIEMPRE `router.back()`, nunca un `<Link>` hacia adelante ni un
 * `redirect()` de servidor. Salir de una ruta interceptada con una navegación
 * hacia adelante no vacía la ranura `@modal`: el overlay se queda montado y
 * desacoplado de la URL, y ni "Cancelar" ni Escape lo cierran (hace falta
 * recargar). Solo la navegación de historial resetea la ranura. Por eso el
 * cierre se reparte por contexto: los formularios no vuelven a inventar su
 * propia navegación para "Cancelar", "Ir a la lista" o el cierre por éxito.
 */

const CerrarOverlayContext = createContext<(() => void) | null>(null)

const noop = () => {}

/**
 * Devuelve la función que cierra el overlay actual (`router.back()`). Fuera de
 * un `OverlayRuta` —p. ej. el mismo formulario renderizado a pantalla completa—
 * devuelve un no-op, así el formulario no necesita saber dónde vive.
 */
export function useCerrarOverlay(): () => void {
  return useContext(CerrarOverlayContext) ?? noop
}

/**
 * Cierra el overlay en cuanto la server action reporta `ok`. Para los
 * formularios de edición, que no tienen pantalla de éxito propia: al guardar,
 * la acción devuelve `{ ok: true }` y el overlay se cierra solo.
 *
 * El cierre se dispara UNA sola vez: `router.back()` retrocede una entrada de
 * historial, así que llamarlo dos veces (React en modo estricto vuelve a
 * ejecutar los efectos en desarrollo) saltaría de más y dejaría al usuario en
 * una pantalla anterior.
 */
export function useCerrarCuando(ok: boolean | undefined): void {
  const cerrar = useCerrarOverlay()
  const yaCerrado = useRef(false)
  useEffect(() => {
    if (ok && !yaCerrado.current) {
      yaCerrado.current = true
      cerrar()
    }
  }, [ok, cerrar])
}

export function OverlayRuta({
  title,
  description,
  footer,
  width,
  detent,
  children,
}: {
  title?: string
  description?: string
  footer?: ReactNode
  width?: string
  detent?: Detent
  children?: ReactNode
}) {
  const router = useRouter()
  const cerrar = useCallback(() => router.back(), [router])

  return (
    <CerrarOverlayContext.Provider value={cerrar}>
      <Overlay
        open
        onClose={cerrar}
        title={title}
        description={description}
        footer={footer}
        width={width}
        detent={detent}
      >
        {children}
      </Overlay>
    </CerrarOverlayContext.Provider>
  )
}
