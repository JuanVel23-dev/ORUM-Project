import { notFound } from 'next/navigation'
import { requireRol } from '@/lib/auth/auth'
import { createAdminClient } from '@/lib/supabase/admin'
import { PageHeader } from '@/components/ui/layout'
import { FormCard } from '@/components/ui/form-card'
import { AnuncioForm } from '../../_components/anuncio-form'

export const metadata = { title: 'Editar novedad · ORUM' }

export default async function EditarAnuncioPage({
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
    <>
      <PageHeader title="Editar novedad" />
      <FormCard>
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
      </FormCard>
    </>
  )
}
