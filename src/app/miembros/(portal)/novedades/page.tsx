import { requireMiembroVigente } from '@/lib/miembros/requerir-miembro'
import { createClient } from '@/lib/supabase/server'
import { obtenerAnunciosVisibles } from '@/lib/anuncios/consultas'
import { ListaAnuncios } from '@/components/anuncios/lista-anuncios'
import { PageHeader } from '@/components/ui/layout'
import estilos from './novedades.module.css'

export const metadata = { title: 'Novedades · ORUM' }

export default async function NovedadesMiembro() {
  await requireMiembroVigente()

  const supabase = await createClient()
  const anuncios = await obtenerAnunciosVisibles(supabase, 'miembros')

  return (
    <div className={estilos.pagina}>
      <PageHeader
        title="Novedades"
        description="Beneficios nuevos y actualizaciones del club."
      />
      <ListaAnuncios anuncios={anuncios} />
    </div>
  )
}
