import { Skeleton } from '@/components/ui/feedback'

/*
  Estado de carga del Inicio (el directorio). Solo la silueta del banner
  negro —lo primero que se ve, pegado a la cabecera negra— y un bloque de
  tarjetas: sin él, la cabecera quedaría flotando sobre blanco hasta que
  llegaran los datos.
*/
export default function Loading() {
  return (
    <div aria-busy="true">
      <p role="status" className="sr-only">
        Cargando los comercios…
      </p>
      <div aria-hidden="true">
        <Skeleton width="100%" height="clamp(320px, 45svh, 480px)" radius="0" />
      </div>
    </div>
  )
}
