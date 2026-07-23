import { notFound } from 'next/navigation'
import { requireRol } from '@/lib/auth'
import { createAdminClient } from '@/lib/supabase/admin'
import { PlanForm } from '../../plan-form'

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
      <h1 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '1.25rem' }}>Editar plan</h1>
      <PlanForm plan={plan} />
    </div>
  )
}
