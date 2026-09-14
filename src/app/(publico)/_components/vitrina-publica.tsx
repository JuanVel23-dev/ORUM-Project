import type { CSSProperties } from 'react'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import { Carril } from '@/components/ui/carril'
import { ComercioLogo } from '@/components/ui/comercio-logo'
import type { ComercioVitrina } from '@/lib/publico/datos-publicos'
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

  Server Component puro: toda la animación es CSS, así que hidratar estas
  tarjetas sería un gasto a cambio de nada.

  Consume `ComercioVitrina`, no `ComercioListado`: importar el modelo de una
  ruta privada desde una ruta pública invertiría la dependencia.
*/

/** Desfase de la entrada escalonada, en milisegundos. Mismo valor que la portada
    del portal: 60ms lee como secuencia sin que la última tarjeta llegue tarde. */
const PASO_ESCALONADO_MS = 60

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
    <div className={estilos.envoltura} id="comercios-aliados">
      <Carril
        titulo="Conoce a tus futuros aliados"
        apoyo={apoyo(comercios.length)}
        pistaClassName={estilos.pista}
      >
        {comercios.map((comercio, indice) => (
          <TarjetaVitrina key={comercio.id} comercio={comercio} indice={indice} />
        ))}
      </Carril>
    </div>
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

  NINGÚN TEXTO SE APOYA SOBRE LA CUBIERTA. El día que exista `portada_url`, el
  contraste dejaría de ser propiedad de un token y pasaría a depender de la
  fotografía que suba cada comercio.
*/
function TarjetaVitrina({
  comercio,
  indice,
}: {
  comercio: ComercioVitrina
  indice: number
}) {
  const descripcion = (comercio.descripcion ?? '').trim()
  const meta = [comercio.categoriaNombre, comercio.ciudades.join(' · ')]
    .filter(Boolean)
    .join(' · ')

  return (
    <div
      className={estilos.celda}
      /* Token dinámico: el único uso de `style` que la norma admite —inyectar
         un valor, nunca maquetar—. Es lo que escalona la entrada. */
      style={{ '--retardo': `${indice * PASO_ESCALONADO_MS}ms` } as CSSProperties}
    >
      <Card padding="none" className={estilos.superficie}>
        <div className={estilos.cubierta}>
          <ComercioLogo
            logoUrl={comercio.logoUrl}
            nombre={comercio.nombre}
            variante="portada"
          />
        </div>

        <div className={estilos.pie}>
          {/* `h3` bajo el `h2` del carril: misma jerarquía que reconocerá en el
              catálogo real el día que se haga socio. */}
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
