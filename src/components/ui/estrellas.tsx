'use client'

/*
  Estrellas de las reseñas: una de lectura y un selector.

  Por qué el archivo es 'use client' aunque `EstrellasLectura` no use estado:
  un módulo no puede mezclar las dos cosas, y una función sin hooks importada
  desde un Server Component funciona igual. Lo único que cruza la frontera es
  JSX serializable (props simples), así que se puede pintar desde el servidor.

  La forma es SVG inline: sin librería. «Llena» y «hueca» difieren por FORMA
  (relleno contra trazo), no solo por color, y el nombre accesible lo dice con
  palabras.
*/

import { useId, useState, type CSSProperties } from 'react'
import { ESTRELLAS_MAX, ESTRELLAS_MIN, formatearPromedio } from '@/lib/resenas/resenas'
import styles from './estrellas.module.css'

const PUNTOS = Array.from(
  { length: ESTRELLAS_MAX - ESTRELLAS_MIN + 1 },
  (_, i) => i + ESTRELLAS_MIN,
)

/** Estrella de cinco puntas en un lienzo de 24x24. */
const TRAZADO =
  'M12 2.6l2.82 5.99 6.48.78-4.78 4.46 1.27 6.46L12 17.1l-5.79 3.19 1.27-6.46L2.7 9.37l6.48-.78z'

function Forma({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      aria-hidden="true"
      focusable="false"
    >
      <path d={TRAZADO} strokeLinejoin="round" />
    </svg>
  )
}

/* -------------------------------------------------------------------------- */

type LecturaProps = {
  /** Promedio de 0 a 5, o `null` si todavía no hay calificaciones. */
  valor: number | null
  /** Cuántas calificaciones lo sostienen; se pinta al lado si se da. */
  total?: number
  tamano?: 'sm' | 'md'
}

/** Redondea a medias estrellas: lo que se puede dibujar sin mentir. */
function mediaMasCercana(valor: number): number {
  const acotado = Math.min(ESTRELLAS_MAX, Math.max(0, valor))
  return Math.round(acotado * 2) / 2
}

export function EstrellasLectura({ valor, total, tamano = 'sm' }: LecturaProps) {
  const sinNota = valor === null || (total !== undefined && total === 0)
  const redondeado = sinNota ? 0 : mediaMasCercana(valor)

  const nombre = sinNota
    ? 'Sin calificaciones'
    : `${formatearPromedio(valor)} de ${ESTRELLAS_MAX} estrellas`

  return (
    <span className={`${styles.lectura} ${styles[tamano]}`}>
      <span className={styles.estrellas} role="img" aria-label={nombre}>
        {PUNTOS.map((n) => {
          const relleno = Math.min(1, Math.max(0, redondeado - (n - 1)))
          return (
            <span
              key={n}
              className={styles.celda}
              style={{ '--relleno': `${relleno * 100}%` } as CSSProperties}
            >
              <Forma className={styles.hueca} />
              <Forma className={styles.llena} />
            </span>
          )
        })}
      </span>
      {total !== undefined && total > 0 && (
        <span className={styles.total}>({total})</span>
      )}
    </span>
  )
}

/* -------------------------------------------------------------------------- */

type SelectorProps = {
  /** Se envía con el formulario bajo este nombre (el valor del radio marcado). */
  name?: string
  valorInicial?: number
  onChange?: (valor: number) => void
  /** Nombre accesible del grupo. */
  etiqueta?: string
  disabled?: boolean
}

export function EstrellasSelector({
  name = 'estrellas',
  valorInicial,
  onChange,
  etiqueta = 'Calificación',
  disabled = false,
}: SelectorProps) {
  const [valor, setValor] = useState<number>(valorInicial ?? 0)
  const grupo = useId()

  return (
    <div
      className={styles.selector}
      role="radiogroup"
      aria-label={etiqueta}
      data-disabled={disabled || undefined}
    >
      {PUNTOS.map((n) => (
        <label
          key={n}
          className={styles.opcion}
          data-lleno={n <= valor ? 'true' : undefined}
        >
          <input
            className={styles.radio}
            type="radio"
            id={`${grupo}-${n}`}
            name={name}
            value={n}
            checked={valor === n}
            disabled={disabled}
            aria-label={n === 1 ? '1 estrella' : `${n} estrellas`}
            onChange={() => {
              setValor(n)
              onChange?.(n)
            }}
          />
          <Forma className={styles.forma} />
        </label>
      ))}
    </div>
  )
}
