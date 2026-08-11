'use client'

import { useActionState, useState } from 'react'
import { CreditCard } from 'lucide-react'
import { Alert } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Field } from '@/components/ui/field'
import { Input, Select } from '@/components/ui/input'
import { renovarMembresia, type RenovarState } from '../actions'
import styles from './ficha.module.css'

type PlanOpcion = { id: number; nombre: string; precio: number }

const estadoInicial: RenovarState = {}

export function RenovarForm({
  miembroId,
  planes,
}: {
  miembroId: number
  planes: PlanOpcion[]
}) {
  const [state, formAction, pending] = useActionState(renovarMembresia, estadoInicial)
  const [precio, setPrecio] = useState(planes[0] ? String(planes[0].precio) : '')

  const sinPlanes = planes.length === 0

  return (
    // `id` para que "Renovar membresía" desde el menú de la lista aterrice aquí.
    <Card padding="lg" id="renovar">
      <form action={formAction} className={styles.renovar} noValidate>
        {state.error && <Alert tone="danger">{state.error}</Alert>}

        {sinPlanes && (
          <Alert tone="warning" title="No hay planes activos">
            Activa al menos un plan de membresía antes de registrar una renovación.
          </Alert>
        )}

        <input type="hidden" name="miembro_id" value={miembroId} />

        <div className={styles.renovarCampos}>
          <Field label="Plan">
            <Select
              name="plan_id"
              required
              defaultValue={planes[0]?.id ?? ''}
              disabled={sinPlanes}
              // Al cambiar de plan se propone su precio de lista, pero el campo
              // sigue siendo editable: puede haber descuentos puntuales.
              onChange={(e) => {
                const plan = planes.find((p) => p.id === Number(e.target.value))
                if (plan) setPrecio(String(plan.precio))
              }}
            >
              {planes.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.nombre} — {p.precio.toLocaleString('es-CO')}
                </option>
              ))}
            </Select>
          </Field>

          <Field label="Precio pagado" help="Puedes ajustarlo si hubo un descuento.">
            <Input
              name="precio_pagado"
              type="number"
              min="0"
              step="0.01"
              inputMode="decimal"
              numeric
              required
              value={precio}
              onChange={(e) => setPrecio(e.target.value)}
              disabled={sinPlanes}
            />
          </Field>
        </div>

        <Button
          type="submit"
          loading={pending}
          disabled={sinPlanes}
          icon={<CreditCard size={16} />}
          className={styles.renovarBoton}
        >
          Registrar renovación
        </Button>
      </form>
    </Card>
  )
}
