import { Store } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { EmptyState } from '@/components/ui/feedback'

/**
 * Caso fatal de la ficha de comercio (`SPEC §5.7`).
 *
 * Se ve como el portal y NO como el 404 del sistema: al vivir dentro del grupo
 * `(portal)`, Next lo monta bajo su layout, así que el socio conserva la
 * cabecera y la barra inferior y sigue teniendo a dónde ir. El 404 por defecto
 * lo dejaría en una pantalla sin salidas.
 *
 * NO SE DICE SI EL ID EXISTE O NO. Los tres motivos por los que `page.tsx`
 * llama a `notFound()` —no existe, `activo === false`, `deleted_at` no nulo—
 * dan exactamente esta pantalla, con el mismo texto. Un mensaje que
 * distinguiera «no existe» de «está inactivo» permitiría enumerar los
 * comercios inactivos del club probando ids, y el `generateMetadata` de la
 * página calla lo mismo en el título de la pestaña.
 *
 * Es un Server Component: no necesita `reset()` —no hay nada que reintentar,
 * el comercio no va a aparecer— a diferencia de `miembros/error.tsx`, que
 * cubre el fallo recuperable.
 */
export default function ComercioNoDisponible() {
  return (
    <Card variant="sunk" padding="none">
      <EmptyState
        icon={<Store size={24} />}
        title="Este comercio ya no está disponible"
        description="Puede que haya salido del club o que el enlace esté mal. Vuelve al catálogo y busca otro."
        actions={
          <Button href="/miembros" icon={<Store size={16} />}>
            Ver todos los comercios
          </Button>
        }
      />
    </Card>
  )
}
