import { notFound } from 'next/navigation'
import { MapPin, MoreHorizontal, Pencil, Tag } from 'lucide-react'
import { requireRol } from '@/lib/auth'
import { createAdminClient } from '@/lib/supabase/admin'
import { AccionEstado } from '@/components/ui/accion-estado'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { DataList, type Column } from '@/components/ui/data-list'
import { EmptyState } from '@/components/ui/feedback'
import { PageHeader, Section, Stack } from '@/components/ui/layout'
import { DropdownMenu, MenuItem } from '@/components/ui/menu'
import { cambiarEstadoAccesoComercio, cambiarEstadoComercio } from '../actions'
import { cambiarEstadoSucursal } from '../sucursales-actions'
import { cambiarEstadoPromocion } from '../promociones-actions'
import styles from './ficha.module.css'

export const metadata = { title: 'Ficha de comercio · ORUM' }

type Sucursal = {
  id: number
  nombre: string | null
  direccion: string | null
  telefono: string | null
  activo: boolean
}

type Promocion = {
  id: number
  titulo: string
  valor: number | null
  activo: boolean
  tipo_beneficio_id: number
}

export default async function FichaComercioPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  await requireRol('super_admin')
  const { id } = await params
  const comercioId = Number(id)

  const admin = createAdminClient()
  const { data: comercio } = await admin
    .from('comercios')
    .select('id, perfil_id, nombre, descripcion, marca_id, categoria_id, logo_url, activo')
    .eq('id', comercioId)
    .is('deleted_at', null)
    .maybeSingle()

  if (!comercio) notFound()

  const [
    { data: marca },
    { data: categoria },
    { data: sucursales },
    { data: promociones },
    { data: tipos },
  ] = await Promise.all([
    comercio.marca_id
      ? admin.from('marcas').select('nombre').eq('id', comercio.marca_id).maybeSingle()
      : Promise.resolve({ data: null }),
    comercio.categoria_id
      ? admin
          .from('categorias')
          .select('nombre')
          .eq('id', comercio.categoria_id)
          .maybeSingle()
      : Promise.resolve({ data: null }),
    admin
      .from('sucursales')
      .select('id, nombre, direccion, telefono, activo')
      .eq('comercio_id', comercioId)
      .is('deleted_at', null)
      .order('nombre'),
    admin
      .from('promociones')
      .select('id, titulo, valor, activo, tipo_beneficio_id')
      .eq('comercio_id', comercioId)
      .is('deleted_at', null)
      .order('titulo'),
    admin.from('tipos_beneficio').select('id, nombre'),
  ])

  let correo: string | null = null
  let perfilActivo = false
  if (comercio.perfil_id) {
    const [{ data: authUser }, { data: perfil }] = await Promise.all([
      admin.auth.admin.getUserById(comercio.perfil_id),
      admin.from('perfiles').select('activo').eq('id', comercio.perfil_id).maybeSingle(),
    ])
    correo = authUser.user?.email ?? null
    perfilActivo = perfil?.activo ?? false
  }

  const nombreTipo = new Map((tipos ?? []).map((t) => [t.id, t.nombre]))

  const columnasSucursales: ReadonlyArray<Column<Sucursal>> = [
    {
      key: 'nombre',
      header: 'Sucursal',
      primary: true,
      cell: (s) => s.nombre ?? 'Sin nombre',
    },
    { key: 'direccion', header: 'Dirección', cell: (s) => s.direccion ?? '—' },
    {
      key: 'telefono',
      header: 'Teléfono',
      numeric: true,
      width: '140px',
      cell: (s) => s.telefono ?? '—',
    },
    {
      key: 'activo',
      header: 'Estado',
      width: '120px',
      cell: (s) => (
        <Badge tone={s.activo ? 'success' : 'neutral'} size="sm">
          {s.activo ? 'Activa' : 'Inactiva'}
        </Badge>
      ),
    },
  ]

  const columnasPromociones: ReadonlyArray<Column<Promocion>> = [
    { key: 'titulo', header: 'Promoción', primary: true, cell: (p) => p.titulo },
    {
      key: 'tipo',
      header: 'Tipo',
      width: '160px',
      cell: (p) => nombreTipo.get(p.tipo_beneficio_id) ?? `Tipo #${p.tipo_beneficio_id}`,
    },
    {
      key: 'valor',
      header: 'Valor',
      numeric: true,
      width: '110px',
      cell: (p) => p.valor ?? '—',
    },
    {
      key: 'activo',
      header: 'Estado',
      width: '120px',
      cell: (p) => (
        <Badge tone={p.activo ? 'success' : 'neutral'} size="sm">
          {p.activo ? 'Activa' : 'Inactiva'}
        </Badge>
      ),
    },
  ]

  return (
    <>
      <PageHeader
        title={comercio.nombre}
        description={comercio.descripcion ?? undefined}
        actions={
          <Button
            href={`/admin/comercios/${comercio.id}/editar`}
            variant="secondary"
            icon={<Pencil size={16} />}
          >
            Editar datos
          </Button>
        }
      />

      <Stack gap={7}>
        <Card padding="lg">
          <div className={styles.datos}>
            <Dato etiqueta="Correo" valor={correo} />
            <Dato etiqueta="Marca" valor={marca?.nombre ?? null} />
            <Dato etiqueta="Categoría" valor={categoria?.nombre ?? null} />
          </div>
        </Card>

        <Section title="Estado del aliado">
          <div className={styles.interruptores}>
            <div className={styles.interruptor}>
              <div className={styles.interruptorCabecera}>
                <span className={styles.interruptorTitulo}>Aliado del club</span>
                <Badge tone={comercio.activo ? 'success' : 'neutral'} size="sm">
                  {comercio.activo ? 'Activo' : 'Inactivo'}
                </Badge>
              </div>

              <p className={styles.interruptorNota}>
                Determina si el comercio y sus promociones aparecen para los miembros.
              </p>

              <form action={cambiarEstadoComercio}>
                <input type="hidden" name="id" value={comercio.id} />
                <input
                  type="hidden"
                  name="activar"
                  value={comercio.activo ? 'false' : 'true'}
                />
                <Button
                  type="submit"
                  size="sm"
                  variant={comercio.activo ? 'danger' : 'primary'}
                >
                  {comercio.activo ? 'Retirar del club' : 'Activar como aliado'}
                </Button>
              </form>
            </div>

            <div className={styles.interruptor}>
              <div className={styles.interruptorCabecera}>
                <span className={styles.interruptorTitulo}>Acceso a su cuenta</span>
                <Badge tone={perfilActivo ? 'success' : 'neutral'} size="sm">
                  {perfilActivo ? 'Activo' : 'Desactivado'}
                </Badge>
              </div>

              <p className={styles.interruptorNota}>
                Determina si el comercio puede iniciar sesión en su herramienta para
                registrar ventas. Es independiente de seguir siendo aliado.
              </p>

              <form action={cambiarEstadoAccesoComercio}>
                <input type="hidden" name="id" value={comercio.id} />
                <input type="hidden" name="perfil_id" value={comercio.perfil_id ?? ''} />
                <input
                  type="hidden"
                  name="activar"
                  value={perfilActivo ? 'false' : 'true'}
                />
                <Button
                  type="submit"
                  size="sm"
                  variant={perfilActivo ? 'danger' : 'primary'}
                  disabled={!comercio.perfil_id}
                >
                  {perfilActivo ? 'Desactivar acceso' : 'Activar acceso'}
                </Button>
              </form>
            </div>
          </div>
        </Section>

        <Section
          title="Sucursales"
          actions={
            <Button
              href={`/admin/comercios/${comercio.id}/sucursales/nueva`}
              variant="secondary"
              size="sm"
              icon={<MapPin size={15} />}
            >
              Nueva sucursal
            </Button>
          }
        >
          <DataList
            caption={`Sucursales de ${comercio.nombre}`}
            items={(sucursales ?? []) as Sucursal[]}
            columns={columnasSucursales}
            getKey={(s) => s.id}
            // Activar/desactivar es la acción principal de estas filas: no debe
            // esconderse hasta que el ratón pase por encima.
            alwaysShowActions
            empty={
              <EmptyState
                title="Sin sucursales"
                description="Añade al menos una sucursal para que los miembros sepan dónde usar el beneficio."
                actions={
                  <Button
                    href={`/admin/comercios/${comercio.id}/sucursales/nueva`}
                    icon={<MapPin size={16} />}
                  >
                    Nueva sucursal
                  </Button>
                }
              />
            }
            actions={(s) => (
              <>
                {/*
                  El cambio de estado es una MUTACIÓN, así que va en su propio
                  formulario con la server action. No cabe dentro del menú:
                  un `MenuItem` es un botón y no puede enviar otro formulario.
                */}
                <AccionEstado
                  activo={s.activo}
                  accion={cambiarEstadoSucursal}
                  campos={{ id: s.id, comercio_id: comercio.id }}
                  etiquetaDesactivar="Desactivar"
                  etiquetaActivar="Activar"
                />

                <DropdownMenu
                  trigger={
                    <Button
                      iconOnly
                      variant="ghost"
                      size="sm"
                      aria-label={`Acciones de ${s.nombre ?? 'la sucursal'}`}
                    >
                      <MoreHorizontal size={16} />
                    </Button>
                  }
                >
                  <MenuItem
                    href={`/admin/comercios/${comercio.id}/sucursales/${s.id}/editar`}
                    icon={<Pencil size={16} />}
                  >
                    Editar
                  </MenuItem>
                </DropdownMenu>
              </>
            )}
          />
        </Section>

        <Section
          title="Promociones"
          actions={
            <Button
              href={`/admin/comercios/${comercio.id}/promociones/nueva`}
              variant="secondary"
              size="sm"
              icon={<Tag size={15} />}
            >
              Nueva promoción
            </Button>
          }
        >
          <DataList
            caption={`Promociones de ${comercio.nombre}`}
            items={(promociones ?? []) as Promocion[]}
            columns={columnasPromociones}
            getKey={(p) => p.id}
            alwaysShowActions
            empty={
              <EmptyState
                title="Sin promociones"
                description="Las promociones son el beneficio que ve el miembro. Crea la primera."
                actions={
                  <Button
                    href={`/admin/comercios/${comercio.id}/promociones/nueva`}
                    icon={<Tag size={16} />}
                  >
                    Nueva promoción
                  </Button>
                }
              />
            }
            actions={(p) => (
              <>
                <AccionEstado
                  activo={p.activo}
                  accion={cambiarEstadoPromocion}
                  campos={{ id: p.id, comercio_id: comercio.id }}
                  etiquetaDesactivar="Desactivar"
                  etiquetaActivar="Activar"
                />

                <DropdownMenu
                  trigger={
                    <Button
                      iconOnly
                      variant="ghost"
                      size="sm"
                      aria-label={`Acciones de ${p.titulo}`}
                    >
                      <MoreHorizontal size={16} />
                    </Button>
                  }
                >
                  <MenuItem
                    href={`/admin/comercios/${comercio.id}/promociones/${p.id}/editar`}
                    icon={<Pencil size={16} />}
                  >
                    Editar
                  </MenuItem>
                </DropdownMenu>
              </>
            )}
          />
        </Section>
      </Stack>
    </>
  )
}

function Dato({ etiqueta, valor }: { etiqueta: string; valor: string | null }) {
  return (
    <div className={styles.dato}>
      <span className={styles.datoEtiqueta}>{etiqueta}</span>
      <span
        className={[styles.datoValor, !valor && styles.datoVacio].filter(Boolean).join(' ')}
      >
        {valor ?? 'Sin registrar'}
      </span>
    </div>
  )
}
