import { redirect } from 'next/navigation'
import { getPerfilActual } from '@/lib/auth/auth'
import { PantallaAcceso } from '@/components/ui/pantalla-acceso'
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
    <PantallaAcceso
      puerta="socio"
      titular="Portal de Miembros"
      apoyo="Entra con tu número de membresía."
      pie="¿No recuerdas tu número de membresía? Está en tu carnet o pídelo en el punto donde te inscribiste."
    >
      <LoginMiembroForm mensajeInicial={mensajeInicial} />
    </PantallaAcceso>
  )
}
