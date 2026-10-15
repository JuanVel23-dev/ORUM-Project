import Link from 'next/link'
import styles from './pestanas.module.css'

/*
  PESTAÑAS DE UNA LISTA  ·  rediseño del panel (15/10/2026)
  ---------------------------------------------------------------------------
  Una franja gris muy suave con las opciones; la elegida es una PÍLDORA
  BLANCA que se levanta con su sombra (encargo: «no me gusta cómo se resalta
  el que estoy usando»; la raya debajo se descartó). Cada opción puede llevar
  un punto de color —el estado que representa— y su recuento.

  Son ENLACES: el filtro vive en la URL (se comparte, sobrevive a un
  refresco y funciona sin JavaScript). La elegida lo dice con
  `aria-current`, el peso y la sombra, nunca solo con el color.
*/

export type TonoPestana = 'neutro' | 'exito' | 'aviso' | 'peligro' | 'vacio'

export type Pestana = {
  href: string
  etiqueta: string
  cuenta?: number
  /** El color del punto; sin tono, sin punto. */
  tono?: TonoPestana
  activa: boolean
}

export function Pestanas({ items, etiqueta }: { items: Pestana[]; etiqueta: string }) {
  return (
    <nav aria-label={etiqueta} className={styles.pista}>
      {items.map((p) => (
        <Link
          key={p.href}
          href={p.href}
          scroll={false}
          className={styles.pestana}
          aria-current={p.activa ? 'page' : undefined}
          data-activa={p.activa || undefined}
        >
          {p.tono && <span className={styles.punto} data-tono={p.tono} aria-hidden="true" />}
          {p.etiqueta}
          {p.cuenta !== undefined && (
            <span className={styles.cuenta}>{p.cuenta.toLocaleString('es-CO')}</span>
          )}
        </Link>
      ))}
    </nav>
  )
}
