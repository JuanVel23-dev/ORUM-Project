import { Suspense } from 'react'
import { PantallaAcceso } from '@/components/ui/pantalla-acceso'
import { textosActivacion } from '@/lib/auth/activacion'
import { ActivarForm } from './_components/activar-form'

export default async function ActivarCuentaPage({
  searchParams,
}: {
  searchParams: Promise<{ modo?: string }>
}) {
  const { modo } = await searchParams

  return (
    <PantallaAcceso
      puerta={modo === 'recuperar' ? 'recuperar' : 'activar'}
      titular={textosActivacion(modo).subtitulo}
      apoyo={
        modo === 'recuperar'
          ? 'Elige una contraseña nueva para volver a entrar.'
          : 'Elige una contraseña y entra al club.'
      }
    >
      <Suspense>
        <ActivarForm />
      </Suspense>
    </PantallaAcceso>
  )
}
