'use client'

import { useState, type ReactNode } from 'react'
import { X } from 'lucide-react'
import { prefiereMovimientoReducido } from '@/lib/shared/motion'
import styles from './aviso-novedad.module.css'

/*
  QUITAR EL AVISO, SOLO POR AHORA  ·  21/10/2026
  ---------------------------------------------------------------------------
  Encargo: «añádele la opción para quitar, pero cuando lo quite, si recarga o
  refresca la página, debe volver a aparecer». Así que se recuerda en el
  ESTADO de la página y en ningún otro sitio: nada de `localStorage` (eso lo
  dejaba quitado para siempre, y no se quería) ni de cookies. Al recargar o
  volver a entrar, el componente nace de nuevo y el aviso está.

  La X va ENCIMA de la tarjeta, no dentro: la tarjeta entera es un enlace y
  un botón dentro de un enlace no es válido (ni para el lector de pantalla
  ni para el clic). La tarjeta llega pintada del servidor como `children`;
  aquí solo vive lo que se toca.

  Sale con un fundido corto (`--dur-salida`) y luego se retira del todo; con
  movimiento reducido, se retira sin más.
*/
/** Algo más que `--dur-salida` (150 ms): para entonces ya terminó de irse. */
const RETIRAR_TRAS_MS = 400

export function CerrarAviso({ children }: { children: ReactNode }) {
  const [estado, setEstado] = useState<'visible' | 'saliendo' | 'quitado'>('visible')

  if (estado === 'quitado') return null

  return (
    <div
      className={styles.envoltura}
      data-saliendo={estado === 'saliendo' || undefined}
      onAnimationEnd={(e) => {
        if (estado === 'saliendo' && e.target === e.currentTarget) setEstado('quitado')
      }}
    >
      {children}
      <button
        type="button"
        className={styles.cerrar}
        aria-label="Quitar este aviso"
        onClick={() => {
          if (prefiereMovimientoReducido()) {
            setEstado('quitado')
            return
          }
          setEstado('saliendo')
          // Red de seguridad: si el fin de la animación no llega (pestaña en
          // segundo plano, animación cancelada), se retira igual.
          window.setTimeout(() => setEstado('quitado'), RETIRAR_TRAS_MS)
        }}
      >
        <X size={16} aria-hidden="true" />
      </button>
    </div>
  )
}
