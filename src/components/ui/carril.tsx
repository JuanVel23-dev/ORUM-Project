import type { ReactNode } from 'react'
import styles from './carril.module.css'

/*
  SCROLL NATIVO, NUNCA GESTO PROPIO.

  El scroll del navegador ya cumple por construcción todo lo que `CLAUDE.md`
  exige de un gesto: seguimiento 1:1, resistencia elástica en los bordes y
  proyección del momento —la del sistema operativo, que es la que el dedo
  espera—. Además corre en el compositor, funciona sin JavaScript y el foco lo
  desplaza el navegador solo al tabular. Una reimplementación con
  `proyectarMomento` sería peor y habría que auditarla entera.

  Server Component: no hay hooks, ni estado, ni eventos. Es CSS y `children`.
*/

type CarrilPistaProps = {
  /**
   * `tarjeta` fija el ancho de columna en `--carril-tarjeta-w`; `auto` deja
   * que cada hijo mida lo suyo (la fila de chips, cuyo ancho es su texto).
   */
  columnas?: 'tarjeta' | 'auto'
  className?: string
  children: ReactNode
}

/**
 * La pista deslizable, sin encabezado.
 *
 * Se expone suelta porque la fila de categorías necesita esta geometría —el
 * sangrado asimétrico, el snap, la reserva del anillo de foco— y no necesita
 * un `h2`. Duplicar el CSS en su módulo era garantizar que los dos se
 * desincronizaran.
 *
 * NO LLEVA `tabindex`: cada hijo es un enlace y el navegador desplaza la
 * pista al enfocarlo, así que añadirlo metería una parada estéril antes de
 * cada estantería. La excepción sería un carril con contenido no enfocable:
 * entonces sí gana `tabindex="0"` y `aria-label`, por WCAG 2.1.1.
 */
export function CarrilPista({
  columnas = 'tarjeta',
  className,
  children,
}: CarrilPistaProps) {
  return (
    <div
      className={[styles.pista, styles[columnas], className].filter(Boolean).join(' ')}
    >
      {children}
    </div>
  )
}

type CarrilProps = {
  titulo: string
  /** Segunda línea de la cabecera. Explica el criterio de la selección. */
  apoyo?: string
  columnas?: 'tarjeta' | 'auto'
  className?: string
  /**
   * Clase para la PISTA, no para la sección.
   *
   * Existe para que un consumidor pueda sobrescribir `--carril-tarjeta-w` o el
   * tipo de snap EN SU INSTANCIA sin duplicar el CSS de la pista, que trae
   * geometría auditada: sangrado asimétrico, `overscroll-behavior`, reserva del
   * anillo de foco y la ausencia deliberada de `touch-action`.
   *
   * Lo usa el carrusel de portada del catálogo, cuya tarjeta es responsiva y
   * necesita `x mandatory` en vez de `x proximity`. Es una ampliación aditiva a
   * propósito: duplicar `.pista` en otro módulo garantiza que los dos se
   * desincronicen.
   */
  pistaClassName?: string
  children: ReactNode
}

/**
 * Estantería: cabecera + pista deslizable.
 *
 * El `h2` va a `--t-title-2` y el nombre de cada tarjeta a `--t-title-3`. No
 * es un detalle: si compartieran nivel, la estantería y su contenido pesarían
 * igual y la agrupación desaparecería.
 *
 * Regla de producto que hay que respetar al usarlo: **nada puede ser
 * alcanzable solo deslizando**. Todo lo que salga en una estantería tiene que
 * estar también en la rejilla de la misma página. Deslizar es un atajo, nunca
 * el único camino.
 */
export function Carril({
  titulo,
  apoyo,
  columnas = 'tarjeta',
  className,
  pistaClassName,
  children,
}: CarrilProps) {
  return (
    <section className={[styles.seccion, className].filter(Boolean).join(' ')}>
      <div className={styles.cabecera}>
        <h2 className={styles.titulo}>{titulo}</h2>
        {apoyo && <p className={styles.apoyo}>{apoyo}</p>}
      </div>

      <CarrilPista columnas={columnas} className={pistaClassName}>
        {children}
      </CarrilPista>
    </section>
  )
}
