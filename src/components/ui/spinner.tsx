import styles from './spinner.module.css'

export type SpinnerSize = 'sm' | 'md' | 'lg'

type Props = {
  size?: SpinnerSize
  /** Texto para lectores de pantalla. `null` si el contenedor ya lo anuncia. */
  label?: string | null
  className?: string
}

/**
 * Indicador de actividad.
 *
 * Lleva `data-motion-esencial` para quedar exento de la regla global de
 * movimiento reducido: un spinner congelado deja de comunicar que algo está
 * pasando, que es justo su única función.
 */
export function Spinner({ size = 'md', label = 'Cargando', className }: Props) {
  return (
    <>
      <svg
        className={[styles.spinner, styles[size], className].filter(Boolean).join(' ')}
        viewBox="0 0 24 24"
        fill="none"
        aria-hidden="true"
        data-motion-esencial
      >
        <circle
          className={styles.pista}
          cx="12"
          cy="12"
          r="9"
          stroke="currentColor"
          strokeWidth="2.5"
        />
        <path
          className={styles.arco}
          d="M21 12a9 9 0 0 0-9-9"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
        />
      </svg>
      {label !== null && <span className="sr-only">{label}</span>}
    </>
  )
}
