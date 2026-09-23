import { notFound } from 'next/navigation'
import { PageHeader } from '@/components/ui/layout'
import { FormCard } from '@/components/ui/form-card'
import { MiFoto } from './_components/mi-foto'
import { cargarMiFoto } from './_components/datos'

export const metadata = { title: 'Mi foto · ORUM' }

/**
 * Pantalla completa. Es a donde se llega por enlace directo o al recargar;
 * desde el carnet, la gemela de `@modal` la intercepta y la abre encima, que
 * es lo que pide la regla «un formulario no navega».
 */
export default async function MiFotoPage() {
  const datos = await cargarMiFoto()
  if (!datos) notFound()

  return (
    <>
      <PageHeader title="Mi foto" description="La que aparece en tu carnet." />
      <FormCard>
        <MiFoto nombre={datos.nombre} fotoUrl={datos.fotoUrl} />
      </FormCard>
    </>
  )
}
