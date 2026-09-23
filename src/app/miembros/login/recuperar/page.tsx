import type { Metadata } from 'next'
import { PantallaAuth } from '@/components/ui/pantalla-auth'
import { RecuperarMiembroForm } from './_components/recuperar-form'

export const metadata: Metadata = { title: 'Recuperar contraseña · ORUM Miembros' }

export default function RecuperarMiembroPage() {
  return (
    <PantallaAuth
      titular="Restablece tu contraseña"
      apoyo="Te enviamos un enlace a tu correo para elegir una contraseña nueva."
    >
      <RecuperarMiembroForm />
    </PantallaAuth>
  )
}
