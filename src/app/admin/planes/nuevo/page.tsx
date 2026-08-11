import { requireRol } from '@/lib/auth'
import { PageHeader } from '@/components/ui/layout'
import { FormCard } from '@/components/ui/form-card'
import { PlanForm } from '../plan-form'

export const metadata = { title: 'Nuevo plan · ORUM' }

export default async function NuevoPlanPage() {
  await requireRol('super_admin')

  return (
    <>
      <PageHeader
        title="Nuevo plan"
        description="Los planes nacen a la venta. Puedes retirarlos después sin borrarlos."
      />
      <FormCard><PlanForm /></FormCard>
    </>
  )
}
