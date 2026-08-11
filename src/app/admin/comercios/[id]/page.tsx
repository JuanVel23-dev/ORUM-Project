import { notFound } from 'next/navigation'
import { requireRol } from '@/lib/auth/auth'
import { createAdminClient } from '@/lib/supabase/admin'
import { cambiarEstadoComercio, cambiarEstadoAccesoComercio } from '../actions'
import { cambiarEstadoSucursal } from '../sucursales-actions'
import { cambiarEstadoPromocion } from '../promociones-actions'
import { Badge, ComercioLogo, DataTable, EmptyState, LinkButton, PageHeader, Row } from '@/components/ui'

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
      <PageHeader
        title={comercio.nombre}
        action={{ href: `/admin/comercios/${comercio.id}/editar`, label: 'Editar datos', variant: 'secondary' }}
      />

      <div className="orum-card" style={{ marginBottom: '1.25rem' }}>
        <Row gap="1rem" style={{ alignItems: 'flex-start', marginBottom: '0.75rem' }}>
          <ComercioLogo logoUrl={comercio.logo_url} nombre={comercio.nombre} size={72} />
          <div>
            <p><strong>Correo:</strong> {correo}</p>
            <p><strong>Descripción:</strong> {comercio.descripcion ?? '—'}</p>
            <p><strong>Marca:</strong> {marca?.nombre ?? '—'}</p>
            <p><strong>Categoría:</strong> {categoria?.nombre ?? '—'}</p>
          </div>
        </Row>

        <Row gap="1.5rem" style={{ marginTop: '0.75rem', flexWrap: 'wrap' }}>
          <Row gap="0.5rem" style={{ alignItems: 'center' }}>
            <Badge tone={comercio.activo ? 'on' : 'off'}>
              {comercio.activo ? 'Aliado activo' : 'Aliado inactivo'}
            </Badge>
            <form action={cambiarEstadoComercio}>
              <input type="hidden" name="id" value={comercio.id} />
              <input type="hidden" name="activar" value={comercio.activo ? 'false' : 'true'} />
              <button type="submit" className={`orum-button ${comercio.activo ? 'orum-button--danger' : ''}`}>
                {comercio.activo ? 'Desactivar aliado' : 'Activar aliado'}
              </button>
            </form>
          </Row>

          <Row gap="0.5rem" style={{ alignItems: 'center' }}>
            <Badge tone={perfilActivo ? 'on' : 'off'}>
              {perfilActivo ? 'Acceso activo' : 'Acceso desactivado'}
            </Badge>
            <form action={cambiarEstadoAccesoComercio}>
              <input type="hidden" name="id" value={comercio.id} />
              <input type="hidden" name="perfil_id" value={comercio.perfil_id ?? ''} />
              <input type="hidden" name="activar" value={perfilActivo ? 'false' : 'true'} />
              <button type="submit" className={`orum-button ${perfilActivo ? 'orum-button--danger' : ''}`}>
                {perfilActivo ? 'Desactivar acceso' : 'Activar acceso'}
              </button>
            </form>
          </Row>
        </Row>
      </div>

      <PageHeader
        as="h2"
        title="Sucursales"
        action={{ href: `/admin/comercios/${comercio.id}/sucursales/nueva`, label: '+ Nueva sucursal', variant: 'secondary' }}
      />
      {!sucursales || sucursales.length === 0 ? (
        <EmptyState marginBottom="1.25rem">Este comercio aún no tiene sucursales.</EmptyState>
      ) : (
        <DataTable marginBottom="1.25rem">
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
                  <Badge tone={s.activo ? 'on' : 'off'}>{s.activo ? 'Activa' : 'Inactiva'}</Badge>
                </td>
                <td>
                  <Row gap="0.5rem" style={{ justifyContent: 'flex-end' }}>
                    <LinkButton
                      href={`/admin/comercios/${comercio.id}/sucursales/${s.id}/editar`}
                      variant="secondary"
                    >
                      Editar
                    </LinkButton>
                    <form action={cambiarEstadoSucursal}>
                      <input type="hidden" name="id" value={s.id} />
                      <input type="hidden" name="comercio_id" value={comercio.id} />
                      <input type="hidden" name="activar" value={s.activo ? 'false' : 'true'} />
                      <button type="submit" className={`orum-button ${s.activo ? 'orum-button--danger' : ''}`}>
                        {s.activo ? 'Desactivar' : 'Activar'}
                      </button>
                    </form>
                  </Row>
                </td>
              </tr>
            ))}
          </tbody>
        </DataTable>
      )}

      <PageHeader
        as="h2"
        title="Promociones"
        action={{ href: `/admin/comercios/${comercio.id}/promociones/nueva`, label: '+ Nueva promoción', variant: 'secondary' }}
      />
      {!promociones || promociones.length === 0 ? (
        <EmptyState>Este comercio aún no tiene promociones.</EmptyState>
      ) : (
        <DataTable>
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
                  <Badge tone={p.activo ? 'on' : 'off'}>{p.activo ? 'Activa' : 'Inactiva'}</Badge>
                </td>
                <td>
                  <Row gap="0.5rem" style={{ justifyContent: 'flex-end' }}>
                    <LinkButton
                      href={`/admin/comercios/${comercio.id}/promociones/${p.id}/editar`}
                      variant="secondary"
                    >
                      Editar
                    </LinkButton>
                    <form action={cambiarEstadoPromocion}>
                      <input type="hidden" name="id" value={p.id} />
                      <input type="hidden" name="comercio_id" value={comercio.id} />
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
