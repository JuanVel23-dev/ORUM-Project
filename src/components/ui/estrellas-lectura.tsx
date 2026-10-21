/*
  Estrellas de LECTURA (el promedio de un comercio, la nota de una reseña).

  Sin 'use client': no tiene estado, así que se pinta en el servidor y no
  añade nada al paquete del navegador. El selector, que sí guarda estado,
  vive aparte en `estrellas.tsx`; los dos comparten la forma y la hoja.

  La forma es SVG inline: sin librería. «Llena» y «hueca» difieren por FORMA
  (relleno contra trazo), no solo por color, y el nombre accesible lo dice con
  palabras.
*/

import type { CSSProperties } from 'react'
import { ESTRELLAS_MAX, ESTRELLAS_MIN, formatearPromedio } from '@/lib/resenas/resenas'
import styles from './estrellas.module.css'

/** Los puntos de la escala, de 1 a 5. */
export const PUNTOS = Array.from(
  { length: ESTRELLAS_MAX - ESTRELLAS_MIN + 1 },
  (_, i) => i + ESTRELLAS_MIN,
)

/** Estrella de cinco puntas en un lienzo de 24x24. */
const TRAZADO =
  'M12 2.6l2.82 5.99 6.48.78-4.78 4.46 1.27 6.46L12 17.1l-5.79 3.19 1.27-6.46L2.7 9.37l6.48-.78z'

export function FormaEstrella({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <path d={TRAZADO} strokeLinejoin="round" />
    </svg>
  )
}

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
  /* Nunca «0,0 de 5» ni «NaN de 5»: sin un promedio positivo y finito, o sin
     nadie que lo sostenga, no hay calificación que leer. */
  const nota =
    valor !== null && Number.isFinite(valor) && valor > 0 && total !== 0 ? valor : null
  const redondeado = nota === null ? 0 : mediaMasCercana(nota)

  const nombre =
    nota === null
      ? 'Sin calificaciones'
      : `${formatearPromedio(nota)} de ${ESTRELLAS_MAX} estrellas`

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
              <FormaEstrella className={styles.hueca} />
              <FormaEstrella className={styles.llena} />
            </span>
          )
        })}
      </span>
      {total !== undefined && total > 0 && <span className={styles.total}>({total})</span>}
    </span>
  )
}
