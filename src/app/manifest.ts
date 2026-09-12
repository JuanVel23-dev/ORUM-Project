import type { MetadataRoute } from 'next'

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
      LA APP INSTALABLE ES LA DEL SOCIO, no la del empleado.

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

    // Deben coincidir con el tema oscuro: es lo que se ve en la pantalla de
    // arranque, antes de que el script de tema resuelva la preferencia real.
    background_color: '#0A0A0C',
    theme_color: '#0A0A0C',

    lang: 'es-CO',
    dir: 'ltr',
    categories: ['business', 'productivity'],

    icons: [
      {
        src: '/icons/orum.svg',
        // `any` porque un SVG escala a cualquier tamaño sin perder nitidez.
        sizes: 'any',
        type: 'image/svg+xml',
        purpose: 'any',
      },
      {
        // Sin esta variante Android recorta el icono normal con la forma del
        // sistema y se ve un cuadrado dentro del círculo.
        src: '/icons/orum-maskable.svg',
        sizes: 'any',
        type: 'image/svg+xml',
        purpose: 'maskable',
      },
    ],

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
