import { requireRol } from '@/lib/auth/auth'
import { createAdminClient } from '@/lib/supabase/admin'
import { Badge, DataTable, EmptyState, LinkButton, PageHeader, SearchForm } from '@/components/ui'

export const metadata = { title: 'Miembros · ORUM' }

export default async function MiembrosPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>
}) {
  await requireRol('super_admin', 'empleado')
  const { q } = await searchParams
  const busqueda = (q ?? '').trim()

  const admin = createAdminClient()
  let consulta = admin
    .from('miembros')
    .select('id, numero_membresia, nombres, apellidos, cedula')
    .is('deleted_at', null)

  // Quitar caracteres que son estructura del filtro `.or(...)` de PostgREST
  // (comas, paréntesis y comodines) para que una búsqueda con puntuación
  // —p. ej. "Pérez, Juan"— no rompa la consulta.
  const termino = busqueda.replace(/[,()%*\\]/g, ' ').trim()
  if (termino) {
    consulta = consulta.or(
      `numero_membresia.ilike.%${termino}%,cedula.ilike.%${termino}%,nombres.ilike.%${termino}%,apellidos.ilike.%${termino}%`,
    )
  }

  const { data: miembros } = await consulta.order('apellidos').limit(100)

  // Estado de la membresía vigente (activa) por miembro.
  const ids = (miembros ?? []).map((m) => m.id)
  const estadoPorMiembro = new Map<number, string>()
  if (ids.length > 0) {
    const { data: activas } = await admin
      .from('membresias')
      .select('miembro_id, estado')
      .in('miembro_id', ids)
      .eq('estado', 'activa')
    for (const a of activas ?? []) estadoPorMiembro.set(a.miembro_id, a.estado)
  }

  return (
    <div>
      <PageHeader title="Miembros" action={{ href: '/admin/miembros/nuevo', label: '+ Registrar miembro' }} />

      <SearchForm
        name="q"
        placeholder="Buscar por número, cédula o nombre"
        defaultValue={busqueda}
        gap="0.5rem"
        marginBottom="1rem"
      />

      {!miembros || miembros.length === 0 ? (
        <EmptyState>
          {busqueda ? 'No se encontraron miembros con esa búsqueda.' : 'Aún no hay miembros registrados.'}
        </EmptyState>
      ) : (
        <DataTable>
          <thead>
            <tr>
              <th>Número</th>
              <th>Nombre</th>
              <th>Cédula</th>
              <th>Membresía</th>
              <th style={{ textAlign: 'right' }}>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {miembros.map((m) => {
              const vigente = estadoPorMiembro.has(m.id)
              return (
                <tr key={m.id}>
                  <td style={{ fontFamily: 'var(--font-geist-mono, monospace)' }}>{m.numero_membresia}</td>
                  <td>{`${m.nombres} ${m.apellidos}`.trim()}</td>
                  <td className="orum-muted">{m.cedula}</td>
                  <td>
                    <Badge tone={vigente ? 'on' : 'off'}>{vigente ? 'Activa' : 'Sin membresía activa'}</Badge>
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    <LinkButton href={`/admin/miembros/${m.id}`} variant="secondary">
                      Ver ficha
                    </LinkButton>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </DataTable>
      )}
    </div>
  )
}
