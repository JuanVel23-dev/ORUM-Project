import { CreditCard, MoreHorizontal, Pencil } from 'lucide-react'
import { requireRol } from '@/lib/auth'
import { createAdminClient } from '@/lib/supabase/admin'
import { AccionEstado } from '@/components/ui/accion-estado'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { DataList, type Column } from '@/components/ui/data-list'
import { EmptyState } from '@/components/ui/feedback'
import { PageHeader } from '@/components/ui/layout'
import { DropdownMenu, MenuItem } from '@/components/ui/menu'
import { cambiarEstadoPlan } from './actions'

export const metadata = { title: 'Planes · ORUM' }

type Plan = {
  id: number
  nombre: string
  descripcion: string | null
  precio: number
  duracion_meses: number
  activo: boolean
}

function formatearPrecio(valor: number): string {
  return valor.toLocaleString('es-CO', {
    style: 'currency',
    currency: 'COP',
    maximumFractionDigits: 0,
  })
}

const COLUMNAS: ReadonlyArray<Column<Plan>> = [
  {
    key: 'nombre',
    header: 'Plan',
    primary: true,
    // Texto plano, sin distintivo de nivel: ORUM vende un único servicio.
    cell: (p) => p.nombre,
  },
  {
    key: 'descripcion',
    header: 'Descripción',
    hideOnMobile: true,
    cell: (p) => p.descripcion ?? '—',
  },
  {
    key: 'precio',
    header: 'Precio',
    numeric: true,
    width: '150px',
    cell: (p) => formatearPrecio(p.precio),
  },
  {
    key: 'duracion',
    header: 'Duración',
    numeric: true,
    width: '120px',
    cell: (p) => `${p.duracion_meses} ${p.duracion_meses === 1 ? 'mes' : 'meses'}`,
  },
  {
    key: 'activo',
    header: 'Estado',
    width: '150px',
    cell: (p) => (
      // Un plan inactivo NO se puede vender: tiene que distinguirse a simple
      // vista de uno disponible.
      <Badge tone={p.activo ? 'success' : 'warning'} size="sm">
        {p.activo ? 'A la venta' : 'No disponible'}
      </Badge>
    ),
  },
]

export default async function PlanesPage() {
  await requireRol('super_admin')

  const admin = createAdminClient()
  const { data: planes } = await admin
    .from('planes_membresia')
    .select('id, nombre, descripcion, precio, duracion_meses, activo')
    .is('deleted_at', null)
    .order('nombre')

  return (
    <>
      <PageHeader
        title="Planes de membresía"
        description="Solo los planes a la venta pueden asignarse a un miembro nuevo o a una renovación."
        actions={
          <Button href="/admin/planes/nuevo" icon={<CreditCard size={16} />}>
            Crear plan
          </Button>
        }
      />

      <DataList
        caption="Planes de membresía"
        items={(planes ?? []) as Plan[]}
        columns={COLUMNAS}
        getKey={(p) => p.id}
        alwaysShowActions
        empty={
          <EmptyState
            title="Aún no hay planes"
            description="Crea el primero: sin un plan a la venta no se pueden registrar membresías."
            actions={
              <Button href="/admin/planes/nuevo" icon={<CreditCard size={16} />}>
                Crear plan
              </Button>
            }
          />
        }
        actions={(p) => (
          <>
            <AccionEstado
              activo={p.activo}
              accion={cambiarEstadoPlan}
              campos={{ id: p.id }}
              etiquetaDesactivar="Retirar"
              etiquetaActivar="Poner a la venta"
            />

            <DropdownMenu
              trigger={
                <Button
                  iconOnly
                  variant="ghost"
                  size="sm"
                  aria-label={`Acciones de ${p.nombre}`}
                >
                  <MoreHorizontal size={16} />
                </Button>
              }
            >
              <MenuItem href={`/admin/planes/${p.id}/editar`} icon={<Pencil size={16} />}>
                Editar plan
              </MenuItem>
            </DropdownMenu>
          </>
        )}
      />
    </>
  )
}
