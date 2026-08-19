import type { CSSProperties, ReactNode } from 'react'
import { Inbox, TriangleAlert } from 'lucide-react'
import styles from './feedback.module.css'

/* --- Skeleton -------------------------------------------------------------- */

type SkeletonProps = {
  width?: string
  height?: string
  radius?: string
  /** Preajuste para líneas de texto: altura y márgenes de una línea. */
  variant?: 'block' | 'text' | 'circle'
  className?: string
}

/**
 * Bloque de carga.
 *
 * Se compone para REPLICAR el layout real que va a sustituir. Un esqueleto que
 * no se parece a lo que llega después desplaza el contenido al resolverse, que
 * es peor que no haber puesto nada.
 */
export function Skeleton({
  width,
  height,
  radius,
  variant = 'block',
  className,
}: SkeletonProps) {
  return (
    <span
      className={[
        styles.skeleton,
        variant === 'text' && styles.texto,
        variant === 'circle' && styles.circulo,
        className,
      ]
        .filter(Boolean)
        .join(' ')}
      style={
        {
          ...(width && { '--ancho': width }),
          ...(height && { '--alto': height }),
          ...(radius && { '--radio': radius }),
        } as CSSProperties
      }
      // Exento de la regla global de movimiento reducido: un esqueleto
      // congelado parece contenido roto, no contenido cargando.
      data-motion-esencial
      aria-hidden="true"
    />
  )
}

/** Varias líneas de texto simulado; la última más corta, como un párrafo real. */
export function SkeletonText({ lines = 3 }: { lines?: number }) {
  return (
    <span aria-hidden="true">
      {Array.from({ length: lines }, (_, i) => (
        <Skeleton key={i} variant="text" width={i === lines - 1 ? '60%' : '100%'} />
      ))}
    </span>
  )
}

/* --- ProgressBar ----------------------------------------------------------- */

type ProgressProps = {
  /** 0–100. Omítelo para la variante indeterminada. */
  value?: number
  label?: string
  className?: string
}

export function ProgressBar({ value, label = 'Progreso', className }: ProgressProps) {
  const indeterminada = value === undefined

  return (
    <div
      className={[styles.progreso, indeterminada && styles.indeterminada, className]
        .filter(Boolean)
        .join(' ')}
      role="progressbar"
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={indeterminada ? undefined : Math.round(value)}
      data-motion-esencial
    >
      <div
        className={styles.progresoBarra}
        style={indeterminada ? undefined : { width: `${Math.min(100, Math.max(0, value))}%` }}
      />
    </div>
  )
}

/* --- EmptyState ------------------------------------------------------------ */

type EmptyProps = {
  title: string
  description?: string
  icon?: ReactNode
  /** La acción que resuelve el vacío. Un estado vacío sin salida es un callejón. */
  actions?: ReactNode
  className?: string
}

export function EmptyState({ title, description, icon, actions, className }: EmptyProps) {
  return (
    <div className={[styles.estado, className].filter(Boolean).join(' ')}>
      <div className={styles.estadoIcono}>{icon ?? <Inbox aria-hidden="true" />}</div>

      <div className={styles.estadoTextos}>
        <p className={styles.estadoTitulo}>{title}</p>
        {description && <p className={styles.estadoDescripcion}>{description}</p>}
      </div>

      {actions && <div className={styles.estadoAcciones}>{actions}</div>}
    </div>
  )
}

/* --- ErrorState ------------------------------------------------------------ */

type ErrorProps = {
  title?: string
  description?: string
  /** Detalle técnico. Se muestra atenuado; nunca sustituye al mensaje humano. */
  detail?: string
  actions?: ReactNode
  className?: string
}

/**
 * Fallo recuperable.
 *
 * Dice qué pasó en lenguaje llano y ofrece salida. Un stack trace en pantalla
 * no ayuda a quien está vendiendo una membresía en un mostrador.
 */
export function ErrorState({
  title = 'Algo no salió bien',
  description = 'No pudimos cargar esta información. Vuelve a intentarlo en unos segundos.',
  detail,
  actions,
  className,
}: ErrorProps) {
  return (
    <div
      className={[styles.estado, styles.estadoError, className].filter(Boolean).join(' ')}
      role="alert"
    >
      <div className={styles.estadoIcono}>
        <TriangleAlert aria-hidden="true" />
      </div>

      <div className={styles.estadoTextos}>
        <p className={styles.estadoTitulo}>{title}</p>
        <p className={styles.estadoDescripcion}>{description}</p>
        {detail && <p className={styles.detalle}>{detail}</p>}
      </div>

      {actions && <div className={styles.estadoAcciones}>{actions}</div>}
    </div>
  )
}
