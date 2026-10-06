import type { Metadata } from 'next'
import { PantallaAcceso } from '@/components/ui/pantalla-acceso'
import { RecuperarMiembroForm } from './_components/recuperar-form'

export const metadata: Metadata = { title: 'Recuperar contraseña · ORUM Miembros' }

export default function RecuperarMiembroPage() {
  return (
    <PantallaAcceso
      puerta="recuperar"
      titular="Restablece tu contraseña"
      apoyo="Te enviamos un enlace a tu correo para elegir una contraseña nueva."
    >
      <RecuperarMiembroForm />
    </PantallaAcceso>
  )
}
