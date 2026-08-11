import { MoreHorizontal, Pencil, Search, Store } from 'lucide-react'
import { requireRol } from '@/lib/auth/auth'
import { createAdminClient } from '@/lib/supabase/admin'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { DataList, type Column } from '@/components/ui/data-list'
import { EmptyState } from '@/components/ui/feedback'
import { Input } from '@/components/ui/input'
import { PageHeader } from '@/components/ui/layout'
import { DropdownMenu, MenuItem } from '@/components/ui/menu'
import styles from '../miembros/miembros.module.css'

export const metadata = { title: 'Comercios · ORUM' }

type ComercioFila = {
  id: number
  nombre: string
  descripcion: string | null
  activo: boolean
}

const COLUMNAS: ReadonlyArray<Column<ComercioFila>> = [
  {
    key: 'nombre',
    header: 'Comercio',
    primary: true,
    cell: (c) => c.nombre,
  },
  {
    key: 'descripcion',
    header: 'Descripción',
    hideOnMobile: true,
    cell: (c) => c.descripcion ?? '—',
  },
  {
    key: 'activo',
    header: 'Aliado',
    width: '140px',
    cell: (c) => (
      // `comercios.activo` responde a "¿sigue siendo aliado del club?", que es
      // distinto de si su cuenta puede iniciar sesión (`perfiles.activo`).
      // Los dos estados se muestran por separado en la ficha.
      <Badge tone={c.activo ? 'success' : 'neutral'} size="sm">
        {c.activo ? 'Activo' : 'Inactivo'}
      </Badge>
    ),
  },
]

export default async function ComerciosPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>
}) {
  await requireRol('super_admin')

  const { q } = await searchParams
  const busqueda = (q ?? '').trim()

  const admin = createAdminClient()
  let query = admin
    .from('comercios')
    .select('id, nombre, descripcion, activo, logo_url')
    .is('deleted_at', null)
    .order('nombre')

  if (busqueda) query = query.ilike('nombre', `%${busqueda}%`)

  const { data: comercios } = await query

  return (
    <>
      <PageHeader
        title="Comercios aliados"
        description="La red de comercios donde los miembros usan sus beneficios."
        actions={
          <Button href="/admin/comercios/nuevo" icon={<Store size={16} />}>
            Crear comercio
          </Button>
        }
      />

      <form method="get" className={styles.buscador}>
        <div className={styles.campo}>
          <Input
            name="q"
            defaultValue={busqueda}
            placeholder="Buscar por nombre"
            aria-label="Buscar comercios"
            startIcon={<Search size={16} />}
            autoComplete="off"
          />
        </div>

        <Button type="submit" variant="secondary">
          Buscar
        </Button>

        {busqueda && (
          <Button href="/admin/comercios" variant="ghost">
            Limpiar
          </Button>
        )}
      </form>

      <DataList
        caption="Comercios aliados"
        items={comercios ?? []}
        columns={COLUMNAS}
        getKey={(c) => c.id}
        rowHref={(c) => `/admin/comercios/${c.id}`}
        empty={
          busqueda ? (
            <EmptyState
              title="Sin resultados"
              description={`Ningún comercio coincide con «${busqueda}».`}
              actions={
                <Button href="/admin/comercios" variant="secondary">
                  Ver todos
                </Button>
              }
            />
          ) : (
            <EmptyState
              title="Aún no hay comercios"
              description="Crea el primer comercio aliado para empezar a cargar sus promociones."
              actions={
                <Button href="/admin/comercios/nuevo" icon={<Store size={16} />}>
                  Crear comercio
                </Button>
              }
            />
          )
        }
        actions={(c) => (
          <DropdownMenu
            trigger={
              <Button
                iconOnly
                variant="ghost"
                size="sm"
                aria-label={`Acciones de ${c.nombre}`}
              >
                <MoreHorizontal size={16} />
              </Button>
            }
          >
            <MenuItem href={`/admin/comercios/${c.id}/editar`} icon={<Pencil size={16} />}>
              Editar datos
            </MenuItem>
          </DropdownMenu>
        )}
      />
    </>
  )
}
