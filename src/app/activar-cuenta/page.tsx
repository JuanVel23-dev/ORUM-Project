import { Suspense } from 'react'
import { PantallaAuth } from '@/components/ui/pantalla-auth'
import { ActivarForm } from './_components/activar-form'

export default function ActivarCuentaPage() {
  return (
    <PantallaAuth subtitulo="Activa tu cuenta">
      <Suspense>
        <ActivarForm />
      </Suspense>
    </PantallaAuth>
  )
}
