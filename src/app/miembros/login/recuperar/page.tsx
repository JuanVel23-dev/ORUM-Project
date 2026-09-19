import { PantallaAuth } from '@/components/ui/pantalla-auth'
import { RecuperarMiembroForm } from './_components/recuperar-form'

export const metadata = { title: 'Recuperar contraseña · ORUM Miembros' }

export default function RecuperarMiembroPage() {
  return (
    <PantallaAuth subtitulo="Restablece tu contraseña">
      <RecuperarMiembroForm />
    </PantallaAuth>
  )
}
