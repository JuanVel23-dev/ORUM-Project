import type { CSSProperties, HTMLAttributes, ReactNode } from 'react'
import styles from './layout.module.css'

/** Pasos de la rejilla de 4pt. Ningún espaciado fuera de esta escala. */
export type SpaceStep = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12

const gapVar = (step: SpaceStep) => `var(--space-${step})`

/* --- Stack ---------------------------------------------------------------- */

type StackProps = HTMLAttributes<HTMLDivElement> & {
  direction?: 'row' | 'column'
  gap?: SpaceStep
  align?: CSSProperties['alignItems']
  justify?: CSSProperties['justifyContent']
  wrap?: boolean
  children: ReactNode
}

/** Apilado con espaciado tokenizado. Evita `margin` suelto entre hermanos. */
export function Stack({
  direction = 'column',
  gap = 4,
  align,
  justify,
  wrap = false,
  className,
  style,
  children,
  ...props
}: StackProps) {
  return (
    <div
      className={[styles.stack, wrap && styles.wrap, className].filter(Boolean).join(' ')}
      style={
        {
          '--direccion': direction,
          '--gap': gapVar(gap),
          ...(align && { '--alinear': align }),
          ...(justify && { '--justificar': justify }),
          ...style,
        } as CSSProperties
      }
      {...props}
    >
      {children}
    </div>
  )
}

/* --- Grid ----------------------------------------------------------------- */

type GridProps = HTMLAttributes<HTMLDivElement> & {
  /** Ancho mínimo de columna. La rejilla se adapta sola, sin media queries. */
  min?: string
  gap?: SpaceStep
  children: ReactNode
}

export function Grid({
  min = '240px',
  gap = 4,
  className,
  style,
  children,
  ...props
}: GridProps) {
  return (
    <div
      className={[styles.grid, className].filter(Boolean).join(' ')}
      style={{ '--min': min, '--gap': gapVar(gap), ...style } as CSSProperties}
      {...props}
    >
      {children}
    </div>
  )
}

/* --- Divider -------------------------------------------------------------- */

export function Divider({ label, className }: { label?: string; className?: string }) {
  if (!label) {
    return <hr className={[styles.divider, className].filter(Boolean).join(' ')} />
  }

  return (
    <div
      className={[styles.dividerConTexto, className].filter(Boolean).join(' ')}
      role="separator"
    >
      {label}
    </div>
  )
}

/* --- Section -------------------------------------------------------------- */

type SectionProps = {
  /** Encabezado en mayúsculas pequeñas: agrupa sin competir con el título. */
  title?: string
  actions?: ReactNode
  gap?: SpaceStep
  className?: string
  children: ReactNode
}

export function Section({ title, actions, gap = 4, className, children }: SectionProps) {
  return (
    <section
      className={[styles.section, className].filter(Boolean).join(' ')}
      style={{ '--gap': gapVar(gap) } as CSSProperties}
    >
      {(title || actions) && (
        <div className={styles.sectionCabecera}>
          {title && <h2 className={styles.sectionTitulo}>{title}</h2>}
          {actions}
        </div>
      )}
      {children}
    </section>
  )
}

/* --- PageHeader ----------------------------------------------------------- */

type PageHeaderProps = {
  title: ReactNode
  description?: ReactNode
  /** Acción primaria de la pantalla. En móvil pasa a ocupar todo el ancho. */
  actions?: ReactNode
  className?: string
}

export function PageHeader({ title, description, actions, className }: PageHeaderProps) {
  return (
    <header className={[styles.pageHeader, className].filter(Boolean).join(' ')}>
      <div className={styles.pageTextos}>
        <h1 className={styles.pageTitulo}>{title}</h1>
        {description && <p className={styles.pageDescripcion}>{description}</p>}
      </div>
      {actions && <div className={styles.pageAcciones}>{actions}</div>}
    </header>
  )
}
