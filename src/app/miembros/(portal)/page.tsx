import { requireMiembroVigente } from '@/lib/miembros/requerir-miembro'
import { createClient } from '@/lib/supabase/server'
import { CardGrid, EmptyState, PageHeader } from '@/components/ui'
import { FiltrosForm } from './_components/filtros-form'
import { ComercioCard, type ComercioListado } from './_components/comercio-card'

export const metadata = { title: 'Comercios y beneficios · ORUM' }

/** Normaliza un valor de searchParams: Next.js entrega `string[]` si el param se repite en la URL. */
function primero(v: string | string[] | undefined): string | undefined {
  return Array.isArray(v) ? v[0] : v
}

/** Escapa los comodines de LIKE (`%`, `_`) para que la búsqueda del usuario se trate como texto literal. */
function escaparLike(texto: string): string {
  return texto.replace(/[%_]/g, '\\$&')
}

export default async function MiembrosHomePage({
  searchParams,
}: {
  searchParams: Promise<{
    q?: string | string[]
    comercio_id?: string | string[]
    marca_id?: string | string[]
    ciudad_id?: string | string[]
  }>
}) {
  await requireMiembroVigente()

  const paramsCrudos = await searchParams
  const q = primero(paramsCrudos.q)
  const comercio_id = primero(paramsCrudos.comercio_id)
  const marca_id = primero(paramsCrudos.marca_id)
  const ciudad_id = primero(paramsCrudos.ciudad_id)
  const busqueda = (q ?? '').trim()
  const busquedaLike = escaparLike(busqueda)
  const comercioIdFiltro = comercio_id ? Number(comercio_id) : null
  const marcaIdFiltro = marca_id ? Number(marca_id) : null
  const ciudadIdFiltro = ciudad_id ? Number(ciudad_id) : null

  const supabase = await createClient()

  const [{ data: todosComercios }, { data: todasMarcas }, { data: todasCiudades }, { data: tipos }] =
    await Promise.all([
      supabase
        .from('comercios')
        .select('id, nombre')
        .eq('activo', true)
        .is('deleted_at', null)
        .order('nombre')
        .limit(100),
      supabase.from('marcas').select('id, nombre').order('nombre').limit(100),
      supabase.from('ciudades').select('id, nombre').order('nombre').limit(100),
      supabase.from('tipos_beneficio').select('id, codigo').limit(100),
    ])

  // Comercios con al menos una sucursal en la ciudad filtrada.
  let idsPorCiudad: number[] | null = null
  if (ciudadIdFiltro) {
    const { data: sucursalesEnCiudad } = await supabase
      .from('sucursales')
      .select('comercio_id')
      .eq('ciudad_id', ciudadIdFiltro)
      .eq('activo', true)
      .is('deleted_at', null)
      .limit(100)
    idsPorCiudad = Array.from(new Set((sucursalesEnCiudad ?? []).map((s) => s.comercio_id)))
  }

  // Comercios cuyo nombre coincide con la búsqueda (y, si aplica, con los filtros de comercio/marca/ciudad).
  let queryPorNombre = supabase
    .from('comercios')
    .select('id, nombre, descripcion, marca_id')
    .eq('activo', true)
    .is('deleted_at', null)
  if (busqueda) queryPorNombre = queryPorNombre.ilike('nombre', `%${busquedaLike}%`)
  if (comercioIdFiltro) queryPorNombre = queryPorNombre.eq('id', comercioIdFiltro)
  if (marcaIdFiltro) queryPorNombre = queryPorNombre.eq('marca_id', marcaIdFiltro)
  // `.in('id', [])` es una lista vacía inválida para PostgREST; -1 es un id imposible que da el
  // mismo resultado (cero filas) cuando la ciudad filtrada no tiene comercios con sucursal ahí.
  if (idsPorCiudad) queryPorNombre = queryPorNombre.in('id', idsPorCiudad.length > 0 ? idsPorCiudad : [-1])
  queryPorNombre = queryPorNombre.order('nombre').limit(100)

  // Comercios con una promoción cuyo título coincide con la búsqueda.
  let idsPorPromocion: number[] = []
  if (busqueda) {
    const { data: promosCoincidentes } = await supabase
      .from('promociones')
      .select('comercio_id')
      .eq('activo', true)
      .is('deleted_at', null)
      .ilike('titulo', `%${busquedaLike}%`)
      .limit(100)
    idsPorPromocion = Array.from(new Set((promosCoincidentes ?? []).map((p) => p.comercio_id)))
  }

  type ComercioBase = { id: number; nombre: string; descripcion: string | null; marca_id: number | null }

  // Comercios cuyo id vino de un match de promoción, acotados también por comercio/marca/ciudad si aplica.
  const queryPorPromocion =
    idsPorPromocion.length > 0
      ? (() => {
          let q = supabase
            .from('comercios')
            .select('id, nombre, descripcion, marca_id')
            .eq('activo', true)
            .is('deleted_at', null)
            .in('id', idsPorPromocion)
          if (comercioIdFiltro) q = q.eq('id', comercioIdFiltro)
          if (marcaIdFiltro) q = q.eq('marca_id', marcaIdFiltro)
          if (idsPorCiudad) q = q.in('id', idsPorCiudad.length > 0 ? idsPorCiudad : [-1])
          return q.limit(100)
        })()
      : Promise.resolve({ data: [] as ComercioBase[] })

  const [{ data: porNombre }, { data: porPromocion }] = await Promise.all([queryPorNombre, queryPorPromocion])
  const comerciosFiltrados: ComercioBase[] = busqueda
    ? Array.from(new Map([...(porNombre ?? []), ...(porPromocion ?? [])].map((c) => [c.id, c])).values())
    : (porNombre ?? [])

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
            .order('titulo')
            .limit(200),
          supabase
            .from('sucursales')
            .select('comercio_id, ciudad_id')
            .eq('activo', true)
            .is('deleted_at', null)
            .in('comercio_id', comercioIds)
            .limit(200),
        ])
      : [{ data: [] as PromocionRow[] }, { data: [] as SucursalRow[] }]

  const nombreMarca = new Map((todasMarcas ?? []).map((m) => [m.id, m.nombre]))
  const nombreCiudad = new Map((todasCiudades ?? []).map((c) => [c.id, c.nombre]))
  const codigoTipo = new Map((tipos ?? []).map((t) => [t.id, t.codigo]))

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
