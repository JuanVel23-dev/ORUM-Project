'use client'

import { useEffect, useRef, useState, type ReactNode } from 'react'
import { Check, Copy } from 'lucide-react'
import { toque } from '@/lib/shared/haptica'
import styles from './copiar.module.css'

/**
 * Valor con botón de copia.
 *
 * Se usa para el número de membresía y para la contraseña autogenerada, que
 * se muestra una sola vez: si se pierde hay que regenerarla, así que copiarla
 * tiene que costar un clic y confirmar que funcionó.
 */
export function Copiar({
  valor,
  children,
  label = 'Copiar',
}: {
  valor: string
  /** Cómo se muestra. Si se omite, se muestra el propio valor. */
  children?: ReactNode
  label?: string
}) {
  const [copiado, setCopiado] = useState(false)
  const temporizador = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Limpia el temporizador si el componente se desmonta antes de que expire.
  useEffect(() => {
    return () => {
      if (temporizador.current) clearTimeout(temporizador.current)
    }
  }, [])

  const copiar = async () => {
    try {
      await navigator.clipboard.writeText(valor)
    } catch {
      // El portapapeles falla sin HTTPS o sin permiso. El valor sigue
      // visible en pantalla, así que se puede seleccionar a mano.
      return
    }

    // Visual y háptico en el mismo fotograma: un desfase entre lo que se ve
    // y lo que se siente rompe la sensación de que son el mismo evento.
    setCopiado(true)
    toque()

    if (temporizador.current) clearTimeout(temporizador.current)
    temporizador.current = setTimeout(() => setCopiado(false), 1600)
  }

  return (
    <span className={styles.contenedor}>
      <span className={styles.valor}>{children ?? valor}</span>

      <button
        type="button"
        className={styles.boton}
        onClick={copiar}
        data-copiado={copiado}
        aria-label={copiado ? 'Copiado' : label}
      >
        {copiado ? (
          <Check className={styles.icono} aria-hidden="true" />
        ) : (
          <Copy className={styles.icono} aria-hidden="true" />
        )}
      </button>

      {/* Anuncia el resultado a lectores de pantalla, que no ven el icono. */}
      <span className="sr-only" role="status" aria-live="polite">
        {copiado ? 'Copiado al portapapeles' : ''}
      </span>
    </span>
  )
}
