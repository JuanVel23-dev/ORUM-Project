import { requireMiembroVigente } from '@/lib/miembros/requerir-miembro'
import { TituloSeccion } from '@/components/ui/titulo-seccion'
import { createClient } from '@/lib/supabase/server'
import { obtenerAnunciosVisibles } from '@/lib/anuncios/consultas'
import { ListaAnuncios } from '@/components/anuncios/lista-anuncios'
import estilos from './novedades.module.css'

export const metadata = { title: 'Novedades · ORUM' }

export default async function NovedadesMiembro() {
  await requireMiembroVigente()

  const supabase = await createClient()
  const anuncios = await obtenerAnunciosVisibles(supabase, 'miembros')

  return (
    <div className={estilos.pagina}>
      {/* El título del Portal Público (29/09/2026), no el `PageHeader` del
          panel: «todos los títulos con el diseño del portal inicial». */}
      <header className={estilos.encabezado}>
        <TituloSeccion como="h1" texto="Novedades del club" />
        <p className={estilos.apoyo}>Beneficios nuevos y actualizaciones del club.</p>
      </header>
      <ListaAnuncios anuncios={anuncios} />
    </div>
  )
}
