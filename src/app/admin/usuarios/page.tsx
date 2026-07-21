import Link from 'next/link'
import { requireRol } from '@/lib/auth'
import { createAdminClient } from '@/lib/supabase/admin'
import { cambiarEstadoAcceso } from './actions'

export const metadata = { title: 'Usuarios · ORUM' }

type Fila = {
  perfilId: string
  nombre: string
  email: string
  rolNombre: string
  rolCodigo: string
  activo: boolean
  tipo: 'empleado' | 'comercio'
}

export default async function UsuariosPage() {
  // Solo el administrador mayor gestiona usuarios.
  await requireRol('super_admin')

  const admin = createAdminClient()

  const [{ data: perfiles }, { data: roles }, { data: empleados }, { data: comercios }, authList] =
    await Promise.all([
      admin.from('perfiles').select('id, rol_id, activo'),
      admin.from('roles').select('id, codigo, nombre'),
      admin.from('empleados').select('perfil_id, nombres, apellidos').is('deleted_at', null),
      admin.from('comercios').select('perfil_id, nombre').is('deleted_at', null),
      admin.auth.admin.listUsers({ page: 1, perPage: 1000 }),
    ])

  const rolPorId = new Map((roles ?? []).map((r) => [r.id, r]))
  const emailPorId = new Map((authList.data?.users ?? []).map((u) => [u.id, u.email ?? '—']))
  const empleadoPorPerfil = new Map((empleados ?? []).map((e) => [e.perfil_id, e]))
  const comercioPorPerfil = new Map((comercios ?? []).map((c) => [c.perfil_id, c]))

  const filas: Fila[] = (perfiles ?? [])
    .map((p): Fila | null => {
      const rol = rolPorId.get(p.rol_id)
      if (!rol) return null

      // En esta fase listamos empleados/administradores y comercios.
      const emp = empleadoPorPerfil.get(p.id)
      const com = comercioPorPerfil.get(p.id)

      if (emp) {
        return {
          perfilId: p.id,
          nombre: `${emp.nombres} ${emp.apellidos}`.trim(),
          email: emailPorId.get(p.id) ?? '—',
          rolNombre: rol.nombre,
          rolCodigo: rol.codigo,
          activo: p.activo,
          tipo: 'empleado',
        }
      }
      if (com) {
        return {
          perfilId: p.id,
          nombre: com.nombre,
          email: emailPorId.get(p.id) ?? '—',
          rolNombre: rol.nombre,
          rolCodigo: rol.codigo,
          activo: p.activo,
          tipo: 'comercio',
        }
      }
      return null
    })
    .filter((f): f is Fila => f !== null)
    .sort((a, b) => a.nombre.localeCompare(b.nombre))

  return (
    <div>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '1.25rem',
        }}
      >
        <h1 style={{ fontSize: '1.5rem', fontWeight: 700 }}>Usuarios</h1>
        <Link href="/admin/usuarios/nuevo" className="orum-button">
          + Crear usuario
        </Link>
      </div>

      {filas.length === 0 ? (
        <div className="orum-card">
          <p className="orum-muted">Aún no hay usuarios registrados. Crea el primero.</p>
        </div>
      ) : (
        <div className="orum-card" style={{ overflowX: 'auto', padding: 0 }}>
          <table className="orum-table">
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
                    <span className={`orum-badge ${f.activo ? 'orum-badge--on' : 'orum-badge--off'}`}>
                      {f.activo ? 'Activo' : 'Inactivo'}
                    </span>
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                      <Link
                        href={`/admin/usuarios/${f.perfilId}/editar`}
                        className="orum-button orum-button--secondary"
                      >
                        Editar
                      </Link>
                      <form action={cambiarEstadoAcceso}>
                        <input type="hidden" name="perfil_id" value={f.perfilId} />
                        <input type="hidden" name="activar" value={f.activo ? 'false' : 'true'} />
                        <button
                          type="submit"
                          className={`orum-button ${f.activo ? 'orum-button--danger' : ''}`}
                        >
                          {f.activo ? 'Desactivar' : 'Activar'}
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
