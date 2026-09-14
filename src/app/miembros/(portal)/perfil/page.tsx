import { requireMiembroVigente } from '@/lib/miembros/requerir-miembro'
import { createClient } from '@/lib/supabase/server'
import { derivarEstadoMembresia } from '@/lib/miembros/membresias'
import { hoyISO } from '@/lib/shared/fecha'
import { StatusBadge, VenceEn } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import { Copiar } from '@/components/ui/copiar'
import { Stack } from '@/components/ui/layout'
import { QrCode } from '@/components/ui/qr-code'
import { WhatsAppButton } from '@/components/ui/whatsapp-button'
import { CarnetAparece } from './_components/carnet-aparece'
import styles from './perfil.module.css'

export const metadata = { title: 'Mi carnet · ORUM' }

/*
  EL CARNET  ·  spec §6

  Es lo que el socio enseña en la caja, con una mano y con prisa. Por eso:

  - Tiene ancho propio (460px) y UNA sola columna a todos los anchos. Antes se
    estiraba hasta `--content-max` con `1fr auto`, lo que abría un hueco muerto
    de varios cientos de píxeles entre los datos y el QR en escritorio. Un
    carnet de 1100px no es un carnet.
  - Es la superficie PRINCIPAL de su pantalla, así que es la única que lleva el
    trazo de 2px (`Card principal`). Nada más en esta vista puede llevarlo: por
    eso «Cómo usarlo» NO es otra tarjeta.
  - El QR sube justo debajo del nombre: es lo que se enseña.

  Server Component entero salvo el envoltorio de aparición y el botón de
  copiar, que son hojas de cliente.
*/

/*
  UTC a propósito: `fechaLegible` construye el instante a medianoche UTC, así
  que hay que leerlo en UTC. En Bogotá (UTC−5) retrocedería al día anterior y
  el carnet anunciaría que la membresía vence un día antes de lo que vence.
*/
const FECHA = new Intl.DateTimeFormat('es-CO', {
  timeZone: 'UTC',
  day: 'numeric',
  month: 'long',
  year: 'numeric',
})

/** 'YYYY-MM-DD' → texto legible, sin desplazarse un día por zona horaria. */
function fechaLegible(iso: string): string {
  const [a, m, d] = iso.split('-').map(Number)
  return FECHA.format(new Date(Date.UTC(a, m - 1, d)))
}

/*
  Onboarding permanente (§6.3 ⑨). No cuesta un clic, no se descarta y es lo
  que llena la columna lateral en escritorio en lugar del hueco muerto. Texto
  plano, sin iconos: son instrucciones, no una fila de características.
*/
const PASOS = [
  'Busca el comercio en el catálogo y mira qué beneficio tiene.',
  'Muestra este código en la caja, antes de pagar.',
  'El comercio lo escanea y aplica tu beneficio al momento.',
]

const MENSAJE_SOPORTE = 'Hola, tengo una duda con mi carnet ORUM.'

export default async function PerfilMiembroPage() {
  const miembro = await requireMiembroVigente()

  const supabase = await createClient()

  /*
    Las dos consultas van juntas y el nombre del plan NO se aísla en un
    `<Suspense>` (§6.7): un carnet que dice «Daniel Bulla» y medio segundo
    después añade «Plan Premium» se lee como un fallo, no como progreso.
  */
  const [{ data: plan }, { data: config }] = await Promise.all([
    supabase
      .from('planes_membresia')
      .select('nombre')
      .eq('id', miembro.membresiaVigente.planId)
      .maybeSingle(),
    supabase.from('configuracion').select('valor').eq('clave', 'whatsapp_soporte').maybeSingle(),
  ])

  /*
    Aunque `requireMiembroVigente` ya garantiza que está vigente, el estado se
    DERIVA igual: así el carnet puede decir cuántos días quedan, que es lo que
    de verdad le interesa al miembro, y nunca puede contradecir a la lista del
    administrador —ambos usan la misma función.
  */
  const estado = derivarEstadoMembresia(
    miembro.membresiaVigente.estado,
    miembro.membresiaVigente.fechaFin,
    hoyISO(),
  )

  const nombreCompleto = `${miembro.nombres} ${miembro.apellidos}`.trim()
  const soporte = config?.valor ?? null

  return (
    <div className={styles.pantalla}>
      <header className={styles.encabezado}>
        <h1 className={styles.titulo}>Mi carnet</h1>
        <p className={styles.lede}>Muestra este código en la caja.</p>
      </header>

      <div className={styles.columnas}>
        <CarnetAparece className={styles.carnetCaja}>
          {/*
            `principal` = el trazo de 2px, y es el único de la pantalla.
            `brand` = el filo dorado de 1px del borde superior, que lo pone la
            primitiva. La spec pedía 2px de oro; la dirección v2 §2.4 dice que
            sobre papel basta 1px, y que el grosor de 2px es de TINTA.
          */}
          <Card padding="lg" variant="brand" principal className={styles.carnet}>
            {/* Entrada escalonada de los cuatro bloques: 35 ms, tope de 8. */}
            <Stack gap={5} escalonado>
              <Stack gap={5}>
                {/* Una credencial sin el nombre de quien la emite no parece
                    una credencial. Pequeño, arriba a la izquierda. */}
                <p className={styles.wordmark}>ORUM</p>

                <Stack gap={1}>
                  <p className={styles.nombre}>{nombreCompleto}</p>
                  {/* `planes_membresia` sostiene varios planes: mostrar el
                      nombre es correcto. Sin plan, un respaldo genérico — un
                      hueco ahí parecería un carnet roto. */}
                  <p className={styles.plan}>{plan?.nombre ?? 'Membresía ORUM'}</p>
                </Stack>
              </Stack>

              {/*
                `data-motion-esencial`: pase lo que pase con las preferencias
                de movimiento, el QR no puede quedarse a medio camino de una
                transformación. Es lo que se escanea delante del cajero.
              */}
              <div className={styles.qr} data-motion-esencial>
                <QrCode
                  value={miembro.numeroMembresia}
                  size={160}
                  className={styles.qrMarco}
                  label={`Código de la membresía ${miembro.numeroMembresia} de ${nombreCompleto}`}
                />
              </div>

              <div className={styles.bloque}>
                <span className={styles.etiqueta}>Número de membresía</span>
                <span className={styles.numero}>
                  <Copiar valor={miembro.numeroMembresia} label="Copiar número de membresía" />
                </span>
              </div>

              <div className={styles.bloque}>
                <span className={styles.estadoFila}>
                  <StatusBadge estado={estado} />
                  <VenceEn estado={estado} />
                </span>
                <span className={styles.vigencia}>
                  Hasta el {fechaLegible(miembro.membresiaVigente.fechaFin)}
                </span>
              </div>
            </Stack>
          </Card>
        </CarnetAparece>

        {/*
          Sin `Card`: la pantalla ya tiene su superficie y duplicarla
          convertiría el carnet en «una caja más» (dirección v2 §6).
        */}
        <section className={styles.como}>
          <h2 className={styles.comoTitulo}>Cómo usarlo</h2>

          <ol className={styles.pasos}>
            {PASOS.map((paso) => (
              <li key={paso}>{paso}</li>
            ))}
          </ol>

          {soporte && (
            <div className={styles.soporte}>
              <p className={styles.soporteTexto}>
                ¿Algo no cuadra? El carnet es donde se nota primero: escríbenos y lo revisamos.
              </p>
              <WhatsAppButton telefono={soporte} mensaje={MENSAJE_SOPORTE}>
                Escríbenos por WhatsApp
              </WhatsAppButton>
            </div>
          )}
        </section>
      </div>
    </div>
  )
}
