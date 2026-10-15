import Link from 'next/link'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { paginasVisibles } from '@/lib/shared/paginacion'
import styles from './paginacion.module.css'

/*
  PAGINACIÓN DE UNA LISTA  ·  «Mostrando 1–25 de 1.284» y los números
  ---------------------------------------------------------------------------
  Enlaces (la página vive en la URL). La actual va en tinta, con
  `aria-current`; las demás son círculos sin fondo que crecen al pasar.
*/

export function Paginacion({
  pagina,
  paginas,
  total,
  desde,
  hasta,
  href,
  nombre = 'resultados',
}: {
  pagina: number
  paginas: number
  total: number
  desde: number
  hasta: number
  /** La dirección de una página. */
  href: (pagina: number) => string
  /** «miembros», «comercios»… */
  nombre?: string
}) {
  const n = (x: number) => x.toLocaleString('es-CO')

  return (
    <div className={styles.paginacion}>
      <p className={styles.resumen} aria-live="polite">
        {total === 0 ? (
          `Sin ${nombre}`
        ) : (
          <>
            Mostrando <strong>{n(desde)}–{n(hasta)}</strong> de <strong>{n(total)}</strong> {nombre}
          </>
        )}
      </p>

      {paginas > 1 && (
        <nav aria-label="Páginas" className={styles.paginas}>
          {pagina > 1 ? (
            <Link href={href(pagina - 1)} className={styles.boton} aria-label="Página anterior">
              <ChevronLeft size={16} aria-hidden="true" />
            </Link>
          ) : (
            <span className={styles.boton} data-inactivo aria-hidden="true">
              <ChevronLeft size={16} />
            </span>
          )}

          {paginasVisibles(pagina, paginas).map((p, i) =>
            p === null ? (
              <span key={`salto-${i}`} className={styles.salto} aria-hidden="true">
                …
              </span>
            ) : (
              <Link
                key={p}
                href={href(p)}
                className={styles.boton}
                aria-current={p === pagina ? 'page' : undefined}
                aria-label={`Página ${p}`}
              >
                {p}
              </Link>
            ),
          )}

          {pagina < paginas ? (
            <Link href={href(pagina + 1)} className={styles.boton} aria-label="Página siguiente">
              <ChevronRight size={16} aria-hidden="true" />
            </Link>
          ) : (
            <span className={styles.boton} data-inactivo aria-hidden="true">
              <ChevronRight size={16} />
            </span>
          )}
        </nav>
      )}
    </div>
  )
}
