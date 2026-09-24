// src/app/admin/anuncios/page.tsx
import { Megaphone, MoreHorizontal, Pencil } from 'lucide-react'
import { requireRol } from '@/lib/auth/auth'
import { createAdminClient } from '@/lib/supabase/admin'
import { etiquetaAlcance } from '@/lib/anuncios/alcance'
import { formatearFechaNovedad } from '@/lib/anuncios/fecha'
import { AccionEstado } from '@/components/ui/accion-estado'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { DataList, type Column } from '@/components/ui/data-list'
import { EmptyState } from '@/components/ui/feedback'
import { PageHeader } from '@/components/ui/layout'
import { DropdownMenu, MenuItem } from '@/components/ui/menu'
import { cambiarEstadoAnuncio } from './actions'

export const metadata = { title: 'Novedades · ORUM' }

type Anuncio = {
  id: number
  titulo: string
  mostrar_publico: boolean
  mostrar_miembros: boolean
  activo: boolean
  created_at: string
}

const COLUMNAS: ReadonlyArray<Column<Anuncio>> = [
  {
    key: 'titulo',
    header: 'Título',
    primary: true,
    cell: (a) => a.titulo,
  },
  {
    key: 'alcance',
    header: 'Alcance',
    hideOnMobile: true,
    cell: (a) => (
      <Badge tone="info" size="sm">
        {etiquetaAlcance(a.mostrar_publico, a.mostrar_miembros)}
      </Badge>
    ),
  },
  {
    key: 'activo',
    header: 'Estado',
    width: '150px',
    cell: (a) => (
      <Badge tone={a.activo ? 'success' : 'warning'} size="sm">
        {a.activo ? 'Publicada' : 'Retirada'}
      </Badge>
    ),
  },
  {
    key: 'creado',
    header: 'Creada',
    hideOnMobile: true,
    cell: (a) => formatearFechaNovedad(a.created_at),
  },
]

export default async function AnunciosPage() {
  await requireRol('super_admin')

  const admin = createAdminClient()
  const { data: anuncios } = await admin
    .from('anuncios')
    .select('id, titulo, mostrar_publico, mostrar_miembros, activo, created_at')
    .is('deleted_at', null)
    .order('created_at', { ascending: false })

  return (
    <>
      <PageHeader
        title="Novedades"
        description="Lo que el admin publica se ve en el Portal Público y/o el de Miembros, según el alcance de cada una."
        actions={
          <Button href="/admin/anuncios/nuevo" icon={<Megaphone size={16} />}>
            Nueva novedad
          </Button>
        }
      />

      <DataList
        caption="Novedades"
        items={(anuncios ?? []) as Anuncio[]}
        columns={COLUMNAS}
        getKey={(a) => a.id}
        alwaysShowActions
        empty={
          <EmptyState
            title="Aún no hay novedades"
            description="Publica la primera para anunciar un beneficio nuevo o una actualización del club."
            actions={
              <Button href="/admin/anuncios/nuevo" icon={<Megaphone size={16} />}>
                Nueva novedad
              </Button>
            }
          />
        }
        actions={(a) => (
          <>
            <AccionEstado
              activo={a.activo}
              accion={cambiarEstadoAnuncio}
              campos={{ id: a.id }}
              etiquetaDesactivar="Retirar"
              etiquetaActivar="Publicar"
            />

            <DropdownMenu
              trigger={
                <Button
                  iconOnly
                  variant="ghost"
                  size="sm"
                  aria-label={`Acciones de ${a.titulo}`}
                >
                  <MoreHorizontal size={16} />
                </Button>
              }
            >
              <MenuItem href={`/admin/anuncios/${a.id}/editar`} icon={<Pencil size={16} />}>
                Editar novedad
              </MenuItem>
            </DropdownMenu>
          </>
        )}
      />
    </>
  )
}
