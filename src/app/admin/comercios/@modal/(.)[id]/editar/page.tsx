import { notFound } from 'next/navigation'
import { requireRol } from '@/lib/auth'
import { createAdminClient } from '@/lib/supabase/admin'
import { OverlayRuta } from '@/components/shell/overlay-ruta'
import { EditarComercioForm } from '../../../[id]/editar/editar-comercio-form'

export default async function EditarComercioInterceptado({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  await requireRol('super_admin')
  const { id } = await params

  const admin = createAdminClient()
  const [{ data: comercio }, { data: marcas }, { data: categorias }] = await Promise.all([
    admin
      .from('comercios')
      .select('id, perfil_id, nombre, descripcion, marca_id, categoria_id, logo_url')
      .eq('id', Number(id))
      .is('deleted_at', null)
      .maybeSingle(),
    admin.from('marcas').select('id, nombre').order('nombre'),
    admin.from('categorias').select('id, nombre').order('nombre'),
  ])

  if (!comercio) notFound()

  let correo = ''
  if (comercio.perfil_id) {
    const { data: authUser } = await admin.auth.admin.getUserById(comercio.perfil_id)
    correo = authUser.user?.email ?? ''
  }

  return (
    <OverlayRuta title="Editar comercio" description={comercio.nombre} width="640px">
      <EditarComercioForm
        comercio={{ ...comercio, correo }}
        marcas={marcas ?? []}
        categorias={categorias ?? []}
      />
    </OverlayRuta>
  )
}