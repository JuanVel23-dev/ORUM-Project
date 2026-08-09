import { redirect } from 'next/navigation'
import { getPerfilActual } from '@/lib/auth/auth'
import { LoginMiembroForm } from './_components/login-form'

export const metadata = { title: 'Iniciar sesión · ORUM Miembros' }

const MENSAJES: Record<string, string> = {
  sin_permiso: 'Ese acceso no tiene una cuenta de miembro asociada.',
}

export default async function LoginMiembroPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>
}) {
  const perfil = await getPerfilActual()
  if (perfil && perfil.activo && perfil.rolCodigo === 'miembro') {
    redirect('/miembros')
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
            Portal de Miembros
          </p>
        </div>
        <LoginMiembroForm mensajeInicial={mensajeInicial} />
      </div>
    </main>
  )
}
