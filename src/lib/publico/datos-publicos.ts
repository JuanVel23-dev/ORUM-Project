import 'server-only'

import { cache } from 'react'
import { createAdminClient } from '@/lib/supabase/admin'
import { resolverLogoComercio } from '@/lib/comercios/logo-comercio'
import { esPromocionVigente } from '@/lib/comercios/promocion-vigente'
import { formatearBeneficio } from '@/lib/comercios/beneficios-formato'
import { hoyISO } from '@/lib/shared/fecha'

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
       `descripcion`, `logo_url`, `categoria_id` y `marca_id`. De `marcas`:
       `id` y `logo_url`. De `promociones`, lo justo para saber si hay un
       beneficio vigente y cómo se llama.
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

/** Cuántas tarjetas entran en la vitrina. Es una muestra, no el catálogo. */
const TOPE_VITRINA = 8

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
  categoriaNombre: string | null
  ciudades: string[]
  logoUrl: string | null
  /** Texto ya formateado del beneficio vigente más visible, o `null`. */
  beneficioDestacado: string | null
  /**
   * EL HUECO DE LA PORTADA, todavía sin columna.
   *
   * `comercios.portada_url` está prevista en
   * `supabase/migrations/20260913120000_imagenes_y_avatares.sql`, pero esa
   * migración NO está aplicada y la columna no existe en `database.types.ts`:
   * consultarla rompería el tipado y la consulta entera. El campo se declara
   * para que el día que exista la fotografía entre por datos y no por una
   * reescritura de la tarjeta; hoy llega `null` en el 100 % de los casos y
   * cuesta cero en ejecución.
   */
  portadaUrl?: string | null
}

export type DatosVitrina = {
  /** La muestra que se pinta en el carrusel, hasta `TOPE_VITRINA`. */
  comercios: ComercioVitrina[]
  /** Cuántos comercios activos hay en total. Es la primera cifra del club. */
  totalComercios: number
  /** En cuántas ciudades distintas hay al menos una sucursal activa. */
  totalCiudades: number
}

const VACIO: DatosVitrina = { comercios: [], totalComercios: 0, totalCiudades: 0 }

export const obtenerVitrinaPublica = cache(async (): Promise<DatosVitrina> => {
  const supabase = createAdminClient()
  // Fecha civil 'YYYY-MM-DD' en America/Bogotá: `fecha_inicio` y `fecha_fin` de
  // promociones son fechas civiles, no `timestamptz`. Se comparan como cadenas.
  const hoy = hoyISO()

  const [{ data: comercios }, { data: marcas }, { data: categorias }] = await Promise.all([
    supabase
      .from('comercios')
      .select('id, nombre, descripcion, logo_url, categoria_id, marca_id')
      .eq('activo', true)
      .is('deleted_at', null)
      .order('nombre')
      .limit(100),
    supabase.from('marcas').select('id, logo_url').limit(100),
    supabase.from('categorias').select('id, nombre').limit(100),
  ])

  if (!comercios || comercios.length === 0) return VACIO

  const ids = comercios.map((c) => c.id)

  const [{ data: promociones }, { data: tipos }, { data: sucursales }, { data: ciudades }] =
    await Promise.all([
      supabase
        .from('promociones')
        .select('comercio_id, valor, tipo_beneficio_id, activo, fecha_inicio, fecha_fin')
        .eq('activo', true)
        .is('deleted_at', null)
        .in('comercio_id', ids)
        .limit(200),
      supabase.from('tipos_beneficio').select('id, codigo').limit(100),
      supabase
        .from('sucursales')
        .select('comercio_id, ciudad_id')
        .eq('activo', true)
        .is('deleted_at', null)
        .in('comercio_id', ids)
        .limit(200),
      supabase.from('ciudades').select('id, nombre').limit(100),
    ])

  const logoDeMarca = new Map((marcas ?? []).map((m) => [m.id, m.logo_url]))
  const nombreCategoria = new Map((categorias ?? []).map((c) => [c.id, c.nombre]))
  const nombreCiudad = new Map((ciudades ?? []).map((c) => [c.id, c.nombre]))
  const codigoTipo = new Map((tipos ?? []).map((t) => [t.id, t.codigo]))

  const ciudadesPorComercio = new Map<number, Set<string>>()
  const ciudadesDelClub = new Set<string>()
  for (const s of sucursales ?? []) {
    const nombre = nombreCiudad.get(s.ciudad_id)
    if (!nombre) continue
    if (!ciudadesPorComercio.has(s.comercio_id)) {
      ciudadesPorComercio.set(s.comercio_id, new Set())
    }
    ciudadesPorComercio.get(s.comercio_id)!.add(nombre)
    ciudadesDelClub.add(nombre)
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

  const todos: ComercioVitrina[] = comercios.map((c) => ({
    id: c.id,
    nombre: c.nombre,
    descripcion: c.descripcion,
    categoriaNombre: c.categoria_id ? (nombreCategoria.get(c.categoria_id) ?? null) : null,
    ciudades: Array.from(ciudadesPorComercio.get(c.id) ?? []),
    logoUrl: resolverLogoComercio(
      c.logo_url,
      c.marca_id ? (logoDeMarca.get(c.marca_id) ?? null) : null,
    ),
    beneficioDestacado: beneficioPorComercio.get(c.id) ?? null,
    portadaUrl: null,
  }))

  /*
    Delante, quien tiene algo que enseñar: primero los que traen beneficio
    vigente, luego el resto. Es el mismo criterio que ordena la portada del
    portal de miembros — una vitrina que abre con cuatro tarjetas sin
    beneficio se lee como catálogo vacío.

    `sort` estable en todos los motores modernos, así que dentro de cada grupo
    se conserva el orden alfabético que trajo la consulta.
  */
  const ordenados = [...todos].sort(
    (a, b) => Number(Boolean(b.beneficioDestacado)) - Number(Boolean(a.beneficioDestacado)),
  )

  return {
    comercios: ordenados.slice(0, TOPE_VITRINA),
    totalComercios: todos.length,
    totalCiudades: ciudadesDelClub.size,
  }
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
