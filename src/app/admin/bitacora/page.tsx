import Link from 'next/link'
import { requireRol } from '@/lib/auth/auth'
import { createAdminClient } from '@/lib/supabase/admin'
import { resumirEventoBitacora } from '@/lib/bitacora/bitacora'
import { Badge, DataTable, EmptyState, PageHeader } from '@/components/ui'

export const metadata = { title: 'Bitácora · ORUM' }

export default async function BitacoraPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; desde?: string; hasta?: string; accion?: string }>
}) {
  await requireRol('super_admin')
  const { q, desde, hasta, accion } = await searchParams
  const busqueda = (q ?? '').trim()

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
  if (desde) query = query.gte('fecha_hora', `${desde} 00:00:00`)
  if (hasta) query = query.lte('fecha_hora', `${hasta} 23:59:59`)
  if (accion) query = query.eq('accion', accion)

  const { data: eventos } = await query

  const idsMiembros = Array.from(
    new Set((eventos ?? []).map((e) => e.entidad_id).filter((idMiembro): idMiembro is number => idMiembro !== null)),
  )
  const { data: miembrosInfo } =
    idsMiembros.length > 0
      ? await admin.from('miembros').select('id, nombres, apellidos').in('id', idsMiembros)
      : { data: [] as { id: number; nombres: string; apellidos: string }[] }
  const nombreMiembro = new Map((miembrosInfo ?? []).map((m) => [m.id, `${m.nombres} ${m.apellidos}`.trim()]))

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

  return (
    <div>
      <PageHeader title="Bitácora de actividad" />

      <form
        method="get"
        className="orum-card"
        style={{ marginBottom: '1.25rem', display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}
      >
        <input
          type="text"
          name="q"
          className="orum-input"
          placeholder="Buscar miembro (nombre, cédula, número)…"
          defaultValue={busqueda}
          style={{ flex: 2, minWidth: 220 }}
        />
        <input type="date" name="desde" className="orum-input" defaultValue={desde ?? ''} style={{ flex: 1, minWidth: 140 }} />
        <input type="date" name="hasta" className="orum-input" defaultValue={hasta ?? ''} style={{ flex: 1, minWidth: 140 }} />
        <select name="accion" className="orum-select" defaultValue={accion ?? ''} style={{ flex: 1, minWidth: 140 }}>
          <option value="">Todas las acciones</option>
          <option value="alta">Alta</option>
          <option value="edicion">Edición</option>
          <option value="renovacion">Renovación</option>
        </select>
        <button type="submit" className="orum-button orum-button--secondary">Filtrar</button>
      </form>

      {!eventos || eventos.length === 0 ? (
        <EmptyState>
          {busqueda || desde || hasta || accion
            ? 'Ningún evento coincide con los filtros aplicados.'
            : 'Aún no hay eventos registrados.'}
        </EmptyState>
      ) : (
        <DataTable>
          <thead>
            <tr><th>Fecha</th><th>Miembro</th><th>Acción</th><th>Detalle</th><th>Registrado por</th></tr>
          </thead>
          <tbody>
            {eventos.map((e) => (
              <tr key={e.id}>
                <td>{new Date(e.fecha_hora).toLocaleString('es-CO', { timeZone: 'America/Bogota' })}</td>
                <td>
                  {e.entidad_id ? (
                    <Link href={`/admin/miembros/${e.entidad_id}`}>
                      {nombreMiembro.get(e.entidad_id) ?? `Miembro #${e.entidad_id}`}
                    </Link>
                  ) : (
                    '—'
                  )}
                </td>
                <td><Badge tone="on">{e.accion}</Badge></td>
                <td>{resumirEventoBitacora(e.accion, e.datos_anteriores, e.datos_nuevos)}</td>
                <td className="orum-muted">{e.actor_id ? (correoActor.get(e.actor_id) ?? '—') : '—'}</td>
              </tr>
            ))}
          </tbody>
        </DataTable>
      )}
    </div>
  )
}
