'use client'

import { useId, type CSSProperties, type ReactNode } from 'react'
import styles from './segmented.module.css'

export type SegmentedOption<T extends string> = {
  value: T
  label: string
  icon?: ReactNode
  disabled?: boolean
}

type Props<T extends string> = {
  options: ReadonlyArray<SegmentedOption<T>>
  value: T
  onChange: (value: T) => void
  /** Obligatorio: el grupo necesita nombre accesible. */
  ariaLabel: string
  size?: 'sm' | 'md'
  /** Oculta las etiquetas y deja solo iconos por debajo de 480px. */
  compactOnMobile?: boolean
  /**
   * Oculta el indicador sin animarlo. Útil durante la hidratación, cuando
   * todavía no se conoce la selección real y deslizarlo sería un salto falso.
   */
  indicatorHidden?: boolean
  className?: string
}

/**
 * Control segmentado: una elección entre pocas opciones mutuamente excluyentes.
 *
 * Frente a un interruptor binario, admite tres o más estados —por ejemplo
 * `Auto / Claro / Oscuro`, donde "Auto" es un estado real y no la ausencia de
 * elección—. Por encima de 4 o 5 opciones conviene un `Select`.
 */
export function SegmentedControl<T extends string>({
  options,
  value,
  onChange,
  ariaLabel,
  size = 'sm',
  compactOnMobile = false,
  indicatorHidden = false,
  className,
}: Props<T>) {
  const nombre = useId()
  const indice = Math.max(
    0,
    options.findIndex((o) => o.value === value),
  )

  return (
    <div
      className={[styles.group, styles[size], className].filter(Boolean).join(' ')}
      role="radiogroup"
      aria-label={ariaLabel}
      data-compacto={compactOnMobile}
      data-indicador={indicatorHidden ? 'oculto' : 'visible'}
      style={
        { '--indice': indice, '--total': options.length } as CSSProperties
      }
    >
      <span className={styles.indicator} aria-hidden="true" />

      {options.map((opcion) => (
        <label key={opcion.value} className={styles.option}>
          <input
            className={styles.radio}
            type="radio"
            name={nombre}
            value={opcion.value}
            checked={value === opcion.value}
            disabled={opcion.disabled}
            onChange={() => onChange(opcion.value)}
          />
          {opcion.icon}
          <span className={styles.etiqueta}>{opcion.label}</span>
        </label>
      ))}
    </div>
  )
}
