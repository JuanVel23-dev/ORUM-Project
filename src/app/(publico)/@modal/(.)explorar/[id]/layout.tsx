import type { ReactNode } from 'react'
import { OverlayFichaPublica } from './overlay-ficha-publica'

/*
  LA VENTANA DE LA FICHA, EN EL LAYOUT (03/10/2026) — igual que en el Portal
  de Miembros: se abre en el acto con la silueta de `loading.tsx` y se
  rellena al llegar la ficha, sin volver a montarse.
*/
export default function FichaPublicaInterceptadaLayout({ children }: { children: ReactNode }) {
  return <OverlayFichaPublica>{children}</OverlayFichaPublica>
}
