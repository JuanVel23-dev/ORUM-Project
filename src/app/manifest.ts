import type { MetadataRoute } from 'next'
import { COLOR_ARRANQUE, ICONOS_APP } from '@/lib/shared/manifiesto-app'

/**
 * Manifest de la aplicación instalable.
 *
 * Se usa la API nativa de Next (`app/manifest.ts`) en vez de un JSON estático:
 * queda tipado y se sirve en `/manifest.webmanifest` automáticamente.
 */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'ORUM · Club de beneficios',
    short_name: 'ORUM',
    description:
      'Tus beneficios en los comercios aliados del club ORUM: el catálogo completo y tu carnet de socio, siempre a mano.',

    /*
      LA APP INSTALABLE ES LA DEL SOCIO, no la del empleado. (El comercio
      tiene la suya, con su propio manifiesto que abre en `/comercios`:
      `app/manifest-comercios.webmanifest/route.ts`.)

      Antes apuntaba a `/admin`, y eso convertía el acceso administrativo en la
      primera pantalla de quien instalara la aplicación. Con `display:
      'standalone'` no hay barra de direcciones, así que el socio no tenía
      forma de corregirlo: le pasaba en CADA arranque, no solo el primero.

      Quien trabaja en el club entra por el navegador y escribe la ruta; quien
      paga la membresía es el único que tiene motivo para instalar un club de
      beneficios en su teléfono.
    */
    start_url: '/miembros',
    scope: '/',
    // `standalone` quita la barra del navegador: la app se abre como una
    // aplicación del sistema, que es lo que pidió el cliente.
    display: 'standalone',
    orientation: 'portrait',

    /*
      Deben coincidir con el tema oscuro: es lo que se ve en la pantalla de
      arranque, antes de que el script de tema resuelva la preferencia real.

      Literales a la fuerza —un `manifest.webmanifest` no lee `var(--…)`— así
      que son la ÚNICA copia a mano de la paleta y hay que moverlos cuando ella
      se mueve. Aquí valen `--n-1000` de la v4: eran `#0A0A0C`, el negro frío de
      la paleta anterior, y la aplicación instalada arrancaba con una franja de
      un sistema de diseño que ya no existe.
    */
    /* Los dos siguen a `--n-1000` de `tokens.css`. No pueden salir de una
       variable CSS: el manifiesto lo lee el sistema operativo antes de que
       exista una hoja de estilos. Si la paleta cambia, cambian a mano — y si no,
       la aplicación instalada arranca con el color de la dirección anterior,
       que es lo que acababa de pasar. */
    background_color: COLOR_ARRANQUE,
    theme_color: COLOR_ARRANQUE,

    lang: 'es-CO',
    dir: 'ltr',
    categories: ['business', 'productivity'],

    /* El monograma dorado, compartido con la aplicación del comercio. */
    icons: ICONOS_APP,

    /*
      Mantener pulsado el icono da acceso directo a las dos cosas que el SOCIO
      hace, sin pasar por el inicio. Antes eran «Registrar miembro» y «Buscar
      miembro», que son tareas de la caja del club: con la app instalada por el
      socio, ninguna de las dos le sirve y las dos llevan a una pantalla que no
      tiene permiso de ver.

      El carnet va primero: es lo que se abre con prisa, delante del cajero.
    */
    shortcuts: [
      {
        name: 'Mi carnet',
        short_name: 'Carnet',
        description: 'Mostrar tu carnet de socio y su código QR',
        url: '/miembros/perfil',
      },
      {
        name: 'Comercios y beneficios',
        short_name: 'Comercios',
        description: 'Ver el catálogo de aliados del club',
        url: '/miembros',
      },
    ],
  }
}
