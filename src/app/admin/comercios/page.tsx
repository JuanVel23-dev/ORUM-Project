import Link from 'next/link'
import { requireRol } from '@/lib/auth'
import { createAdminClient } from '@/lib/supabase/admin'

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
    .select('id, nombre, descripcion, activo')
    .is('deleted_at', null)
    .order('nombre')
  if (busqueda) query = query.ilike('nombre', `%${busqueda}%`)
  const { data: comercios } = await query

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 700 }}>Comercios</h1>
        <Link href="/admin/comercios/nuevo" className="orum-button">+ Crear comercio</Link>
      </div>

      <form method="get" className="orum-card" style={{ marginBottom: '1.25rem', display: 'flex', gap: '0.75rem' }}>
        <input
          type="text"
          name="q"
          className="orum-input"
          placeholder="Buscar por nombre…"
          defaultValue={busqueda}
        />
        <button type="submit" className="orum-button orum-button--secondary">Buscar</button>
      </form>

      {!comercios || comercios.length === 0 ? (
        <div className="orum-card">
          <p className="orum-muted">
            {busqueda ? 'Ningún comercio coincide con la búsqueda.' : 'Aún no hay comercios. Crea el primero.'}
          </p>
        </div>
      ) : (
        <div className="orum-card" style={{ overflowX: 'auto', padding: 0 }}>
          <table className="orum-table">
            <thead>
              <tr>
                <th>Nombre</th>
                <th>Descripción</th>
                <th>Estado</th>
                <th style={{ textAlign: 'right' }}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {comercios.map((c) => (
                <tr key={c.id}>
                  <td>{c.nombre}</td>
                  <td className="orum-muted">{c.descripcion ?? '—'}</td>
                  <td>
                    <span className={`orum-badge ${c.activo ? 'orum-badge--on' : 'orum-badge--off'}`}>
                      {c.activo ? 'Activo' : 'Inactivo'}
                    </span>
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    <Link href={`/admin/comercios/${c.id}`} className="orum-button orum-button--secondary">
                      Ver ficha
                    </Link>
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
