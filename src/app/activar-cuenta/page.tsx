import { Suspense } from 'react'
import { PantallaAuth } from '@/components/ui/pantalla-auth'
import { ActivarForm } from './_components/activar-form'

export default function ActivarCuentaPage() {
  return (
    <PantallaAuth titular="Activa tu cuenta" apoyo="Elige una contraseña y entra al club.">
      <Suspense>
        <ActivarForm />
      </Suspense>
    </PantallaAuth>
  )
}
