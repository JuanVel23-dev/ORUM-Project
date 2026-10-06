import type { Metadata } from 'next'
import { PantallaAcceso } from '@/components/ui/pantalla-acceso'
import { RecuperarComercioForm } from './_components/recuperar-form'

export const metadata: Metadata = { title: 'Recuperar contraseña · ORUM Comercios' }

export default function RecuperarComercioPage() {
  return (
    <PantallaAcceso
      puerta="recuperar"
      titular="Restablece tu contraseña"
      apoyo="Te enviamos un enlace a tu correo para elegir una contraseña nueva."
    >
      <RecuperarComercioForm />
    </PantallaAcceso>
  )
}
