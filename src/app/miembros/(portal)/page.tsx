import type { ReactNode } from 'react'
import { Heart, Repeat2, SearchX, Store } from 'lucide-react'
import { requireMiembroVigente } from '@/lib/miembros/requerir-miembro'
import { createClient } from '@/lib/supabase/server'
import { esPromocionVigente } from '@/lib/comercios/promocion-vigente'
import { resolverLogoComercio } from '@/lib/comercios/logo-comercio'
import {
  seleccionarBeneficiosDelMomento,
  seleccionarDestacados,
  seleccionarNovedades,
} from '@/lib/comercios/estanterias'
import {
  prepararTopDescuentos,
  TOPE_TOP_DESCUENTOS,
  type FilaTopDescuento,
} from '@/lib/comercios/top-descuentos'
import {
  seleccionarFavoritos,
  seleccionarMasUsados,
  TOPE_VISTA_MAS_USADOS,
  type FilaMasUsado,
} from '@/lib/miembros/favoritos'
import {
  aplicarVista,
  esCatalogoSinFiltrar,
  normalizarVista,
  VISTA_POR_DEFECTO,
  type Vista,
} from '@/lib/miembros/vistas-catalogo'
import { hoyISO } from '@/lib/shared/fecha'
import { Button } from '@/components/ui/button'
import { Carril } from '@/components/ui/carril'
import { EmptyState } from '@/components/ui/feedback'
import { Grid } from '@/components/ui/layout'
import { EncabezadoCatalogo } from './_components/encabezado-catalogo'
import { ChipsCategoria } from './_components/chips-categoria'
import { CarruselDestacados } from './_components/carrusel-destacados'
import { FavoritosProvider } from './_components/favoritos-contexto'
import { FiltrosForm } from './_components/filtros-form'
import { SeccionFavoritos } from './_components/seccion-favoritos'
import { SelectorVista } from './_components/selector-vista'
import { TopDescuentos } from './_components/top-descuentos'
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
  vista: Vista,
): string | null {
  const params = new URLSearchParams()
  if (busqueda) params.set('q', busqueda)
  /* La vista por defecto NO se escribe: `?ver=todo` es ruido en una URL que el
     socio puede pasar por WhatsApp, y el catálogo ya cae ahí por defecto. */
  if (vista !== VISTA_POR_DEFECTO) params.set('ver', vista)
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
    /** La vista: `recientes`, `usados`, `favoritos`. Ausente = todo el club. */
    ver?: string | string[]
  }>
}) {
  /* El `miembro_id` de la sesión. NUNCA llega del cliente: lo necesitan la
     lectura de favoritos y la función `comercios_mas_usados`, que son datos
     privados de este socio. */
  const miembro = await requireMiembroVigente()

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
  /* Entrada no confiable: un `?ver=` desconocido cae a la vista por defecto en
     silencio, igual que un `?categoria_id=abc`. */
  const vista = normalizarVista(primero(paramsCrudos.ver))
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
  const volver = urlDelCatalogo(busqueda, marcaIdFiltro, ciudadIdFiltro, categoriaIdFiltro, vista)

  const supabase = await createClient()
  // Fecha civil 'YYYY-MM-DD'. `fecha_inicio`/`fecha_fin` de promociones son fechas civiles,
  // no timestamptz: se comparan como cadenas, sin conversión de zona horaria.
  const hoy = hoyISO()

  /*
    LA PUERTA ÚNICA DE TODO EL CONTENIDO CURADO.

    Se calcula ANTES de las consultas, no después, porque decide cuáles hacer:
    el top del club solo se pide cuando va a pintarse. Con filtros o con una
    vista distinta de la de defecto, el resultado ES el contenido y una
    selección al lado es una distracción — la misma regla que ya gobernaba la
    portada y las estanterías, ahora con la vista dentro.
  */
  const sinFiltrar = esCatalogoSinFiltrar({
    busqueda,
    marcaId: marca_id,
    ciudadId: ciudad_id,
    categoriaId: categoriaIdFiltro,
    vista,
  })

  const [
    { data: comerciosDelClub },
    { data: todasMarcas },
    { data: todasCiudades },
    { data: todasCategorias },
    { data: tipos },
    { data: filasFavoritos },
    { data: filasMasUsados },
    { data: filasTop },
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

    /*
      FAVORITOS DEL SOCIO. Se pide SIEMPRE, también con filtros, porque no
      alimenta solo a su estantería: es lo que decide qué corazones salen
      llenos en cada tarjeta de la pantalla. Sin esto, buscar "pizza" mostraría
      vacíos los corazones de comercios que el socio ya había marcado.

      `miembro_id` sale de la sesión, no de la URL. La política RLS lo comprueba
      igual; el `eq` está para que el día que la política cambie, esto no se
      convierta en silencio en "los favoritos de todo el mundo".

      Orden descendente por `created_at`: lo último marcado, primero. Es lo que
      hace que la estantería reaccione al gesto que el socio acaba de hacer.
    */
    supabase
      .from('favoritos')
      .select('comercio_id')
      .eq('miembro_id', miembro.id)
      .order('created_at', { ascending: false })
      .limit(200),

    /*
      «LOS QUE MÁS USAS» — PERSONAL. Función y no consulta porque `ventas`
      guarda `sucursal_id`, no `comercio_id`: contarlo desde aquí serían dos
      consultas más un agrupado en JavaScript sobre todo el historial.

      Una sola llamada sirve a las dos piezas: la estantería (toma las ocho
      primeras) y la vista "Los que más usas" (las usa todas).
    */
    supabase.rpc('comercios_mas_usados', {
      p_miembro_id: miembro.id,
      p_limite: TOPE_VISTA_MAS_USADOS,
    }),

    /*
      «TOP 10 DEL CLUB» — GLOBAL, y CON TOLERANCIA A QUE LA FUNCIÓN NO EXISTA
      TODAVÍA.

      El script de `top_descuentos` puede no estar corrido en la base. Si no
      está, PostgREST devuelve error y `data` llega `null`: la sección no se
      pinta y el catálogo sigue entero. Ese es el requisito, y es la lección de
      V2 —añadir una columna no aplicada a la consulta que decide si un comercio
      EXISTE convirtió "falta una columna" en "este comercio no existe"—.

      Por eso va aquí y no mezclada con ninguna consulta de la que dependa la
      rejilla: su peor caso tiene que ser quedarse sin sección, nunca sin
      catálogo.

      No se pide cuando no va a pintarse: con filtros activos la sección no
      existe, así que sería una llamada de agregación tirada a la basura.
    */
    sinFiltrar
      ? supabase.rpc('top_descuentos', { p_limite: TOPE_TOP_DESCUENTOS })
      : Promise.resolve({ data: [] as FilaTopDescuento[] }),
  ])

  /* Ids de favoritos en el orden en que llegan. Alimenta el estado optimista
     del cliente y la vista "Tus favoritos". */
  const idsFavoritos = (filasFavoritos ?? []).map((f) => f.comercio_id)
  const masUsados: FilaMasUsado[] = filasMasUsados ?? []

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

  /*
    LA VISTA SE APLICA AQUÍ, sobre la lista YA filtrada por búsqueda, marca,
    ciudad y categoría. El orden importa: la categoría recorta lo que la vista
    eligió, no al revés. Por qué esa es la subordinación correcta —y no la
    contraria— está argumentado en `vistas-catalogo.ts`.

    Cero consultas nuevas: `idsFavoritos` y `masUsados` ya están en memoria y
    sirven a la vez a la vista, a las estanterías y a los corazones.
  */
  const comerciosVisibles = aplicarVista(
    comerciosListado,
    vista,
    idsFavoritos,
    masUsados.filter((f) => f.usos > 0).map((f) => f.comercio_id),
  )

  /* La puerta de las estanterías y de la portada. `sinFiltrar` ya incluye la
     vista, así que `?ver=favoritos` cierra el contenido curado igual que lo
     cerraba una búsqueda. */
  const hayFiltros = !sinFiltrar

  /*
    Con filtros activos NO hay estanterías: en modo búsqueda el resultado es el
    contenido, y una selección curada al lado es una distracción.

    Las dos son de duplicación, no de enlace: todo lo que muestran está también
    en la rejilla de abajo. Por eso sus cabeceras no llevan "Ver todos" —no
    habría a dónde ir que no fuera esta misma URL— y por eso deslizar nunca es
    el único camino a nada.
  */
  /*
    LA PORTADA, con la MISMA puerta que las estanterías y por la misma razón:
    con filtros activos el resultado ES el contenido, y una selección curada al
    lado es una distracción. Tres bloques deslizables con tres condiciones
    distintas serían imposibles de predecir.

    Cero consultas nuevas: se calcula en memoria sobre `comerciosListado`, que
    esta página ya construye. Si alguien añade una consulta para esta pieza,
    algo se entendió mal.

    Y no hay deduplicación con las estanterías ni con la rejilla: un comercio
    puede salir en la portada y también en "Nuevos en el club". Quitarlo de la
    estantería haría que la estantería MINTIERA sobre su criterio, y un aliado
    recién sumado ausente de "Nuevos en el club" es peor defecto que un nombre
    repetido.
  */
  const destacados = hayFiltros ? [] : seleccionarDestacados(comerciosListado)

  const novedades = hayFiltros ? [] : seleccionarNovedades(comerciosListado, new Date())
  const beneficiosDelMomento = hayFiltros
    ? []
    : seleccionarBeneficiosDelMomento(comerciosListado)

  /* Solo se ofrecen como chips las categorías que tienen algún comercio. */
  const categoriasConComercios = (todasCategorias ?? []).filter((cat) =>
    (comerciosDelClub ?? []).some((c) => c.categoria_id === cat.id),
  )

  /*
    LAS DOS ESTANTERÍAS PERSONALES.

    "Tus favoritos" se pinta aunque esté vacía —es la única del catálogo que lo
    hace, y el porqué está en `seccion-favoritos.tsx`—; "Los que más usas"
    desaparece si no hay nada, como el resto.

    Se surten de `comerciosListado`, no de `comerciosVisibles`: solo existen
    cuando no hay filtros, así que las dos listas coinciden, pero surtirlas de
    la lista sin vista deja claro que no dependen de ella.
  */
  const favoritosEstanteria = seleccionarFavoritos(comerciosListado, idsFavoritos)
  const masUsadosEstanteria = seleccionarMasUsados(comerciosListado, masUsados)

  /*
    EL TOP DEL CLUB. `filasTop` llega vacío si la función todavía no está
    aplicada en la base, y entonces esto da lista vacía y la sección no se
    pinta. Sin `try`, sin bandera y sin mensaje: el catálogo no tiene por qué
    contarle al socio qué scripts corrió el propietario.
  */
  const topDelClub = prepararTopDescuentos(filasTop, codigoTipo)

  /* LOS DOS EJES, Y CADA UNO CONSERVA LO DEL OTRO. */

  /* Lo que cada chip de CATEGORÍA conserva: todo menos la propia categoría. La
     vista incluida — cambiar de categoría no puede sacar al socio de "Tus
     favoritos". */
  const paramsBase: Record<string, string> = {}
  if (busqueda) paramsBase.q = busqueda
  if (marca_id) paramsBase.marca_id = marca_id
  if (ciudad_id) paramsBase.ciudad_id = ciudad_id
  if (vista !== VISTA_POR_DEFECTO) paramsBase.ver = vista

  /* Y lo que cada pestaña de VISTA conserva: todo menos la propia vista,
     categoría incluida — "tus favoritos de comida" es una frase con sentido. */
  const paramsVista: Record<string, string> = {}
  if (busqueda) paramsVista.q = busqueda
  if (marca_id) paramsVista.marca_id = marca_id
  if (ciudad_id) paramsVista.ciudad_id = ciudad_id
  if (categoriaIdFiltro !== null) paramsVista.categoria_id = String(categoriaIdFiltro)

  const vacio = construirVacio({
    hayFiltros,
    busqueda,
    vista,
    categoriaNombre: categoriaIdFiltro ? (nombreCategoria.get(categoriaIdFiltro) ?? null) : null,
    otrosFiltros: Boolean(marca_id || ciudad_id),
    hrefSoloBusqueda: busqueda ? `/miembros?q=${encodeURIComponent(busqueda)}` : null,
  })

  /*
    EL TÍTULO DE LA REJILLA DICE QUÉ LISTA ES.

    "Todos los comercios" sobre una rejilla de cuatro favoritos es una mentira
    pequeña y constante. El encabezado es el único sitio de la pantalla donde
    cabe decirlo en palabras, y es además el destino de salto del lector de
    pantalla.
  */
  const tituloRejilla = TITULO_REJILLA[vista]

  return (
    /*
      EL ESTADO DE FAVORITOS ENVUELVE LA PANTALLA ENTERA, y el coste en cliente
      es el de este archivo más el del botón: NADA MÁS.

      Todo lo de dentro llega por `children` desde este Server Component, así
      que se sigue renderizando en el servidor y no se hidrata. Es "empujar
      `'use client'` lo más abajo posible" aplicado al caso en que la pieza con
      estado envuelve, pero no posee, lo de dentro.

      Y es necesario: un mismo comercio puede salir a la vez en la portada, en
      "Tus favoritos", en "Los que más usas", en una estantería y en la rejilla.
      Con estado por botón, el socio llenaría un corazón y vería los otros
      cuatro seguir vacíos.
    */
    <FavoritosProvider inicial={idsFavoritos}>
      <div className={estilos.pagina}>
        <EncabezadoCatalogo />

        <FiltrosForm
          q={busqueda}
          marcaId={marca_id ?? ''}
          ciudadId={ciudad_id ?? ''}
          categoriaId={categoria_id ?? ''}
          ver={vista === VISTA_POR_DEFECTO ? '' : vista}
          marcas={todasMarcas ?? []}
          ciudades={todasCiudades ?? []}
        />

        {/*
          EJE 1 · LA VISTA — qué lista se mira. Va ENCIMA de las categorías
          porque las subordina: la categoría recorta lo que la vista eligió.
          Y habla otro lenguaje visual —pestañas con subrayado, no chips con
          relleno— para que la jerarquía se vea antes de leer una palabra.
        */}
        <SelectorVista activa={vista} paramsBase={paramsVista} />

        {/* EJE 2 · LA CATEGORÍA. La fila sigue visible sobre un resultado
            vacío: el socio debe poder cambiar de categoría sin dar marcha
            atrás. */}
        <ChipsCategoria
          categorias={categoriasConComercios}
          activaId={categoriaIdFiltro}
          paramsBase={paramsBase}
        />

        {/*
          La portada va AQUÍ: después de la búsqueda y de los filtros, y antes
          de cualquier contenido curado —ninguna estantería la precede—.

          Las dos cosas se cumplen a la vez, y era el punto difícil. Puesta
          antes de la búsqueda, la portada empujaría el campo a ~610px y el
          socio recurrente —el que abre la aplicación para buscar "pizza"—
          tendría que desplazar media pantalla para encontrarlo: eso es un paso
          añadido, y la regla nº1 manda. La búsqueda es herramienta, no
          contenido; una portada de revista no va antes del índice por estar
          antes en el papel, va antes de los artículos.
        */}
        <CarruselDestacados
          destacados={destacados}
          comerciosDelResultado={comerciosListado.length}
          mostrarCiudades={mostrarCiudades}
          volver={volver}
        />

        {/*
          LO DEL SOCIO ANTES QUE LO DEL CLUB, y en este orden exacto:

            1. Tus favoritos      — lo que él eligió a mano.
            2. Los que más usas   — lo que su propio historial dice de él.
            3. Top del club       — lo que hace todo el mundo.

          De más personal a menos. Lo contrario pondría delante el ranking
          global, que es lo único de esta pantalla que es idéntico para todos
          los socios.

          Las tres solo existen sin filtros. "Tus favoritos" es la única que se
          pinta vacía: es la que enseña un mecanismo que, si no, nadie
          descubriría.
        */}
        {/*
          LAS DOS LISTAS PERSONALES COMPARTEN UNA FRANJA DE CREMA.

          Favoritos y «los que más usas» responden a la misma pregunta —«lo
          mío»— y separarlas en dos campos de color las convertiría en dos
          temas distintos. El tono las agrupa sin necesidad de un encabezado
          que las englobe.
        */}
        {sinFiltrar && (
          <div className={`${estilos.franja} ${estilos.franjaCrema}`}>
            <SeccionFavoritos favoritos={favoritosEstanteria} volver={volver} />

            {masUsadosEstanteria.length > 0 && (
              <Carril titulo="Los que más usas" apoyo="Donde más has usado tu membresía">
                {masUsadosEstanteria.map((c) => (
                  <ComercioCardCompacta key={c.id} comercio={c} volver={volver} />
                ))}
              </Carril>
            )}
          </div>
        )}

        {/*
          EL TOP DEL CLUB, SOBRE CACAO.

          Es la única sección ceremonial del catálogo —lo que presume el club,
          no lo que el socio vino a buscar— y por eso es la que se lleva la
          franja oscura. Además es la única condición bajo la que el oro claro
          (`--gold-400`) es legible: da 7,83:1 sobre cacao y 1,99:1 sobre crema.

          Se pinta sola si hay al menos tres descuentos con uso. Si la función
          `top_descuentos` no está aplicada en la base, `topDelClub` llega vacío
          y la franja entera no aparece — no queda una banda oscura hueca.
        */}
        {sinFiltrar && topDelClub.length > 0 && (
          <div className={`${estilos.franja} ${estilos.franjaCacao}`}>
            <TopDescuentos items={topDelClub} volver={volver} />
          </div>
        )}

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

        {comerciosVisibles.length === 0 ? (
          <EmptyState
            icon={vacio.icono}
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
            <h2 className={estilos.tituloRejilla}>{tituloRejilla}</h2>

            <Grid min="290px">
              {comerciosVisibles.map((c) => (
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
    </FavoritosProvider>
  )
}

/**
 * Cómo se llama la rejilla en cada vista.
 *
 * `Record<Vista, string>` exhaustivo: si mañana aparece una quinta vista,
 * TypeScript no deja compilar hasta que tenga nombre. Es más barato que
 * descubrir "Todos los comercios" encima de una lista que no lo es.
 */
const TITULO_REJILLA: Record<Vista, string> = {
  todo: 'Todos los comercios',
  recientes: 'Los más recientes',
  usados: 'Los que más usas',
  favoritos: 'Tus favoritos',
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
/*
  EL VACÍO NO ES UNO, SON SEIS.

  «Sin resultados» sobre una rejilla de favoritos vacía es una respuesta
  equivocada: el socio no ha buscado nada, es que todavía no ha marcado ninguno.
  Cada vista y cada combinación de filtros falla por un motivo distinto, y el
  copy tiene que decir EL SUYO — si no, el socio no sabe qué hacer a
  continuación, que es lo único que un estado vacío tiene que resolver.

  El icono acompaña al copy por la misma razón: un corazón dice «favoritos» antes
  de que se lea la primera palabra.
*/
function construirVacio({
  hayFiltros,
  busqueda,
  vista,
  categoriaNombre,
  otrosFiltros,
  hrefSoloBusqueda,
}: {
  hayFiltros: boolean
  busqueda: string
  vista: Vista
  categoriaNombre: string | null
  otrosFiltros: boolean
  hrefSoloBusqueda: string | null
}): {
  titulo: string
  descripcion: string
  icono: ReactNode
  conSalida: boolean
  hrefQuitarFiltros: string | null
} {
  /*
    LAS VISTAS VAN PRIMERO, y el orden importa.

    Un socio en «Favoritos» sin nada marcado no tiene un problema de filtros:
    tiene una lista que todavía no ha empezado. Si esto fuera después de la
    comprobación de filtros, se le diría «sin resultados», que es culpar a su
    búsqueda de algo que no hizo.
  */
  if (vista === 'favoritos') {
    return {
      titulo: 'Todavía no tienes favoritos',
      descripcion:
        'Toca el corazón de un comercio y aparecerá aquí, siempre a mano.',
      icono: <Heart size={22} />,
      conSalida: true,
      hrefQuitarFiltros: null,
    }
  }

  if (vista === 'usados') {
    return {
      titulo: 'Aún no has usado tu membresía',
      descripcion:
        'Cuando muestres tu carnet en la caja de un aliado, ese comercio aparecerá aquí.',
      icono: <Repeat2 size={22} />,
      conSalida: true,
      hrefQuitarFiltros: null,
    }
  }

  if (!hayFiltros) {
    return {
      titulo: 'Aún no hay comercios',
      descripcion: 'Estamos sumando aliados al club. Vuelve pronto.',
      icono: <Store size={22} />,
      conSalida: false,
      hrefQuitarFiltros: null,
    }
  }

  const soloTexto = Boolean(busqueda) && !categoriaNombre && !otrosFiltros
  if (soloTexto) {
    return {
      titulo: `Sin resultados para «${busqueda}»`,
      descripcion: 'Prueba con menos palabras, o revisa las categorías.',
      icono: <SearchX size={22} />,
      conSalida: true,
      hrefQuitarFiltros: null,
    }
  }

  const soloCategoria = !busqueda && Boolean(categoriaNombre) && !otrosFiltros
  if (soloCategoria) {
    return {
      titulo: `Nada en ${categoriaNombre}, por ahora`,
      descripcion: 'Todavía no hay aliados en esta categoría. Están en camino.',
      icono: <Store size={22} />,
      conSalida: true,
      hrefQuitarFiltros: null,
    }
  }

  return {
    titulo: 'Sin resultados',
    descripcion: 'Ningún comercio coincide con lo que buscas y los filtros aplicados.',
    icono: <SearchX size={22} />,
    conSalida: true,
    /* Conserva lo escrito y borra el resto: no ha fallado su palabra, ha
       fallado la combinación. Sin texto que conservar, no se ofrece. */
    hrefQuitarFiltros: hrefSoloBusqueda,
  }
}
