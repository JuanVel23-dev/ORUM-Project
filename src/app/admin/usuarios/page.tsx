import { requireRol } from '@/lib/auth/auth'
import { createAdminClient } from '@/lib/supabase/admin'
import { cambiarEstadoAcceso } from './actions'
import { Badge, DataTable, EmptyState, LinkButton, PageHeader, Row } from '@/components/ui'

export const metadata = { title: 'Usuarios · ORUM' }

type Fila = {
  perfilId: string
  nombre: string
  email: string
  rolNombre: string
  rolCodigo: string
  activo: boolean
}

export default async function UsuariosPage() {
  // Solo el administrador mayor gestiona usuarios.
  await requireRol('super_admin')

  const admin = createAdminClient()

  const [{ data: perfiles }, { data: roles }, { data: empleados }, authList] = await Promise.all([
    admin.from('perfiles').select('id, rol_id, activo'),
    admin.from('roles').select('id, codigo, nombre'),
    admin.from('empleados').select('perfil_id, nombres, apellidos').is('deleted_at', null),
    admin.auth.admin.listUsers({ page: 1, perPage: 1000 }),
  ])

  const rolPorId = new Map((roles ?? []).map((r) => [r.id, r]))
  const emailPorId = new Map((authList.data?.users ?? []).map((u) => [u.id, u.email ?? '—']))
  const empleadoPorPerfil = new Map((empleados ?? []).map((e) => [e.perfil_id, e]))

  const filas: Fila[] = (perfiles ?? [])
    .map((p): Fila | null => {
      const rol = rolPorId.get(p.rol_id)
      const emp = empleadoPorPerfil.get(p.id)
      if (!rol || !emp) return null

      return {
        perfilId: p.id,
        nombre: `${emp.nombres} ${emp.apellidos}`.trim(),
        email: emailPorId.get(p.id) ?? '—',
        rolNombre: rol.nombre,
        rolCodigo: rol.codigo,
        activo: p.activo,
      }
    })
    .filter((f): f is Fila => f !== null)
    .sort((a, b) => a.nombre.localeCompare(b.nombre))

  return (
    <div>
      <PageHeader title="Usuarios" action={{ href: '/admin/usuarios/nuevo', label: '+ Crear usuario' }} />

      {filas.length === 0 ? (
        <EmptyState>Aún no hay usuarios registrados. Crea el primero.</EmptyState>
      ) : (
        <DataTable>
          <thead>
            <tr>
              <th>Nombre</th>
              <th>Correo</th>
              <th>Rol</th>
              <th>Estado</th>
              <th style={{ textAlign: 'right' }}>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {filas.map((f) => (
              <tr key={f.perfilId}>
                <td>{f.nombre}</td>
                <td className="orum-muted">{f.email}</td>
                <td>{f.rolNombre}</td>
                <td>
                  <Badge tone={f.activo ? 'on' : 'off'}>{f.activo ? 'Activo' : 'Inactivo'}</Badge>
                </td>
                <td>
                  <Row gap="0.5rem" style={{ justifyContent: 'flex-end' }}>
                    <LinkButton href={`/admin/usuarios/${f.perfilId}/editar`} variant="secondary">
                      Editar
                    </LinkButton>
                    <form action={cambiarEstadoAcceso}>
                      <input type="hidden" name="perfil_id" value={f.perfilId} />
                      <input type="hidden" name="activar" value={f.activo ? 'false' : 'true'} />
                      <button type="submit" className={`orum-button ${f.activo ? 'orum-button--danger' : ''}`}>
                        {f.activo ? 'Desactivar' : 'Activar'}
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
