import { Camera } from 'lucide-react'
import { requireMiembroVigente } from '@/lib/miembros/requerir-miembro'
import { createClient } from '@/lib/supabase/server'
import { derivarEstadoMembresia } from '@/lib/miembros/membresias'
import { hoyISO } from '@/lib/shared/fecha'
import { Button } from '@/components/ui/button'
import { WhatsAppButton } from '@/components/ui/whatsapp-button'
import { Carnet } from './_components/carnet'
import { CarnetAmpliable } from './_components/carnet-ampliable'
import styles from './perfil.module.css'

export const metadata = { title: 'Mi carnet · ORUM' }

/*
  EL CARNET  ·  Z1

  Es lo que el socio enseña con orgullo en la caja, con una mano y con prisa.
  Con la licencia creativa v4 —sin presupuesto de oro y sin disciplina de
  trazo— es lo que tenía que ser: una tarjeta de CHOCOLATE con el wordmark y
  los datos en oro. El porqué de cada decisión de color, y los ratios medidos,
  están en `perfil.module.css`; el marcado del objeto, en
  `_components/carnet.tsx`; aquí solo los datos y el reparto de la pantalla.

  Lo que manda la forma, tras el encargo del propietario del 15/09/2026:

  - UN SOLO EJE VERTICAL, centrado, como un carnet de verdad: emisor, foto,
    nombre, plan, estado, número, vigencia y QR sobre la misma línea. Antes la
    foto estaba en la esquina del pasaporte y el texto corría desde la
    izquierda: se leía como una ficha de datos.
  - La FOTO manda la jerarquía (128px, circular), no el nombre — que baja de
    `hero-2` a `display-2`.
  - Ancho propio (460px) y UNA sola columna a todos los anchos. Un carnet de
    1100px no es un carnet.
  - Se AMPLÍA por encima de la página, con velo, sin navegar: `CarnetAmpliable`.
  - El QR va en su placa BLANCA, pase lo que pase con el tema y con el fondo.
  - La foto del socio, si la hay. Si no la hay, sus iniciales — nunca un hueco
    ni un icono genérico de persona, que es lo que hace que una credencial
    parezca rota.

  Server Component entero salvo `CarnetAmpliable` (que solo guarda un booleano)
  y el botón de copiar. La aparición no necesita JavaScript: la hace un
  `@keyframes` de 180 ms.
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
  'Toca «Ampliar carnet» y muestra el código en la caja, antes de pagar.',
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

  /*
    Los datos del objeto se resuelven UNA vez y se reparten a las dos copias
    —la de la página y la ampliada—. Escribirlas por separado es cómo dos
    vistas del mismo dato acaban diciendo cosas distintas.
  */
  const datos = {
    nombre: nombreCompleto,
    // `planes_membresia` sostiene varios planes: mostrar el nombre es
    // correcto. Sin plan, un respaldo genérico.
    plan: plan?.nombre ?? 'Membresía ORUM',
    numeroMembresia: miembro.numeroMembresia,
    estado,
    vigencia: fechaLegible(miembro.membresiaVigente.fechaFin),
    fotoUrl,
  }

  return (
    <div className={styles.pantalla}>
      <header className={styles.encabezado}>
        <h1 className={styles.titulo}>Mi carnet</h1>
        <p className={styles.lede}>Muestra este código en la caja.</p>
      </header>

      <div className={styles.columnas}>
        {/*
          Las dos copias del carnet se crean AQUÍ, en el servidor, y viajan
          como props al componente de cliente. Así el QR y el retrato siguen
          siendo marcado de servidor: lo único que se hidrata es el booleano
          de «abierto».

          «Cambiar foto» va FUERA de la tarjeta. Es mantenimiento —se hace una
          vez— y dentro competía con el nombre y con el QR: lo que se enseña
          en una caja no lleva botones de administración impresos encima.

          Un formulario no navega: `/miembros/perfil/foto` está interceptada
          por la ranura `@modal` del portal y se abre encima del carnet.
        */}
        <CarnetAmpliable
          ampliado={<Carnet {...datos} variante="ampliado" />}
          acciones={
            <Button
              href="/miembros/perfil/foto"
              variant="ghost"
              size="sm"
              icon={<Camera size={15} aria-hidden="true" />}
            >
              {fotoUrl ? 'Cambiar foto' : 'Añadir mi foto'}
            </Button>
          }
        >
          <Carnet {...datos} />
        </CarnetAmpliable>

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
