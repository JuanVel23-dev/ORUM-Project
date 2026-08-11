import type { ReactNode } from 'react'
import styles from './cifra.module.css'

type CifraProps = {
  etiqueta: string
  valor: ReactNode
  nota?: string
  /** `sm` para rejillas de 4+ cifras, donde el display-1 no cabe. */
  size?: 'md' | 'sm'
  className?: string
}

/**
 * Una cifra del negocio: etiqueta arriba, número grande, nota opcional debajo.
 *
 * El orden visual está invertido respecto al orden de lectura a propósito: la
 * etiqueta va en versalitas pequeñas y el número domina, porque en un panel se
 * escanean los números y solo se lee la etiqueta del que llama la atención.
 *
 * El número usa cifras tabulares para que varias tarjetas en rejilla alineen
 * sus dígitos en columna. Formatea el valor tú (`toLocaleString('es-CO')`):
 * este componente no decide la localización.
 *
 * No lleva superficie propia — envuélvela en `<Card>` cuando la necesite.
 */
export function Cifra({ etiqueta, valor, nota, size = 'md', className }: CifraProps) {
  return (
    <div
      className={[styles.cifra, size === 'sm' && styles.sm, className]
        .filter(Boolean)
        .join(' ')}
    >
      <span className={styles.etiqueta}>{etiqueta}</span>
      <span className={styles.valor}>{valor}</span>
      {nota && <span className={styles.nota}>{nota}</span>}
    </div>
  )
}
