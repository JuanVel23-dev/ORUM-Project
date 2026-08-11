import { redirect } from 'next/navigation'
import { getPerfilActual } from '@/lib/auth/auth'
import { PantallaAuth } from '@/components/ui/pantalla-auth'
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
  if (
    perfil &&
    perfil.activo &&
    (perfil.rolCodigo === 'super_admin' || perfil.rolCodigo === 'empleado')
  ) {
    redirect('/admin')
  }

  const { error } = await searchParams
  const mensajeInicial = error ? MENSAJES[error] : undefined

  return (
    <PantallaAuth
      subtitulo="Portal de Administración"
      pie="¿Problemas para entrar? Contacta al administrador del club."
    >
      <LoginForm mensajeInicial={mensajeInicial} />
    </PantallaAuth>
  )
}
