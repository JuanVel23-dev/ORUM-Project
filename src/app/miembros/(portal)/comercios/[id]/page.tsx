import { cache } from 'react'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ChevronLeft, MapPin, Phone, Store } from 'lucide-react'
import { requireMiembroVigente } from '@/lib/miembros/requerir-miembro'
import { resolverVolverAlCatalogo } from '@/lib/miembros/volver-catalogo'
import { createClient } from '@/lib/supabase/server'
import { esPromocionVigente } from '@/lib/comercios/promocion-vigente'
import { formatearBeneficio } from '@/lib/comercios/beneficios-formato'
import { resolverLogoComercio } from '@/lib/comercios/logo-comercio'
import { hoyISO } from '@/lib/shared/fecha'
import type { TipoBeneficioCodigo } from '@/lib/supabase/database.types'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { ComercioLogo } from '@/components/ui/comercio-logo'
import { EmptyState } from '@/components/ui/feedback'
import { WhatsAppButton } from '@/components/ui/whatsapp-button'
import estilos from './ficha.module.css'

/*
  FICHA DE COMERCIO — es una PÁGINA, no un overlay.

  `CLAUDE.md` dice que un formulario no navega, se abre encima. Esto no es un
  formulario: es contenido, y el contenido se empuja. Además un overlay
  exigiría una ranura `@modal` nueva bajo `/miembros`, y la norma es explícita
  en que la ranura vive en `app/admin/layout.tsx` y SOLO ahí. Es la ruptura que
  más fácil se cuela por reflejo, así que queda escrita: aquí no hay
  `OverlayRuta`, ni `useCerrarOverlay`, ni `@modal`.

  Server Component sin una sola línea de cliente. Los `searchParams` —de donde
  sale el destino de la vuelta— están disponibles en el servidor, así que la
  barra de vuelta no necesita `useSearchParams()` ni la frontera de `Suspense`
  que eso arrastraría al cromo.
*/

const MENSAJE_SOPORTE_SEDES =
  'Hola, quiero saber dónde puedo usar mi beneficio ORUM en este comercio.'

/** Id numérico de la URL, o `null`. Entrada no confiable: llega de la ruta. */
function idOnulo(valor: string): number | null {
  const n = Number(valor)
  return Number.isInteger(n) && n > 0 ? n : null
}

type Hero = {
  id: number
  nombre: string
  descripcion: string | null
  marcaNombre: string | null
  categoriaNombre: string | null
  logoUrl: string | null
}

/**
 * El comercio y los dos nombres que lo acompañan.
 *
 * `cache()` de React memoiza la llamada DENTRO de la misma petición, que es lo
 * que permite que `generateMetadata` y la página compartan una sola consulta
 * en vez de duplicarla. No es caché entre peticiones —ninguna pantalla de este
 * repositorio declara caché— y no cambia la frescura de nada: dos llamadas en
 * el mismo render devuelven la misma fila.
 *
 * Devuelve `null` en los TRES casos fatales —no existe, `activo === false`,
 * `deleted_at` no nulo— sin distinguirlos. Distinguirlos permitiría enumerar
 * comercios inactivos probando ids.
 */
const cargarComercio = cache(async (id: number): Promise<Hero | null> => {
  /*
    `createClient()`, NUNCA `createAdminClient()`. El panel usa service role y
    salta RLS; los portales de usuario final, jamás. `admin.ts` lleva
    `server-only` para que el fallo sea de compilación, pero la regla se
    escribe igual: la barrera técnica no sustituye a la intención.
  */
  const supabase = await createClient()

  /*
    Las tres consultas son independientes, así que van juntas. Encadenar
    `await` —leer el comercio y solo después su marca— sería la regresión que
    el commit `e1fc40a` vino a cerrar.

    Marca y categoría se leen ENTERAS, como ya hace el catálogo: son
    diccionarios de decenas de filas, y traerlos completos cuesta una consulta
    paralela en vez de una encadenada al `marca_id` que todavía no conocemos.
  */
  const [{ data: comercio }, { data: marcas }, { data: categorias }] = await Promise.all([
    supabase
      .from('comercios')
      .select('id, nombre, descripcion, marca_id, categoria_id, logo_url')
      .eq('id', id)
      .eq('activo', true)
      .is('deleted_at', null)
      .maybeSingle(),
    supabase.from('marcas').select('id, nombre, logo_url').limit(100),
    supabase.from('categorias').select('id, nombre').limit(100),
  ])

  if (!comercio) return null

  const marca = comercio.marca_id
    ? ((marcas ?? []).find((m) => m.id === comercio.marca_id) ?? null)
    : null
  const categoria = comercio.categoria_id
    ? ((categorias ?? []).find((c) => c.id === comercio.categoria_id) ?? null)
    : null

  return {
    id: comercio.id,
    nombre: comercio.nombre,
    descripcion: comercio.descripcion,
    marcaNombre: marca?.nombre ?? null,
    categoriaNombre: categoria?.nombre ?? null,
    // La misma cadena comercio -> marca -> inicial que usa el catálogo.
    logoUrl: resolverLogoComercio(comercio.logo_url, marca?.logo_url ?? null),
  }
})

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const numero = idOnulo(id)
  const comercio = numero ? await cargarComercio(numero) : null

  /* El título del caso fatal es el mismo para los tres motivos, igual que la
     pantalla: no se filtra por la pestaña del navegador lo que la página
     calla. */
  return { title: comercio ? `${comercio.nombre} · ORUM` : 'Comercio no disponible · ORUM' }
}

type Beneficio = {
  id: number
  titulo: string
  descripcion: string | null
  tipoCodigo: TipoBeneficioCodigo
  valor: number | null
}

type Sede = {
  id: number
  nombre: string
  direccion: string | null
  telefono: string | null
  ciudadNombre: string | null
}

export default async function FichaComercioPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>
  searchParams: Promise<{ volver?: string | string[] }>
}) {
  /*
    SIN EXCEPCIÓN, y antes de leer nada. Un socio con la membresía vencida no
    puede ver la ficha de un beneficio que no puede usar; enseñársela sería
    prometer en la pantalla lo que la caja del comercio va a denegar delante
    del cliente.
  */
  await requireMiembroVigente()

  const [{ id }, paramsCrudos] = await Promise.all([params, searchParams])

  const numero = idOnulo(id)
  if (numero === null) notFound()

  const supabase = await createClient()
  /* Fecha civil 'YYYY-MM-DD' en America/Bogota. `toISOString().slice(0,10)` es
     UTC y adelanta el día cada tarde: una promoción que vence hoy dejaría de
     verse a partir de las 7pm hora Colombia. */
  const hoy = hoyISO()

  /*
    Cuatro consultas más, todas independientes entre sí y de la del hero, así
    que arrancan a la vez. Ninguna espera a la anterior.

    Se lanzan ANTES de resolver el hero a propósito: si el comercio no existe
    se descartan sus resultados, que cuesta menos que encadenar una espera
    entera en el caso normal, que es el que existe.
  */
  const datos = Promise.all([
    cargarComercio(numero),
    supabase
      .from('promociones')
      .select('id, titulo, descripcion, valor, tipo_beneficio_id, activo, fecha_inicio, fecha_fin')
      .eq('comercio_id', numero)
      .eq('activo', true)
      .is('deleted_at', null)
      .order('titulo')
      .limit(100),
    supabase.from('tipos_beneficio').select('id, codigo').limit(100),
    supabase
      .from('sucursales')
      .select('id, nombre, direccion, telefono, ciudad_id')
      .eq('comercio_id', numero)
      .eq('activo', true)
      .is('deleted_at', null)
      .order('nombre')
      .limit(100),
    supabase.from('ciudades').select('id, nombre').limit(100),
    supabase
      .from('configuracion')
      .select('valor')
      .eq('clave', 'whatsapp_soporte')
      .maybeSingle(),
  ])

  const [
    comercio,
    { data: promociones },
    { data: tipos },
    { data: sucursales },
    { data: ciudades },
    { data: configSoporte },
  ] = await datos

  /* No existe, está inactivo o tiene `deleted_at`: los tres dan exactamente la
     misma pantalla (`not-found.tsx` de esta carpeta). */
  if (!comercio) notFound()

  const codigoTipo = new Map((tipos ?? []).map((t) => [t.id, t.codigo]))
  const nombreCiudad = new Map((ciudades ?? []).map((c) => [c.id, c.nombre]))

  /*
    SOLO PROMOCIONES VIGENTES, con el mismo criterio que el catálogo. Una ficha
    que anunciara un beneficio caducado contradiría a la tarjeta desde la que
    se llegó, y sobre todo prometería lo que la caja del comercio rechaza.
  */
  const beneficios: Beneficio[] = (promociones ?? [])
    .filter((p) => esPromocionVigente(p.activo, p.fecha_inicio, p.fecha_fin, hoy))
    .flatMap((p) => {
      const tipoCodigo = codigoTipo.get(p.tipo_beneficio_id)
      if (!tipoCodigo) return []
      return [
        {
          id: p.id,
          titulo: p.titulo,
          descripcion: p.descripcion,
          tipoCodigo,
          valor: p.valor,
        },
      ]
    })

  const sedes: Sede[] = (sucursales ?? []).map((s) => {
    const ciudadNombre = nombreCiudad.get(s.ciudad_id) ?? null
    return {
      id: s.id,
      /* `sucursales.nombre` es opcional. Un comercio de un solo local suele
         dejarlo vacío: la ciudad es entonces el nombre más útil que tenemos,
         y «Sede» a secas el último recurso. Nunca una fila sin encabezado. */
      nombre: (s.nombre ?? '').trim() || ciudadNombre || 'Sede',
      direccion: s.direccion,
      telefono: s.telefono,
      ciudadNombre,
    }
  })

  const ciudadesDelComercio = Array.from(
    new Set(sedes.map((s) => s.ciudadNombre).filter((c): c is string => Boolean(c))),
  )

  const soporte = configSoporte?.valor ?? null

  /*
    ENTRADA NO CONFIABLE. `?volver=` viaja en una URL que cualquiera puede
    enviar; sin la lista blanca de `resolverVolverAlCatalogo` el botón de
    vuelta de una pantalla autenticada sería una redirección abierta, y de las
    peores, porque el socio la pulsa creyendo que vuelve al catálogo.
  */
  const hrefVolver = resolverVolverAlCatalogo(paramsCrudos.volver)

  return (
    <div className={estilos.pagina}>
      {/*
        LA VUELTA ES CROMO DE LA FICHA, no un enlace dentro del contenido:
        barra pegajosa anclada justo bajo la cabecera, con fondo sólido y su
        hairline. Nunca se desplaza fuera de la vista.

        El camino normal sigue siendo el gesto atrás del sistema, que conserva
        filtros y scroll gratis porque los dos viven en la URL. Esta barra es
        la salida de quien llega por enlace directo o pierde el gesto.

        Sin `backdrop-filter`: apilar una segunda capa de material sobre la
        cabecera es caro en gama media, y con fondo sólido la prohibición de
        `CLAUDE.md` ni siquiera entra en juego.

        La etiqueta es «Comercios» —el destino, como en iOS— y no «Volver»: no
        promete devolver a unos resultados que puede que no existan.
      */}
      <div className={estilos.barraVuelta}>
        <Link href={hrefVolver} className={estilos.volver}>
          <ChevronLeft size={18} aria-hidden />
          Comercios
        </Link>
      </div>

      <header className={estilos.hero}>
        <ComercioLogo logoUrl={comercio.logoUrl} nombre={comercio.nombre} variante="hero" />

        <div className={estilos.heroTextos}>
          {/* Único `h1` de la pantalla. `--t-title-1` (24px FIJO) y no
              `--t-display-2`: junto a una placa de 144px, a 375px le quedan
              187px, y un tamaño que creciera a 32px partiría el nombre en
              cuatro líneas. */}
          <h1 className={estilos.nombre}>{comercio.nombre}</h1>

          {/* Es lo que explica por qué se ve ESE logotipo cuando el comercio
              no tiene uno propio y hereda el de su marca (V4). */}
          {comercio.marcaNombre && <p className={estilos.marca}>{comercio.marcaNombre}</p>}
        </div>

        {(comercio.categoriaNombre || ciudadesDelComercio.length > 0) && (
          <p className={estilos.meta}>
            {comercio.categoriaNombre && (
              <span className={estilos.categoria}>{comercio.categoriaNombre}</span>
            )}
            {ciudadesDelComercio.length > 0 && (
              <span className={estilos.ciudades}>
                {/* El texto que sigue ya dice las ciudades. */}
                <MapPin size={13} aria-hidden />
                {ciudadesDelComercio.join(' · ')}
              </span>
            )}
          </p>
        )}
      </header>

      {/* V3 · Sin descripción, el bloque NO se renderiza y no deja hueco: un
          «Sin descripción» de relleno sería peor que el silencio. */}
      {comercio.descripcion && (
        <p className={estilos.descripcion}>{comercio.descripcion}</p>
      )}

      <section className={estilos.seccion} aria-labelledby="titulo-beneficios">
        <h2 id="titulo-beneficios" className={estilos.tituloSeccion}>
          Tus beneficios
        </h2>

        {beneficios.length > 0 ? (
          <Card padding="none">
            <ul className={estilos.listaBeneficios}>
              {beneficios.map((b) => (
                <li key={b.id} className={estilos.beneficio}>
                  <div className={estilos.beneficioCabecera}>
                    <h3 className={estilos.beneficioTitulo}>{b.titulo}</h3>
                    {/* La cifra va DENTRO de la píldora: el oro nunca es el
                        único portador del significado. */}
                    <Badge tone="gold" size="sm">
                      {formatearBeneficio(b.tipoCodigo, b.valor)}
                    </Badge>
                  </div>
                  {b.descripcion && (
                    <p className={estilos.beneficioDetalle}>{b.descripcion}</p>
                  )}
                </li>
              ))}
            </ul>
          </Card>
        ) : (
          /* V1 · La sección CONSERVA su `h2` y pone un bloque de estado, no un
             hueco: una ficha a medio dibujar se lee como error de carga. */
          <Card variant="sunk" padding="none">
            <EmptyState
              icon={<Store size={24} />}
              title="Sin beneficios vigentes hoy"
              description="Este aliado no tiene ningún beneficio publicado en este momento. En cuanto lo tenga, aparecerá aquí."
              actions={
                <Button href="/miembros" variant="secondary">
                  Ver otros comercios
                </Button>
              }
            />
          </Card>
        )}
      </section>

      {/*
        LA ACCIÓN PRINCIPAL VA AQUÍ, entre los beneficios y las sedes.

        El socio acaba de leer lo que le descuentan y en ese momento exacto
        tiene delante el botón que lo hace efectivo. Al final de la página
        quedaría escondida tras la lista de sucursales; arriba llegaría antes
        de que sepa si le interesa.

        `variant="brand"` es el relleno dorado PLANO (5,40:1 texto/relleno),
        no `variant="gold"`, que es el barrido y reprueba 1.4.3 en tema claro.
        `size` por defecto (md): T4 mide 6,03 % del lienzo a 375px, dentro de
        la Regla A; `lg` subiría a 7,13 %. Es la ÚNICA acción dorada de la
        pantalla — la vuelta es terciaria y las sedes no son accionables.
      */}
      <div className={estilos.accion}>
        <Button href="/miembros/perfil" variant="brand" fullWidth>
          Mostrar mi carnet
        </Button>
      </div>

      <section className={estilos.seccion} aria-labelledby="titulo-sedes">
        <h2 id="titulo-sedes" className={estilos.tituloSeccion}>
          Dónde usarlo
        </h2>

        {sedes.length > 0 ? (
          <ul className={estilos.listaSedes}>
            {sedes.map((s) => (
              <li key={s.id}>
                <Card className={estilos.sede}>
                  <h3 className={estilos.sedeNombre}>{s.nombre}</h3>

                  {(s.direccion || s.ciudadNombre) && (
                    <p className={estilos.sedeDato}>
                      {[s.direccion, s.ciudadNombre].filter(Boolean).join(' · ')}
                    </p>
                  )}

                  {s.telefono && (
                    /* El número es un enlace `tel:` y se conserva legible: en
                       el teléfono abre el marcador, en escritorio no estorba. */
                    <a href={`tel:${s.telefono.replace(/\s+/g, '')}`} className={estilos.sedeTelefono}>
                      <Phone size={14} aria-hidden />
                      {s.telefono}
                    </a>
                  )}
                </Card>
              </li>
            ))}
          </ul>
        ) : (
          /* V2 · Misma regla que V1: encabezado conservado, bloque de estado y
             una salida real. Sin número de soporte configurado, la salida es
             el catálogo: nunca un callejón. */
          <Card variant="sunk" padding="none">
            <EmptyState
              icon={<MapPin size={24} />}
              title="Todavía sin sedes publicadas"
              description={
                soporte
                  ? 'Este aliado todavía no ha publicado sus sedes. Escríbenos por WhatsApp y te decimos dónde encontrarlo.'
                  : 'Este aliado todavía no ha publicado sus sedes. Vuelve pronto: en cuanto las registre, aparecerán aquí.'
              }
              actions={
                soporte ? (
                  <WhatsAppButton telefono={soporte} mensaje={MENSAJE_SOPORTE_SEDES}>
                    Escribir a soporte
                  </WhatsAppButton>
                ) : (
                  <Button href="/miembros" variant="secondary">
                    Ver otros comercios
                  </Button>
                )
              }
            />
          </Card>
        )}
      </section>
    </div>
  )
}
