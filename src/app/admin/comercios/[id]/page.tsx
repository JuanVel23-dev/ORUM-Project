import Link from 'next/link'
import { notFound } from 'next/navigation'
import { requireRol } from '@/lib/auth'
import { createAdminClient } from '@/lib/supabase/admin'
import { cambiarEstadoComercio, cambiarEstadoAccesoComercio } from '../actions'
import { cambiarEstadoSucursal } from '../sucursales-actions'
import { cambiarEstadoPromocion } from '../promociones-actions'

export const metadata = { title: 'Ficha de comercio · ORUM' }

export default async function FichaComercioPage({ params }: { params: Promise<{ id: string }> }) {
  await requireRol('super_admin')
  const { id } = await params
  const comercioId = Number(id)

  const admin = createAdminClient()
  const { data: comercio } = await admin
    .from('comercios')
    .select('id, perfil_id, nombre, descripcion, marca_id, categoria_id, logo_url, activo')
    .eq('id', comercioId)
    .is('deleted_at', null)
    .maybeSingle()
  if (!comercio) notFound()

  const [{ data: marca }, { data: categoria }, { data: sucursales }, { data: promociones }, { data: tipos }] =
    await Promise.all([
      comercio.marca_id
        ? admin.from('marcas').select('nombre').eq('id', comercio.marca_id).maybeSingle()
        : Promise.resolve({ data: null }),
      comercio.categoria_id
        ? admin.from('categorias').select('nombre').eq('id', comercio.categoria_id).maybeSingle()
        : Promise.resolve({ data: null }),
      admin
        .from('sucursales')
        .select('id, nombre, direccion, telefono, activo')
        .eq('comercio_id', comercioId)
        .is('deleted_at', null)
        .order('nombre'),
      admin
        .from('promociones')
        .select('id, titulo, valor, activo, tipo_beneficio_id')
        .eq('comercio_id', comercioId)
        .is('deleted_at', null)
        .order('titulo'),
      admin.from('tipos_beneficio').select('id, nombre'),
    ])

  let correo = '—'
  let perfilActivo = false
  if (comercio.perfil_id) {
    const [{ data: authUser }, { data: perfil }] = await Promise.all([
      admin.auth.admin.getUserById(comercio.perfil_id),
      admin.from('perfiles').select('activo').eq('id', comercio.perfil_id).maybeSingle(),
    ])
    correo = authUser.user?.email ?? '—'
    perfilActivo = perfil?.activo ?? false
  }

  const nombreTipo = new Map((tipos ?? []).map((t) => [t.id, t.nombre]))

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 700 }}>{comercio.nombre}</h1>
        <Link href={`/admin/comercios/${comercio.id}/editar`} className="orum-button orum-button--secondary">
          Editar datos
        </Link>
      </div>

      <div className="orum-card" style={{ marginBottom: '1.25rem' }}>
        <p><strong>Correo:</strong> {correo}</p>
        <p><strong>Descripción:</strong> {comercio.descripcion ?? '—'}</p>
        <p><strong>Marca:</strong> {marca?.nombre ?? '—'}</p>
        <p><strong>Categoría:</strong> {categoria?.nombre ?? '—'}</p>

        <div style={{ display: 'flex', gap: '1.5rem', marginTop: '0.75rem', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span className={`orum-badge ${comercio.activo ? 'orum-badge--on' : 'orum-badge--off'}`}>
              {comercio.activo ? 'Aliado activo' : 'Aliado inactivo'}
            </span>
            <form action={cambiarEstadoComercio}>
              <input type="hidden" name="id" value={comercio.id} />
              <input type="hidden" name="activar" value={comercio.activo ? 'false' : 'true'} />
              <button type="submit" className={`orum-button ${comercio.activo ? 'orum-button--danger' : ''}`}>
                {comercio.activo ? 'Desactivar aliado' : 'Activar aliado'}
              </button>
            </form>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span className={`orum-badge ${perfilActivo ? 'orum-badge--on' : 'orum-badge--off'}`}>
              {perfilActivo ? 'Acceso activo' : 'Acceso desactivado'}
            </span>
            <form action={cambiarEstadoAccesoComercio}>
              <input type="hidden" name="id" value={comercio.id} />
              <input type="hidden" name="perfil_id" value={comercio.perfil_id ?? ''} />
              <input type="hidden" name="activar" value={perfilActivo ? 'false' : 'true'} />
              <button type="submit" className={`orum-button ${perfilActivo ? 'orum-button--danger' : ''}`}>
                {perfilActivo ? 'Desactivar acceso' : 'Activar acceso'}
              </button>
            </form>
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
        <h2 style={{ fontSize: '1.2rem', fontWeight: 700 }}>Sucursales</h2>
        <Link href={`/admin/comercios/${comercio.id}/sucursales/nueva`} className="orum-button orum-button--secondary">
          + Nueva sucursal
        </Link>
      </div>
      {!sucursales || sucursales.length === 0 ? (
        <div className="orum-card" style={{ marginBottom: '1.25rem' }}>
          <p className="orum-muted">Este comercio aún no tiene sucursales.</p>
        </div>
      ) : (
        <div className="orum-card" style={{ overflowX: 'auto', padding: 0, marginBottom: '1.25rem' }}>
          <table className="orum-table">
            <thead>
              <tr>
                <th>Nombre</th>
                <th>Dirección</th>
                <th>Teléfono</th>
                <th>Estado</th>
                <th style={{ textAlign: 'right' }}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {sucursales.map((s) => (
                <tr key={s.id}>
                  <td>{s.nombre}</td>
                  <td className="orum-muted">{s.direccion ?? '—'}</td>
                  <td className="orum-muted">{s.telefono ?? '—'}</td>
                  <td>
                    <span className={`orum-badge ${s.activo ? 'orum-badge--on' : 'orum-badge--off'}`}>
                      {s.activo ? 'Activa' : 'Inactiva'}
                    </span>
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                      <Link
                        href={`/admin/comercios/${comercio.id}/sucursales/${s.id}/editar`}
                        className="orum-button orum-button--secondary"
                      >
                        Editar
                      </Link>
                      <form action={cambiarEstadoSucursal}>
                        <input type="hidden" name="id" value={s.id} />
                        <input type="hidden" name="comercio_id" value={comercio.id} />
                        <input type="hidden" name="activar" value={s.activo ? 'false' : 'true'} />
                        <button type="submit" className={`orum-button ${s.activo ? 'orum-button--danger' : ''}`}>
                          {s.activo ? 'Desactivar' : 'Activar'}
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

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
        <h2 style={{ fontSize: '1.2rem', fontWeight: 700 }}>Promociones</h2>
        <Link href={`/admin/comercios/${comercio.id}/promociones/nueva`} className="orum-button orum-button--secondary">
          + Nueva promoción
        </Link>
      </div>
      {!promociones || promociones.length === 0 ? (
        <div className="orum-card">
          <p className="orum-muted">Este comercio aún no tiene promociones.</p>
        </div>
      ) : (
        <div className="orum-card" style={{ overflowX: 'auto', padding: 0 }}>
          <table className="orum-table">
            <thead>
              <tr>
                <th>Título</th>
                <th>Tipo</th>
                <th>Valor</th>
                <th>Estado</th>
                <th style={{ textAlign: 'right' }}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {promociones.map((p) => (
                <tr key={p.id}>
                  <td>{p.titulo}</td>
                  <td>{nombreTipo.get(p.tipo_beneficio_id) ?? `Tipo #${p.tipo_beneficio_id}`}</td>
                  <td>{p.valor ?? '—'}</td>
                  <td>
                    <span className={`orum-badge ${p.activo ? 'orum-badge--on' : 'orum-badge--off'}`}>
                      {p.activo ? 'Activa' : 'Inactiva'}
                    </span>
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                      <Link
                        href={`/admin/comercios/${comercio.id}/promociones/${p.id}/editar`}
                        className="orum-button orum-button--secondary"
                      >
                        Editar
                      </Link>
                      <form action={cambiarEstadoPromocion}>
                        <input type="hidden" name="id" value={p.id} />
                        <input type="hidden" name="comercio_id" value={comercio.id} />
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
