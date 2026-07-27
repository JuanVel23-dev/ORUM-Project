import { notFound } from 'next/navigation'
import { requireRol } from '@/lib/auth'
import { createAdminClient } from '@/lib/supabase/admin'
import { SucursalForm } from '../sucursal-form'

export const metadata = { title: 'Nueva sucursal · ORUM' }

export default async function NuevaSucursalPage({ params }: { params: Promise<{ id: string }> }) {
  await requireRol('super_admin')
  const { id } = await params
  const comercioId = Number(id)

  const admin = createAdminClient()
  const [{ data: comercio }, { data: ciudades }] = await Promise.all([
    admin.from('comercios').select('id').eq('id', comercioId).is('deleted_at', null).maybeSingle(),
    admin.from('ciudades').select('id, nombre').order('nombre'),
  ])
  if (!comercio) notFound()

  return (
    <div>
      <h1 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '1.25rem' }}>Nueva sucursal</h1>
      <SucursalForm comercioId={comercioId} ciudades={ciudades ?? []} />
    </div>
  )
}
