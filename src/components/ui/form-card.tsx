import type { ReactNode } from 'react'
import { Card } from './card'
import styles from './form-card.module.css'

/**
 * Superficie de un formulario.
 *
 * El mismo formulario se usa en dos sitios: como página propia (enlace
 * directo, recarga) y dentro de un overlay (navegación normal). En el overlay
 * la superficie ya la pone el propio overlay, así que envolver otra vez daría
 * una tarjeta dentro de otra, con doble borde y doble sombra.
 *
 * `desnudo` quita el envoltorio. Vive aquí y no en cada formulario para que
 * los ocho no repitan la misma condición.
 */
export function FormCard({
  desnudo = false,
  variant,
  estrecha = false,
  children,
}: {
  desnudo?: boolean
  /** `brand` añade el filo dorado. Reservado a la entrega de credenciales. */
  variant?: 'brand'
  estrecha?: boolean
  children: ReactNode
}) {
  if (desnudo) return <>{children}</>

  return (
    <Card
      padding="lg"
      variant={variant}
      className={estrecha ? styles.estrecha : styles.ancha}
    >
      {children}
    </Card>
  )
}
