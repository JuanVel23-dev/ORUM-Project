import { requireRol } from '@/lib/auth'
import { createAdminClient } from '@/lib/supabase/admin'
import { PageHeader } from '@/components/ui/layout'
import { FormCard } from '@/components/ui/form-card'
import { MiembroForm } from '../miembro-form'

export const metadata = { title: 'Registrar miembro · ORUM' }

export default async function NuevoMiembroPage() {
  await requireRol('super_admin', 'empleado')

  const admin = createAdminClient()
  const [{ data: ciudades }, { data: planes }] = await Promise.all([
    admin.from('ciudades').select('id, nombre').order('nombre'),
    admin
      .from('planes_membresia')
      .select('id, nombre, precio')
      .eq('activo', true)
      .is('deleted_at', null)
      .order('nombre'),
  ])

  return (
    <>
      <PageHeader
        title="Registrar miembro"
        description="Crea el cliente, su cuenta de acceso y su primera membresía en un solo paso."
      />
      <FormCard><MiembroForm ciudades={ciudades ?? []} planes={planes ?? []} /></FormCard>
    </>
  )
}
