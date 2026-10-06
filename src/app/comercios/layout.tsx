import type { Metadata } from 'next'
import type { ReactNode } from 'react'
import { RUTA_MANIFIESTO_COMERCIOS } from '@/lib/shared/manifiesto-app'

/*
  LA RAÍZ DE `/comercios`  ·  solo metadatos (04/10/2026)
  ---------------------------------------------------------------------------
  No pinta nada: existe para que TODO lo que cuelga de `/comercios` —el portal
  y sus dos pantallas de acceso— enlace el manifiesto de la aplicación del
  comercio en vez del del sitio. Así, instalar desde aquí crea una aplicación
  que abre en `/comercios` y no en la puerta del socio. El porqué entero está
  en `app/manifest-comercios.webmanifest/route.ts`.

  `appleWebApp` se repite COMPLETO: los metadatos se fusionan por clave, sin
  mezclar por dentro, así que poner solo `title` borraría `capable` y
  `statusBarStyle` del layout raíz. El título es lo que iOS escribe bajo el
  icono al «Añadir a pantalla de inicio».
*/
export const metadata: Metadata = {
  manifest: RUTA_MANIFIESTO_COMERCIOS,
  applicationName: 'ORUM Comercios',
  appleWebApp: {
    capable: true,
    title: 'Comercios',
    statusBarStyle: 'black-translucent',
  },
}

export default function ComerciosRaiz({ children }: { children: ReactNode }) {
  return children
}
