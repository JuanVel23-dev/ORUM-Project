'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Home, User } from 'lucide-react'
import styles from '../portal.module.css'

const DESTINOS = [
  { href: '/miembros', etiqueta: 'Inicio', Icono: Home },
  { href: '/miembros/perfil', etiqueta: 'Mi perfil', Icono: User },
] as const

/**
 * `/miembros` solo está activo en coincidencia exacta; si no, quedaría marcado
 * también estando en `/miembros/perfil`, que es su hijo.
 */
function esActivo(pathname: string, href: string): boolean {
  return href === '/miembros' ? pathname === href : pathname.startsWith(href)
}

/** Navegación de escritorio, en la cabecera. */
export function PortalNav() {
  const pathname = usePathname()

  return (
    <nav className={styles.nav} aria-label="Secciones del portal">
      {DESTINOS.map(({ href, etiqueta }) => {
        const activo = esActivo(pathname, href)
        return (
          <Link
            key={href}
            href={href}
            className={[styles.enlace, activo && styles.enlaceActivo].filter(Boolean).join(' ')}
            aria-current={activo ? 'page' : undefined}
          >
            {etiqueta}
          </Link>
        )
      })}
    </nav>
  )
}

/** Barra inferior de móvil. Mismos destinos, alcance del pulgar. */
export function PortalTabBar() {
  const pathname = usePathname()

  return (
    <nav className={styles.tabbar} aria-label="Secciones del portal">
      {DESTINOS.map(({ href, etiqueta, Icono }) => {
        const activo = esActivo(pathname, href)
        return (
          <Link
            key={href}
            href={href}
            className={[styles.tab, activo && styles.tabActivo].filter(Boolean).join(' ')}
            aria-current={activo ? 'page' : undefined}
          >
            {/* El texto de al lado ya nombra el destino. */}
            <Icono size={22} strokeWidth={activo ? 2.2 : 1.8} aria-hidden />
            {etiqueta}
          </Link>
        )
      })}
    </nav>
  )
}
