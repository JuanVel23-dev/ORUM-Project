'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Home, IdCard, Megaphone, Store } from 'lucide-react'
import { esDestinoActivo } from '@/lib/miembros/navegacion-portal'
import styles from '../portal.module.css'

/*
  LA BARRA DE ESCRITORIO (29/09/2026, encargo del propietario): Inicio,
  Novedades y Comercios, como la del Portal Público. «Comercios» baja a
  «Todos los comercios» del Inicio. El carnet sale de la barra y vive en el
  menú del avatar («Mi carnet»).
*/
const DESTINOS = [
  { href: '/miembros', etiqueta: 'Inicio', Icono: Home },
  /* Baja a la sección del Inicio: la página `/miembros/novedades` se
     retiró el 29/09/2026 y las novedades viven solo ahí. */
  { href: '/miembros#novedades', etiqueta: 'Novedades', Icono: Megaphone },
  { href: '/miembros#comercios', etiqueta: 'Comercios', Icono: Store },
] as const

/*
  LA BARRA INFERIOR DE MÓVIL conserva el carnet como pestaña: en el
  teléfono no hay menú de avatar a mano en la caja, y el carnet es lo que se
  enseña para pagar. Los otros tres destinos son los mismos que arriba.
*/
const DESTINOS_MOVIL = [
  ...DESTINOS,
  { href: '/miembros/perfil', etiqueta: 'Mi carnet', Icono: IdCard },
] as const

/** Navegación de escritorio, en la cabecera. */
export function PortalNav() {
  const pathname = usePathname()

  return (
    <nav className={styles.nav} aria-label="Secciones del portal">
      {DESTINOS.map(({ href, etiqueta }) => {
        const activo = esDestinoActivo(pathname, href)
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
      {DESTINOS_MOVIL.map(({ href, etiqueta, Icono }) => {
        const activo = esDestinoActivo(pathname, href)
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
