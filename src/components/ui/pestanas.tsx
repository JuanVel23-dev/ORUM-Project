'use client'

import Link from 'next/link'
import { useLayoutEffect, useRef, useState, type MouseEvent } from 'react'
import { prefiereMovimientoReducido } from '@/lib/shared/motion'
import styles from './pestanas.module.css'

/*
  PESTAÑAS DE UNA LISTA  ·  rediseño del panel (15/10/2026)
  ---------------------------------------------------------------------------
  Una franja gris muy suave con las opciones; la elegida es una PÍLDORA
  BLANCA que se levanta con su sombra (encargo: «no me gusta cómo se resalta
  el que estoy usando»; la raya debajo se descartó). Cada opción puede llevar
  un punto de color —el estado que representa— y su recuento.

  Son ENLACES: el filtro vive en la URL (se comparte, sobrevive a un
  refresco y funciona sin JavaScript). La elegida lo dice con
  `aria-current`, el peso y la sombra, nunca solo con el color.

  LA PÍLDORA SE DESLIZA (16/10/2026: «quiero que tenga animación de
  desplazamiento»). Es UNA pieza detrás de las pestañas que viaja de la vieja
  a la nueva con la técnica FLIP: se coloca de golpe en su sitio final (un
  solo cálculo de caja) y se anima `transform` desde donde estaba —sin
  animar el ancho, que recalcularía la caja en cada fotograma—.

    · Responde AL PULSAR, no cuando llega la página: la elegida pasa a ser la
      pulsada en el acto (optimista) y la URL lo confirma después.
    · Si la página se vuelve a montar por la navegación (la pantalla de
      carga), la última posición se recuerda por `etiqueta` y la nueva
      píldora sale de ahí.
    · Sin JavaScript, o antes de hidratar, cada pestaña pinta su propia
      píldora (`[data-activa]`), como siempre.
    · Con movimiento reducido no viaja: aparece en su sitio.
    · Es una animación NATIVA (`element.animate`), no de `motion`: la mueve
      el compositor y no gasta el hilo principal mientras llega la página.
*/

export type TonoPestana = 'neutro' | 'exito' | 'aviso' | 'peligro' | 'vacio'

export type Pestana = {
  href: string
  etiqueta: string
  cuenta?: number
  /** El color del punto; sin tono, sin punto. */
  tono?: TonoPestana
  activa: boolean
}

type Caja = { x: number; y: number; w: number; h: number }

/** La última posición de la píldora por grupo de pestañas, para la que se monte después. */
const ULTIMA = new Map<string, { caja: Caja; cuando: number }>()

/** Un clic que abre en otra pestaña o ventana no cambia la elegida aquí. */
function esClicNormal(e: MouseEvent) {
  return e.button === 0 && !e.metaKey && !e.ctrlKey && !e.shiftKey && !e.altKey
}

export function Pestanas({ items, etiqueta }: { items: Pestana[]; etiqueta: string }) {
  const hrefActivo = items.find((p) => p.activa)?.href ?? null

  // La pulsada manda hasta que la URL confirme (o cambie por otro camino).
  const [pulsada, setPulsada] = useState<{ href: string; desde: string | null } | null>(null)
  const elegida = pulsada && pulsada.desde === hrefActivo ? pulsada.href : hrefActivo

  const pista = useRef<HTMLElement>(null)
  const pildora = useRef<HTMLSpanElement>(null)
  const anterior = useRef<Caja | null>(null)

  useLayoutEffect(() => {
    const contenedor = pista.current
    const pieza = pildora.current
    if (!contenedor || !pieza) return

    const colocar = (animar: boolean) => {
      const destino = elegida
        ? contenedor.querySelector<HTMLElement>(`[data-href="${CSS.escape(elegida)}"]`)
        : null
      if (!destino) {
        pieza.dataset.oculta = ''
        anterior.current = null
        return
      }
      delete pieza.dataset.oculta
      const caja: Caja = {
        x: destino.offsetLeft,
        y: destino.offsetTop,
        w: destino.offsetWidth,
        h: destino.offsetHeight,
      }
      pieza.style.setProperty('--x', `${caja.x}px`)
      pieza.style.setProperty('--y', `${caja.y}px`)
      pieza.style.setProperty('--w', `${caja.w}px`)
      pieza.style.setProperty('--h', `${caja.h}px`)

      // De dónde sale: la de este montaje o, si es nuevo, la que dejó el anterior.
      const recordada = ULTIMA.get(etiqueta)
      const desde =
        anterior.current ??
        (recordada && performance.now() - recordada.cuando < 4000 ? recordada.caja : null)
      anterior.current = caja
      ULTIMA.set(etiqueta, { caja, cuando: performance.now() })

      if (!animar || !desde || (desde.x === caja.x && desde.y === caja.y && desde.w === caja.w)) {
        return
      }
      if (prefiereMovimientoReducido()) return
      // Animación nativa (la mueve el compositor) con la curva y la duración
      // de los tokens: `--ease-out` y `--dur-slow`.
      const estilo = getComputedStyle(pieza)
      pieza.getAnimations().forEach((a) => a.cancel())
      pieza.animate(
        [
          {
            transform: `translate(${desde.x - caja.x}px, ${desde.y - caja.y}px) scaleX(${desde.w / caja.w})`,
          },
          { transform: 'translate(0px, 0px) scaleX(1)' },
        ],
        {
          duration: parseFloat(estilo.getPropertyValue('--dur-slow')) || 320,
          easing: estilo.getPropertyValue('--ease-out').trim() || 'ease-out',
        },
      )
    }

    colocar(true)
    // Desde aquí la pinta la pieza que viaja, no cada pestaña.
    contenedor.dataset.pildora = ''

    // Si cambia el ancho (la ventana, la barra lateral), se recoloca sin viajar.
    const observador = new ResizeObserver(() => colocar(false))
    observador.observe(contenedor)
    return () => observador.disconnect()
  }, [elegida, etiqueta])

  return (
    <nav ref={pista} aria-label={etiqueta} className={styles.pista}>
      <span ref={pildora} className={styles.pildora} aria-hidden="true" />
      {items.map((p) => {
        const activa = p.href === elegida
        return (
          <Link
            key={p.href}
            href={p.href}
            scroll={false}
            className={styles.pestana}
            aria-current={activa ? 'page' : undefined}
            data-activa={activa || undefined}
            data-href={p.href}
            onClick={(e) => {
              if (esClicNormal(e) && p.href !== elegida) setPulsada({ href: p.href, desde: hrefActivo })
            }}
          >
            {p.tono && <span className={styles.punto} data-tono={p.tono} aria-hidden="true" />}
            {p.etiqueta}
            {p.cuenta !== undefined && (
              <span className={styles.cuenta}>{p.cuenta.toLocaleString('es-CO')}</span>
            )}
          </Link>
        )
      })}
    </nav>
  )
}
