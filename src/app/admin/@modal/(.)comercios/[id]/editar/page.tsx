import { notFound } from 'next/navigation'
import { requireRol } from '@/lib/auth/auth'
import { createAdminClient } from '@/lib/supabase/admin'
import { OverlayRuta } from '@/components/shell/overlay-ruta'
import { cargarCategoriasConSubcategorias } from '@/lib/comercios/categorias-admin'
import { EditarComercioForm } from '@/app/admin/comercios/[id]/editar/_components/editar-comercio-form'

export default async function EditarComercioInterceptado({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  await requireRol('super_admin')
  const { id } = await params

  const admin = createAdminClient()
  const [{ data: comercio }, categorias] = await Promise.all([
    admin
      .from('comercios')
      .select('id, perfil_id, nombre, descripcion, categoria_id, subcategoria_id, logo_url, indexable')
      .eq('id', Number(id))
      .is('deleted_at', null)
      .maybeSingle(),
    cargarCategoriasConSubcategorias(admin),
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
        categorias={categorias}
      />
    </OverlayRuta>
  )
}