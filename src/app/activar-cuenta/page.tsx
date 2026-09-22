import { Suspense } from 'react'
import { PantallaAuth } from '@/components/ui/pantalla-auth'
import { textosActivacion } from '@/lib/auth/activacion'
import { ActivarForm } from './_components/activar-form'

export default async function ActivarCuentaPage({
  searchParams,
}: {
  searchParams: Promise<{ modo?: string }>
}) {
  const { modo } = await searchParams

  return (
    <PantallaAuth
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
    </PantallaAuth>
  )
}
