import { notFound } from 'next/navigation'
import { requireRol } from '@/lib/auth/auth'
import { createAdminClient } from '@/lib/supabase/admin'
import { OverlayRuta } from '@/components/shell/overlay-ruta'
import { AnuncioForm } from '@/app/admin/anuncios/_components/anuncio-form'

export default async function EditarAnuncioInterceptada({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  await requireRol('super_admin')

  const { id } = await params
  const anuncioId = Number(id)
  if (!Number.isInteger(anuncioId) || anuncioId < 1) notFound()

  const admin = createAdminClient()
  const { data: anuncio } = await admin
    .from('anuncios')
    .select('id, titulo, cuerpo, imagen_url, mostrar_publico, mostrar_miembros')
    .eq('id', anuncioId)
    .is('deleted_at', null)
    .maybeSingle()

  if (!anuncio) notFound()

  return (
    <OverlayRuta title="Editar novedad" detent="large" width="640px">
      <AnuncioForm
        anuncio={{
          id: anuncio.id,
          titulo: anuncio.titulo,
          cuerpo: anuncio.cuerpo,
          imagenUrl: anuncio.imagen_url,
          mostrarPublico: anuncio.mostrar_publico,
          mostrarMiembros: anuncio.mostrar_miembros,
        }}
      />
    </OverlayRuta>
  )
}
