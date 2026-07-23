import Link from 'next/link'
import { requireRol } from '@/lib/auth'
import { createAdminClient } from '@/lib/supabase/admin'

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
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 700 }}>Miembros</h1>
        <Link href="/admin/miembros/nuevo" className="orum-button">+ Registrar miembro</Link>
      </div>

      <form method="get" className="orum-card" style={{ marginBottom: '1rem', display: 'flex', gap: '0.5rem' }}>
        <input name="q" className="orum-input" placeholder="Buscar por número, cédula o nombre" defaultValue={busqueda} />
        <button type="submit" className="orum-button orum-button--secondary">Buscar</button>
      </form>

      {!miembros || miembros.length === 0 ? (
        <div className="orum-card">
          <p className="orum-muted">
            {busqueda ? 'No se encontraron miembros con esa búsqueda.' : 'Aún no hay miembros registrados.'}
          </p>
        </div>
      ) : (
        <div className="orum-card" style={{ overflowX: 'auto', padding: 0 }}>
          <table className="orum-table">
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
                      <span className={`orum-badge ${vigente ? 'orum-badge--on' : 'orum-badge--off'}`}>
                        {vigente ? 'Activa' : 'Sin membresía activa'}
                      </span>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <Link href={`/admin/miembros/${m.id}`} className="orum-button orum-button--secondary">
                        Ver ficha
                      </Link>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
