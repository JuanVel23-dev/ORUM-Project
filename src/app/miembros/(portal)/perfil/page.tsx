import { requireMiembroVigente } from '@/lib/miembros/requerir-miembro'
import { createClient } from '@/lib/supabase/server'
import { QrCode, Badge } from '@/components/ui'

export const metadata = { title: 'Mi perfil · ORUM' }

export default async function PerfilMiembroPage() {
  const miembro = await requireMiembroVigente()

  const supabase = await createClient()
  const { data: plan } = await supabase
    .from('planes_membresia')
    .select('nombre')
    .eq('id', miembro.membresiaVigente.planId)
    .maybeSingle()

  return (
    <div>
      <h1 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '1.25rem' }}>Mi perfil</h1>

      <div
        className="orum-card"
        style={{ display: 'flex', gap: '2rem', flexWrap: 'wrap', alignItems: 'flex-start' }}
      >
        <div style={{ flex: 1, minWidth: 240 }}>
          <p>
            <strong>Nombre:</strong> {miembro.nombres} {miembro.apellidos}
          </p>
          <p>
            <strong>Número de membresía:</strong>{' '}
            <span style={{ fontFamily: 'var(--font-geist-mono, monospace)' }}>{miembro.numeroMembresia}</span>
          </p>
          <p>
            <strong>Plan:</strong> {plan?.nombre ?? '—'}
          </p>
          <p>
            <strong>Tipo:</strong> {miembro.membresiaVigente.tipo === 'nueva' ? 'Nueva' : 'Renovada'}
          </p>
          <p>
            <strong>Vigencia:</strong> {miembro.membresiaVigente.fechaInicio} a {miembro.membresiaVigente.fechaFin}
          </p>
          <p>
            <strong>Estado:</strong> <Badge tone="on">Activa</Badge>
          </p>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem' }}>
          <QrCode value={miembro.numeroMembresia} />
          <p className="orum-muted" style={{ fontSize: '0.8rem' }}>
            Muestra este código en el comercio
          </p>
        </div>
      </div>
    </div>
  )
}
