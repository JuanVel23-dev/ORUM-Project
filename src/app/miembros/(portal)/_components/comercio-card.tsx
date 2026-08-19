import { MapPin } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import { ComercioLogo } from '@/components/ui/comercio-logo'
import { formatearBeneficio } from '@/lib/comercios/beneficios-formato'
import type { TipoBeneficioCodigo } from '@/lib/supabase/database.types'
import styles from './comercio-card.module.css'

export type ComercioListado = {
  id: number
  nombre: string
  descripcion: string | null
  marcaNombre: string | null
  logoUrl: string | null
  ciudades: string[]
  promociones: {
    id: number
    titulo: string
    tipoCodigo: TipoBeneficioCodigo
    valor: number | null
  }[]
}

export function ComercioCard({ comercio }: { comercio: ComercioListado }) {
  return (
    <Card>
      <div className={styles.tarjeta}>
        <div className={styles.cabecera}>
          <ComercioLogo logoUrl={comercio.logoUrl} nombre={comercio.nombre} size={44} />

          <div className={styles.titulos}>
            <h3 className={styles.nombre}>{comercio.nombre}</h3>
            {comercio.marcaNombre && <p className={styles.marca}>{comercio.marcaNombre}</p>}
          </div>
        </div>

        {comercio.descripcion && <p className={styles.descripcion}>{comercio.descripcion}</p>}

        {comercio.ciudades.length > 0 && (
          <p className={styles.ciudades}>
            {/* El texto que sigue ya dice las ciudades. */}
            <MapPin size={13} aria-hidden />
            <span className={styles.ciudadesTexto}>{comercio.ciudades.join(' · ')}</span>
          </p>
        )}

        {comercio.promociones.length === 0 ? (
          <p className={styles.sinPromociones}>Sin promociones activas por ahora.</p>
        ) : (
          <ul className={styles.promociones}>
            {comercio.promociones.map((p) => (
              <li key={p.id} className={styles.promocion}>
                <span className={styles.promocionTitulo}>{p.titulo}</span>
                {/*
                  El beneficio es la cifra que el miembro busca: va en oro.
                  Es el único uso ceremonial del oro en esta pantalla, y cabe
                  en el presupuesto porque ocupa una píldora por promoción.
                */}
                <Badge tone="gold" size="sm">
                  {formatearBeneficio(p.tipoCodigo, p.valor)}
                </Badge>
              </li>
            ))}
          </ul>
        )}
      </div>
    </Card>
  )
}
