import Link from 'next/link'
import { Filter, ScrollText, X } from 'lucide-react'
import { requireRol } from '@/lib/auth/auth'
import { createAdminClient } from '@/lib/supabase/admin'
import { resumirEventoBitacora } from '@/lib/bitacora/bitacora'
import { finDiaBogota, inicioDiaBogota } from '@/lib/shared/fecha'
import { Badge, type BadgeTone } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { DataList, type Column } from '@/components/ui/data-list'
import { EmptyState } from '@/components/ui/feedback'
import { Input, Select } from '@/components/ui/input'
import { PageHeader } from '@/components/ui/layout'
import styles from './bitacora.module.css'

export const metadata = { title: 'Bitácora · ORUM' }

type Evento = {
  id: number
  fechaISO: string
  miembroId: number | null
  miembroNombre: string
  accion: string
  detalle: string
  actor: string
}

/*
  El tono NO inventa una semántica de riesgo: un registro no es una alerta.
  Solo separa los tres tipos de evento lo justo para poder escanear la columna
  sin leerla. Nada de oro aquí — el oro es marca y esta pantalla es operativa.
*/
const TONO_ACCION: Record<string, BadgeTone> = {
  alta: 'success',
  renovacion: 'info',
  edicion: 'neutral',
}

const ETIQUETA_ACCION: Record<string, string> = {
  alta: 'Alta',
  renovacion: 'Renovación',
  edicion: 'Edición',
}

/* Bogotá siempre: el negocio es colombiano y el servidor puede no estarlo. */
const ZONA = 'America/Bogota'
const FECHA = new Intl.DateTimeFormat('es-CO', {
  timeZone: ZONA,
  day: '2-digit',
  month: 'short',
  year: 'numeric',
})
const HORA = new Intl.DateTimeFormat('es-CO', {
  timeZone: ZONA,
  hour: '2-digit',
  minute: '2-digit',
})

const COLUMNAS: ReadonlyArray<Column<Evento>> = [
  {
    key: 'fecha',
    header: 'Fecha',
    /* 175px es lo que mide "09 de ago de 2026" sin partirse: por debajo, la
       fecha cae a dos líneas y descuadra la altura de todas las filas. */
    width: '175px',
    cell: (e) => {
      const d = new Date(e.fechaISO)
      return (
        <span className={styles.fecha}>
          <span>{FECHA.format(d)}</span>
          <span className={styles.hora}>{HORA.format(d)}</span>
        </span>
      )
    },
  },
  {
    key: 'miembro',
    header: 'Miembro',
    primary: true,
    cell: (e) =>
      e.miembroId ? (
        <Link href={`/admin/miembros/${e.miembroId}`} className={styles.enlaceMiembro}>
          {e.miembroNombre}
        </Link>
      ) : (
        '—'
      ),
  },
  {
    key: 'accion',
    header: 'Acción',
    width: '140px',
    cell: (e) => (
      <Badge tone={TONO_ACCION[e.accion] ?? 'neutral'} size="sm">
        {ETIQUETA_ACCION[e.accion] ?? e.accion}
      </Badge>
    ),
  },
  {
    key: 'detalle',
    header: 'Detalle',
    cell: (e) => <span className={styles.detalle}>{e.detalle}</span>,
  },
  {
    key: 'actor',
    header: 'Registrado por',
    width: '220px',
    cell: (e) => <span className={styles.actor}>{e.actor}</span>,
  },
]

export default async function BitacoraPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; desde?: string; hasta?: string; accion?: string }>
}) {
  await requireRol('super_admin')
  const { q, desde, hasta, accion } = await searchParams
  const busqueda = (q ?? '').trim()
  const hayFiltros = Boolean(busqueda || desde || hasta || accion)

  const admin = createAdminClient()

  // Sanear caracteres especiales de PostgREST (comas, paréntesis y comodines)
  // para que una búsqueda con puntuación —p. ej. "Pérez, Juan"— no rompa la consulta.
  const termino = busqueda.replace(/[,()%*\\]/g, ' ').trim()

  // Si hay búsqueda por miembro, primero resolvemos qué miembros calzan.
  let miembroIds: number[] | null = null
  if (termino) {
    const { data: miembrosCoincidentes } = await admin
      .from('miembros')
      .select('id')
      .is('deleted_at', null)
      .or(
        `nombres.ilike.%${termino}%,apellidos.ilike.%${termino}%,cedula.ilike.%${termino}%,numero_membresia.ilike.%${termino}%`,
      )
      .limit(100)
    miembroIds = (miembrosCoincidentes ?? []).map((m) => m.id)
  }

  let query = admin
    .from('bitacora_actividad')
    .select('id, actor_id, entidad_id, accion, datos_anteriores, datos_nuevos, fecha_hora')
    .eq('entidad', 'miembro')
    .order('fecha_hora', { ascending: false })
    .limit(200)

  if (miembroIds) query = query.in('entidad_id', miembroIds.length > 0 ? miembroIds : [-1])
  /*
    Offset explícito de Bogotá, no una cadena suelta: `fecha_hora` es
    timestamptz y Postgres leería `'2026-08-12 23:59:59'` en la zona de la
    sesión (UTC). Con Bogotá cinco horas por detrás, todo lo ocurrido después
    de las 7pm caía en el día siguiente en UTC y se salía del filtro — el
    mismo fallo que backend encontró en métricas contra la base real.
  */
  if (desde) query = query.gte('fecha_hora', inicioDiaBogota(desde))
  if (hasta) query = query.lte('fecha_hora', finDiaBogota(hasta))
  if (accion) query = query.eq('accion', accion)

  const { data: eventos } = await query

  const idsMiembros = Array.from(
    new Set(
      (eventos ?? [])
        .map((e) => e.entidad_id)
        .filter((idMiembro): idMiembro is number => idMiembro !== null),
    ),
  )
  const { data: miembrosInfo } =
    idsMiembros.length > 0
      ? await admin.from('miembros').select('id, nombres, apellidos').in('id', idsMiembros)
      : { data: [] as { id: number; nombres: string; apellidos: string }[] }
  const nombreMiembro = new Map(
    (miembrosInfo ?? []).map((m) => [m.id, `${m.nombres} ${m.apellidos}`.trim()]),
  )

  const actorIds = Array.from(
    new Set((eventos ?? []).map((e) => e.actor_id).filter((idActor): idActor is string => !!idActor)),
  )
  const correoActor = new Map<string, string>()
  await Promise.all(
    actorIds.map(async (idActor) => {
      const { data } = await admin.auth.admin.getUserById(idActor)
      correoActor.set(idActor, data.user?.email ?? '—')
    }),
  )

  const filas: Evento[] = (eventos ?? []).map((e) => ({
    id: e.id,
    fechaISO: e.fecha_hora,
    miembroId: e.entidad_id,
    miembroNombre: e.entidad_id
      ? (nombreMiembro.get(e.entidad_id) ?? `Miembro #${e.entidad_id}`)
      : '—',
    accion: e.accion,
    detalle: resumirEventoBitacora(e.accion, e.datos_anteriores, e.datos_nuevos),
    actor: e.actor_id ? (correoActor.get(e.actor_id) ?? '—') : '—',
  }))

  return (
    <>
      <PageHeader
        title="Bitácora de actividad"
        description="Quién hizo qué y cuándo sobre los miembros. Se muestran los 200 eventos más recientes que cumplan los filtros."
      />

      {/*
        Formulario GET: los filtros quedan en la URL, se pueden compartir y
        sobreviven a un refresco. Funciona sin JavaScript.
      */}
      <form method="get" className={styles.filtros}>
        <div className={styles.campoAncho}>
          <label className={styles.etiqueta} htmlFor="f-q">
            Miembro
          </label>
          <Input
            id="f-q"
            name="q"
            defaultValue={busqueda}
            placeholder="Nombre, cédula o número"
            autoComplete="off"
          />
        </div>

        <div>
          <label className={styles.etiqueta} htmlFor="f-desde">
            Desde
          </label>
          <Input id="f-desde" type="date" name="desde" defaultValue={desde ?? ''} />
        </div>

        <div>
          <label className={styles.etiqueta} htmlFor="f-hasta">
            Hasta
          </label>
          <Input id="f-hasta" type="date" name="hasta" defaultValue={hasta ?? ''} />
        </div>

        <div>
          <label className={styles.etiqueta} htmlFor="f-accion">
            Acción
          </label>
          <Select id="f-accion" name="accion" defaultValue={accion ?? ''}>
            <option value="">Todas</option>
            <option value="alta">Alta</option>
            <option value="edicion">Edición</option>
            <option value="renovacion">Renovación</option>
          </Select>
        </div>

        <div className={styles.acciones}>
          <Button type="submit" variant="secondary" icon={<Filter size={16} />}>
            Filtrar
          </Button>
          {hayFiltros && (
            <Button href="/admin/bitacora" variant="ghost" icon={<X size={16} />}>
              Limpiar
            </Button>
          )}
        </div>
      </form>

      {filas.length > 0 && (
        <p className={styles.resumen}>
          {filas.length} {filas.length === 1 ? 'evento' : 'eventos'}
          {filas.length === 200 && ' (límite alcanzado: acota el rango de fechas)'}
        </p>
      )}

      <DataList
        caption="Eventos registrados sobre miembros"
        items={filas}
        columns={COLUMNAS}
        getKey={(e) => e.id}
        empty={
          hayFiltros ? (
            <EmptyState
              icon={<ScrollText size={24} />}
              title="Sin eventos"
              description="Ningún evento coincide con los filtros aplicados."
              actions={
                <Button href="/admin/bitacora" variant="secondary">
                  Quitar filtros
                </Button>
              }
            />
          ) : (
            <EmptyState
              icon={<ScrollText size={24} />}
              title="Aún no hay actividad"
              description="Cuando se registren o renueven miembros, el rastro aparecerá aquí."
            />
          )
        }
      />
    </>
  )
}
