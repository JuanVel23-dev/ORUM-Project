import type { Metadata } from 'next'
import { PantallaAccesoSocio } from '@/components/ui/pantalla-acceso-socio'
import { RecuperarMiembroForm } from './_components/recuperar-form'

export const metadata: Metadata = { title: 'Recuperar contraseña · ORUM Miembros' }

export default function RecuperarMiembroPage() {
  return (
    <PantallaAccesoSocio
      titular="Restablece tu contraseña"
      apoyo="Te enviamos un enlace a tu correo para elegir una contraseña nueva."
    >
      <RecuperarMiembroForm />
    </PantallaAccesoSocio>
  )
}
