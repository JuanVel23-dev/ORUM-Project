import { Store } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { EmptyState } from '@/components/ui/feedback'

/*
  El mismo mensaje para los tres casos —no existe, inactivo, borrado—: la
  ficha no distingue entre ellos para no dejar enumerar comercios dados de
  baja probando ids.
*/
export default function ComercioNoDisponible() {
  return (
    <EmptyState
      icon={<Store aria-hidden="true" />}
      title="Este comercio no está disponible"
      description="Puede que ya no forme parte del club. Mira los demás aliados."
      actions={
        <Button href="/explorar" variant="secondary" pildora>
          Ver todos los comercios
        </Button>
      }
    />
  )
}
