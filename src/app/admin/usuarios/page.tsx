import { MoreHorizontal, Pencil, UserPlus } from 'lucide-react'
import { requireRol } from '@/lib/auth'
import { createAdminClient } from '@/lib/supabase/admin'
import { AccionEstado } from '@/components/ui/accion-estado'
import { Avatar } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { DataList, type Column } from '@/components/ui/data-list'
import { EmptyState } from '@/components/ui/feedback'
import { PageHeader } from '@/components/ui/layout'
import { DropdownMenu, MenuItem } from '@/components/ui/menu'
import { cambiarEstadoAcceso } from './actions'
import styles from '../miembros/miembros.module.css'

export const metadata = { title: 'Usuarios · ORUM' }

type Fila = {
  perfilId: string
  nombre: string
  email: string
  rolNombre: string
  rolCodigo: string
  activo: boolean
}

const COLUMNAS: ReadonlyArray<Column<Fila>> = [
  {
    key: 'nombre',
    header: 'Usuario',
    primary: true,
    cell: (f) => (
      <span className={styles.celdaNombre}>
        <Avatar nombre={f.nombre} size="sm" decorativo />
        <span className={styles.nombre}>{f.nombre}</span>
      </span>
    ),
  },
  { key: 'email', header: 'Correo', cell: (f) => f.email },
  {
    key: 'rol',
    header: 'Rol',
    width: '180px',
    cell: (f) => (
      // El super_admin se distingue del empleado: es quien puede crear otros
      // administradores y tocar planes y comercios.
      <Badge tone={f.rolCodigo === 'super_admin' ? 'info' : 'neutral'} size="sm">
        {f.rolNombre}
      </Badge>
    ),
  },
  {
    key: 'activo',
    header: 'Acceso',
    width: '120px',
    cell: (f) => (
      <Badge tone={f.activo ? 'success' : 'neutral'} size="sm">
        {f.activo ? 'Activo' : 'Inactivo'}
      </Badge>
    ),
  },
]

export default async function UsuariosPage() {
  // Solo el administrador mayor gestiona usuarios.
  await requireRol('super_admin')

  const admin = createAdminClient()

  const [{ data: perfiles }, { data: roles }, { data: empleados }, authList] =
    await Promise.all([
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
    <>
      <PageHeader
        title="Usuarios"
        description="Empleados y administradores con acceso al panel."
        actions={
          <Button href="/admin/usuarios/nuevo" icon={<UserPlus size={16} />}>
            Crear usuario
          </Button>
        }
      />

      <DataList
        caption="Usuarios del panel"
        items={filas}
        columns={COLUMNAS}
        getKey={(f) => f.perfilId}
        alwaysShowActions
        empty={
          <EmptyState
            title="Aún no hay usuarios"
            description="Crea el primer empleado o administrador del panel."
            actions={
              <Button href="/admin/usuarios/nuevo" icon={<UserPlus size={16} />}>
                Crear usuario
              </Button>
            }
          />
        }
        actions={(f) => (
          <>
            <AccionEstado
              activo={f.activo}
              accion={cambiarEstadoAcceso}
              campos={{ perfil_id: f.perfilId }}
              etiquetaDesactivar="Desactivar"
              etiquetaActivar="Activar"
            />

            <DropdownMenu
              trigger={
                <Button
                  iconOnly
                  variant="ghost"
                  size="sm"
                  aria-label={`Acciones de ${f.nombre}`}
                >
                  <MoreHorizontal size={16} />
                </Button>
              }
            >
              <MenuItem
                href={`/admin/usuarios/${f.perfilId}/editar`}
                icon={<Pencil size={16} />}
              >
                Editar datos
              </MenuItem>
            </DropdownMenu>
          </>
        )}
      />
    </>
  )
}
