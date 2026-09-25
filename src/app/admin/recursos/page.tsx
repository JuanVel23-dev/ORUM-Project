import { requireRol } from '@/lib/auth/auth'
import { Alert } from '@/components/ui/alert'
import { FormCard } from '@/components/ui/form-card'
import { PageHeader } from '@/components/ui/layout'
import { GestorRecursos } from './_components/gestor-recursos'
import { cargarRecursosSitio } from './_components/datos'

export const metadata = { title: 'Recursos del sitio · ORUM' }

/**
 * RECURSOS DEL SITIO — la biblioteca de imágenes de la página pública.
 *
 * Es una pantalla completa y no un overlay, y eso no contradice la regla de
 * «un formulario no navega»: lo que se abre por encima son los formularios que
 * se alcanzan DESDE una lista —crear un miembro, editar un comercio—, que se
 * hacen y se cierran. Esto es un sitio donde se trabaja: se mira lo que hay
 * alojado, se reordena, se enciende y se apaga. Por eso tiene su entrada en la
 * barra lateral, igual que «Planes», y por eso los formularios de subida viven
 * dentro de la pantalla, igual que en las imágenes de un comercio.
 *
 * `force-dynamic` porque las acciones revalidan `/admin/recursos` y `/`: sin
 * él, el administrador sube un cartel, vuelve, y ve la lista de antes.
 */
export const dynamic = 'force-dynamic'

export default async function RecursosSitioPage() {
  await requireRol('super_admin')

  const { recursos, migracionPendiente } = await cargarRecursosSitio()

  return (
    <>
      <PageHeader
        title="Recursos del sitio"
        description="Las imágenes de la página pública: la portada, los carteles de promociones y los logotipos del club."
      />

      <FormCard>
        {/*
          El aviso de migración pendiente NO es paranoia de más. El esquema de
          este proyecto se aplica A MANO desde el panel de Supabase, y sin él
          la pantalla se vería exactamente igual que una biblioteca vacía: el
          administrador subiría un archivo, vería un error críptico y no
          tendría forma de saber que lo que falta es una migración.
        */}
        {migracionPendiente && (
          <Alert tone="danger" title="Falta aplicar un cambio en la base de datos">
            Esta pantalla necesita la tabla <code>recursos_sitio</code>, que todavía
            no existe. Corre{' '}
            <code>supabase/migrations/20260925090000_recursos_sitio.sql</code> en el
            editor SQL de Supabase y vuelve a cargar. Hasta entonces no se puede
            subir nada.
          </Alert>
        )}

        <GestorRecursos recursos={recursos} />
      </FormCard>
    </>
  )
}
