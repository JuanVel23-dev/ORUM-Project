import { requireMiembroVigente } from '@/lib/miembros/requerir-miembro'
import { createClient } from '@/lib/supabase/server'
import { derivarEstadoMembresia } from '@/lib/miembros/membresias'
import { Card } from '@/components/ui/card'
import { Copiar } from '@/components/ui/copiar'
import { PageHeader } from '@/components/ui/layout'
import { QrCode } from '@/components/ui/qr-code'
import { StatusBadge, VenceEn } from '@/components/ui/badge'
import styles from './perfil.module.css'

export const metadata = { title: 'Mi perfil · ORUM' }

const FECHA = new Intl.DateTimeFormat('es-CO', {
  timeZone: 'America/Bogota',
  day: 'numeric',
  month: 'long',
  year: 'numeric',
})

/** 'YYYY-MM-DD' → texto legible, sin que el parseo se desplace un día por UTC. */
function fechaLegible(iso: string): string {
  const [a, m, d] = iso.split('-').map(Number)
  return FECHA.format(new Date(Date.UTC(a, m - 1, d)))
}

/** Hoy en 'YYYY-MM-DD' según la zona del negocio, no la del servidor. */
function hoyBogota(): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Bogota' }).format(new Date())
}

export default async function PerfilMiembroPage() {
  const miembro = await requireMiembroVigente()

  const supabase = await createClient()
  const { data: plan } = await supabase
    .from('planes_membresia')
    .select('nombre')
    .eq('id', miembro.membresiaVigente.planId)
    .maybeSingle()

  /*
    Aunque `requireMiembroVigente` ya garantiza que está vigente, el estado se
    DERIVA igual: así el carnet puede decir cuántos días quedan, que es lo que
    de verdad le interesa al miembro, y nunca puede contradecir a la lista del
    administrador —ambos usan la misma función.
  */
  const estado = derivarEstadoMembresia(
    miembro.membresiaVigente.estado,
    miembro.membresiaVigente.fechaFin,
    hoyBogota(),
  )

  const nombreCompleto = `${miembro.nombres} ${miembro.apellidos}`.trim()

  return (
    <>
      <PageHeader
        title="Mi perfil"
        description="Tu carnet del club. Muestra el código en el comercio para aplicar tu beneficio."
      />

      <Card padding="lg" className={styles.carnet}>
        <div className={styles.cuerpo}>
          <div className={styles.datos}>
            <div>
              <p className={styles.nombre}>{nombreCompleto}</p>
              <p className={styles.etiqueta}>{plan?.nombre ?? 'Membresía ORUM'}</p>
            </div>

            <div className={styles.dato}>
              <span className={styles.etiqueta}>Número de membresía</span>
              <span className={styles.numero}>
                <Copiar valor={miembro.numeroMembresia} label="Copiar número de membresía" />
              </span>
            </div>

            <div className={styles.dato}>
              <span className={styles.etiqueta}>Estado</span>
              <span className={styles.valor}>
                <StatusBadge estado={estado} />
                <VenceEn estado={estado} />
              </span>
            </div>

            <div className={styles.dato}>
              <span className={styles.etiqueta}>Vigencia</span>
              <span className={styles.valor}>
                Hasta el {fechaLegible(miembro.membresiaVigente.fechaFin)}
              </span>
            </div>
          </div>

          <div className={styles.qr}>
            <QrCode
              value={miembro.numeroMembresia}
              label={`Código de la membresía ${miembro.numeroMembresia} de ${nombreCompleto}`}
            />
            <p className={styles.qrNota}>Muestra este código en el comercio</p>
          </div>
        </div>
      </Card>
    </>
  )
}
