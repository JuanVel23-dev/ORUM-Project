import { StatusBadge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import type { MiembroEncontrado } from '../actions'
import styles from './verificar.module.css'

/**
 * El veredicto: ¿esta persona tiene derecho al beneficio?
 *
 * Es la pantalla que decide la transacción, así que el estado no viaja solo en
 * el color: la insignia lleva punto **y** texto, y cuando no está vigente el
 * punto pasa a hueco. Un cajero daltónico tiene que poder decir que no.
 */
export function ResultadoMiembro({ miembro }: { miembro: MiembroEncontrado }) {
  return (
    <Card padding="lg">
      <div className={styles.veredicto}>
        <div>
          <p className={styles.nombre}>{miembro.nombreCompleto}</p>
          <p className={styles.numero}>N.º {miembro.numeroMembresia}</p>
        </div>

        <div className={styles.estadoFila}>
          {/*
            `StatusBadge` y no un `Badge` suelto: trae el punto lleno / punto
            hueco, que es la diferencia de FORMA que sostiene el veredicto
            cuando el color no llega —daltonismo, sol sobre la pantalla del
            móvil en una caja—. El motivo se omite a propósito: la búsqueda del
            comercio solo devuelve `vigente`, y no se inventa un "vencida" que
            podría ser "suspendida".
          */}
          <StatusBadge estado={miembro.vigente ? { activa: true } : { activa: false }} />

          {miembro.vigente && miembro.planNombre && (
            <span className={styles.plan}>{miembro.planNombre}</span>
          )}
        </div>

        {!miembro.vigente && (
          <p className={styles.plan}>
            No apliques el beneficio. El miembro puede reactivarla con el club.
          </p>
        )}
      </div>
    </Card>
  )
}
