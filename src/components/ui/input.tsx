'use client'

import type {
  InputHTMLAttributes,
  ReactNode,
  SelectHTMLAttributes,
  TextareaHTMLAttributes,
} from 'react'
import { ChevronDown } from 'lucide-react'
import { useField } from './field'
import styles from './input.module.css'

/*
  Los tres controles consumen el cableado del `Field` padre (id,
  aria-describedby, aria-invalid). Si se usan sueltos, `useField` devuelve
  valores neutros y siguen funcionando.
*/

type ComunProps = {
  /** Alinea las cifras en columna: cédulas, teléfonos, montos, nº de membresía. */
  numeric?: boolean
  className?: string
}

/* --- Input ---------------------------------------------------------------- */

type InputProps = ComunProps &
  Omit<InputHTMLAttributes<HTMLInputElement>, 'className'> & {
    /** Icono decorativo a la izquierda. No captura el puntero. */
    startIcon?: ReactNode
    /**
     * Control al final del campo (mostrar contraseña, limpiar…). A diferencia
     * del inicial, este SÍ es interactivo. Usa `InputButton` para el estilo.
     */
    endAdornment?: ReactNode
  }

export function Input({
  numeric,
  startIcon,
  endAdornment,
  className,
  ...props
}: InputProps) {
  const { id, describedBy, invalid } = useField()

  const control = (
    <input
      id={props.id ?? (id || undefined)}
      aria-describedby={props['aria-describedby'] ?? describedBy}
      aria-invalid={props['aria-invalid'] ?? (invalid || undefined)}
      className={[styles.control, numeric && styles.numerico, className]
        .filter(Boolean)
        .join(' ')}
      {...props}
    />
  )

  if (!startIcon && !endAdornment) return control

  return (
    <span
      className={styles.conAdorno}
      data-inicio={startIcon ? 'true' : undefined}
      data-fin={endAdornment ? 'true' : undefined}
    >
      {startIcon && (
        <span className={`${styles.adorno} ${styles.adornoInicio}`} aria-hidden="true">
          {startIcon}
        </span>
      )}
      {control}
      {endAdornment && (
        <span className={`${styles.adorno} ${styles.adornoFin}`}>{endAdornment}</span>
      )}
    </span>
  )
}

/** Botón con el tamaño y el estilo correctos para ir dentro de un `Input`. */
export function InputButton({
  label,
  onClick,
  children,
}: {
  /** Nombre accesible: el botón solo muestra un icono. */
  label: string
  onClick: () => void
  children: ReactNode
}) {
  return (
    <button
      type="button"
      className={styles.botonAdorno}
      onClick={onClick}
      aria-label={label}
      // Evita que el botón robe el foco al tabular por el formulario: se
      // alcanza igualmente, pero después del campo al que pertenece.
      tabIndex={-1}
    >
      {children}
    </button>
  )
}

/* --- Textarea ------------------------------------------------------------- */

type TextareaProps = ComunProps &
  Omit<TextareaHTMLAttributes<HTMLTextAreaElement>, 'className'>

export function Textarea({ numeric, className, ...props }: TextareaProps) {
  const { id, describedBy, invalid } = useField()

  return (
    <textarea
      id={props.id ?? (id || undefined)}
      aria-describedby={props['aria-describedby'] ?? describedBy}
      aria-invalid={props['aria-invalid'] ?? (invalid || undefined)}
      className={[styles.control, styles.textarea, numeric && styles.numerico, className]
        .filter(Boolean)
        .join(' ')}
      {...props}
    />
  )
}

/* --- Select --------------------------------------------------------------- */

type SelectProps = ComunProps &
  Omit<SelectHTMLAttributes<HTMLSelectElement>, 'className'> & {
    children: ReactNode
  }

/**
 * Select nativo con flecha propia.
 *
 * Se mantiene el `<select>` del sistema a propósito: en móvil abre la rueda
 * nativa, que es más rápida y accesible que cualquier lista personalizada.
 */
export function Select({ numeric, className, children, ...props }: SelectProps) {
  const { id, describedBy, invalid } = useField()

  return (
    <span className={styles.selectWrap}>
      <select
        id={props.id ?? (id || undefined)}
        aria-describedby={props['aria-describedby'] ?? describedBy}
        aria-invalid={props['aria-invalid'] ?? (invalid || undefined)}
        className={[styles.control, styles.select, numeric && styles.numerico, className]
          .filter(Boolean)
          .join(' ')}
        {...props}
      >
        {children}
      </select>
      <ChevronDown className={styles.flecha} aria-hidden="true" />
    </span>
  )
}
