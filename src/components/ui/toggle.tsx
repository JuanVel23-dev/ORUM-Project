'use client'

import type { InputHTMLAttributes, ReactNode } from 'react'
import styles from './toggle.module.css'

/*
  Los tres controles envuelven un input nativo oculto en vez de reimplementar
  el comportamiento con divs y ARIA. Así heredan gratis el rol, el estado
  marcado, la activación con espacio, la navegación con flechas dentro de un
  grupo de radios y la integración con `<form>`.
*/

type Base = {
  label: ReactNode
  /** Segunda línea explicativa bajo la etiqueta. */
  description?: ReactNode
  className?: string
}

type EntradaProps = Omit<InputHTMLAttributes<HTMLInputElement>, 'type' | 'className'>

function Textos({ label, description }: Pick<Base, 'label' | 'description'>) {
  return (
    <span className={styles.textos}>
      <span className={styles.titulo}>{label}</span>
      {description && <span className={styles.descripcion}>{description}</span>}
    </span>
  )
}

/* --- Switch --------------------------------------------------------------- */

/**
 * Interruptor de encendido/apagado. Aplica el cambio de inmediato; para
 * confirmar antes de aplicar, usa un checkbox dentro de un formulario.
 */
export function Switch({ label, description, className, ...props }: Base & EntradaProps) {
  return (
    <label className={[styles.fila, className].filter(Boolean).join(' ')}>
      <input className={styles.entrada} type="checkbox" role="switch" {...props} />
      <span className={styles.pista} aria-hidden="true">
        <span className={styles.pulgar} />
      </span>
      <Textos label={label} description={description} />
    </label>
  )
}

/* --- Checkbox ------------------------------------------------------------- */

export function Checkbox({
  label,
  description,
  className,
  ...props
}: Base & EntradaProps) {
  return (
    <label className={[styles.fila, className].filter(Boolean).join(' ')}>
      <input className={styles.entrada} type="checkbox" {...props} />
      <span className={`${styles.caja} ${styles.cuadrada}`} aria-hidden="true">
        <svg className={styles.marca} viewBox="0 0 24 24" fill="none">
          <path
            d="M4.5 12.5l5 5 10-11"
            stroke="currentColor"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </span>
      <Textos label={label} description={description} />
    </label>
  )
}

/* --- Radio ---------------------------------------------------------------- */

/** Recuerda darle `name` compartido a todas las opciones del mismo grupo. */
export function Radio({ label, description, className, ...props }: Base & EntradaProps) {
  return (
    <label className={[styles.fila, className].filter(Boolean).join(' ')}>
      <input className={styles.entrada} type="radio" {...props} />
      <span className={`${styles.caja} ${styles.redonda}`} aria-hidden="true">
        <span className={styles.punto} />
      </span>
      <Textos label={label} description={description} />
    </label>
  )
}
