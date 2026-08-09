import { requireMiembroVigente } from '@/lib/miembros/requerir-miembro'
import { createClient } from '@/lib/supabase/server'
import { CardGrid, EmptyState, PageHeader } from '@/components/ui'
import { FiltrosForm } from './_components/filtros-form'
import { ComercioCard, type ComercioListado } from './_components/comercio-card'
import type { TipoBeneficioCodigo } from '@/lib/supabase/database.types'

export const metadata = { title: 'Comercios y beneficios · ORUM' }

export default async function MiembrosHomePage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; comercio_id?: string; marca_id?: string; ciudad_id?: string }>
}) {
  await requireMiembroVigente()

  const { q, comercio_id, marca_id, ciudad_id } = await searchParams
  const busqueda = (q ?? '').trim()
  const comercioIdFiltro = comercio_id ? Number(comercio_id) : null
  const marcaIdFiltro = marca_id ? Number(marca_id) : null
  const ciudadIdFiltro = ciudad_id ? Number(ciudad_id) : null

  const supabase = await createClient()

  const [{ data: todosComercios }, { data: todasMarcas }, { data: todasCiudades }, { data: tipos }] =
    await Promise.all([
      supabase.from('comercios').select('id, nombre').eq('activo', true).is('deleted_at', null).order('nombre'),
      supabase.from('marcas').select('id, nombre').order('nombre'),
      supabase.from('ciudades').select('id, nombre').order('nombre'),
      supabase.from('tipos_beneficio').select('id, codigo'),
    ])

  // Comercios cuyo nombre coincide con la búsqueda.
  let queryPorNombre = supabase
    .from('comercios')
    .select('id, nombre, descripcion, marca_id')
    .eq('activo', true)
    .is('deleted_at', null)
  if (busqueda) queryPorNombre = queryPorNombre.ilike('nombre', `%${busqueda}%`)

  // Comercios con una promoción cuyo título coincide con la búsqueda.
  let idsPorPromocion: number[] = []
  if (busqueda) {
    const { data: promosCoincidentes } = await supabase
      .from('promociones')
      .select('comercio_id')
      .eq('activo', true)
      .is('deleted_at', null)
      .ilike('titulo', `%${busqueda}%`)
    idsPorPromocion = Array.from(new Set((promosCoincidentes ?? []).map((p) => p.comercio_id)))
  }

  type ComercioBase = { id: number; nombre: string; descripcion: string | null; marca_id: number | null }

  const queryPorPromocion =
    idsPorPromocion.length > 0
      ? supabase
          .from('comercios')
          .select('id, nombre, descripcion, marca_id')
          .eq('activo', true)
          .is('deleted_at', null)
          .in('id', idsPorPromocion)
      : Promise.resolve({ data: [] as ComercioBase[] })

  // Comercios con al menos una sucursal en la ciudad filtrada.
  let idsPorCiudad: number[] | null = null
  if (ciudadIdFiltro) {
    const { data: sucursalesEnCiudad } = await supabase
      .from('sucursales')
      .select('comercio_id')
      .eq('ciudad_id', ciudadIdFiltro)
      .eq('activo', true)
      .is('deleted_at', null)
    idsPorCiudad = Array.from(new Set((sucursalesEnCiudad ?? []).map((s) => s.comercio_id)))
  }

  const [{ data: porNombre }, { data: porPromocion }] = await Promise.all([queryPorNombre, queryPorPromocion])
  const baseComercios: ComercioBase[] = busqueda
    ? Array.from(new Map([...(porNombre ?? []), ...(porPromocion ?? [])].map((c) => [c.id, c])).values())
    : (porNombre ?? [])

  const comerciosFiltrados = baseComercios.filter((c) => {
    if (comercioIdFiltro && c.id !== comercioIdFiltro) return false
    if (marcaIdFiltro && c.marca_id !== marcaIdFiltro) return false
    if (idsPorCiudad && !idsPorCiudad.includes(c.id)) return false
    return true
  })

  const comercioIds = comerciosFiltrados.map((c) => c.id)

  type PromocionRow = { id: number; comercio_id: number; titulo: string; valor: number | null; tipo_beneficio_id: number }
  type SucursalRow = { comercio_id: number; ciudad_id: number }

  const [{ data: promociones }, { data: sucursales }] =
    comercioIds.length > 0
      ? await Promise.all([
          supabase
            .from('promociones')
            .select('id, comercio_id, titulo, valor, tipo_beneficio_id')
            .eq('activo', true)
            .is('deleted_at', null)
            .in('comercio_id', comercioIds)
            .order('titulo'),
          supabase
            .from('sucursales')
            .select('comercio_id, ciudad_id')
            .eq('activo', true)
            .is('deleted_at', null)
            .in('comercio_id', comercioIds),
        ])
      : [{ data: [] as PromocionRow[] }, { data: [] as SucursalRow[] }]

  const nombreMarca = new Map((todasMarcas ?? []).map((m) => [m.id, m.nombre]))
  const nombreCiudad = new Map((todasCiudades ?? []).map((c) => [c.id, c.nombre]))
  const codigoTipo = new Map((tipos ?? []).map((t) => [t.id, t.codigo as TipoBeneficioCodigo]))

  const ciudadesPorComercio = new Map<number, Set<string>>()
  for (const s of sucursales ?? []) {
    const nombre = nombreCiudad.get(s.ciudad_id)
    if (!nombre) continue
    if (!ciudadesPorComercio.has(s.comercio_id)) ciudadesPorComercio.set(s.comercio_id, new Set())
    ciudadesPorComercio.get(s.comercio_id)!.add(nombre)
  }

  const promocionesPorComercio = new Map<number, ComercioListado['promociones']>()
  for (const p of promociones ?? []) {
    const tipoCodigo = codigoTipo.get(p.tipo_beneficio_id)
    if (!tipoCodigo) continue
    if (!promocionesPorComercio.has(p.comercio_id)) promocionesPorComercio.set(p.comercio_id, [])
    promocionesPorComercio.get(p.comercio_id)!.push({ id: p.id, titulo: p.titulo, tipoCodigo, valor: p.valor })
  }

  const comerciosListado: ComercioListado[] = comerciosFiltrados.map((c) => ({
    id: c.id,
    nombre: c.nombre,
    descripcion: c.descripcion,
    marcaNombre: c.marca_id ? (nombreMarca.get(c.marca_id) ?? null) : null,
    ciudades: Array.from(ciudadesPorComercio.get(c.id) ?? []),
    promociones: promocionesPorComercio.get(c.id) ?? [],
  }))

  return (
    <div>
      <PageHeader title="Comercios y beneficios" />

      <FiltrosForm
        q={busqueda}
        comercioId={comercio_id ?? ''}
        marcaId={marca_id ?? ''}
        ciudadId={ciudad_id ?? ''}
        comercios={todosComercios ?? []}
        marcas={todasMarcas ?? []}
        ciudades={todasCiudades ?? []}
      />

      {comerciosListado.length === 0 ? (
        <EmptyState>Ningún comercio coincide con la búsqueda o los filtros.</EmptyState>
      ) : (
        <CardGrid>
          {comerciosListado.map((c) => (
            <ComercioCard key={c.id} comercio={c} />
          ))}
        </CardGrid>
      )}
    </div>
  )
}
