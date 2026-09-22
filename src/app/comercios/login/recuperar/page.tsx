import type { Metadata } from 'next'
import { PantallaAuth } from '@/components/ui/pantalla-auth'
import { RecuperarComercioForm } from './_components/recuperar-form'

export const metadata: Metadata = { title: 'Recuperar contraseña · ORUM Comercios' }

export default function RecuperarComercioPage() {
  return (
    <PantallaAuth
      titular="Restablece tu contraseña"
      apoyo="Te enviamos un enlace a tu correo para elegir una contraseña nueva."
    >
      <RecuperarComercioForm />
    </PantallaAuth>
  )
}
