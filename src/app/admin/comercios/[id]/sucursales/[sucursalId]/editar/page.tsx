import { notFound } from 'next/navigation'
import { requireRol } from '@/lib/auth'
import { createAdminClient } from '@/lib/supabase/admin'
import { SucursalForm } from '../../sucursal-form'

export const metadata = { title: 'Editar sucursal · ORUM' }

export default async function EditarSucursalPage({
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
    <div>
      <h1 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '1.25rem' }}>Editar sucursal</h1>
      <SucursalForm
        comercioId={comercioId}
        ciudades={ciudades ?? []}
        sucursal={{ ...sucursal, nombre: sucursal.nombre ?? '' }}
      />
    </div>
  )
}
