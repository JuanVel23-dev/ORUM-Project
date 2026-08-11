import type { HTMLAttributes, ReactNode } from 'react'
import styles from './card.module.css'

export type CardPadding = 'none' | 'sm' | 'md' | 'lg'
export type CardVariant = 'default' | 'sunk' | 'brand'

type CardProps = HTMLAttributes<HTMLDivElement> & {
  /** Usa `none` cuando dentro vayan `CardHeader` / `CardBody` / `CardFooter`. */
  padding?: CardPadding
  /**
   * `brand` añade un filo dorado superior. Reservado a una tarjeta por
   * pantalla como mucho: si varias compiten, el oro deja de destacar nada.
   */
  variant?: CardVariant
  /** Aplica estados de hover/press. El elemento pulsable lo pone el consumidor. */
  interactive?: boolean
  children: ReactNode
}

export function Card({
  padding = 'md',
  variant = 'default',
  interactive = false,
  className,
  children,
  ...props
}: CardProps) {
  return (
    <div
      className={[
        styles.card,
        styles[`pad-${padding}`],
        variant !== 'default' && styles[variant],
        interactive && styles.interactive,
        className,
      ]
        .filter(Boolean)
        .join(' ')}
      {...props}
    >
      {children}
    </div>
  )
}

type CardHeaderProps = {
  title: ReactNode
  subtitle?: ReactNode
  /** Botones o menú alineados a la derecha del encabezado. */
  actions?: ReactNode
  className?: string
}

export function CardHeader({ title, subtitle, actions, className }: CardHeaderProps) {
  return (
    <div className={[styles.header, className].filter(Boolean).join(' ')}>
      <div className={styles.headerTextos}>
        <h3 className={styles.title}>{title}</h3>
        {subtitle && <p className={styles.subtitle}>{subtitle}</p>}
      </div>
      {actions && <div className={styles.acciones}>{actions}</div>}
    </div>
  )
}

export function CardBody({
  className,
  children,
  ...props
}: HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={[styles.body, className].filter(Boolean).join(' ')} {...props}>
      {children}
    </div>
  )
}

export function CardFooter({
  className,
  children,
  ...props
}: HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={[styles.footer, className].filter(Boolean).join(' ')} {...props}>
      {children}
    </div>
  )
}
