'use client'

import Link from 'next/link'
import { useId } from 'react'
import { CAMPO_DECLARACION, VALOR_DECLARACION } from '@/lib/imagenes/derechos'
import styles from './declaracion-foto.module.css'

/*
  La casilla de declaración de derechos. `value="si"` EXPLÍCITO: un checkbox sin
  `value` envía `on`, y el servidor solo acepta `si`.

  Dentro de un `<form>` con server action la casilla viaja sola. En el editor
  del socio (que arma el `FormData` a mano) el campo se añade a mano: ver ahí.
*/
export function DeclaracionFoto({
  texto,
  marcada,
  onChange,
}: {
  texto: string
  marcada: boolean
  onChange: (valor: boolean) => void
}) {
  const id = useId()

  return (
    <div className={styles.declaracion}>
      <input
        id={id}
        type="checkbox"
        name={CAMPO_DECLARACION}
        value={VALOR_DECLARACION}
        checked={marcada}
        onChange={(e) => onChange(e.target.checked)}
        className={styles.casilla}
      />
      <label htmlFor={id} className={styles.texto}>
        {texto}{' '}
        <Link href="/terminos" target="_blank" className={styles.enlace}>
          Términos
        </Link>
        {' · '}
        <Link href="/derechos-de-autor" target="_blank" className={styles.enlace}>
          Derechos de autor
        </Link>
      </label>
    </div>
  )
}
