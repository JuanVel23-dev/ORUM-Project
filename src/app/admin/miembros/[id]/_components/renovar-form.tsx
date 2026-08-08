'use client'

import { useActionState, useState } from 'react'
import { renovarMembresia, type RenovarState } from '../../actions'
import { Alert, Button, Field, Row } from '@/components/ui'

type PlanOpcion = { id: number; nombre: string; precio: number }

const estadoInicial: RenovarState = {}

export function RenovarForm({ miembroId, planes }: { miembroId: number; planes: PlanOpcion[] }) {
  const [state, formAction, pending] = useActionState(renovarMembresia, estadoInicial)
  const [precio, setPrecio] = useState<string>(planes[0] ? String(planes[0].precio) : '')

  return (
    <form action={formAction} className="orum-card">
      <h2 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '0.75rem' }}>Renovar / nueva membresía</h2>
      {state.error && <Alert tone="error">{state.error}</Alert>}

      <input type="hidden" name="miembro_id" value={miembroId} />

      <Row>
        <Field label="Plan" htmlFor="plan_id" flex>
          <select
            id="plan_id"
            name="plan_id"
            className="orum-select"
            required
            defaultValue={planes[0]?.id ?? ''}
            onChange={(e) => {
              const p = planes.find((x) => x.id === Number(e.target.value))
              if (p) setPrecio(String(p.precio))
            }}
          >
            {planes.length === 0 && <option value="">— No hay planes activos —</option>}
            {planes.map((p) => (
              <option key={p.id} value={p.id}>
                {p.nombre} (${p.precio.toLocaleString('es-CO')})
              </option>
            ))}
          </select>
        </Field>
        <Field label="Precio pagado" htmlFor="precio_pagado" flex>
          <input
            id="precio_pagado"
            name="precio_pagado"
            type="number"
            min="0"
            step="0.01"
            className="orum-input"
            required
            value={precio}
            onChange={(e) => setPrecio(e.target.value)}
          />
        </Field>
      </Row>

      <Button type="submit" disabled={pending || planes.length === 0}>
        {pending ? 'Registrando…' : 'Registrar renovación'}
      </Button>
    </form>
  )
}
