import { redirect } from 'next/navigation'
import { getPerfilActual } from '@/lib/auth/auth'
import { PantallaAcceso } from '@/components/ui/pantalla-acceso'
import { obtenerWhatsappSoporte } from '@/lib/publico/datos-publicos'
import { LoginMiembroForm } from './_components/login-form'

export const metadata = { title: 'Iniciar sesión · ORUM Miembros' }

/** Lo que llega escrito al WhatsApp de soporte desde esta puerta. */
const MENSAJE_SOPORTE = 'Hola, necesito ayuda para entrar al Portal de Miembros de ORUM.'

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

  /* El mismo número de soporte del pie del sitio (`configuracion`). Solo
     dígitos en `wa.me`. Sin número configurado, la nota queda sin enlace. */
  const soporte = (await obtenerWhatsappSoporte())?.replace(/\D/g, '')

  return (
    <PantallaAcceso
      puerta="socio"
      titular="Portal de Miembros"
      apoyo="Entra con tu número de membresía."
      pie={
        soporte ? (
          <>
            ¿Necesitas ayuda para entrar?{' '}
            <a
              href={`https://wa.me/${soporte}?text=${encodeURIComponent(MENSAJE_SOPORTE)}`}
              target="_blank"
              rel="noopener noreferrer"
            >
              Escríbenos por WhatsApp
            </a>{' '}
            y te damos soporte.
          </>
        ) : (
          '¿Necesitas ayuda para entrar? Escríbenos por WhatsApp y te damos soporte.'
        )
      }
    >
      <LoginMiembroForm mensajeInicial={mensajeInicial} />
    </PantallaAcceso>
  )
}
