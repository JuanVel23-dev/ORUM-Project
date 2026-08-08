import { notFound } from 'next/navigation'
import { requireRol } from '@/lib/auth/auth'
import { createAdminClient } from '@/lib/supabase/admin'
import { PlanForm } from '../../_components/plan-form'
import { PageHeader } from '@/components/ui'

export const metadata = { title: 'Editar plan · ORUM' }

export default async function EditarPlanPage({ params }: { params: Promise<{ id: string }> }) {
  await requireRol('super_admin')
  const { id } = await params

  const admin = createAdminClient()
  const { data: plan } = await admin
    .from('planes_membresia')
    .select('id, nombre, descripcion, precio, duracion_meses')
    .eq('id', Number(id))
    .is('deleted_at', null)
    .maybeSingle()

  if (!plan) notFound()

  return (
    <div>
      <PageHeader title="Editar plan" />
      <PlanForm plan={plan} />
    </div>
  )
}
