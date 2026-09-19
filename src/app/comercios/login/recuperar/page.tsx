import type { Metadata } from 'next'
import { PantallaAuth } from '@/components/ui/pantalla-auth'
import { RecuperarComercioForm } from './_components/recuperar-form'

export const metadata: Metadata = { title: 'Recuperar contraseña · ORUM Comercios' }

export default function RecuperarComercioPage() {
  return (
    <PantallaAuth subtitulo="Restablece tu contraseña">
      <RecuperarComercioForm />
    </PantallaAuth>
  )
}
