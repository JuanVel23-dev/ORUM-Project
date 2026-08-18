import { redirect } from 'next/navigation'
import { getPerfilActual } from '@/lib/auth/auth'
import { PantallaAuth } from '@/components/ui/pantalla-auth'
import { LoginComercioForm } from './_components/login-form'

export const metadata = { title: 'Iniciar sesión · ORUM Comercios' }

const MENSAJES: Record<string, string> = {
  sin_permiso: 'Ese acceso no tiene una cuenta de comercio asociada.',
}

export default async function LoginComercioPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>
}) {
  const perfil = await getPerfilActual()
  if (perfil && perfil.activo && perfil.rolCodigo === 'comercio') {
    redirect('/comercios')
  }

  const { error } = await searchParams
  const mensajeInicial = error ? MENSAJES[error] : undefined

  return (
    <PantallaAuth
      subtitulo="Portal de Comercios"
      pie="¿Problemas para entrar? Escribe al administrador del club."
    >
      <LoginComercioForm mensajeInicial={mensajeInicial} />
    </PantallaAuth>
  )
}
