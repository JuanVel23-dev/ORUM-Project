import { Badge } from '@/components/ui'
import type { MiembroEncontrado } from '../actions'

export function ResultadoMiembro({ miembro }: { miembro: MiembroEncontrado }) {
  return (
    <div className="orum-card" style={{ marginTop: '1rem' }}>
      <p style={{ fontWeight: 700, fontSize: '1.1rem' }}>{miembro.nombreCompleto}</p>
      <p className="orum-muted" style={{ fontSize: '0.85rem', marginBottom: '0.5rem' }}>
        N.º {miembro.numeroMembresia}
      </p>
      <Badge tone={miembro.vigente ? 'on' : 'off'}>{miembro.vigente ? 'Activa' : 'Inactiva'}</Badge>
      {miembro.vigente && miembro.planNombre && (
        <p style={{ marginTop: '0.5rem' }}>
          <strong>Plan:</strong> {miembro.planNombre}
        </p>
      )}
    </div>
  )
}
