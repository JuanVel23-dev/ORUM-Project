import { requireRol } from '@/lib/auth/auth'
import { PlanForm } from '../_components/plan-form'
import { PageHeader } from '@/components/ui'

export const metadata = { title: 'Nuevo plan · ORUM' }

export default async function NuevoPlanPage() {
  await requireRol('super_admin')
  return (
    <div>
      <PageHeader title="Nuevo plan" />
      <PlanForm />
    </div>
  )
}
