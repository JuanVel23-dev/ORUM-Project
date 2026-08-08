'use client'

import { useActionState } from 'react'
import { crearPlan, editarPlan, type PlanState } from '../actions'
import { Alert, Button, Field, LinkButton, Row } from '@/components/ui'

type PlanInicial = {
  id: number
  nombre: string
  descripcion: string | null
  precio: number
  duracion_meses: number
}

const estadoInicial: PlanState = {}

export function PlanForm({ plan }: { plan?: PlanInicial }) {
  const accion = plan ? editarPlan : crearPlan
  const [state, formAction, pending] = useActionState(accion, estadoInicial)

  return (
    <form action={formAction} className="orum-card">
      {state.error && <Alert tone="error">{state.error}</Alert>}

      {plan && <input type="hidden" name="id" value={plan.id} />}

      <Field label="Nombre" htmlFor="nombre">
        <input id="nombre" name="nombre" className="orum-input" required defaultValue={plan?.nombre} />
      </Field>

      <Field label="Descripción (opcional)" htmlFor="descripcion">
        <input id="descripcion" name="descripcion" className="orum-input" defaultValue={plan?.descripcion ?? ''} />
      </Field>

      <Row>
        <Field label="Precio" htmlFor="precio" flex>
          <input
            id="precio"
            name="precio"
            type="number"
            min="0"
            step="0.01"
            className="orum-input"
            required
            defaultValue={plan?.precio}
          />
        </Field>
        <Field label="Duración (meses)" htmlFor="duracion_meses" flex>
          <input
            id="duracion_meses"
            name="duracion_meses"
            type="number"
            min="1"
            step="1"
            className="orum-input"
            required
            defaultValue={plan?.duracion_meses ?? 1}
          />
        </Field>
      </Row>

      <Row style={{ marginTop: '0.5rem' }}>
        <Button type="submit" disabled={pending}>
          {pending ? 'Guardando…' : plan ? 'Guardar cambios' : 'Crear plan'}
        </Button>
        <LinkButton href="/admin/planes" variant="secondary">Cancelar</LinkButton>
      </Row>
    </form>
  )
}
