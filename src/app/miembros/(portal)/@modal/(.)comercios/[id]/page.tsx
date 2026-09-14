import FichaComercioPage from '@/app/miembros/(portal)/comercios/[id]/page'
import { OverlayFicha } from './overlay-ficha'

/*
  LA FICHA, INTERCEPTADA  ·  se abre encima sin abandonar el catálogo
  ---------------------------------------------------------------------------
  Una ruta interceptada da tres cosas gratis que un estado local no da: el botón
  atrás cierra, un enlace directo abre la pantalla completa, y la lista de detrás
  conserva su scroll y sus filtros porque nunca se desmontó.

  La ranura vive en `(portal)/layout.tsx` y SOLO ahí. En el panel de
  administración se aprendió por las malas: con una ranura por sección, el mismo
  destino se abría encima o navegaba según de dónde vinieras, porque una ruta
  interceptada solo intercepta si el layout que declara su ranura ya está
  montado.

  El contenido es EL MISMO componente de la página real, importado con alias y
  no con `../../../..`. No hay dos copias que puedan desincronizarse: solo
  cambia `enOverlay`, que retira la barra de vuelta y los nombres de transición.

  Si tras añadir esta ruta la interceptación «no funciona», reinicia el servidor
  de desarrollo antes de buscar el fallo en el código: el manifiesto de rutas
  queda obsoleto y falla en silencio.
*/
export default async function FichaInterceptada({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>
  searchParams: Promise<{ volver?: string | string[] }>
}) {
  return (
    <OverlayFicha>
      <FichaComercioPage params={params} searchParams={searchParams} enOverlay />
    </OverlayFicha>
  )
}
