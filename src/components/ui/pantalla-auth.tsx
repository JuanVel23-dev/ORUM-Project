import type { ReactNode } from 'react'
import styles from './pantalla-auth.module.css'

/**
 * Clases del formulario de acceso, para los componentes cliente que viven
 * dentro de `PantallaAuth`.
 *
 * `formulario` incluye la sacudida al fallar, que se dispara con `:has(.alerta)`
 * — por eso ambas clases tienen que salir del MISMO módulo CSS: si el aviso
 * llevara la clase de otro módulo, el selector nunca casaría.
 */
export const estilosAuth = {
  formulario: styles.formulario,
  alerta: styles.alerta,
} as const

type PantallaAuthProps = {
  /** Qué portal es. El wordmark ya dice ORUM. */
  subtitulo: string
  /** Texto de ayuda bajo la tarjeta. */
  pie?: ReactNode
  children: ReactNode
}

/**
 * Envoltura de las pantallas de acceso: fondo oscuro con halo dorado, tarjeta
 * de material y wordmark.
 *
 * La comparten el acceso de administración y el de miembros. Son dos puertas
 * al mismo club: si tuvieran dirección de arte distinta, la segunda parecería
 * de otra empresa.
 */
export function PantallaAuth({ subtitulo, pie, children }: PantallaAuthProps) {
  return (
    <div className={styles.pantalla} data-theme="dark">
      <div className={styles.tarjeta}>
        <header className={styles.cabecera}>
          <span className={styles.wordmark}>ORUM</span>
          <span className={styles.subtitulo}>{subtitulo}</span>
        </header>

        {children}

        {pie && <p className={styles.pie}>{pie}</p>}
      </div>
    </div>
  )
}
