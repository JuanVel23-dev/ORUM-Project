'use client'

/*
  Selector de estrellas de las reseñas (la de lectura vive en
  `estrellas-lectura.tsx`, sin 'use client', para pintarse en el servidor).

  Cinco radios reales, escondidos a la vista pero no al lector de pantalla:
  dan el rol, las flechas y el envío con el formulario. Lo que se ve es la
  estrella.
*/

import { useState } from 'react'
import { FormaEstrella, PUNTOS } from './estrellas-lectura'
import styles from './estrellas.module.css'

type SelectorProps = {
  /** Se envía con el formulario bajo este nombre (el valor del radio marcado). */
  name?: string
  valorInicial?: number
  onChange?: (valor: number) => void
  /** Nombre accesible del grupo. */
  etiqueta?: string
  disabled?: boolean
  /** Id del texto de ayuda/error: va en CADA radio, que es quien recibe el foco. */
  describedBy?: string
}

export function EstrellasSelector({
  name = 'estrellas',
  valorInicial,
  onChange,
  etiqueta = 'Calificación',
  disabled = false,
  describedBy,
}: SelectorProps) {
  const [valor, setValor] = useState<number>(valorInicial ?? 0)

  return (
    <div
      className={styles.selector}
      role="radiogroup"
      aria-label={etiqueta}
      data-disabled={disabled || undefined}
    >
      {PUNTOS.map((n) => (
        <label key={n} className={styles.opcion} data-lleno={n <= valor ? 'true' : undefined}>
          <input
            className={styles.radio}
            type="radio"
            name={name}
            value={n}
            checked={valor === n}
            disabled={disabled}
            aria-describedby={describedBy}
            aria-label={n === 1 ? '1 estrella' : `${n} estrellas`}
            onChange={() => {
              setValor(n)
              onChange?.(n)
            }}
          />
          <FormaEstrella className={styles.forma} />
        </label>
      ))}
    </div>
  )
}
