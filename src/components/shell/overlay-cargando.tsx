'use client'

import { useRouter } from 'next/navigation'
import { Overlay } from '@/components/ui/overlay'
import { Skeleton } from '@/components/ui/feedback'
import styles from './overlay-cargando.module.css'

/**
 * Estado de carga de una ranura `@modal`.
 *
 * SIN ESTO, mientras la ruta interceptada pide sus datos Next suspende la
 * ranura y cae al `loading.tsx` de la sección — el esqueleto de la tabla —
 * que se renderiza DENTRO del hueco del modal y aparece debajo de la lista.
 * Ese era el "algo raro debajo de la tabla".
 *
 * Con esto el overlay aparece de inmediato con su propio esqueleto y luego se
 * rellena. La superficie llega antes que el contenido, que es justo lo que
 * hace que una transición se sienta rápida: la estructura ya está ahí.
 */
export function OverlayCargando() {
  const router = useRouter()

  return (
    <Overlay open onClose={() => router.back()} width="640px">
      <div className={styles.cuerpo} aria-busy="true" aria-label="Cargando formulario">
        <div className={styles.cabecera}>
          <Skeleton width="52%" height="24px" radius="var(--radius-sm)" />
          <Skeleton width="78%" height="14px" />
        </div>

        {/* Dos columnas: replica la forma real de los formularios. */}
        <div className={styles.pareja}>
          <Campo />
          <Campo />
        </div>
        <Campo ancho />
        <div className={styles.pareja}>
          <Campo />
          <Campo />
        </div>

        <div className={styles.acciones}>
          <Skeleton width="150px" height="44px" radius="var(--radius-sm)" />
          <Skeleton width="104px" height="44px" radius="var(--radius-sm)" />
        </div>
      </div>
    </Overlay>
  )
}

function Campo({ ancho = false }: { ancho?: boolean }) {
  return (
    <div className={styles.campo}>
      <Skeleton width={ancho ? '32%' : '46%'} height="12px" />
      <Skeleton width="100%" height="44px" radius="var(--radius-sm)" />
    </div>
  )
}
