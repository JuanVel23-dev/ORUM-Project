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
      'Panel de administración del club de beneficios ORUM: miembros, membresías y comercios aliados.',

    start_url: '/admin',
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

    // Mantener pulsado el icono de la app da acceso directo a las dos cosas
    // que un empleado hace todo el día, sin pasar por el inicio.
    shortcuts: [
      {
        name: 'Registrar miembro',
        short_name: 'Registrar',
        description: 'Crear un cliente y venderle su membresía',
        url: '/admin/miembros/nuevo',
      },
      {
        name: 'Buscar miembro',
        short_name: 'Buscar',
        description: 'Consultar el estado de una membresía',
        url: '/admin/miembros',
      },
    ],
  }
}
