import { notFound } from 'next/navigation'
import { OverlayRuta } from '@/components/shell/overlay-ruta'
import { MiFoto } from '@/app/miembros/(portal)/perfil/foto/_components/mi-foto'
import { cargarMiFoto } from '@/app/miembros/(portal)/perfil/foto/_components/datos'

/**
 * Gemela interceptada, colgada de la ranura `@modal` del portal.
 *
 * `medium`: el formulario es una sola fila y conviene seguir viendo el carnet
 * de detrás mientras se elige la foto — es literalmente el objeto que va a
 * cambiar.
 */
export default async function MiFotoInterceptada() {
  const datos = await cargarMiFoto()
  if (!datos) notFound()

  return (
    <OverlayRuta title="Mi foto" description="La que aparece en tu carnet." width="520px" detent="medium">
      <MiFoto nombre={datos.nombre} fotoUrl={datos.fotoUrl} />
    </OverlayRuta>
  )
}
