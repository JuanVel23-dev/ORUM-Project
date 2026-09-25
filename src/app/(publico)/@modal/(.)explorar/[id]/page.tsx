import FichaPublicaPage from '@/app/(publico)/explorar/[id]/page'
import { OverlayFichaPublica } from './overlay-ficha-publica'

/*
  LA FICHA PÚBLICA, INTERCEPTADA  ·  se abre encima sin abandonar la lista
  ---------------------------------------------------------------------------
  Desde el directorio o desde «Comercios destacados» de la landing, la ficha
  se abre encima: el botón atrás la cierra, la lista de detrás conserva su
  scroll y sus filtros, y un enlace directo sigue abriendo la página
  completa.

  La ranura vive en `(publico)/layout.tsx` y solo ahí, por la lección del
  panel: una ruta interceptada solo intercepta si el layout que declara su
  ranura ya está montado.

  El contenido es EL MISMO componente de la página real, importado con alias.
  Solo cambia `enOverlay`.

  Si tras añadir esta ruta la interceptación «no funciona», reinicia el
  servidor de desarrollo antes de buscar el fallo: el manifiesto de rutas
  queda obsoleto y falla en silencio.
*/
export default async function FichaPublicaInterceptada({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  return (
    <OverlayFichaPublica>
      <FichaPublicaPage params={params} enOverlay />
    </OverlayFichaPublica>
  )
}
