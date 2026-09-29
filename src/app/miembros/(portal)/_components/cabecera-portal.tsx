'use client'

import type { ReactNode } from 'react'
import { usePathname } from 'next/navigation'
import styles from '../portal.module.css'

/*
  LA CABECERA DEL PORTAL, Y POR QUÉ CAMBIA DE MATERIAL SEGÚN LA RUTA
  ---------------------------------------------------------------------------
  Rediseño del 27/09/2026 (artifact «ORUM — Rediseño Portal Inicial»,
  `Miembros.dc.html`): en Inicio la cabecera va MONTADA SOBRE EL HÉROE NEGRO
  —el mismo lenguaje que la vitrina de comercios del Portal Público—, y en el
  resto del portal (carnet, novedades) sigue siendo el material claro de
  siempre (`MiembrosCarnet.dc.html`).

  `data-theme="dark"` en el propio `<header>` y no una lista de colores a
  mano: `globals.css` remapea TODOS los tokens bajo ese atributo sea cual sea
  el elemento, así que la navegación, el foco y el avatar se visten solos, y
  `LogoOrumTema` enseña la variante plata (CLAUDE.md → «sobre negro, plata»).

  Es la única pieza de cliente que se añade, y solo lee la ruta: todo lo que
  va dentro llega por `children` desde el layout, que sigue siendo servidor.
*/
export function CabeceraPortal({ children }: { children: ReactNode }) {
  const enInicio = usePathname() === '/miembros'

  return (
    <header
      className={[styles.cabecera, enInicio && styles.cabeceraInicio].filter(Boolean).join(' ')}
      data-theme={enInicio ? 'dark' : undefined}
    >
      {children}
    </header>
  )
}
