'use client'

import { useState, type CSSProperties } from 'react'
import Link from 'next/link'
import { Flame, Pause, Play, TicketPercent } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { ComercioLogo } from '@/components/ui/comercio-logo'
import { formatearBeneficioCorto } from '@/lib/comercios/beneficios-formato'
import {
  duracionMarquesinaSegundos,
  mereceMarquesina,
  type TopDescuento,
} from '@/lib/comercios/top-descuentos'
import { hrefFicha } from './comercio-card'
import estilos from './top-descuentos.module.css'

/*
  TOP 10 DE DESCUENTOS DEL CLUB  ·  encargo nº 13
  ---------------------------------------------------------------------------
  Global, no personal: lo que más usa el club entero. No confundir con "Los que
  más usas", que es del socio y sale de otra función.

  EL PROPIETARIO LO QUIERE EN MOVIMIENTO, y se concede con la salvaguarda que
  WCAG 2.2.2 exige: **un contenido que se mueve solo más de cinco segundos
  necesita un mecanismo de pausa**. Sin eso es un fallo de accesibilidad
  conocido, no una opinión de diseño. Aquí hay cuatro mecanismos, y los cuatro
  tienen que seguir vivos:

    1. BOTÓN DE PAUSA VISIBLE. Es el único que cumple el criterio por sí solo:
       los otros tres son transitorios —dependen de mantener el ratón, el foco o
       el dedo— y el criterio pide detener, no suspender mientras aguantas.
    2. Al pasar el ratón  (`:hover` sobre la cinta).
    3. Al enfocar con teclado (`:focus-within`).
    4. Al tocarla (`pointerdown` sobre la cinta pausa de verdad, y el botón
       queda en "Reanudar": en táctil no hay `hover`, así que sin esto un dedo
       apoyado no detendría nada).

  Y NO SE MUEVE bajo `prefers-reduced-motion`. Eso NO significa "sin
  contenido": la cinta se queda quieta y se recorre con el dedo o con el tabulador
  como cualquier carril del portal. El botón de pausa desaparece porque no hay
  nada que pausar.

  SOLO `transform`. La cinta se desplaza con `translate` sobre una pista
  duplicada; ni `left`, ni `margin`, ni `scroll-left` animado.

  `'use client'` — y solo esto. Es la hoja del árbol: un botón con un booleano.
  El contenido lo genera el servidor y llega por props.
*/

/**
 * Ancho de una tarjeta de la cinta, en píxeles.
 *
 * Tiene que coincidir con `--top-item-w` del CSS. Vive aquí ADEMÁS porque la
 * duración se deriva de él: la velocidad es lo que se fija (px/s) y el tiempo
 * se calcula, para que una cinta de tres elementos y otra de diez se muevan
 * igual de despacio. Con una duración fija, la de tres se arrastraría.
 *
 * Si cambias uno, cambia el otro. No hay forma de leer una custom property
 * desde el servidor, y medir el DOM para esto exigiría un efecto y un
 * `ResizeObserver` a cambio de nada.
 */
const ANCHO_ITEM_PX = 232

export function TopDescuentos({
  items,
  volver = null,
}: {
  items: TopDescuento[]
  volver?: string | null
}) {
  const [pausada, setPausada] = useState(false)

  /*
    LA PUERTA. Con menos de tres, la sección NO SE PINTA: ni encabezado, ni
    cinta, ni hueco reservado. Es la regla de los vacíos del catálogo, y aquí
    pesa más que en ninguna otra sección porque lo que se ahorra no es espacio,
    es movimiento.

    Con la función `top_descuentos` todavía sin aplicar en la base, `items`
    llega vacío y esto se sale por aquí. El catálogo sigue entero.
  */
  if (!mereceMarquesina(items)) return null

  const duracion = duracionMarquesinaSegundos(items.length, ANCHO_ITEM_PX)

  return (
    <section className={estilos.seccion}>
      <div className={estilos.cabecera}>
        <div className={estilos.titulos}>
          {/* `h2`, el mismo nivel que las estanterías y que "Todos los
              comercios". Sin saltos. */}
          <h2 className={estilos.titulo}>
            <Flame size={18} aria-hidden="true" className={estilos.llama} />
            Top {items.length} del club
          </h2>
          <p className={estilos.apoyo}>Los descuentos que más usan los socios</p>
        </div>

        {/*
          EL BOTÓN DE PAUSA, VISIBLE. No es un adorno de accesibilidad
          escondido: es el mecanismo que cumple el criterio.

          `aria-pressed` diría "pulsado/no pulsado", que no es lo que importa;
          lo que importa es qué hace ahora. Por eso el nombre accesible cambia
          con el estado —"Pausar" / "Reanudar"— y el icono cambia con él.
        */}
        <button
          type="button"
          className={estilos.pausa}
          data-pulsable="sm"
          onClick={() => setPausada((p) => !p)}
        >
          {pausada ? (
            <Play size={14} aria-hidden="true" />
          ) : (
            <Pause size={14} aria-hidden="true" />
          )}
          <span className={estilos.pausaTexto}>{pausada ? 'Reanudar' : 'Pausar'}</span>
        </button>
      </div>

      {/*
        LA VENTANA. Recorta la cinta y es quien escucha el hover, el foco y el
        toque. El `pointerdown` pausa DE VERDAD —cambia el estado— porque en
        táctil no hay `:hover` que sostenga la pausa mientras el dedo está
        encima.
      */}
      <div
        className={estilos.ventana}
        data-pausada={pausada}
        onPointerDown={() => setPausada(true)}
      >
        <div
          className={estilos.cinta}
          /* Token dinámico: el único uso de `style` que la norma admite —
             inyectar un valor, nunca maquetar. */
          style={{ '--duracion': `${duracion}s` } as CSSProperties}
        >
          {/* LA COPIA REAL: enlaces, enfocables, anunciados. */}
          <ul className={estilos.grupo}>
            {items.map((item) => (
              <li key={item.promocionId} className={estilos.celda}>
                <Link
                  href={hrefFicha(item.comercioId, volver)}
                  className={estilos.tarjeta}
                >
                  <Contenido item={item} />
                </Link>
              </li>
            ))}
          </ul>

          {/*
            LA COPIA FANTASMA, que es lo que permite que el bucle no tenga
            costura: cuando la primera copia termina de salir por la izquierda,
            la segunda está justo donde estaba la primera y el salto a cero no
            se ve.

            `aria-hidden` Y SIN UN SOLO ENLACE DENTRO. Se pintan `<span>`, no
            `<a>`. Así no hay nada enfocable que esconder y no hace falta sacar
            nada del orden de tabulación —la norma prohíbe `tabIndex={-1}` en
            algo accionable, y la forma de no romperla es que aquí no haya nada
            accionable—. Para el lector de pantalla y para el teclado, esta
            copia sencillamente no existe.
          */}
          <ul className={estilos.grupo} aria-hidden="true">
            {items.map((item) => (
              <li key={`fantasma-${item.promocionId}`} className={estilos.celda}>
                <span className={estilos.tarjeta}>
                  <Contenido item={item} />
                </span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  )
}

/*
  EL CONTENIDO DE UNA TARJETA DE LA CINTA.

  Se extrae porque lo comparten la copia real y la fantasma: dos cuerpos
  distintos se desincronizarían, y la costura del bucle se vería justo donde no
  puede verse.

  NINGÚN `view-transition-name` aquí. Un comercio puede salir a la vez en la
  portada, en dos estanterías, en esta cinta —DOS VECES, contando la copia
  fantasma— y en la rejilla. Dos nombres iguales vivos en el mismo documento
  anulan la transición ENTERA en silencio.

  El puesto se pinta como número visible: es lo que convierte una fila de
  beneficios en un ranking, y da un segundo portador al orden que el
  desplazamiento por sí solo no comunica.
*/
function Contenido({ item }: { item: TopDescuento }) {
  return (
    <>
      <span className={estilos.puesto}>{item.puesto}</span>

      <ComercioLogo logoUrl={item.logoUrl} nombre={item.comercioNombre} />

      <span className={estilos.textos}>
        <span className={estilos.comercio}>{item.comercioNombre}</span>
        <span className={estilos.promocion}>{item.titulo}</span>
      </span>

      {/*
        LA CIFRA SOLA, con el icono del descuento.

        Aquí vivía la frase entera —«$1.250.000 de descuento»— dentro de una
        celda de ancho FIJO (`--top-item-w`). `Badge` no parte línea y el
        `min-width` automático de un hijo de flex es su ancho de contenido: no
        encogía, empujaba, y la insignia se salía de la tarjeta. Es el mismo
        fallo que ya se corrigió en la portada y en la rejilla — esta cinta se
        quedó atrás porque se escribió antes.
      */}
      <Badge
        tone="gold"
        size="sm"
        className={estilos.beneficio}
        icon={<TicketPercent size={12} aria-hidden="true" />}
      >
        {formatearBeneficioCorto(item.tipoCodigo, item.valor)}
      </Badge>
    </>
  )
}
