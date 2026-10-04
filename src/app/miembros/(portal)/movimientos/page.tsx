import Link from 'next/link'
import { redirect } from 'next/navigation'
import { ChevronRight, Receipt } from 'lucide-react'
import { requireRolMiembro } from '@/lib/miembros/requerir-miembro'
import { createClient } from '@/lib/supabase/server'
import { obtenerBitacora } from '@/lib/miembros/datos-movimientos'
import {
  agruparPorMes,
  limiteSolicitado,
  PASO_VER_MAS,
  type Movimiento,
} from '@/lib/miembros/movimientos'
import { Button } from '@/components/ui/button'
import { ComercioLogo } from '@/components/ui/comercio-logo'
import { EmptyState, ErrorState } from '@/components/ui/feedback'
import { EstrellaOrum } from '@/components/ui/marca/marca'
import { TituloSeccion } from '@/components/ui/titulo-seccion'
import styles from './movimientos.module.css'

export const metadata = { title: 'Mis movimientos · ORUM' }

/*
  MIS MOVIMIENTOS  ·  la bitácora del socio
  ---------------------------------------------------------------------------
  Dónde usó su membresía, con qué beneficio y cuánto ahorró. Es la misma
  información que el comercio registra en caja (`ventas`), vista por quien la
  recibió: el socio puede comprobar que lo que le cobraron es lo que se le
  prometió.

  `requireRolMiembro` y NO `requireMiembroVigente`: es su propio historial, no
  un beneficio activo, así que un socio con la membresía en pausa sigue
  pudiendo consultar a dónde fue. (Sí hay que ser socio: el rol se exige.)

  LA SEGURIDAD la pone la RLS de `ventas` (ver `datos-movimientos.ts`). El
  `miembroId` sale de la sesión, nunca de la URL. Lo único que la URL controla
  es cuántas filas se piden (`?mostrar=`), y está acotado en `limiteSolicitado`.

  Sin JavaScript: «Ver más» es un enlace que sube el límite y vuelve a
  renderizar en el servidor.

  REDISEÑO DEL 03/10/2026 (encargo del propietario: «mejora el diseño, no me
  convence, tanto para móvil como PC»). Era un título, una tarjeta con el
  total y una tabla de seis columnas con el aspecto del panel de
  administración; en el móvil, tarjetas apiladas con seis etiquetas cada una.
  Ahora habla el idioma del portal:

    · EL RESUMEN es una tarjeta clara, como las del portal inicial (la
      primera versión, negra, no gustó): un icono en anillo de oro, lo
      ahorrado en el serif de display y los usos y el ahorro promedio. En
      escritorio se queda fija a la izquierda mientras se recorre la lista;
      en el móvil va arriba.
    · LA LISTA va por MESES (`agruparPorMes`), y cada movimiento es una fila
      con el logotipo del comercio: a un lado dónde, qué beneficio y cuándo;
      al otro, lo que se ahorró —lo que el socio viene a ver— y lo que pagó
      junto al precio original tachado. Sin encabezados de columna ni
      etiquetas repetidas.
    · Cada fila lleva a la ficha del comercio.
*/

/* Zona del negocio, no la del servidor: una compra de las 7 p. m. en Colombia
   es ya el día siguiente en UTC. `timestamptz` → Bogotá (CLAUDE.md, «Fechas»).
   Sin el año: el encabezado del grupo ya lo dice. */
const DIA_HORA = new Intl.DateTimeFormat('es-CO', {
  timeZone: 'America/Bogota',
  weekday: 'short',
  day: 'numeric',
  month: 'short',
  hour: 'numeric',
  minute: '2-digit',
})

/** Pesos colombianos sin decimales: aquí nadie cobra centavos. */
const PESOS = new Intl.NumberFormat('es-CO', {
  style: 'currency',
  currency: 'COP',
  maximumFractionDigits: 0,
})

/** Una fila del historial. Enlace a la ficha si el comercio sigue disponible. */
function FilaMovimiento({ m }: { m: Movimiento }) {
  const contenido = (
    <>
      <ComercioLogo logoUrl={m.logoUrl} nombre={m.comercio} className={styles.logo} />

      <span className={styles.donde}>
        <span className={styles.comercio}>{m.comercio}</span>
        <span className={styles.detalle}>
          {m.promocion ?? 'Sin promoción'}
          {m.sucursal && ` · ${m.sucursal}`}
        </span>
        <time className={styles.fecha} dateTime={m.fechaHora}>
          {DIA_HORA.format(new Date(m.fechaHora))}
        </time>
      </span>

      <span className={styles.importes}>
        <span className={styles.ahorro}>
          <span className={styles.etiqueta}>Ahorraste</span> {PESOS.format(m.ahorro)}
        </span>
        <span className={styles.pago}>
          <span className={styles.etiqueta}>Pagaste</span> {PESOS.format(m.valorFinal)}
          {m.valorCompra > m.valorFinal && (
            <>
              {' '}
              <s className={styles.antes}>
                <span className="sr-only">antes </span>
                {PESOS.format(m.valorCompra)}
              </s>
            </>
          )}
        </span>
      </span>

      {m.comercioId !== null && (
        <ChevronRight size={16} aria-hidden="true" className={styles.flecha} />
      )}
    </>
  )

  return m.comercioId !== null ? (
    <Link href={`/miembros/comercios/${m.comercioId}`} className={styles.fila}>
      {contenido}
    </Link>
  ) : (
    <div className={styles.fila}>{contenido}</div>
  )
}

export default async function MovimientosPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}) {
  const perfil = await requireRolMiembro()
  const limite = limiteSolicitado((await searchParams).mostrar)

  /* `miembros_self_select`: la RLS ya limita esto al propio socio. */
  const supabase = await createClient()
  const { data: miembro } = await supabase
    .from('miembros')
    .select('id')
    .eq('perfil_id', perfil.userId)
    .is('deleted_at', null)
    .maybeSingle()

  if (!miembro) redirect('/miembros/inactiva')

  const bitacora = await obtenerBitacora(miembro.id, limite)
  const meses = bitacora ? agruparPorMes(bitacora.movimientos) : []

  return (
    <div className={styles.pantalla}>
      <header className={styles.encabezado}>
        <TituloSeccion como="h1" texto="Mis movimientos" tamano="bloque" />
        <p className={styles.lede}>Dónde has usado tu membresía y cuánto has ahorrado.</p>
      </header>

      {!bitacora ? (
        <ErrorState
          title="No pudimos cargar tus movimientos"
          description="Es un fallo nuestro, no tuyo. Recarga la página en un momento."
        />
      ) : bitacora.total === 0 ? (
        <EmptyState
          icon={<Receipt aria-hidden="true" />}
          title="Aún no tienes movimientos"
          description="Cuando un comercio registre una compra con tu carnet, aparecerá aquí."
          actions={
            <Button href="/miembros" variant="secondary" pildora>
              Ver comercios y beneficios
            </Button>
          }
        />
      ) : (
        <div className={styles.cuerpo}>
          {/* ── EL RESUMEN ────────────────────────────────────────────── */}
          <aside className={styles.resumen} aria-label="Resumen de tu ahorro">
            <div className={styles.resumenCabecera}>
              <span className={styles.resumenIcono} aria-hidden="true">
                {/* La estrella de la marca, no un icono genérico (la alcancía
                    que hubo antes no gustó). */}
                <EstrellaOrum className={styles.resumenEstrella} />
              </span>
              <p className={styles.resumenEtiqueta}>Has ahorrado</p>
            </div>
            <p className={styles.resumenTotal}>{PESOS.format(bitacora.ahorroTotal)}</p>
            <p className={styles.resumenNota}>con tu membresía ORUM</p>

            <dl className={styles.cifras}>
              <div className={styles.cifra}>
                <dt>{bitacora.total === 1 ? 'Uso' : 'Usos'}</dt>
                <dd>{bitacora.total.toLocaleString('es-CO')}</dd>
              </div>
              <div className={styles.cifra}>
                <dt>Ahorro promedio</dt>
                <dd>{PESOS.format(Math.round(bitacora.ahorroTotal / bitacora.total))}</dd>
              </div>
            </dl>
          </aside>

          {/* ── LA LISTA, POR MESES ───────────────────────────────────── */}
          <div className={styles.lista}>
            {meses.map((mes) => (
              <section key={mes.clave} aria-labelledby={`mes-${mes.clave}`}>
                <div className={styles.mesCabecera}>
                  <h2 id={`mes-${mes.clave}`} className={styles.mes}>
                    {mes.titulo}
                  </h2>
                  <p className={styles.mesAhorro}>
                    <span className="sr-only">Ahorro del mes: </span>
                    {PESOS.format(mes.ahorro)}
                  </p>
                </div>

                <ul className={styles.filas}>
                  {mes.movimientos.map((m) => (
                    <li key={m.id}>
                      <FilaMovimiento m={m} />
                    </li>
                  ))}
                </ul>
              </section>
            ))}

            {bitacora.total > bitacora.movimientos.length && (
              <div className={styles.verMas}>
                <Button
                  href={`/miembros/movimientos?mostrar=${limite + PASO_VER_MAS}`}
                  variant="secondary"
                  pildora
                >
                  Ver más movimientos
                </Button>
                <p className={styles.contador}>
                  Mostrando {bitacora.movimientos.length.toLocaleString('es-CO')} de{' '}
                  {bitacora.total.toLocaleString('es-CO')}
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
