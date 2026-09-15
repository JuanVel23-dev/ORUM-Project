import type { CSSProperties } from 'react'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import { CarrilPista } from '@/components/ui/carril'
import { ComercioLogo } from '@/components/ui/comercio-logo'
import type { ComercioVitrina } from '@/lib/publico/datos-publicos'
import escaparate from '../escaparate.module.css'
import { Revelar } from './revelar'
import estilos from './vitrina-publica.module.css'

/*
  LA VITRINA  ·  hermana visual del carrusel del portal, pero NO interactiva
  ---------------------------------------------------------------------------
  Aquí se construye el deseo, con nombres y beneficios concretos, y solo después
  de que «Así funciona ORUM» haya explicado que hace falta ser socio para
  usarlos.

  LAS TARJETAS NO ENLAZAN A NINGÚN SITIO, y es la diferencia de fondo con
  `CarruselDestacados`. La ficha de un comercio vive en
  `/miembros/comercios/[id]`, detrás de `requireRolMiembro()`: un visitante
  anónimo que la pulsara acabaría en el formulario de acceso. Eso es un clic
  muerto — peor que no poder pulsar, porque promete algo y entrega un login.

  SCROLL NATIVO, como el carrusel del portal: el navegador ya da seguimiento
  1:1, resistencia elástica en los bordes y la proyección de momento del
  sistema operativo. Reimplementarlo sería peor y habría que auditarlo entero.
  Se navega con teclado porque la pista es desplazable y el navegador la mueve
  sola — sin `tabindex` que meta una parada estéril.

  SIN AUTOPLAY. Un carrusel que se mueve solo roba el control y es un fallo
  conocido de WCAG 2.2.2.

  POR QUÉ `CarrilPista` Y NO `Carril`. Son el mismo CSS: `Carril` es la pista
  más una cabecera de `h2` a `--t-title-2`. El escaparate sube TODOS sus
  encabezados de sección al peldaño ceremonial `--t-hero-2` con Fraunces, y si
  esta sección se quedara en la cabecera por defecto sería el único `h2` de la
  página en otra escala. `CarrilPista` se expone suelta exactamente para esto,
  y la geometría auditada de la pista —sangrado asimétrico, `overscroll`,
  reserva del anillo de foco— se sigue heredando sin duplicar una línea.

  Server Component: toda la animación es CSS. Lo único que se hidrata es el
  `Revelar`, que no re-renderiza nada —escribe un atributo en el DOM—.

  Consume `ComercioVitrina`, no `ComercioListado`: importar el modelo de una
  ruta privada desde una ruta pública invertiría la dependencia.
*/

/** Desfase de la entrada escalonada, en milisegundos. 60ms lee como secuencia
    sin que la última tarjeta llegue tarde; la banda de la v4 es 30–80. */
const PASO_ESCALONADO_MS = 60

/** Tope del escalonado. Importa más que el paso: con ocho tarjetas, un paso sin
    techo deja la última entrando medio segundo después y eso se lee como
    lentitud, no como ritmo. */
const TOPE_ESCALONADO_MS = 300

type Props = {
  comercios: ComercioVitrina[]
}

/**
 * La línea de apoyo del encabezado. Dice la verdad sobre lo que se enseña, sin
 * prometer un número redondo: «decenas de aliados» con tres comercios sería
 * exactamente la clase de exageración que se descubre al hacerse socio.
 */
function apoyo(cantidad: number): string {
  if (cantidad === 1) return 'El primer comercio del club. Y vienen más.'
  return `${cantidad} de los comercios donde tu carnet ya tiene beneficio.`
}

export function VitrinaPublica({ comercios }: Props) {
  /*
    SIN COMERCIOS NO SE RENDERIZA NADA: ni encabezado, ni pista vacía, ni una
    tarjeta de relleno (SPEC §5.1).

    Y tampoco se pinta un «aún no hay comercios». En el catálogo de miembros ese
    texto tiene a quién dirigirse; en una landing pública no, y restaría
    confianza justo en la primera impresión de alguien que no conoce la marca.
  */
  if (comercios.length === 0) return null

  return (
    <section
      className={[escaparate.franja, escaparate.tonoCrema, estilos.envoltura].join(' ')}
      id="comercios-aliados"
      aria-labelledby="vitrina-titulo"
    >
      <Revelar modo="contenedor">
        <div className={estilos.cabecera}>
          <h2 id="vitrina-titulo" className={escaparate.tituloSeccion}>
            Conoce a tus futuros aliados
          </h2>
          <p className={escaparate.apoyoSeccion}>{apoyo(comercios.length)}</p>
        </div>

        <CarrilPista className={estilos.pista}>
          {comercios.map((comercio, indice) => (
            <TarjetaVitrina key={comercio.id} comercio={comercio} indice={indice} />
          ))}
        </CarrilPista>
      </Revelar>
    </section>
  )
}

/*
  LA TARJETA  ·  cubierta + pie, y el orden en que lee el ojo
  ---------------------------------------------------------------------------
   1. CUBIERTA — reconocer, sin leer.
   2. NOMBRE — identificar. Primer texto y el más grande.
   3. BENEFICIO — convencer. Va el tercero porque «-20 %» no significa nada;
      «-20 % en Casa Duarte», sí.
   4. CATEGORÍA Y CIUDAD — descartar. El menor peso visual de la tarjeta.

  NINGÚN TEXTO SE APOYA SOBRE LA CUBIERTA, y ahora que hay fotografías reales
  esa decisión pasa de precaución a requisito: con texto encima, el contraste
  dejaría de ser propiedad de un token y pasaría a depender de la foto que suba
  cada comercio — un número que nadie puede firmar.
*/
function TarjetaVitrina({
  comercio,
  indice,
}: {
  comercio: ComercioVitrina
  indice: number
}) {
  const descripcion = (comercio.descripcion ?? '').trim()
  const portadaUrl = (comercio.portadaUrl ?? '').trim()
  const meta = [comercio.categoriaNombre, comercio.ciudades.join(' · ')]
    .filter(Boolean)
    .join(' · ')

  const retardo = Math.min(indice * PASO_ESCALONADO_MS, TOPE_ESCALONADO_MS)

  return (
    <div
      className={estilos.celda}
      /* Token dinámico: el único uso de `style` que la norma admite —inyectar
         un valor, nunca maquetar—. Es lo que escalona la entrada. */
      style={{ '--retardo': `${retardo}ms` } as CSSProperties}
    >
      <Card padding="none" className={estilos.superficie}>
        <div className={estilos.cubierta}>
          {/*
            LA FOTO DEL LOCAL, cuando la hay. `comercios.portada_url` ya existe
            y ya se consulta: una foto del sitio vende mucho más que un
            logotipo, y este es el escaparate.

            El material con la placa es SIEMPRE la capa de fondo y la foto va
            encima. Si falla no pinta nada —`alt` vacío— y queda el retrato de
            marca, sin `onError`, sin `'use client'` y sin salto de layout
            porque la proporción la fija el contenedor y no la imagen.
          */}
          {portadaUrl && (
            // eslint-disable-next-line @next/next/no-img-element -- URL externa arbitraria, no un asset local
            <img
              src={portadaUrl}
              /* Decorativa: el nombre del comercio está en texto justo debajo.
                 Con `alt=""` un fallo de carga no pinta ni texto alternativo ni
                 glifo de rotura. */
              alt=""
              className={estilos.foto}
              loading="lazy"
              decoding="async"
            />
          )}

          {portadaUrl && <span className={estilos.velo} aria-hidden="true" />}

          <ComercioLogo
            logoUrl={comercio.logoUrl}
            nombre={comercio.nombre}
            variante={portadaUrl ? 'tarjeta' : 'portada'}
            className={portadaUrl ? estilos.placaSobreFoto : undefined}
          />
        </div>

        <div className={estilos.pie}>
          {/* `h3` bajo el `h2` de la sección: misma jerarquía que reconocerá en
              el catálogo real el día que se haga socio. */}
          <h3 className={estilos.nombre}>{comercio.nombre}</h3>

          {/* La línea se pinta siempre, aunque quede vacía: la anatomía
              invariante es lo que hace que una fila mezclada se lea uniforme. */}
          <p className={estilos.meta}>{meta}</p>

          {/*
            Cascada: beneficio → descripción a una línea → nada, conservando la
            altura. Ni píldora vacía ni guion: silencio, no promesa.

            La píldora es oro DIFUSO (relleno al 10 % con la cifra en `--brand`),
            no oro sólido, y el dato va DENTRO de ella: el color nunca es el
            único portador del significado.
          */}
          <div className={estilos.ranura}>
            {comercio.beneficioDestacado ? (
              <Badge tone="gold" size="sm">
                {comercio.beneficioDestacado}
              </Badge>
            ) : descripcion ? (
              <p className={estilos.frase}>{descripcion}</p>
            ) : null}
          </div>
        </div>
      </Card>
    </div>
  )
}
