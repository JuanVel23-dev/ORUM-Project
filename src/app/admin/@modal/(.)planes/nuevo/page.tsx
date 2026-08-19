import { requireRol } from '@/lib/auth/auth'
import { OverlayRuta } from '@/components/shell/overlay-ruta'
import { PlanForm } from '@/app/admin/planes/_components/plan-form'

/**
 * `detent="medium"`: son cuatro campos. Según la HIG, el detent medio permite
 * seguir viendo la lista de planes de detrás mientras se rellena.
 */
export default async function NuevoPlanInterceptado() {
  await requireRol('super_admin')

  return (
    <OverlayRuta
      title="Nuevo plan"
      description="Los planes nacen a la venta. Puedes retirarlos después sin borrarlos."
      detent="medium"
    >
      <PlanForm />
    </OverlayRuta>
  )
}
