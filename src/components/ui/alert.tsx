import type { ReactNode } from 'react'
import { AlertTriangle, CheckCircle2, Info, XCircle } from 'lucide-react'
import styles from './alert.module.css'

export type AlertTone = 'info' | 'success' | 'warning' | 'danger'

/*
  Cada tono trae SU icono. El color nunca transporta el significado por sí
  solo: sin icono, un aviso y un error son el mismo bloque para quien no
  distingue rojo de naranja.
*/
const ICONO = {
  info: Info,
  success: CheckCircle2,
  warning: AlertTriangle,
  danger: XCircle,
} as const

type Props = {
  tone?: AlertTone
  /** Si se omite, `children` es todo el mensaje. */
  title?: string
  children?: ReactNode
  /** Botones de resolución. Un aviso que no se puede resolver es ruido. */
  actions?: ReactNode
  className?: string
}

export function Alert({ tone = 'info', title, children, actions, className }: Props) {
  const Icono = ICONO[tone]

  return (
    <div
      className={[styles.alert, styles[tone], className].filter(Boolean).join(' ')}
      // Los errores interrumpen; el resto se anuncia sin cortar la lectura.
      role={tone === 'danger' ? 'alert' : 'status'}
    >
      <Icono className={styles.icono} aria-hidden="true" />

      <div className={styles.cuerpo}>
        {title && <span className={styles.titulo}>{title}</span>}
        {children && <span className={styles.descripcion}>{children}</span>}
        {actions && <div className={styles.acciones}>{actions}</div>}
      </div>
    </div>
  )
}
