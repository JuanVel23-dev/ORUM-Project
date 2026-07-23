import { requireRol } from '@/lib/auth'
import { PlanForm } from '../plan-form'

export const metadata = { title: 'Nuevo plan · ORUM' }

export default async function NuevoPlanPage() {
  await requireRol('super_admin')
  return (
    <div>
      <h1 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '1.25rem' }}>Nuevo plan</h1>
      <PlanForm />
    </div>
  )
}
