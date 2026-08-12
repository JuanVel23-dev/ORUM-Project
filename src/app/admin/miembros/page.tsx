import { CreditCard, MoreHorizontal, Pencil, Search, UserPlus } from 'lucide-react'
import { requireRol } from '@/lib/auth/auth'
import { buscarMiembros, type MiembroEncontrado } from '@/lib/miembros/buscar-miembros'
import { Avatar } from '@/components/ui/avatar'
import { Badge, StatusBadge, VenceEn } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { DataList, type Column } from '@/components/ui/data-list'
import { EmptyState } from '@/components/ui/feedback'
import { Input } from '@/components/ui/input'
import { PageHeader } from '@/components/ui/layout'
import { DropdownMenu, MenuItem, MenuSeparator } from '@/components/ui/menu'
import styles from './miembros.module.css'

export const metadata = { title: 'Miembros · ORUM' }

const COLUMNAS: ReadonlyArray<Column<MiembroEncontrado>> = [
  {
    key: 'nombre',
    header: 'Miembro',
    primary: true,
    cell: (m) => (
      <span className={styles.celdaNombre}>
        {/* Decorativo: el nombre va escrito justo al lado. */}
        <Avatar nombre={m.nombre} size="sm" decorativo />
        <span className={styles.nombre}>{m.nombre}</span>
      </span>
    ),
  },
  {
    key: 'numero',
    header: 'Nº membresía',
    numeric: true,
    width: '150px',
    cell: (m) => m.numeroMembresia,
  },
  {
    key: 'cedula',
    header: 'Cédula',
    numeric: true,
    width: '140px',
    cell: (m) => m.cedula,
  },
  /*
    No hay columna "Plan": ORUM vende un único servicio, así que mostraría el
    mismo valor en todas las filas. Ese ancho se lo queda el estado, que es lo
    que de verdad se escanea en esta pantalla.
  */
  {
    key: 'estado',
    header: 'Estado',
    width: '240px',
    cell: (m) =>
      m.estado ? (
        <span className={styles.celdaEstado}>
          <StatusBadge estado={m.estado} size="sm" />
          <VenceEn estado={m.estado} />
        </span>
      ) : (
        <Badge tone="neutral" size="sm">
          Sin membresía
        </Badge>
      ),
  },
]

export default async function MiembrosPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>
}) {
  await requireRol('super_admin', 'empleado')

  const { q } = await searchParams
  const busqueda = (q ?? '').trim()

  // Misma función que usa la paleta de comandos: una sola definición de qué
  // significa buscar un miembro, y el estado ya viene DERIVADO de
  // `estado` + `fecha_fin`, no leído en crudo de la columna.
  const miembros = await buscarMiembros(busqueda)

  const activos = miembros.filter((m) => m.estado?.activa).length

  return (
    <>
      <PageHeader
        title="Miembros"
        description="Busca por número de membresía, cédula o nombre. El estado que ves ya tiene en cuenta la fecha de vencimiento."
        actions={
          <Button href="/admin/miembros/nuevo" icon={<UserPlus size={16} />}>
            Registrar miembro
          </Button>
        }
      />

      {/*
        Formulario GET: la búsqueda queda en la URL, así que se puede compartir
        y sobrevive a un refresco. Funciona sin JavaScript.
      */}
      <form method="get" className={styles.buscador}>
        <div className={styles.campo}>
          <Input
            name="q"
            defaultValue={busqueda}
            placeholder="Número, cédula o nombre"
            aria-label="Buscar miembros"
            startIcon={<Search size={16} />}
            autoComplete="off"
          />
        </div>

        <Button type="submit" variant="secondary">
          Buscar
        </Button>

        {busqueda && (
          <Button href="/admin/miembros" variant="ghost">
            Limpiar
          </Button>
        )}
      </form>

      {miembros.length > 0 && (
        <p className={styles.resumen}>
          {miembros.length} {miembros.length === 1 ? 'miembro' : 'miembros'}
          {busqueda && ` para «${busqueda}»`} · {activos}{' '}
          {activos === 1 ? 'con membresía vigente' : 'con membresía vigente'}
        </p>
      )}

      <DataList
        caption="Miembros del club"
        items={miembros}
        columns={COLUMNAS}
        getKey={(m) => m.id}
        rowHref={(m) => `/admin/miembros/${m.id}`}
        empty={
          busqueda ? (
            <EmptyState
              title="Sin resultados"
              description={`Ningún miembro coincide con «${busqueda}». Prueba con el número de membresía o la cédula.`}
              actions={
                <Button href="/admin/miembros" variant="secondary">
                  Ver todos
                </Button>
              }
            />
          ) : (
            <EmptyState
              title="Aún no hay miembros"
              description="Registra el primer cliente y véndele su membresía."
              actions={
                <Button href="/admin/miembros/nuevo" icon={<UserPlus size={16} />}>
                  Registrar miembro
                </Button>
              }
            />
          )
        }
        actions={(m) => (
          <DropdownMenu
            trigger={
              <Button
                iconOnly
                variant="ghost"
                size="sm"
                aria-label={`Acciones de ${m.nombre}`}
              >
                <MoreHorizontal size={16} />
              </Button>
            }
          >
            <MenuItem href={`/admin/miembros/${m.id}/editar`} icon={<Pencil size={16} />}>
              Editar datos
            </MenuItem>
            <MenuSeparator />
            <MenuItem
              href={`/admin/miembros/${m.id}/renovar`}
              icon={<CreditCard size={16} />}
            >
              Renovar membresía
            </MenuItem>
          </DropdownMenu>
        )}
      />
    </>
  )
}
