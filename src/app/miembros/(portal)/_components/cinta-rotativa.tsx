import type { CSSProperties, ReactNode } from 'react'
import estilos from './cinta-rotativa.module.css'

/*
  LA CINTA QUE ROTA SOLA  ·  para los estantes de solo logo
  ---------------------------------------------------------------------------
  Encargo del propietario: «si solo son logos, nombres y promociones, sin
  imágenes, haz un carrusel con una animación para que vaya rotando».

  Solo CSS: la pista contiene las tarjetas DOS veces y se desplaza la mitad de
  su ancho en bucle, así que el final empalma con el principio sin salto. La
  segunda copia es `aria-hidden` e `inert`: un lector de pantalla no oye cada
  comercio dos veces y el tabulador no entra en los duplicados.

  Rota solo si hay suficientes tarjetas para llenar la franja (`MINIMO`): una
  sola tarjeta dando vueltas no es un carrusel, es un tic. Por debajo del
  mínimo se pinta una fila quieta.

  Se detiene al apuntar, al enfocar algo dentro y con movimiento reducido
  (WCAG 2.2.2); en ese último caso la fila se puede desplazar a mano.
*/

const MINIMO = 4
/** Segundos por tarjeta: ni tan rápido que no se lea, ni tan lento que parezca parado. */
const SEGUNDOS_POR_TARJETA = 5

export function CintaRotativa({
  titulo,
  apoyo,
  items,
}: {
  titulo: string
  apoyo?: string
  items: ReactNode[]
}) {
  const rota = items.length >= MINIMO

  return (
    <section className={`${estilos.seccion} revelar-vista`} aria-label={titulo}>
      <div className={estilos.cabecera}>
        <h2 className={estilos.titulo}>{titulo}</h2>
        {apoyo && <p className={estilos.apoyo}>{apoyo}</p>}
      </div>

      <div className={rota ? estilos.ventana : estilos.fila}>
        <div
          className={rota ? estilos.pista : estilos.pistaQuieta}
          style={
            rota
              ? ({ '--duracion': `${items.length * SEGUNDOS_POR_TARJETA}s` } as CSSProperties)
              : undefined
          }
        >
          <ul className={estilos.grupo}>
            {items.map((item, i) => (
              <li key={i} className={estilos.celda}>
                {item}
              </li>
            ))}
          </ul>
          {rota && (
            <ul className={estilos.grupo} aria-hidden="true" inert>
              {items.map((item, i) => (
                <li key={`copia-${i}`} className={estilos.celda}>
                  {item}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </section>
  )
}
