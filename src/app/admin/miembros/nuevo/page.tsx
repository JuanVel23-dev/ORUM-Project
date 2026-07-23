import { requireRol } from '@/lib/auth'
import { createAdminClient } from '@/lib/supabase/admin'
import { MiembroForm } from '../miembro-form'

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
      <h1 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '1.25rem' }}>Registrar miembro</h1>
      <MiembroForm ciudades={ciudades ?? []} planes={planes ?? []} />
    </div>
  )
}
