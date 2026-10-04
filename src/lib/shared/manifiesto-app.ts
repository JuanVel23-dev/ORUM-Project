import type { MetadataRoute } from 'next'

/*
  LO QUE COMPARTEN LOS DOS MANIFIESTOS DE LA APLICACIÓN INSTALABLE
  ---------------------------------------------------------------------------
  Hay dos aplicaciones instalables sobre el mismo sitio:

    · la del SOCIO    — `app/manifest.ts`, abre en `/miembros`;
    · la del COMERCIO — `app/manifest-comercios.webmanifest/route.ts`, abre
      en `/comercios` (04/10/2026).

  Los iconos y el color de arranque son los mismos, y son copias a mano de la
  paleta (un manifiesto no lee `var(--…)`): viven aquí UNA vez para que al
  mover la paleta no haya que acordarse de los dos archivos.
*/

/**
 * Sigue a `--n-1000` de `tokens.css`: es lo que se ve en la pantalla de
 * arranque, antes de que exista una hoja de estilos. Si la paleta cambia,
 * cambia a mano.
 */
export const COLOR_ARRANQUE = '#111114'

/**
 * EL MONOGRAMA DE ORUM EN DORADO Y SIN FONDO (29/09/2026, encargo del
 * propietario: «el icono de ORUM para todas las páginas», «dorado y sin
 * fondo»). PNG transparentes generados desde
 * `src/components/ui/marca/monograma.png`: la «O» con la estrella del
 * cliente, no un dibujo aproximado. iOS pinta de negro lo transparente del
 * icono de inicio; Android usa `background_color`. La variante `maskable`
 * deja el monograma dentro del 80 % central, que es lo que Android no recorta
 * al aplicar su forma.
 */
export const ICONOS_APP: NonNullable<MetadataRoute.Manifest['icons']> = [
  { src: '/icons/orum-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
  { src: '/icons/orum-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
  {
    src: '/icons/orum-maskable-192.png',
    sizes: '192x192',
    type: 'image/png',
    purpose: 'maskable',
  },
  {
    src: '/icons/orum-maskable-512.png',
    sizes: '512x512',
    type: 'image/png',
    purpose: 'maskable',
  },
]

/** Dónde se sirve el manifiesto de la aplicación del comercio. */
export const RUTA_MANIFIESTO_COMERCIOS = '/manifest-comercios.webmanifest'
