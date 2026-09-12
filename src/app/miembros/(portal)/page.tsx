import { Store } from 'lucide-react'
import { requireMiembroVigente } from '@/lib/miembros/requerir-miembro'
import { createClient } from '@/lib/supabase/server'
import { esPromocionVigente } from '@/lib/comercios/promocion-vigente'
import { resolverLogoComercio } from '@/lib/comercios/logo-comercio'
import {
  seleccionarBeneficiosDelMomento,
  seleccionarNovedades,
} from '@/lib/comercios/estanterias'
import { hoyISO } from '@/lib/shared/fecha'
import { Button } from '@/components/ui/button'
import { Carril } from '@/components/ui/carril'
import { EmptyState } from '@/components/ui/feedback'
import { Grid } from '@/components/ui/layout'
import { EncabezadoCatalogo } from './_components/encabezado-catalogo'
import { ChipsCategoria } from './_components/chips-categoria'
import { FiltrosForm } from './_components/filtros-form'
import {
  ComercioCard,
  ComercioCardCompacta,
  type ComercioListado,
} from './_components/comercio-card'
import estilos from './_components/catalogo.module.css'

export const metadata = { title: 'Comercios y beneficios · ORUM' }

/** Normaliza un valor de searchParams: Next.js entrega `string[]` si el param se repite en la URL. */
function primero(v: string | string[] | undefined): string | undefined {
  return Array.isArray(v) ? v[0] : v
}

/** Escapa los comodines de LIKE (`%`, `_`) para que la búsqueda del usuario se trate como texto literal. */
function escaparLike(texto: string): string {
  return texto.replace(/[%_]/g, '\\$&')
}

/** Id numérico de la URL, o `null` si no lo es. Entrada no confiable. */
function numeroONulo(valor: string | undefined): number | null {
  if (!valor) return null
  const n = Number(valor)
  return Number.isFinite(n) ? n : null
}

/**
 * El catálogo tal y como el socio lo dejó, para que la ficha de un comercio
 * pueda devolverlo exactamente aquí sin guardar estado en ningún sitio.
 *
 * Se construye con los valores YA NORMALIZADOS, no con `searchParams` en
 * crudo: así un `?comercio_id=` de una URL antigua —que esta pantalla ignora
 * a propósito— no viaja de vuelta, y un `?categoria_id=abc` se queda fuera en
 * vez de reaparecer al volver. Lo que se devuelve es lo que el catálogo de
 * verdad está mostrando.
 *
 * `null` cuando no hay ningún filtro: la ficha ya cae al catálogo limpio por
 * defecto, y un `?volver=%2Fmiembros` es ruido en una URL que el socio puede
 * pasarle a otro por WhatsApp.
 *
 * El destino se valida OTRA VEZ al llegar, con `resolverVolverAlCatalogo`.
 * Que el origen sea de confianza no hace de confianza al parámetro: viaja en
 * una URL que cualquiera puede reescribir.
 */
function urlDelCatalogo(
  busqueda: string,
  marcaId: number | null,
  ciudadId: number | null,
  categoriaId: number | null,
): string | null {
  const params = new URLSearchParams()
  if (busqueda) params.set('q', busqueda)
  /* `Number.isFinite` y no solo `!== null`: `marcaIdFiltro` y `ciudadIdFiltro`
     salen de un `Number()` sin guarda, así que un `?marca_id=abc` llega como
     NaN. Sin este filtro volvería en la URL como el literal «NaN». */
  if (Number.isFinite(marcaId)) params.set('marca_id', String(marcaId))
  if (Number.isFinite(ciudadId)) params.set('ciudad_id', String(ciudadId))
  if (categoriaId !== null) params.set('categoria_id', String(categoriaId))

  const consulta = params.toString()
  return consulta ? `/miembros?${consulta}` : null
}

export default async function MiembrosHomePage({
  searchParams,
}: {
  searchParams: Promise<{
    q?: string | string[]
    marca_id?: string | string[]
    ciudad_id?: string | string[]
    categoria_id?: string | string[]
  }>
}) {
  await requireMiembroVigente()

  /*
    `comercio_id` se retiró junto con su desplegable. Si llega en una URL
    antigua se ignora sin error: no se lee, no se valida y no se avisa. Un
    enlace guardado sigue abriendo el catálogo, solo que completo.
  */
  const paramsCrudos = await searchParams
  const q = primero(paramsCrudos.q)
  const marca_id = primero(paramsCrudos.marca_id)
  const ciudad_id = primero(paramsCrudos.ciudad_id)
  const categoria_id = primero(paramsCrudos.categoria_id)
  const busqueda = (q ?? '').trim()
  const busquedaLike = escaparLike(busqueda)
  const marcaIdFiltro = marca_id ? Number(marca_id) : null
  const ciudadIdFiltro = ciudad_id ? Number(ciudad_id) : null
  /* `Number('abc')` da NaN, que es falsy: el filtro no se aplicaría igual,
     pero NaN tampoco casa con ningún chip y la fila se quedaba sin ninguno
     marcado, ni siquiera "Todas". Normalizado a `null`, una categoría
     inventada en la URL deja el catálogo completo y "Todas" encendida. */
  const categoriaIdFiltro = numeroONulo(categoria_id)

  /* Viaja en el `href` de cada tarjeta. Es lo que hace que el botón
     «‹ Comercios» de la ficha devuelva al catálogo filtrado y no al completo. */
  const volver = urlDelCatalogo(busqueda, marcaIdFiltro, ciudadIdFiltro, categoriaIdFiltro)

  const supabase = await createClient()
  // Fecha civil 'YYYY-MM-DD'. `fecha_inicio`/`fecha_fin` de promociones son fechas civiles,
  // no timestamptz: se comparan como cadenas, sin conversión de zona horaria.
  const hoy = hoyISO()

  const [
    { data: comerciosDelClub },
    { data: todasMarcas },
    { data: todasCiudades },
    { data: todasCategorias },
    { data: tipos },
  ] = await Promise.all([
    /*
      Esta consulta poblaba el desplegable "Comercio", que ya no existe. En vez
      de borrarla y añadir otra, cambia de `select`: ahora dice qué categorías
      tienen al menos un comercio activo, que es lo que decide qué chips se
      pintan. Una categoría sin comercios sería un filtro que solo puede dar
      cero. Coste neto de la fila de chips: cero consultas.
    */
    supabase
      .from('comercios')
      .select('id, categoria_id')
      .eq('activo', true)
      .is('deleted_at', null)
      .limit(100),
    // `logo_url` alimenta el respaldo del logo: un comercio sin logo propio hereda el de su marca.
    supabase.from('marcas').select('id, nombre, logo_url').order('nombre').limit(100),
    supabase.from('ciudades').select('id, nombre').order('nombre').limit(100),
    supabase.from('categorias').select('id, nombre').order('nombre').limit(100),
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

  /* `created_at` y `categoria_id` viajan en el mismo `select` que ya existía:
     alimentan la estantería de novedades y la línea inferior de la tarjeta
     cuando el comercio no tiene ningún beneficio vigente. */
  const COLUMNAS_COMERCIO = 'id, nombre, descripcion, marca_id, categoria_id, logo_url, created_at'

  // Comercios cuyo nombre coincide con la búsqueda (y, si aplica, con los filtros de marca/ciudad).
  let queryPorNombre = supabase
    .from('comercios')
    .select(COLUMNAS_COMERCIO)
    .eq('activo', true)
    .is('deleted_at', null)
  if (busqueda) queryPorNombre = queryPorNombre.ilike('nombre', `%${busquedaLike}%`)
  if (marcaIdFiltro) queryPorNombre = queryPorNombre.eq('marca_id', marcaIdFiltro)
  if (categoriaIdFiltro) queryPorNombre = queryPorNombre.eq('categoria_id', categoriaIdFiltro)
  // `.in('id', [])` es una lista vacía inválida para PostgREST; -1 es un id imposible que da el
  // mismo resultado (cero filas) cuando la ciudad filtrada no tiene comercios con sucursal ahí.
  if (idsPorCiudad) queryPorNombre = queryPorNombre.in('id', idsPorCiudad.length > 0 ? idsPorCiudad : [-1])
  queryPorNombre = queryPorNombre.order('nombre').limit(100)

  // Comercios con una promoción cuyo título coincide con la búsqueda.
  let idsPorPromocion: number[] = []
  if (busqueda) {
    const { data: promosCoincidentes } = await supabase
      .from('promociones')
      .select('comercio_id, activo, fecha_inicio, fecha_fin')
      .eq('activo', true)
      .is('deleted_at', null)
      .ilike('titulo', `%${busquedaLike}%`)
      .limit(100)
    idsPorPromocion = Array.from(
      new Set(
        (promosCoincidentes ?? [])
          .filter((p) => esPromocionVigente(p.activo, p.fecha_inicio, p.fecha_fin, hoy))
          .map((p) => p.comercio_id),
      ),
    )
  }

  type ComercioBase = {
    id: number
    nombre: string
    descripcion: string | null
    marca_id: number | null
    categoria_id: number | null
    logo_url: string | null
    created_at: string | null
  }

  // Comercios cuyo id vino de un match de promoción, acotados también por marca/ciudad si aplica.
  const queryPorPromocion =
    idsPorPromocion.length > 0
      ? (() => {
          let q = supabase
            .from('comercios')
            .select(COLUMNAS_COMERCIO)
            .eq('activo', true)
            .is('deleted_at', null)
            .in('id', idsPorPromocion)
          if (marcaIdFiltro) q = q.eq('marca_id', marcaIdFiltro)
          if (categoriaIdFiltro) q = q.eq('categoria_id', categoriaIdFiltro)
          if (idsPorCiudad) q = q.in('id', idsPorCiudad.length > 0 ? idsPorCiudad : [-1])
          return q.limit(100)
        })()
      : Promise.resolve({ data: [] as ComercioBase[] })

  const [{ data: porNombre }, { data: porPromocion }] = await Promise.all([queryPorNombre, queryPorPromocion])
  const comerciosFiltrados: ComercioBase[] = busqueda
    ? Array.from(new Map([...(porNombre ?? []), ...(porPromocion ?? [])].map((c) => [c.id, c])).values())
    : (porNombre ?? [])

  const comercioIds = comerciosFiltrados.map((c) => c.id)

  type PromocionRow = {
    id: number
    comercio_id: number
    titulo: string
    valor: number | null
    tipo_beneficio_id: number
    activo: boolean
    fecha_inicio: string | null
    fecha_fin: string | null
  }
  type SucursalRow = { comercio_id: number; ciudad_id: number }

  const [{ data: promociones }, { data: sucursales }] =
    comercioIds.length > 0
      ? await Promise.all([
          supabase
            .from('promociones')
            .select('id, comercio_id, titulo, valor, tipo_beneficio_id, activo, fecha_inicio, fecha_fin')
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
  const logoMarca = new Map((todasMarcas ?? []).map((m) => [m.id, m.logo_url]))
  const nombreCiudad = new Map((todasCiudades ?? []).map((c) => [c.id, c.nombre]))
  const nombreCategoria = new Map((todasCategorias ?? []).map((c) => [c.id, c.nombre]))
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
    // Una promoción caducada no se anuncia: la caja del comercio la rechazaría.
    if (!esPromocionVigente(p.activo, p.fecha_inicio, p.fecha_fin, hoy)) continue
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
    categoriaNombre: c.categoria_id ? (nombreCategoria.get(c.categoria_id) ?? null) : null,
    logoUrl: resolverLogoComercio(c.logo_url, c.marca_id ? (logoMarca.get(c.marca_id) ?? null) : null),
    createdAt: c.created_at,
    ciudades: Array.from(ciudadesPorComercio.get(c.id) ?? []),
    promociones: promocionesPorComercio.get(c.id) ?? [],
  }))

  /*
    La línea de ciudades solo aparece si aporta algo: o el catálogo tiene dos o
    más ciudades distintas, o este comercio está en más de una. Repetir
    "Bogotá" en las cuatro tarjetas —el caso de hoy— no informa de nada y gasta
    una línea del bloque que sí se compara.
  */
  const ciudadesDelResultado = new Set(comerciosListado.flatMap((c) => c.ciudades))
  const mostrarCiudades = ciudadesDelResultado.size > 1

  const hayFiltros = Boolean(busqueda || marca_id || ciudad_id || categoria_id)

  /*
    Con filtros activos NO hay estanterías: en modo búsqueda el resultado es el
    contenido, y una selección curada al lado es una distracción.

    Las dos son de duplicación, no de enlace: todo lo que muestran está también
    en la rejilla de abajo. Por eso sus cabeceras no llevan "Ver todos" —no
    habría a dónde ir que no fuera esta misma URL— y por eso deslizar nunca es
    el único camino a nada.
  */
  const novedades = hayFiltros ? [] : seleccionarNovedades(comerciosListado, new Date())
  const beneficiosDelMomento = hayFiltros
    ? []
    : seleccionarBeneficiosDelMomento(comerciosListado)

  /* Solo se ofrecen como chips las categorías que tienen algún comercio. */
  const categoriasConComercios = (todasCategorias ?? []).filter((cat) =>
    (comerciosDelClub ?? []).some((c) => c.categoria_id === cat.id),
  )

  /* Lo que cada chip debe conservar al cambiar de categoría. */
  const paramsBase: Record<string, string> = {}
  if (busqueda) paramsBase.q = busqueda
  if (marca_id) paramsBase.marca_id = marca_id
  if (ciudad_id) paramsBase.ciudad_id = ciudad_id

  const vacio = construirVacio({
    hayFiltros,
    busqueda,
    categoriaNombre: categoriaIdFiltro ? (nombreCategoria.get(categoriaIdFiltro) ?? null) : null,
    otrosFiltros: Boolean(marca_id || ciudad_id),
    hrefSoloBusqueda: busqueda ? `/miembros?q=${encodeURIComponent(busqueda)}` : null,
  })

  return (
    <div className={estilos.pagina}>
      <EncabezadoCatalogo />

      <FiltrosForm
        q={busqueda}
        marcaId={marca_id ?? ''}
        ciudadId={ciudad_id ?? ''}
        categoriaId={categoria_id ?? ''}
        marcas={todasMarcas ?? []}
        ciudades={todasCiudades ?? []}
      />

      {/* La fila sigue visible sobre un resultado vacío: el socio debe poder
          cambiar de categoría sin dar marcha atrás. */}
      <ChipsCategoria
        categorias={categoriasConComercios}
        activaId={categoriaIdFiltro}
        paramsBase={paramsBase}
      />

      {novedades.length > 0 && (
        <Carril titulo="Nuevos en el club" apoyo="Los últimos aliados que se sumaron">
          {novedades.map((c) => (
            <ComercioCardCompacta key={c.id} comercio={c} volver={volver} />
          ))}
        </Carril>
      )}

      {beneficiosDelMomento.length > 0 && (
        <Carril titulo="Beneficios del momento" apoyo="Lo que puedes usar esta semana">
          {beneficiosDelMomento.map((c) => (
            <ComercioCardCompacta key={c.id} comercio={c} volver={volver} />
          ))}
        </Carril>
      )}

      {comerciosListado.length === 0 ? (
        <EmptyState
          icon={<Store size={24} />}
          title={vacio.titulo}
          description={vacio.descripcion}
          actions={
            vacio.conSalida ? (
              <>
                <Button href="/miembros" variant="secondary">
                  Ver todos los comercios
                </Button>
                {vacio.hrefQuitarFiltros && (
                  <Button href={vacio.hrefQuitarFiltros} variant="ghost">
                    Quitar los filtros
                  </Button>
                )}
              </>
            ) : undefined
          }
        />
      ) : (
        <section className={estilos.rejilla}>
          <h2 className={estilos.tituloRejilla}>Todos los comercios</h2>

          <Grid min="290px">
            {comerciosListado.map((c) => (
              <ComercioCard
                key={c.id}
                comercio={c}
                mostrarCiudades={mostrarCiudades}
                volver={volver}
              />
            ))}
          </Grid>
        </section>
      )}
    </div>
  )
}

/*
  Los cuatro vacíos del catálogo. Son estados DISTINTOS y no comparten copy:
  decir siempre lo mismo desperdicia la única información útil que tenemos, que
  es por qué no salió nada.

  El vacío inicial no lleva acciones a propósito: no hay nada que el socio
  pueda hacer, y ofrecerle un botón sería fingir que sí.

  ADVERTENCIA CONOCIDA, y no es diseño: las consultas de esta página
  desestructuran solo `data` e ignoran `error`, así que un fallo de lectura no
  lanza —devuelve cero filas— y el socio ve "Aún no hay comercios" cuando su
  club sí existe. Está escalado como propuesta de backend (B6); no se puede
  arreglar desde aquí sin cambiar el contrato de las lecturas.
*/
function construirVacio({
  hayFiltros,
  busqueda,
  categoriaNombre,
  otrosFiltros,
  hrefSoloBusqueda,
}: {
  hayFiltros: boolean
  busqueda: string
  categoriaNombre: string | null
  otrosFiltros: boolean
  hrefSoloBusqueda: string | null
}): {
  titulo: string
  descripcion: string
  conSalida: boolean
  hrefQuitarFiltros: string | null
} {
  if (!hayFiltros) {
    return {
      titulo: 'Aún no hay comercios',
      descripcion: 'Estamos sumando aliados al club. Vuelve pronto.',
      conSalida: false,
      hrefQuitarFiltros: null,
    }
  }

  const soloTexto = Boolean(busqueda) && !categoriaNombre && !otrosFiltros
  if (soloTexto) {
    return {
      titulo: `Sin resultados para «${busqueda}»`,
      descripcion: 'Prueba con menos palabras, o revisa las categorías.',
      conSalida: true,
      hrefQuitarFiltros: null,
    }
  }

  const soloCategoria = !busqueda && Boolean(categoriaNombre) && !otrosFiltros
  if (soloCategoria) {
    return {
      titulo: `Nada en ${categoriaNombre}, por ahora`,
      descripcion: 'Todavía no hay aliados en esta categoría. Están en camino.',
      conSalida: true,
      hrefQuitarFiltros: null,
    }
  }

  return {
    titulo: 'Sin resultados',
    descripcion: 'Ningún comercio coincide con lo que buscas y los filtros aplicados.',
    conSalida: true,
    /* Conserva lo escrito y borra el resto: no ha fallado su palabra, ha
       fallado la combinación. Sin texto que conservar, no se ofrece. */
    hrefQuitarFiltros: hrefSoloBusqueda,
  }
}
