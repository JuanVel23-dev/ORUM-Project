import { requireRol } from '@/lib/auth/auth'
import { createAdminClient } from '@/lib/supabase/admin'
import { MiembroForm } from '../_components/miembro-form'
import { PageHeader } from '@/components/ui'

export const metadata = { title: 'Registrar miembro · ORUM' }

export default async function NuevoMiembroPage() {
  await requireRol('super_admin', 'empleado')

  const admin = createAdminClient()
  const [{ data: ciudades }, { data: planes }] = await Promise.all([
    admin.from('ciudades').select('id, nombre').order('nombre'),
    admin.from('planes_membresia').select('id, nombre, precio').eq('activo', true).is('deleted_at', null).order('nombre'),
  ])

  return (
    <div>
      <PageHeader title="Registrar miembro" />
      <MiembroForm ciudades={ciudades ?? []} planes={planes ?? []} />
    </div>
  )
}
