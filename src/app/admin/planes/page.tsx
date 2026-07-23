import Link from 'next/link'
import { requireRol } from '@/lib/auth'
import { createAdminClient } from '@/lib/supabase/admin'
import { cambiarEstadoPlan } from './actions'

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
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 700 }}>Planes de membresía</h1>
        <Link href="/admin/planes/nuevo" className="orum-button">+ Crear plan</Link>
      </div>

      {!planes || planes.length === 0 ? (
        <div className="orum-card">
          <p className="orum-muted">Aún no hay planes. Crea el primero para poder vender membresías.</p>
        </div>
      ) : (
        <div className="orum-card" style={{ overflowX: 'auto', padding: 0 }}>
          <table className="orum-table">
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
                    <span className={`orum-badge ${p.activo ? 'orum-badge--on' : 'orum-badge--off'}`}>
                      {p.activo ? 'Activo' : 'Inactivo'}
                    </span>
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                      <Link href={`/admin/planes/${p.id}/editar`} className="orum-button orum-button--secondary">
                        Editar
                      </Link>
                      <form action={cambiarEstadoPlan}>
                        <input type="hidden" name="id" value={p.id} />
                        <input type="hidden" name="activar" value={p.activo ? 'false' : 'true'} />
                        <button type="submit" className={`orum-button ${p.activo ? 'orum-button--danger' : ''}`}>
                          {p.activo ? 'Desactivar' : 'Activar'}
                        </button>
                      </form>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
