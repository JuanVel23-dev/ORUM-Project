import type { Metadata } from 'next'
import { createAdminClient } from '@/lib/supabase/admin'
import { obtenerAnunciosVisibles } from '@/lib/anuncios/consultas'
import { ListaAnuncios } from '@/components/anuncios/lista-anuncios'
import { PageHeader } from '@/components/ui/layout'
import estilos from './novedades.module.css'

export const metadata: Metadata = {
  title: 'Novedades · ORUM',
  description: 'Beneficios nuevos y actualizaciones del club.',
}

export const dynamic = 'force-dynamic'

export default async function NovedadesPublicas() {
  const anuncios = await obtenerAnunciosVisibles(createAdminClient(), 'publico')

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
