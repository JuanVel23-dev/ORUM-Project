import { redirect } from 'next/navigation'
import { getPerfilActual } from '@/lib/auth'
import { LoginForm } from './login-form'

export const metadata = {
  title: 'Iniciar sesión · ORUM',
}

const MENSAJES: Record<string, string> = {
  sin_permiso: 'Tu cuenta no tiene permiso para acceder a esa sección.',
}

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>
}) {
  // Si ya inició sesión y tiene acceso, no mostramos el login.
  const perfil = await getPerfilActual()
  if (perfil && perfil.activo && (perfil.rolCodigo === 'super_admin' || perfil.rolCodigo === 'empleado')) {
    redirect('/admin')
  }

  const { error } = await searchParams
  const mensajeInicial = error ? MENSAJES[error] : undefined

  return (
    <main
      style={{
        flex: 1,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '2rem 1rem',
      }}
    >
      <div className="orum-card" style={{ width: '100%', maxWidth: 400 }}>
        <div style={{ marginBottom: '1.5rem', textAlign: 'center' }}>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 700 }}>ORUM</h1>
          <p className="orum-muted" style={{ fontSize: '0.9rem', marginTop: '0.25rem' }}>
            Portal de Administración
          </p>
        </div>
        <LoginForm mensajeInicial={mensajeInicial} />
      </div>
    </main>
  )
}
