import 'server-only'

import { cache } from 'react'
import { createAdminClient } from '@/lib/supabase/admin'
import { resolverLogoComercio } from '@/lib/comercios/logo-comercio'
import { esPromocionVigente } from '@/lib/comercios/promocion-vigente'
import { formatearBeneficio } from '@/lib/comercios/beneficios-formato'
import { hoyISO } from '@/lib/shared/fecha'
import { compararNombres, ordenarCategorias } from './directorio'
import { prepararPlanes, type PlanPublico } from './planes'

/* ==========================================================================
   LOS DATOS DE LA FACHADA  ·  y por qué salen del cliente de servicio
   --------------------------------------------------------------------------
   `createAdminClient()` y NO `createClient()`, que es el que usa el resto del
   producto.

   `createClient()` lleva la clave anónima y resuelve la sesión por cookies, y
   hoy TODOS los consumidores de `comercios`, `marcas`, `promociones` y
   `configuracion` están detrás de `requireMiembroVigente`, `requireRolComercio`
   o un rol de administración: no existe ninguna política de lectura anónima
   sobre esas tablas. Desde una página pública, sin sesión, esas consultas
   devolverían CERO FILAS EN SILENCIO —sin error, sin aviso— y la landing
   diría por omisión que ORUM no tiene aliados.

   La alternativa correcta a largo plazo es la política RLS de lectura pública
   (B1 de la spec). No se toma hoy porque esa migración no está aplicada y una
   landing que depende de SQL sin aplicar se ve vacía el día del despliegue.

   Al usar la `service_role` se salta RLS, así que la disciplina la pone ESTE
   archivo, en un único sitio:

     · Solo se seleccionan columnas públicas. De `comercios`: `id`, `nombre`,
       `descripcion`, `logo_url`, `portada_url`, `categoria_id` y `marca_id`.
       De `marcas`: `id` y `logo_url`. De `promociones`, lo justo para saber
       si hay un beneficio vigente y cómo se llama. De `sucursales`: nombre,
       dirección y ciudad —el teléfono de cada sede se queda fuera: el
       contacto de la fachada es el WhatsApp de ORUM—. De `comercio_imagenes`:
       URL y texto alternativo. De `planes_membresia`: nombre, descripción,
       precio y duración, que es catálogo de producto y no dato de nadie.
     · QUEDA DELIBERADAMENTE FUERA `comercios.perfil_id` —es el enlace con la
       cuenta de acceso del comercio— y cualquier columna de `miembros`,
       `perfiles`, `ventas` o `membresias`. Nada de lo que se lee aquí
       identifica a una persona.
     · `marca_id` sí entra, aunque no aparezca en pantalla: es lo que permite
       que un comercio sin logotipo propio herede el de su marca
       (`resolverLogoComercio`). Es una clave foránea a un catálogo público,
       no un dato sensible.
     · Siempre `activo = true` y `deleted_at is null`. Un comercio dado de baja
       no se anuncia en la puerta.
     · Este módulo lleva `server-only`: si alguien lo importara desde un
       componente con `'use client'`, el build falla en vez de publicar la
       clave de servicio en el navegador.

   `cache()` de React deduplica dentro de una misma petición: el layout pide el
   WhatsApp para el pie y la página lo vuelve a pedir para el CTA, y solo se
   consulta una vez.
   ========================================================================== */

/** Cuántas tarjetas entran en «Comercios destacados». Es una muestra, no el catálogo. */
const TOPE_DESTACADOS = 5

/** Cuántas fotografías rotan en el carrusel de «Qué es ORUM». */
const TOPE_FOTOS = 5

/**
 * Techo de la lectura del directorio. Holgado para el lanzamiento; cuando el
 * club pase de aquí, el directorio necesitará paginar y este número lo dirá
 * antes que nadie.
 */
const TOPE_DIRECTORIO = 500

/**
 * Un comercio tal y como lo necesita la fachada: más delgado que el
 * `ComercioListado` del catálogo de miembros, y a propósito.
 *
 * No importa aquel tipo porque vive en `_components/` de una ruta privada:
 * una ruta pública que dependiera de él invertiría la dependencia, y además
 * arrastraría campos (`createdAt`, `marcaNombre`, la lista completa de
 * promociones) que esta pantalla no muestra.
 */
export type ComercioVitrina = {
  id: number
  nombre: string
  descripcion: string | null
  categoriaId: number | null
  categoriaNombre: string | null
  /** Ids de las ciudades con al menos una sede activa. Alimentan el filtro. */
  ciudadIds: number[]
  ciudades: string[]
  logoUrl: string | null
  /** Texto ya formateado del beneficio vigente más visible, o `null`. */
  beneficioDestacado: string | null
  /**
   * La fotografía del local, que NO es el logotipo: `comercios.portada_url`
   * (migración `20260913120000_imagenes_y_avatares.sql`). Una cadena vacía se
   * normaliza a `null`: sería un `<img src="">`, que el navegador resuelve
   * pidiendo otra vez la propia página.
   */
  portadaUrl: string | null
}

/** Una opción de filtro del directorio: una categoría o una ciudad. */
export type OpcionFiltro = { id: number; nombre: string }

/** Una fotografía de la fachada, con su texto alternativo ya resuelto. */
export type FotoPublica = { url: string; alt: string }

export type DatosVitrina = {
  /** «Comercios destacados», hasta `TOPE_DESTACADOS`. */
  destacados: ComercioVitrina[]
  /** Portadas reales para el héroe y el carrusel, hasta `TOPE_FOTOS`. */
  fotos: FotoPublica[]
  /** Cuántos comercios activos hay en total. */
  totalComercios: number
}

export type CatalogoPublico = {
  /** Todos los comercios activos, en orden alfabético. */
  comercios: ComercioVitrina[]
  /** Todas las categorías del catálogo, aunque alguna esté vacía hoy. */
  categorias: OpcionFiltro[]
  /**
   * Solo las ciudades con al menos una sede activa: filtrar por una ciudad
   * sin comercios daría siempre una rejilla vacía.
   */
  ciudades: OpcionFiltro[]
}

/**
 * LA ÚNICA LECTURA DEL CATÁLOGO PÚBLICO.
 *
 * La landing y el directorio (`/explorar`) piden cosas distintas —una muestra
 * de cinco y la lista entera— pero del MISMO conjunto de comercios. Leerlo en
 * un solo sitio garantiza que las dos pantallas no se contradigan (un
 * destacado de la portada que no aparece en el directorio), y `cache()` hace
 * que, si las dos lo piden en la misma petición, se consulte una sola vez.
 */
const cargarCatalogoPublico = cache(async (): Promise<CatalogoPublico> => {
  const supabase = createAdminClient()
  // Fecha civil 'YYYY-MM-DD' en America/Bogotá: `fecha_inicio` y `fecha_fin` de
  // promociones son fechas civiles, no `timestamptz`. Se comparan como cadenas.
  const hoy = hoyISO()

  const [{ data: comercios }, { data: marcas }, { data: categorias }] = await Promise.all([
    supabase
      .from('comercios')
      .select('id, nombre, descripcion, logo_url, portada_url, categoria_id, marca_id')
      .eq('activo', true)
      .is('deleted_at', null)
      .order('nombre')
      .limit(TOPE_DIRECTORIO),
    supabase.from('marcas').select('id, logo_url').limit(200),
    supabase.from('categorias').select('id, nombre').limit(100),
  ])

  const categoriasOrdenadas = ordenarCategorias(categorias ?? [])

  if (!comercios || comercios.length === 0) {
    return { comercios: [], categorias: categoriasOrdenadas, ciudades: [] }
  }

  const ids = comercios.map((c) => c.id)

  const [{ data: promociones }, { data: tipos }, { data: sucursales }, { data: ciudades }] =
    await Promise.all([
      supabase
        .from('promociones')
        .select('comercio_id, valor, tipo_beneficio_id, activo, fecha_inicio, fecha_fin')
        .eq('activo', true)
        .is('deleted_at', null)
        .in('comercio_id', ids)
        .limit(TOPE_DIRECTORIO * 2),
      supabase.from('tipos_beneficio').select('id, codigo').limit(100),
      supabase
        .from('sucursales')
        .select('comercio_id, ciudad_id')
        .eq('activo', true)
        .is('deleted_at', null)
        .in('comercio_id', ids)
        .limit(TOPE_DIRECTORIO * 2),
      supabase.from('ciudades').select('id, nombre').limit(200),
    ])

  const logoDeMarca = new Map((marcas ?? []).map((m) => [m.id, m.logo_url]))
  const nombreCategoria = new Map((categorias ?? []).map((c) => [c.id, c.nombre]))
  const nombreCiudad = new Map((ciudades ?? []).map((c) => [c.id, c.nombre]))
  const codigoTipo = new Map((tipos ?? []).map((t) => [t.id, t.codigo]))

  const ciudadesPorComercio = new Map<number, Set<number>>()
  const ciudadesDelClub = new Set<number>()
  for (const s of sucursales ?? []) {
    if (!nombreCiudad.has(s.ciudad_id)) continue
    if (!ciudadesPorComercio.has(s.comercio_id)) {
      ciudadesPorComercio.set(s.comercio_id, new Set())
    }
    ciudadesPorComercio.get(s.comercio_id)!.add(s.ciudad_id)
    ciudadesDelClub.add(s.ciudad_id)
  }

  const beneficioPorComercio = new Map<number, string>()
  for (const p of promociones ?? []) {
    // Una promoción caducada no se anuncia: la caja del comercio la rechazaría.
    if (!esPromocionVigente(p.activo, p.fecha_inicio, p.fecha_fin, hoy)) continue
    if (beneficioPorComercio.has(p.comercio_id)) continue
    const tipoCodigo = codigoTipo.get(p.tipo_beneficio_id)
    if (!tipoCodigo) continue
    beneficioPorComercio.set(p.comercio_id, formatearBeneficio(tipoCodigo, p.valor))
  }

  const lista: ComercioVitrina[] = comercios.map((c) => {
    const ciudadIds = Array.from(ciudadesPorComercio.get(c.id) ?? [])
    return {
      id: c.id,
      nombre: c.nombre,
      descripcion: c.descripcion,
      categoriaId: c.categoria_id,
      categoriaNombre: c.categoria_id ? (nombreCategoria.get(c.categoria_id) ?? null) : null,
      ciudadIds,
      ciudades: ciudadIds.map((id) => nombreCiudad.get(id) ?? '').filter(Boolean),
      logoUrl: resolverLogoComercio(
        c.logo_url,
        c.marca_id ? (logoDeMarca.get(c.marca_id) ?? null) : null,
      ),
      beneficioDestacado: beneficioPorComercio.get(c.id) ?? null,
      portadaUrl: (c.portada_url ?? '').trim() || null,
    }
  })

  return {
    /* Postgres ordena por bytes («Café 10» antes que «Café 2»): se reordena
       aquí con el mismo criterio que usa el directorio. */
    comercios: lista.sort((a, b) => compararNombres(a.nombre, b.nombre)),
    categorias: categoriasOrdenadas,
    ciudades: Array.from(ciudadesDelClub)
      .map((id) => ({ id, nombre: nombreCiudad.get(id) ?? '' }))
      .sort((a, b) => compararNombres(a.nombre, b.nombre)),
  }
})

/**
 * Lo que pinta la landing: cinco destacados, las fotos del carrusel y el
 * total del club.
 */
export const obtenerVitrinaPublica = cache(async (): Promise<DatosVitrina> => {
  const { comercios } = await cargarCatalogoPublico()

  /*
    Delante, quien tiene algo que enseñar. Una tarjeta de «destacados» sin
    fotografía es un rectángulo negro con un logotipo, y sin beneficio no
    tiene nada que prometer: primero los que traen las dos cosas, luego los
    que traen foto, luego los que traen beneficio. `sort` es estable, así que
    dentro de cada grupo se conserva el orden alfabético.
  */
  const peso = (c: ComercioVitrina) => (c.portadaUrl ? 2 : 0) + (c.beneficioDestacado ? 1 : 0)
  const ordenados = [...comercios].sort((a, b) => peso(b) - peso(a))

  const fotos: FotoPublica[] = ordenados.flatMap((c) =>
    c.portadaUrl ? [{ url: c.portadaUrl, alt: `${c.nombre}, comercio aliado de ORUM` }] : [],
  )

  return {
    destacados: ordenados.slice(0, TOPE_DESTACADOS),
    fotos: fotos.slice(0, TOPE_FOTOS),
    totalComercios: comercios.length,
  }
})

/** El directorio entero, con sus opciones de filtro. */
export const obtenerDirectorioPublico = cache(
  async (): Promise<CatalogoPublico> => cargarCatalogoPublico(),
)

/* ==========================================================================
   LA FICHA PÚBLICA
   ========================================================================== */

export type SedePublica = {
  id: number
  nombre: string | null
  direccion: string | null
  ciudadNombre: string | null
}

export type FichaPublica = {
  id: number
  nombre: string
  descripcion: string | null
  categoriaNombre: string | null
  logoUrl: string | null
  portadaUrl: string | null
  ciudades: string[]
  sedes: SedePublica[]
  /** Beneficios vigentes, ya formateados. La ficha los enseña desenfocados. */
  beneficios: string[]
  fotos: FotoPublica[]
}

/**
 * La ficha de un comercio para quien todavía no es socio.
 *
 * Devuelve `null` en los tres casos fatales —no existe, inactivo, borrado—
 * sin distinguirlos, igual que la ficha del portal de miembros: distinguirlos
 * permitiría enumerar comercios dados de baja probando ids.
 */
export const obtenerFichaPublica = cache(async (id: number): Promise<FichaPublica | null> => {
  const supabase = createAdminClient()
  const hoy = hoyISO()

  const [
    { data: comercio },
    { data: marcas },
    { data: categorias },
    { data: promociones },
    { data: tipos },
    { data: sucursales },
    { data: ciudades },
    { data: imagenes },
  ] = await Promise.all([
    supabase
      .from('comercios')
      .select('id, nombre, descripcion, logo_url, portada_url, categoria_id, marca_id')
      .eq('id', id)
      .eq('activo', true)
      .is('deleted_at', null)
      .maybeSingle(),
    supabase.from('marcas').select('id, logo_url').limit(200),
    supabase.from('categorias').select('id, nombre').limit(100),
    supabase
      .from('promociones')
      .select('valor, tipo_beneficio_id, activo, fecha_inicio, fecha_fin')
      .eq('comercio_id', id)
      .eq('activo', true)
      .is('deleted_at', null)
      .limit(50),
    supabase.from('tipos_beneficio').select('id, codigo').limit(100),
    supabase
      .from('sucursales')
      .select('id, nombre, direccion, ciudad_id')
      .eq('comercio_id', id)
      .eq('activo', true)
      .is('deleted_at', null)
      .order('nombre')
      .limit(50),
    supabase.from('ciudades').select('id, nombre').limit(200),
    /* La galería puede no existir en una base sin la migración: el error deja
       `data` en `null` y la ficha se pinta sin fotos, que es la verdad. */
    supabase
      .from('comercio_imagenes')
      .select('id, url, descripcion, orden')
      .eq('comercio_id', id)
      .order('orden')
      .limit(12),
  ])

  if (!comercio) return null

  const nombreCiudad = new Map((ciudades ?? []).map((c) => [c.id, c.nombre]))
  const codigoTipo = new Map((tipos ?? []).map((t) => [t.id, t.codigo]))
  const logoMarca = comercio.marca_id
    ? ((marcas ?? []).find((m) => m.id === comercio.marca_id)?.logo_url ?? null)
    : null

  const sedes: SedePublica[] = (sucursales ?? []).map((s) => ({
    id: s.id,
    nombre: (s.nombre ?? '').trim() || null,
    direccion: (s.direccion ?? '').trim() || null,
    ciudadNombre: nombreCiudad.get(s.ciudad_id) ?? null,
  }))

  /* Dos promociones con el mismo valor se anunciarían dos veces con el mismo
     texto: el `Set` las funde. */
  const beneficios = Array.from(
    new Set(
      (promociones ?? [])
        .filter((p) => esPromocionVigente(p.activo, p.fecha_inicio, p.fecha_fin, hoy))
        .flatMap((p) => {
          const codigo = codigoTipo.get(p.tipo_beneficio_id)
          return codigo ? [formatearBeneficio(codigo, p.valor)] : []
        }),
    ),
  )

  const fotos: FotoPublica[] = (imagenes ?? []).flatMap((i) => {
    const url = (i.url ?? '').trim()
    /* Vacío = decorativa, como dice el propio tipo. Nunca el nombre del
       archivo, que un lector de pantalla deletrearía. */
    return url ? [{ url, alt: (i.descripcion ?? '').trim() }] : []
  })

  return {
    id: comercio.id,
    nombre: comercio.nombre,
    descripcion: comercio.descripcion,
    categoriaNombre: comercio.categoria_id
      ? ((categorias ?? []).find((c) => c.id === comercio.categoria_id)?.nombre ?? null)
      : null,
    logoUrl: resolverLogoComercio(comercio.logo_url, logoMarca),
    portadaUrl: (comercio.portada_url ?? '').trim() || null,
    ciudades: Array.from(new Set(sedes.flatMap((s) => (s.ciudadNombre ? [s.ciudadNombre] : [])))),
    sedes,
    beneficios,
    fotos,
  }
})

/* ==========================================================================
   LOS PLANES
   ========================================================================== */

/**
 * Los planes de membresía que se venden hoy, ya con el ahorro calculado.
 *
 * Solo planes activos y no borrados: uno retirado no se anuncia en la puerta.
 */
export const obtenerPlanesPublicos = cache(async (): Promise<PlanPublico[]> => {
  const supabase = createAdminClient()
  const { data } = await supabase
    .from('planes_membresia')
    .select('id, nombre, descripcion, precio, duracion_meses')
    .eq('activo', true)
    .is('deleted_at', null)
    .limit(20)

  /* `numeric` puede llegar como cadena según la versión de PostgREST: se
     normaliza aquí para que la función pura trabaje siempre con números. */
  return prepararPlanes((data ?? []).map((p) => ({ ...p, precio: Number(p.precio) })))
})

/**
 * El WhatsApp de soporte, de `configuracion.whatsapp_soporte`.
 *
 * Devuelve `null` si la fila no existe o está vacía, y **eso no puede romper
 * la landing**: la spec lo trata como dato obligatorio del lanzamiento, pero
 * un clon recién hecho no lo tiene y la fachada tiene que seguir siendo
 * navegable. Quien llama decide qué ocultar (SPEC §5.2).
 */
export const obtenerWhatsappSoporte = cache(async (): Promise<string | null> => {
  const supabase = createAdminClient()

  const { data } = await supabase
    .from('configuracion')
    .select('valor')
    .eq('clave', 'whatsapp_soporte')
    .maybeSingle()

  const valor = (data?.valor ?? '').trim()
  return valor === '' ? null : valor
})

/**
 * El instante actual, según el reloj del SERVIDOR.
 *
 * Lo usa la comprobación anti-robot del formulario de aliados: el reloj del
 * visitante puede ir mal o estar manipulado, así que el único con el que se
 * puede comparar «cuánto tardó en rellenarlo» es este.
 *
 * Es `async` a propósito, aunque no espere nada. `Date.now()` es impuro y
 * llamarlo en el cuerpo de un componente es leerlo *durante el render*, que es
 * justo lo que la regla `react-hooks/purity` prohíbe —y con razón: en un
 * componente que se reevalúe, el valor cambiaría solo—. Pedirlo con `await` lo
 * saca del render y lo deja donde debe estar: en la capa de datos, junto a las
 * demás lecturas que hace la página.
 *
 * Deliberadamente SIN `cache()`: dos formularios pintados en la misma petición
 * pueden compartir instante sin problema, pero congelarlo entre peticiones
 * rompería la comprobación entera.
 */
export async function obtenerInstanteServidor(): Promise<number> {
  return Date.now()
}
