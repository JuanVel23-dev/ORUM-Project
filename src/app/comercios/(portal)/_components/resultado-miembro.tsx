import { Card } from '@/components/ui/card'
import type { MiembroEncontrado } from '../actions'
import styles from './verificar.module.css'

/**
 * El veredicto: ¿esta persona tiene derecho al beneficio?
 *
 * Es la única pantalla del producto que se lee **a un metro, de pie y con el
 * pulgar tapando media pantalla**, así que es la única que se permite
 * presencia: una franja de color sólido a todo el ancho, con el dictamen en
 * mayúsculas dentro.
 *
 * POR QUÉ NO `StatusBadge` AQUÍ, Y POR QUÉ ESO NO CONTRADICE AL SISTEMA:
 * `StatusBadge` sigue siendo lo correcto en una lista —admin, carnet— y su
 * forma ampliada (`EstadoBadge`, con `motivo` opcional) es la que este portal
 * necesitaría; no se toca ni se rediseña. Lo que no puede hacer un badge es
 * ser el contenido principal: es una etiqueta que acompaña a otra cosa, y su
 * tamaño —el diagnóstico exacto de `AUDIT-a11y` #9— es justo lo que falla
 * cuando el dato que decide la transacción es el más pequeño de la tarjeta. Lo
 * que se hereda es su PATRÓN, que es lo que importa: punto lleno / punto
 * hueco, texto siempre, nunca el color solo.
 *
 * CONTRASTE, MEDIDO (no estimado). El relleno es `--success` / `--danger` y el
 * texto `--surface`, que es el token que gira con el tema justo al revés que
 * los de estado — por eso el par funciona en los dos sin ramas:
 *
 *   activa   claro  #137a3b con texto #fdfcfa .......... 5,29:1
 *   activa   oscuro #45d67c con texto #211a16 .......... 9,12:1
 *   inactiva claro  #c1121f con texto #fdfcfa .......... 6,07:1
 *   inactiva oscuro #ff5a52 con texto #211a16 .......... 5,59:1
 *
 * Los cuatro pasan AA de texto (4,5:1) con el tamaño de cuerpo, así que el
 * titular grande va sobrado. El filo de la franja contra la tarjeta usa esos
 * mismos ratios, muy por encima del 3:1 de 1.4.11.
 *
 * El motivo se omite a propósito: `buscar_miembro_comercio` solo devuelve
 * `vigente`, y no se inventa un «vencida» que podría ser «suspendida».
 */
export function ResultadoMiembro({ miembro }: { miembro: MiembroEncontrado }) {
  const vigente = miembro.vigente

  return (
    <Card padding="lg">
      <div className={styles.veredicto}>
        <p
          className={`${styles.banner} ${vigente ? styles.bannerActiva : styles.bannerInactiva}`}
        >
          {/*
            Punto LLENO frente a anillo HUECO: la diferencia es de forma, no de
            color, así que sobrevive al daltonismo y al sol dando en la pantalla
            del móvil en plena caja. El texto dice lo mismo que el color, y es
            quien manda.
          */}
          <span
            className={`${styles.punto} ${vigente ? '' : styles.puntoHueco}`}
            aria-hidden="true"
          />
          {vigente ? 'Membresía activa' : 'Membresía inactiva'}
        </p>

        <div className={styles.datos}>
          {/*
            El NOMBRE antes que el número: lo que confirma que el carnet es de
            quien lo está entregando es la cara y el nombre. El número baja a
            dato de cotejo, que es para lo que sirve.
          */}
          <p className={styles.nombre}>{miembro.nombreCompleto}</p>

          {vigente && miembro.planNombre && <p className={styles.plan}>{miembro.planNombre}</p>}

          <p className={styles.numero}>N.º {miembro.numeroMembresia}</p>

          {!vigente && (
            <p className={styles.instruccion}>
              No apliques el beneficio. El socio puede reactivarla con el club.
            </p>
          )}
        </div>
      </div>
    </Card>
  )
}
