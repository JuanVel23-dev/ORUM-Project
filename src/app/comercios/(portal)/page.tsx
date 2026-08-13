import { requireRolComercio } from '@/lib/comercios/requerir-comercio'
import { createClient } from '@/lib/supabase/server'
import { PageHeader, EmptyState } from '@/components/ui'
import { esPromocionVigente } from '@/lib/comercios/promocion-vigente'
import { hoyISO } from '@/lib/shared/fecha'
import { VerificacionTool } from './_components/verificacion-tool'
import type { TipoBeneficioCodigo } from '@/lib/supabase/database.types'

export const metadata = { title: 'Verificar membresía · ORUM Comercios' }

export default async function ComerciosHomePage() {
  const perfil = await requireRolComercio()
  const supabase = await createClient()

  const { data: comercio } = await supabase
    .from('comercios')
    .select('id')
    .eq('perfil_id', perfil.userId)
    .maybeSingle()

  if (!comercio) {
    return (
      <div>
        <PageHeader title="Verificar membresía" />
        <EmptyState>No se encontró el comercio asociado a esta cuenta. Contacta al administrador.</EmptyState>
      </div>
    )
  }

  const [{ data: sucursales }, { data: promocionesRaw }, { data: tipos }] = await Promise.all([
    supabase
      .from('sucursales')
      .select('id, nombre')
      .eq('comercio_id', comercio.id)
      .eq('activo', true)
      .is('deleted_at', null)
      .order('nombre')
      .limit(50),
    supabase
      .from('promociones')
      .select('id, titulo, tipo_beneficio_id, valor, activo, fecha_inicio, fecha_fin')
      .eq('comercio_id', comercio.id)
      .eq('activo', true)
      .is('deleted_at', null)
      .limit(50),
    supabase.from('tipos_beneficio').select('id, codigo').limit(10),
  ])

  if (!sucursales || sucursales.length === 0) {
    return (
      <div>
        <PageHeader title="Verificar membresía" />
        <EmptyState>Este comercio no tiene sucursales activas. Contacta al administrador.</EmptyState>
      </div>
    )
  }

  const codigoPorTipoId = new Map((tipos ?? []).map((t) => [t.id, t.codigo as TipoBeneficioCodigo]))
  const hoy = hoyISO()
  const promociones = (promocionesRaw ?? [])
    .filter(
      (p) => esPromocionVigente(p.activo, p.fecha_inicio, p.fecha_fin, hoy) && codigoPorTipoId.has(p.tipo_beneficio_id),
    )
    .map((p) => ({
      id: p.id,
      titulo: p.titulo,
      tipoCodigo: codigoPorTipoId.get(p.tipo_beneficio_id)!,
      valor: p.valor,
    }))

  return (
    <div>
      <PageHeader title="Verificar membresía" />
      <VerificacionTool sucursales={sucursales} promociones={promociones} />
    </div>
  )
}
