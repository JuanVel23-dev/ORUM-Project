import { requireRol } from '@/lib/auth/auth'
import { createAdminClient } from '@/lib/supabase/admin'
import { Badge, ComercioLogo, DataTable, EmptyState, LinkButton, PageHeader, SearchForm } from '@/components/ui'

export const metadata = { title: 'Comercios · ORUM' }

export default async function ComerciosPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>
}) {
  await requireRol('super_admin')
  const { q } = await searchParams
  const busqueda = (q ?? '').trim()

  const admin = createAdminClient()
  let query = admin
    .from('comercios')
    .select('id, nombre, descripcion, activo, logo_url')
    .is('deleted_at', null)
    .order('nombre')
  if (busqueda) query = query.ilike('nombre', `%${busqueda}%`)
  const { data: comercios } = await query

  return (
    <div>
      <PageHeader title="Comercios" action={{ href: '/admin/comercios/nuevo', label: '+ Crear comercio' }} />

      <SearchForm name="q" placeholder="Buscar por nombre…" defaultValue={busqueda} />

      {!comercios || comercios.length === 0 ? (
        <EmptyState>
          {busqueda ? 'Ningún comercio coincide con la búsqueda.' : 'Aún no hay comercios. Crea el primero.'}
        </EmptyState>
      ) : (
        <DataTable>
          <thead>
            <tr>
              <th>Logo</th>
              <th>Nombre</th>
              <th>Descripción</th>
              <th>Estado</th>
              <th style={{ textAlign: 'right' }}>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {comercios.map((c) => (
              <tr key={c.id}>
                <td>
                  <ComercioLogo logoUrl={c.logo_url} nombre={c.nombre} size={32} />
                </td>
                <td>{c.nombre}</td>
                <td className="orum-muted">{c.descripcion ?? '—'}</td>
                <td>
                  <Badge tone={c.activo ? 'on' : 'off'}>{c.activo ? 'Activo' : 'Inactivo'}</Badge>
                </td>
                <td style={{ textAlign: 'right' }}>
                  <LinkButton href={`/admin/comercios/${c.id}`} variant="secondary">
                    Ver ficha
                  </LinkButton>
                </td>
              </tr>
            ))}
          </tbody>
        </DataTable>
      )}
    </div>
  )
}
