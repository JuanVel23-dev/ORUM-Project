import { notFound } from 'next/navigation'
import { requireRol } from '@/lib/auth'
import { createAdminClient } from '@/lib/supabase/admin'
import { PromocionForm } from '../../promocion-form'

export const metadata = { title: 'Editar promoción · ORUM' }

export default async function EditarPromocionPage({
  params,
}: {
  params: Promise<{ id: string; promoId: string }>
}) {
  await requireRol('super_admin')
  const { id, promoId } = await params
  const comercioId = Number(id)

  const admin = createAdminClient()
  const [{ data: promocion }, { data: tipos }] = await Promise.all([
    admin
      .from('promociones')
      .select('id, titulo, descripcion, tipo_beneficio_id, valor, fecha_inicio, fecha_fin')
      .eq('id', Number(promoId))
      .eq('comercio_id', comercioId)
      .is('deleted_at', null)
      .maybeSingle(),
    admin.from('tipos_beneficio').select('id, codigo, nombre').order('id'),
  ])
  if (!promocion) notFound()

  return (
    <div>
      <h1 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '1.25rem' }}>Editar promoción</h1>
      <PromocionForm comercioId={comercioId} tipos={tipos ?? []} promocion={promocion} />
    </div>
  )
}
