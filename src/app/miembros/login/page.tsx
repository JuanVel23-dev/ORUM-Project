import { redirect } from 'next/navigation'
import { getPerfilActual } from '@/lib/auth/auth'
import { PantallaAuth } from '@/components/ui/pantalla-auth'
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
    <PantallaAuth
      subtitulo="Portal de Miembros"
      pie="¿No recuerdas tu número de membresía? Está en tu carnet o pídelo en el punto donde te inscribiste."
    >
      <LoginMiembroForm mensajeInicial={mensajeInicial} />
    </PantallaAuth>
  )
}
