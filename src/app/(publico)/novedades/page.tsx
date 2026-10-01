import type { Metadata } from 'next'
import { obtenerAnunciosPublicos } from '@/lib/publico/datos-publicos'
import { ListaAnuncios } from '@/components/anuncios/lista-anuncios'
import { PageHeader } from '@/components/ui/layout'
import estilos from './novedades.module.css'

export const metadata: Metadata = {
  alternates: { canonical: '/novedades' },
  title: 'Novedades · ORUM',
  description: 'Beneficios nuevos y actualizaciones del club.',
}

export const dynamic = 'force-dynamic'

export default async function NovedadesPublicas() {
  const anuncios = await obtenerAnunciosPublicos()

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
