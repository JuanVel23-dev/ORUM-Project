import type { ReactNode } from 'react'
import { Clock } from 'lucide-react'
import {
  DIAS_AVISO_VENCIMIENTO,
  venceProximamente,
  type EstadoDerivado,
  type MotivoInactiva,
} from '@/lib/miembros/membresias'
import styles from './badge.module.css'

export type BadgeTone =
  | 'neutral'
  | 'success'
  | 'warning'
  | 'danger'
  | 'info'
  /** Eje de MARCA, no de estado. Reservado al tier del plan. */
  | 'gold'

type BadgeProps = {
  tone?: BadgeTone
  size?: 'sm' | 'md'
  icon?: ReactNode
  children: ReactNode
  className?: string
}

export function Badge({
  tone = 'neutral',
  size = 'md',
  icon,
  children,
  className,
}: BadgeProps) {
  return (
    <span
      className={[styles.badge, styles[tone], size === 'sm' && styles.sm, className]
        .filter(Boolean)
        .join(' ')}
    >
      {icon}
      {children}
    </span>
  )
}

/* ==========================================================================
   EJE 1 · Estado de la membresía (semántico) — BINARIO
   ========================================================================== */

const ETIQUETA_MOTIVO: Record<MotivoInactiva, string> = {
  vencida: 'vencida',
  cancelada: 'cancelada',
  suspendida: 'suspendida',
}

/**
 * Estado de pago de una membresía. Solo dos valores: **Activa** o **Inactiva**.
 *
 * Recibe el estado YA DERIVADO (`derivarEstadoMembresia`), nunca la columna
 * `estado` en crudo: esa columna no se actualiza al vencer la fecha y pintaría
 * "Activa" a quien no paga.
 *
 * El motivo (vencida / cancelada / suspendida) se muestra como texto
 * secundario, no como un tercer color: en una lista larga lo que hay que poder
 * escanear es una sola cosa, si paga o no paga.
 */
export function StatusBadge({
  estado,
  size = 'md',
}: {
  estado: EstadoDerivado
  size?: 'sm' | 'md'
}) {
  if (estado.activa) {
    return (
      <Badge tone="success" size={size} icon={<span className={styles.punto} />}>
        Activa
      </Badge>
    )
  }

  return (
    <Badge
      tone="danger"
      size={size}
      // Anillo hueco frente al disco lleno del estado activo: la diferencia es
      // de forma, no solo de color, así que sobrevive a la visión cromática
      // deficiente y a una impresión en blanco y negro.
      icon={<span className={`${styles.punto} ${styles.puntoHueco}`} />}
    >
      Inactiva
      <span className={styles.motivo}>· {ETIQUETA_MOTIVO[estado.motivo]}</span>
    </Badge>
  )
}

/**
 * Señal secundaria de renovación próxima.
 *
 * Deliberadamente NO es un badge: una membresía a punto de vencer sigue
 * estando activa. Acompaña al `StatusBadge`, no lo sustituye.
 *
 * Devuelve `null` si no procede avisar, para poder invocarlo sin condicionales
 * en el consumidor.
 */
export function VenceEn({
  estado,
  umbral = DIAS_AVISO_VENCIMIENTO,
}: {
  estado: EstadoDerivado
  umbral?: number
}) {
  if (!venceProximamente(estado, umbral)) return null

  const dias = estado.activa ? estado.diasRestantes : 0
  const texto =
    dias === 0 ? 'Vence hoy' : dias === 1 ? 'Vence mañana' : `Vence en ${dias} días`

  return (
    <span className={styles.vence}>
      <Clock className={styles.venceIcono} aria-hidden="true" />
      {texto}
    </span>
  )
}

/*
  Aquí vivía `PlanTierBadge`, el segundo eje del sistema de color: el nivel
  del plan, que era lo único que llevaba oro.

  Se eliminó el 2026-08-09 al confirmarse que ORUM vende UN solo servicio (la
  membresía mensual). Con un único producto, la etiqueta mostraba el mismo
  valor en todas las filas: ocupaba ancho sin informar de nada.

  El oro no desaparece del sistema — se repliega a donde su escasez lo hace
  valioso: wordmark, indicador de ruta activa, anillo de focus, filos y el CTA
  comercial del Portal Público. El tono `gold` del `Badge` sigue disponible
  para cuando haga falta.
*/
