'use client'

import { useOptimistic, useRef, useTransition, type ReactNode } from 'react'
import { Check, Undo2 } from 'lucide-react'
import { Spinner } from './spinner'
import { toque } from '@/lib/haptica'
import styles from './accion-estado.module.css'

/**
 * Activar / desactivar algo, con respuesta inmediata.
 *
 * El problema del formulario normal: pulsas, y la etiqueta no cambia hasta que
 * el servidor responde y revalida. En una conexión lenta eso son cientos de
 * milisegundos en los que la interfaz parece no haber recibido el clic, y la
 * gente vuelve a pulsar.
 *
 * Aquí la etiqueta cambia EN EL MISMO FOTOGRAMA que el clic (`useOptimistic`)
 * y el servidor confirma después. Si falla, React revierte solo al estado
 * real: no hay que gestionar el retroceso a mano.
 *
 * El háptico se dispara en el clic, no al confirmar: la regla de causalidad
 * dice que acompaña al gesto que lo provocó.
 */
export function AccionEstado({
  activo,
  accion,
  campos,
  etiquetaActivar,
  etiquetaDesactivar,
  iconoActivar,
  iconoDesactivar,
}: {
  activo: boolean
  /** Server action que recibe el `FormData` con `campos` + `activar`. */
  accion: (formData: FormData) => void | Promise<void>
  /** Campos ocultos que identifican el registro. */
  campos: Record<string, string | number>
  etiquetaActivar: string
  etiquetaDesactivar: string
  iconoActivar?: ReactNode
  iconoDesactivar?: ReactNode
}) {
  const formRef = useRef<HTMLFormElement>(null)
  const [pendiente, iniciar] = useTransition()

  // El estado que se PINTA. Se adelanta al servidor y vuelve solo si falla.
  const [optimista, aplicarOptimista] = useOptimistic(
    activo,
    (_actual, siguiente: boolean) => siguiente,
  )

  const siguiente = !optimista

  return (
    <form
      ref={formRef}
      className={styles.form}
      action={(formData) => {
        iniciar(async () => {
          aplicarOptimista(siguiente)
          await accion(formData)
        })
      }}
    >
      {Object.entries(campos).map(([nombre, valor]) => (
        <input key={nombre} type="hidden" name={nombre} value={valor} />
      ))}
      <input type="hidden" name="activar" value={String(siguiente)} />

      <button
        type="submit"
        className={styles.boton}
        data-destructivo={optimista}
        data-pendiente={pendiente}
        // Acompaña al gesto, no a la confirmación del servidor.
        onClick={toque}
      >
        {pendiente ? (
          <Spinner size="sm" label={null} />
        ) : optimista ? (
          (iconoDesactivar ?? <Undo2 className={styles.icono} aria-hidden="true" />)
        ) : (
          (iconoActivar ?? <Check className={styles.icono} aria-hidden="true" />)
        )}
        {optimista ? etiquetaDesactivar : etiquetaActivar}
      </button>
    </form>
  )
}
