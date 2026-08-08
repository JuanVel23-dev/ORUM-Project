import { requireRol } from '@/lib/auth/auth'
import { createAdminClient } from '@/lib/supabase/admin'
import { cambiarEstadoPlan } from './actions'
import { Badge, DataTable, EmptyState, LinkButton, PageHeader, Row } from '@/components/ui'

export const metadata = { title: 'Planes · ORUM' }

export default async function PlanesPage() {
  await requireRol('super_admin')

  const admin = createAdminClient()
  const { data: planes } = await admin
    .from('planes_membresia')
    .select('id, nombre, descripcion, precio, duracion_meses, activo')
    .is('deleted_at', null)
    .order('nombre')

  return (
    <div>
      <PageHeader title="Planes de membresía" action={{ href: '/admin/planes/nuevo', label: '+ Crear plan' }} />

      {!planes || planes.length === 0 ? (
        <EmptyState>Aún no hay planes. Crea el primero para poder vender membresías.</EmptyState>
      ) : (
        <DataTable>
          <thead>
            <tr>
              <th>Nombre</th>
              <th>Precio</th>
              <th>Duración</th>
              <th>Estado</th>
              <th style={{ textAlign: 'right' }}>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {planes.map((p) => (
              <tr key={p.id}>
                <td>{p.nombre}</td>
                <td>${p.precio.toLocaleString('es-CO')}</td>
                <td>{p.duracion_meses} mes(es)</td>
                <td>
                  <Badge tone={p.activo ? 'on' : 'off'}>{p.activo ? 'Activo' : 'Inactivo'}</Badge>
                </td>
                <td>
                  <Row gap="0.5rem" style={{ justifyContent: 'flex-end' }}>
                    <LinkButton href={`/admin/planes/${p.id}/editar`} variant="secondary">
                      Editar
                    </LinkButton>
                    <form action={cambiarEstadoPlan}>
                      <input type="hidden" name="id" value={p.id} />
                      <input type="hidden" name="activar" value={p.activo ? 'false' : 'true'} />
                      <button type="submit" className={`orum-button ${p.activo ? 'orum-button--danger' : ''}`}>
                        {p.activo ? 'Desactivar' : 'Activar'}
                      </button>
                    </form>
                  </Row>
                </td>
              </tr>
            ))}
          </tbody>
        </DataTable>
      )}
    </div>
  )
}
