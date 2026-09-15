import { Camera } from 'lucide-react'
import { requireMiembroVigente } from '@/lib/miembros/requerir-miembro'
import { createClient } from '@/lib/supabase/server'
import { derivarEstadoMembresia } from '@/lib/miembros/membresias'
import { hoyISO } from '@/lib/shared/fecha'
import { iniciales } from '@/components/ui/avatar'
import { StatusBadge, VenceEn } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Copiar } from '@/components/ui/copiar'
import { QrCode } from '@/components/ui/qr-code'
import { WhatsAppButton } from '@/components/ui/whatsapp-button'
import styles from './perfil.module.css'

export const metadata = { title: 'Mi carnet · ORUM' }

/*
  EL CARNET  ·  Z1

  Es lo que el socio enseña con orgullo en la caja, con una mano y con prisa.
  Con la licencia creativa v4 —sin presupuesto de oro y sin disciplina de
  trazo— pasa a ser lo que tenía que ser: una tarjeta de CHOCOLATE con el
  wordmark y los datos en oro. El porqué de cada decisión de color, y los
  ratios medidos, están en `perfil.module.css`; aquí solo el marcado.

  Lo que manda la forma:

  - Ancho propio (460px) y UNA sola columna a todos los anchos. Un carnet de
    1100px no es un carnet.
  - El nombre del socio va a ancho completo de la tarjeta, en Fraunces y en el
    peldaño `hero`: en un carnet físico es lo primero que se lee a un brazo de
    distancia. Por eso la foto sube a la cabecera, a la esquina del retrato de
    un pasaporte, en vez de robarle 300px de línea al nombre.
  - El QR va en su placa BLANCA, pase lo que pase con el tema y con el fondo.
  - La foto del socio, si la hay. Si no la hay, sus iniciales — nunca un hueco
    ni un icono genérico de persona, que es lo que hace que una credencial
    parezca rota.

  Server Component entero salvo el botón de copiar, que es una hoja de cliente.
  La aparición ya no necesita JavaScript: la hace un `@keyframes` de 180ms.
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
  Onboarding permanente. No cuesta un clic, no se descarta y es lo que llena la
  columna lateral en escritorio en lugar del hueco muerto. Texto plano, sin
  iconos: son instrucciones, no una fila de características.
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
    Las tres consultas van juntas y ninguna se aísla en un `<Suspense>`: un
    carnet que dice «Daniel Bulla» y medio segundo después añade «Plan
    Premium» —o le aparece la cara— se lee como un fallo, no como progreso.

    La foto se pide aquí y no en `requireMiembroVigente` porque esa función la
    comparten el layout y `/miembros/inactiva`, y ninguna de las dos la
    necesita: añadírsela cargaría una columna en cada navegación del portal
    para usarla en una sola pantalla.
  */
  const [{ data: plan }, { data: config }, { data: ficha }] = await Promise.all([
    supabase
      .from('planes_membresia')
      .select('nombre')
      .eq('id', miembro.membresiaVigente.planId)
      .maybeSingle(),
    supabase.from('configuracion').select('valor').eq('clave', 'whatsapp_soporte').maybeSingle(),
    supabase.from('miembros').select('foto_url').eq('id', miembro.id).maybeSingle(),
  ])

  /*
    Aunque `requireMiembroVigente` ya garantiza que está vigente, el estado se
    DERIVA igual: así el carnet puede decir cuántos días quedan, que es lo que
    de verdad le interesa al miembro, y nunca puede contradecir a la lista del
    administrador —ambos usan la misma función—.

    `membresias.estado` en crudo, JAMÁS: tiene default `'activa'` y nada la
    actualiza al vencer.
  */
  const estado = derivarEstadoMembresia(
    miembro.membresiaVigente.estado,
    miembro.membresiaVigente.fechaFin,
    hoyISO(),
  )

  const nombreCompleto = `${miembro.nombres} ${miembro.apellidos}`.trim()
  const soporte = config?.valor ?? null
  const fotoUrl = ficha?.foto_url ?? null

  return (
    <div className={styles.pantalla}>
      <header className={styles.encabezado}>
        <h1 className={styles.titulo}>Mi carnet</h1>
        <p className={styles.lede}>Muestra este código en la caja.</p>
      </header>

      <div className={styles.columnas}>
        {/* El envoltorio existe para llevar el `transform` de la entrada: una
            animación sobre el elemento que además recorta con `overflow` se
            pelea con el recorte en algunos navegadores. */}
        <div className={styles.carnetCaja}>
          {/*
            `padding="none"`: el relleno lo pone `.carnetInterior`, que es
            además quien se eleva por encima del halo dorado.

            `variant="brand"` aporta el hairline superior de su `::before`; el
            filo dorado del contorno lo sube el módulo, porque sobre chocolate
            el `--brand-edge` al 45% de la primitiva no se ve.
          */}
          <Card padding="none" variant="brand" principal className={styles.carnet}>
            <div className={styles.carnetInterior}>
              <header className={styles.cabecera}>
                <div className={styles.emisor}>
                  {/* Una credencial sin el nombre de quien la emite no parece
                      una credencial. */}
                  <p className={styles.wordmark}>ORUM</p>
                  <p className={styles.tipo}>Carnet de socio</p>
                </div>

                {/*
                  LA FOTO. `aria-hidden` porque el nombre está justo debajo:
                  sin esto el lector anuncia «Daniel Bulla» dos veces, que es
                  el mismo motivo por el que `Avatar` tiene `decorativo`.

                  `<img>` y no `next/image`: `next.config.ts` no declara
                  `images` y la URL es externa —Storage o el servidor de quien
                  la subiera—. `alt` vacío a propósito: una URL muerta con
                  `alt` con texto puede arrastrar el glifo de imagen rota de
                  Chrome, y eso no se enseña en una caja.
                */}
                <span className={styles.foto} aria-hidden="true">
                  {fotoUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element -- URL externa arbitraria, no un asset local
                    <img
                      src={fotoUrl}
                      alt=""
                      className={styles.fotoImagen}
                      loading="lazy"
                      decoding="async"
                    />
                  ) : (
                    <span className={styles.fotoIniciales}>{iniciales(nombreCompleto)}</span>
                  )}
                </span>
              </header>

              <div className={styles.identidad}>
                <p className={styles.nombre}>{nombreCompleto}</p>
                {/* `planes_membresia` sostiene varios planes: mostrar el
                    nombre es correcto. Sin plan, un respaldo genérico — un
                    hueco ahí parecería un carnet roto. */}
                <p className={styles.plan}>{plan?.nombre ?? 'Membresía ORUM'}</p>
              </div>

              <div className={styles.credencial}>
                {/*
                  `data-motion-esencial`: pase lo que pase con las preferencias
                  de movimiento, el QR no puede quedarse a medio camino de una
                  transformación. Es lo que se escanea delante del cajero.

                  Va en el envoltorio del QR y NO en `.credencial`: la exención
                  alcanza a todos los descendientes, y colgándola del bloque
                  entero el botón de copiar se quedaría con su encogido de
                  pulsación activo justo para quien pidió no tener movimiento.
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
              </div>

              <div className={styles.pie}>
                <span className={styles.estadoFila}>
                  <StatusBadge estado={estado} />
                  <VenceEn estado={estado} />
                </span>
                <span className={styles.vigencia}>
                  Hasta el {fechaLegible(miembro.membresiaVigente.fechaFin)}
                </span>
              </div>
            </div>
          </Card>

          {/*
            «Cambiar foto» va FUERA de la tarjeta. Es mantenimiento —se hace
            una vez— y dentro competía con el nombre y con el QR: lo que se
            enseña en una caja no lleva botones de administración impresos
            encima.

            Un formulario no navega: `/miembros/perfil/foto` está interceptada
            por la ranura `@modal` del portal y se abre encima del carnet.
          */}
          <div className={styles.acciones}>
            <Button
              href="/miembros/perfil/foto"
              variant="ghost"
              size="sm"
              icon={<Camera size={15} />}
            >
              {fotoUrl ? 'Cambiar foto' : 'Añadir mi foto'}
            </Button>
          </div>
        </div>

        {/*
          Sin `Card`: la pantalla ya tiene su superficie y duplicarla
          convertiría el carnet en «una caja más».
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
