'use client'

import { createContext, useContext, useId, type ReactNode } from 'react'
import { AlertCircle } from 'lucide-react'
import styles from './field.module.css'

/*
  El cableado de accesibilidad de un campo (id, `for`, `aria-describedby`,
  `aria-invalid`) se olvida siempre si hay que escribirlo a mano en cada
  formulario. `Field` lo genera una vez y lo reparte por contexto, así que el
  control solo tiene que consumirlo.
*/

type FieldContextValue = {
  id: string
  describedBy: string | undefined
  invalid: boolean
}

const FieldContext = createContext<FieldContextValue | null>(null)

/** Devuelve el cableado del `Field` padre, o valores neutros si no hay ninguno. */
export function useField(): FieldContextValue {
  return (
    useContext(FieldContext) ?? { id: '', describedBy: undefined, invalid: false }
  )
}

type Props = {
  label: string
  /** Texto de ayuda permanente bajo el control. */
  help?: string
  /** Mensaje de error. Su presencia marca el campo como inválido. */
  error?: string | null
  /** Marca visualmente el campo como opcional (mejor que marcar los obligatorios). */
  optional?: boolean
  children: ReactNode
  className?: string
}

export function Field({ label, help, error, optional, children, className }: Props) {
  const base = useId()
  const id = `${base}-control`
  const idHelp = `${base}-help`
  const idError = `${base}-error`

  // El error se anuncia antes que la ayuda: es lo que hay que resolver.
  const describedBy =
    [error ? idError : null, help ? idHelp : null].filter(Boolean).join(' ') || undefined

  return (
    <FieldContext.Provider value={{ id, describedBy, invalid: Boolean(error) }}>
      <div className={[styles.field, className].filter(Boolean).join(' ')}>
        <label className={styles.label} htmlFor={id}>
          {label}
          {optional && <span className={styles.opcional}>opcional</span>}
        </label>

        <div className={styles.control}>{children}</div>

        {help && (
          <p className={styles.help} id={idHelp}>
            {help}
          </p>
        )}

        {error && (
          // `key` fuerza el remontaje cuando cambia el mensaje, para que la
          // animación de entrada y la sacudida se reproduzcan de nuevo.
          <p key={error} className={styles.error} id={idError}>
            <AlertCircle className={styles.errorIcono} aria-hidden="true" />
            {error}
          </p>
        )}
      </div>
    </FieldContext.Provider>
  )
}
