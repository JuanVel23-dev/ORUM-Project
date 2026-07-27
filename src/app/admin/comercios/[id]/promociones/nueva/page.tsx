import { notFound } from 'next/navigation'
import { requireRol } from '@/lib/auth'
import { createAdminClient } from '@/lib/supabase/admin'
import { PromocionForm } from '../promocion-form'

export const metadata = { title: 'Nueva promoción · ORUM' }

export default async function NuevaPromocionPage({ params }: { params: Promise<{ id: string }> }) {
  await requireRol('super_admin')
  const { id } = await params
  const comercioId = Number(id)

  const admin = createAdminClient()
  const [{ data: comercio }, { data: tipos }] = await Promise.all([
    admin.from('comercios').select('id').eq('id', comercioId).is('deleted_at', null).maybeSingle(),
    admin.from('tipos_beneficio').select('id, codigo, nombre').order('id'),
  ])
  if (!comercio) notFound()

  return (
    <div>
      <h1 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '1.25rem' }}>Nueva promoción</h1>
      <PromocionForm comercioId={comercioId} tipos={tipos ?? []} />
    </div>
  )
}
