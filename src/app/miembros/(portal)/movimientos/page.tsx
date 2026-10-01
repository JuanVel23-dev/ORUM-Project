import { redirect } from 'next/navigation'
import { Receipt } from 'lucide-react'
import { requireRolMiembro } from '@/lib/miembros/requerir-miembro'
import { createClient } from '@/lib/supabase/server'
import { obtenerBitacora } from '@/lib/miembros/datos-movimientos'
import { limiteSolicitado, PASO_VER_MAS, type Movimiento } from '@/lib/miembros/movimientos'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Cifra } from '@/components/ui/cifra'
import { DataList, type Column } from '@/components/ui/data-list'
import { EmptyState, ErrorState } from '@/components/ui/feedback'
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
*/

/* Zona del negocio, no la del servidor: una compra de las 7 p. m. en Colombia
   es ya el día siguiente en UTC. `timestamptz` → Bogotá (CLAUDE.md, «Fechas»). */
const FECHA_HORA = new Intl.DateTimeFormat('es-CO', {
  timeZone: 'America/Bogota',
  day: 'numeric',
  month: 'short',
  year: 'numeric',
  hour: 'numeric',
  minute: '2-digit',
})

/** Pesos colombianos sin decimales: aquí nadie cobra centavos. */
const PESOS = new Intl.NumberFormat('es-CO', {
  style: 'currency',
  currency: 'COP',
  maximumFractionDigits: 0,
})

const COLUMNAS: ReadonlyArray<Column<Movimiento>> = [
  {
    key: 'comercio',
    header: 'Comercio',
    primary: true,
    cell: (m) => (
      <span className={styles.comercio}>
        <span className={styles.comercioNombre}>{m.comercio}</span>
        {m.sucursal && <span className={styles.secundario}>{m.sucursal}</span>}
      </span>
    ),
  },
  {
    key: 'beneficio',
    header: 'Beneficio',
    cell: (m) =>
      m.promocion ?? <span className={styles.secundario}>Sin promoción</span>,
  },
  {
    key: 'fecha',
    header: 'Fecha',
    cell: (m) => (
      <time dateTime={m.fechaHora}>{FECHA_HORA.format(new Date(m.fechaHora))}</time>
    ),
  },
  { key: 'compra', header: 'Compra', numeric: true, cell: (m) => PESOS.format(m.valorCompra) },
  {
    key: 'ahorro',
    header: 'Ahorraste',
    numeric: true,
    cell: (m) => <strong>{PESOS.format(m.ahorro)}</strong>,
  },
  { key: 'final', header: 'Pagaste', numeric: true, cell: (m) => PESOS.format(m.valorFinal) },
]

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
        <>
          <Card className={styles.resumen}>
            <Cifra
              size="display"
              etiqueta="Has ahorrado"
              valor={PESOS.format(bitacora.ahorroTotal)}
              nota={`en ${bitacora.total.toLocaleString('es-CO')} ${
                bitacora.total === 1 ? 'movimiento' : 'movimientos'
              }`}
            />
          </Card>

          <DataList
            caption="Movimientos de tu membresía"
            items={bitacora.movimientos}
            columns={COLUMNAS}
            getKey={(m) => m.id}
          />

          {bitacora.total > bitacora.movimientos.length && (
            <div className={styles.verMas}>
              <Button
                href={`/miembros/movimientos?mostrar=${limite + PASO_VER_MAS}`}
                variant="secondary"
                pildora
              >
                Ver más movimientos
              </Button>
              <p className={styles.secundario}>
                Mostrando {bitacora.movimientos.length.toLocaleString('es-CO')} de{' '}
                {bitacora.total.toLocaleString('es-CO')}
              </p>
            </div>
          )}
        </>
      )}
    </div>
  )
}
