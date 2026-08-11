import { notFound } from 'next/navigation'
import { requireRol } from '@/lib/auth/auth'
import { createAdminClient } from '@/lib/supabase/admin'
import { OverlayRuta } from '@/components/shell/overlay-ruta'
import { SucursalForm } from '../../../../../[id]/sucursales/_components/sucursal-form'

export default async function EditarSucursalInterceptada({
  params,
}: {
  params: Promise<{ id: string; sucursalId: string }>
}) {
  await requireRol('super_admin')
  const { id, sucursalId } = await params
  const comercioId = Number(id)

  const admin = createAdminClient()
  const [{ data: sucursal }, { data: ciudades }] = await Promise.all([
    admin
      .from('sucursales')
      .select('id, nombre, direccion, telefono, ciudad_id')
      .eq('id', Number(sucursalId))
      .eq('comercio_id', comercioId)
      .is('deleted_at', null)
      .maybeSingle(),
    admin.from('ciudades').select('id, nombre').order('nombre'),
  ])
  if (!sucursal) notFound()

  return (
    <OverlayRuta
      title="Editar sucursal"
      description={sucursal.nombre ?? undefined}
      detent="medium"
    >
      <SucursalForm
        comercioId={comercioId}
        ciudades={ciudades ?? []}
        sucursal={{ ...sucursal, nombre: sucursal.nombre ?? '' }}
      />
    </OverlayRuta>
  )
}