import { Skeleton } from '@/components/ui/feedback'
import styles from './movimientos.module.css'

/*
  Carga de «Mis movimientos»: el título, la tarjeta del total y unas filas.
  Sin ella Next caería al `loading.tsx` del Inicio y dibujaría el banner
  negro del directorio sobre una pantalla que no lo tiene.
*/
export default function Loading() {
  return (
    <div aria-busy="true">
      <p role="status" className="sr-only">
        Cargando tus movimientos…
      </p>
      <div aria-hidden="true" className={styles.cargando}>
        <Skeleton width="16rem" height="2rem" />
        <Skeleton width="100%" height="7rem" />
        <Skeleton width="100%" height="4rem" />
        <Skeleton width="100%" height="4rem" />
        <Skeleton width="100%" height="4rem" />
      </div>
    </div>
  )
}
