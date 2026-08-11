import { notFound } from 'next/navigation'
import { requireRol } from '@/lib/auth'
import { createAdminClient } from '@/lib/supabase/admin'
import { OverlayRuta } from '@/components/shell/overlay-ruta'
import { EditarForm } from '../../../[id]/editar/editar-form'

export default async function EditarUsuarioInterceptado({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  await requireRol('super_admin')
  const { id: perfilId } = await params

  const admin = createAdminClient()
  const [{ data: empleado }, { data: authUser }] = await Promise.all([
    admin
      .from('empleados')
      .select('nombres, apellidos, cedula, telefono')
      .eq('perfil_id', perfilId)
      .maybeSingle(),
    admin.auth.admin.getUserById(perfilId),
  ])

  if (!empleado) notFound()

  return (
    <OverlayRuta
      title="Editar usuario"
      description={`${empleado.nombres} ${empleado.apellidos}`.trim()}
      width="640px"
    >
      <EditarForm
        perfilId={perfilId}
        email={authUser?.user?.email ?? ''}
        empleado={empleado}
      />
    </OverlayRuta>
  )
}
