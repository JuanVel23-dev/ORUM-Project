import Link from 'next/link'
import { getPerfilActual } from '@/lib/auth'

export default async function AdminInicioPage() {
  // El layout ya garantizó el acceso; aquí solo saludamos con el nombre del rol.
  const perfil = await getPerfilActual()
  const esSuperAdmin = perfil?.rolCodigo === 'super_admin'

  return (
    <div>
      <h1 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '0.5rem' }}>
        Bienvenido al Panel de ORUM
      </h1>
      <p className="orum-muted" style={{ marginBottom: '1.5rem' }}>
        Rol actual: <strong>{perfil?.rolNombre}</strong>
      </p>

      {esSuperAdmin ? (
        <div className="orum-card" style={{ maxWidth: 480 }}>
          <h2 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '0.5rem' }}>
            Gestión de usuarios
          </h2>
          <p className="orum-muted" style={{ marginBottom: '1rem' }}>
            Crea y administra empleados, comercios y otros administradores.
          </p>
          <Link href="/admin/usuarios" className="orum-button">
            Ir a usuarios
          </Link>
        </div>
      ) : (
        <div className="orum-card" style={{ maxWidth: 480 }}>
          <p className="orum-muted">
            Próximamente podrás registrar clientes y vender membresías desde aquí.
          </p>
        </div>
      )}
    </div>
  )
}
