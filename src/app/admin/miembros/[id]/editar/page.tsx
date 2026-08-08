import { notFound } from 'next/navigation'
import { requireRol } from '@/lib/auth/auth'
import { createAdminClient } from '@/lib/supabase/admin'
import { EditarMiembroForm } from './_components/editar-miembro-form'
import { PageHeader } from '@/components/ui'

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
      <PageHeader title="Editar miembro" />
      <EditarMiembroForm miembro={{ ...miembro, correo }} ciudades={ciudades ?? []} />
    </div>
  )
}
