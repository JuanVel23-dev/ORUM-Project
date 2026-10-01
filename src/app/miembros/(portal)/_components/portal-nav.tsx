'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { esDestinoActivo } from '@/lib/miembros/navegacion-portal'
import styles from '../portal.module.css'

/*
  LA NAVEGACIÓN DEL PORTAL  ·  29/09/2026
  ---------------------------------------------------------------------------
  Encargo del propietario: «Inicio y Comercios por el momento». Desde el
  30/09/2026 se suma «Movimientos», la bitácora del socio (en móvil, donde
  esta barra no existe, la puerta es el icono de la cabecera). El Inicio ES
  el directorio de comercios (igual que `/explorar`): «Inicio» lleva arriba
  del todo y «Comercios» baja a la rejilla (`#comercios`).

  La ruta activa no se pinta (encargo: «que no se resalten ni se subrayen»);
  la dice `aria-current`. Solo en escritorio: en móvil el logo lleva al
  inicio y la rejilla está justo debajo del buscador.
*/
const DESTINOS = [
  { href: '/miembros', etiqueta: 'Inicio' },
  { href: '/miembros#comercios', etiqueta: 'Comercios' },
  { href: '/miembros/movimientos', etiqueta: 'Movimientos' },
] as const

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
            className={styles.enlace}
            aria-current={activo ? 'page' : undefined}
          >
            {etiqueta}
          </Link>
        )
      })}
    </nav>
  )
}
