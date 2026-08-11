import { Badge, Card, ComercioLogo, Row } from '@/components/ui'
import { formatearBeneficio } from '@/lib/comercios/beneficios-formato'
import type { TipoBeneficioCodigo } from '@/lib/supabase/database.types'

export type ComercioListado = {
  id: number
  nombre: string
  descripcion: string | null
  marcaNombre: string | null
  logoUrl: string | null
  ciudades: string[]
  promociones: { id: number; titulo: string; tipoCodigo: TipoBeneficioCodigo; valor: number | null }[]
}

export function ComercioCard({ comercio }: { comercio: ComercioListado }) {
  return (
    <Card>
      <Row gap="0.75rem" style={{ alignItems: 'center', marginBottom: '0.25rem' }}>
        <ComercioLogo logoUrl={comercio.logoUrl} nombre={comercio.nombre} size={40} />
        <div>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 700 }}>{comercio.nombre}</h3>
          {comercio.marcaNombre && (
            <p className="orum-muted" style={{ fontSize: '0.85rem' }}>
              {comercio.marcaNombre}
            </p>
          )}
        </div>
      </Row>
      {comercio.descripcion && <p style={{ margin: '0.5rem 0' }}>{comercio.descripcion}</p>}
      {comercio.ciudades.length > 0 && (
        <p className="orum-muted" style={{ fontSize: '0.85rem', marginBottom: '0.5rem' }}>
          {comercio.ciudades.join(', ')}
        </p>
      )}

      {comercio.promociones.length === 0 ? (
        <p className="orum-muted" style={{ fontSize: '0.85rem' }}>
          Sin promociones activas por ahora.
        </p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', marginTop: '0.5rem' }}>
          {comercio.promociones.map((p) => (
            <div key={p.id} style={{ display: 'flex', justifyContent: 'space-between', gap: '0.5rem' }}>
              <span>{p.titulo}</span>
              <Badge tone="on">{formatearBeneficio(p.tipoCodigo, p.valor)}</Badge>
            </div>
          ))}
        </div>
      )}
    </Card>
  )
}
