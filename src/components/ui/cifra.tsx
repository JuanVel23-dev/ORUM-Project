import type { ReactNode } from 'react'
import styles from './cifra.module.css'

type CifraProps = {
  etiqueta: string
  valor: ReactNode
  nota?: string
  /**
   * `sm` para rejillas de 4+ cifras, donde el display-1 no cabe.
   * `display` es el peldaño SERIF de la v4: el número grande de un carnet o de
   * un panel del socio, a 36–52px.
   */
  size?: 'md' | 'sm' | 'display'
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
 *
 * ⛔ `size="display"` NO SE USA EN ADMINISTRACIÓN NI EN LA HERRAMIENTA DE
 * COMERCIOS (v4 §3 y §6). Son pantallas de trabajo: el serif ahí no aporta
 * jerarquía, aporta ruido, y una tabla de métricas con titulares de revista se
 * lee peor, no mejor. Su sitio es el carnet del socio y el panel del socio.
 *
 * Y una sola por pantalla: un acento repetido deja de ser un acento.
 */
export function Cifra({ etiqueta, valor, nota, size = 'md', className }: CifraProps) {
  return (
    <div
      className={[
        styles.cifra,
        size === 'sm' && styles.sm,
        size === 'display' && styles.display,
        className,
      ]
        .filter(Boolean)
        .join(' ')}
    >
      <span className={styles.etiqueta}>{etiqueta}</span>
      <span className={styles.valor}>{valor}</span>
      {nota && <span className={styles.nota}>{nota}</span>}
    </div>
  )
}
