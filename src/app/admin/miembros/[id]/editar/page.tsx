import { notFound } from 'next/navigation'
import { requireRol } from '@/lib/auth'
import { createAdminClient } from '@/lib/supabase/admin'
import { EditarMiembroForm } from './editar-miembro-form'

export const metadata = { title: 'Editar miembro · ORUM' }

export default async function EditarMiembroPage({ params }: { params: Promise<{ id: string }> }) {
  await requireRol('super_admin', 'empleado')
  const { id } = await params
  const miembroId = Number(id)

  const admin = createAdminClient()
  const { data: miembro } = await admin
    .from('miembros')
    .select('id, perfil_id, nombres, apellidos, cedula, telefono, direccion, ciudad_id')
    .eq('id', miembroId)
    .is('deleted_at', null)
    .maybeSingle()
  if (!miembro) notFound()

  const { data: ciudades } = await admin.from('ciudades').select('id, nombre').order('nombre')

  let correo = '—'
  if (miembro.perfil_id) {
    const { data: authUser } = await admin.auth.admin.getUserById(miembro.perfil_id)
    correo = authUser.user?.email ?? '—'
  }

  return (
    <div>
      <h1 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '1.25rem' }}>Editar miembro</h1>
      <EditarMiembroForm miembro={{ ...miembro, correo }} ciudades={ciudades ?? []} />
    </div>
  )
}
