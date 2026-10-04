import type { ReactNode } from 'react'
import { OverlayFicha } from './overlay-ficha'

/*
  LA VENTANA DE LA FICHA, EN EL LAYOUT (03/10/2026)

  Antes la envoltura (`OverlayFicha`) vivía en la página, así que no existía
  hasta que el servidor terminaba de preparar la ficha: el toque en la
  tarjeta tardaba en hacer efecto. En el layout, la ventana se abre EN EL
  ACTO con la silueta de `loading.tsx` y, cuando llega la ficha, se rellena
  SIN volver a montarse — con la envoltura en la página y otra en el
  `loading`, la ventana se cerraría y se abriría otra vez al llegar los datos.
*/
export default function FichaInterceptadaLayout({ children }: { children: ReactNode }) {
  return <OverlayFicha>{children}</OverlayFicha>
}
