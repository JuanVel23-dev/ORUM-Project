'use client'

import type { ReactNode } from 'react'
import { usePathname } from 'next/navigation'

/*
  EL PIE DEL PORTAL SEGÚN LA PANTALLA (maquetas del 29/09/2026)

  Inicio lleva el pie completo del Portal Público —las tres puertas, soporte
  y enlaces legales—; las pantallas interiores (carnet, novedades) llevan el
  compacto: logotipo y derechos. Los dos llegan ya renderizados del servidor;
  esto solo lee la ruta y elige.
*/
export function PiePortal({ completo, compacto }: { completo: ReactNode; compacto: ReactNode }) {
  return usePathname() === '/miembros' ? completo : compacto
}
