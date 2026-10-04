import type { MetadataRoute } from 'next'
import { COLOR_ARRANQUE, ICONOS_APP } from '@/lib/shared/manifiesto-app'

/*
  EL MANIFIESTO DE LA APLICACIÓN DEL COMERCIO  ·  04/10/2026
  ---------------------------------------------------------------------------
  Encargo del propietario: «los comercios pueden también descargar este
  portal». El manifiesto del sitio (`app/manifest.ts`) abre en `/miembros`:
  instalado desde la caja, llevaría al cajero a la puerta del SOCIO en cada
  arranque, y con `display: 'standalone'` no hay barra de direcciones para
  corregirlo. Por eso el Portal de Comercios enlaza ESTE (`comercios/layout.tsx`
  lo pone en `metadata.manifest`), que abre en `/comercios`.

  Son DOS aplicaciones distintas para el sistema: cada una tiene su `id`, así
  que un comercio que además es socio puede tener las dos en el teléfono.

  Es un Route Handler y no un segundo `manifest.ts` porque Next solo admite
  ese archivo especial en la raíz de `app/`. Estático: no lee la sesión.
*/

export const dynamic = 'force-static'

export function GET() {
  const manifiesto: MetadataRoute.Manifest = {
    id: '/comercios',
    name: 'ORUM Comercios · Verificar membresías',
    // Lo que se lee bajo el icono: corto, para que el sistema no lo corte, y
    // distinto del «ORUM» de la aplicación del socio.
    short_name: 'Comercios',
    description:
      'La herramienta de caja de los comercios aliados de ORUM: verifica el carnet de cada socio y registra sus compras.',

    start_url: '/comercios',
    /* Solo el portal de comercios: lo demás del sitio (los textos legales del
       pie, la fachada) se abre aparte, sin sacar al cajero de su caja. */
    scope: '/comercios',
    display: 'standalone',
    orientation: 'portrait',

    background_color: COLOR_ARRANQUE,
    theme_color: COLOR_ARRANQUE,

    lang: 'es-CO',
    dir: 'ltr',
    categories: ['business', 'productivity'],

    icons: ICONOS_APP,
  }

  return new Response(JSON.stringify(manifiesto), {
    headers: { 'Content-Type': 'application/manifest+json; charset=utf-8' },
  })
}
