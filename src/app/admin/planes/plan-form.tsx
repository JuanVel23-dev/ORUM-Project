'use client'

import { useActionState } from 'react'
import Link from 'next/link'
import { crearPlan, editarPlan, type PlanState } from './actions'

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
      {state.error && (
        <p className="orum-alert orum-alert--error" role="alert">
          {state.error}
        </p>
      )}

      {plan && <input type="hidden" name="id" value={plan.id} />}

      <div className="orum-field">
        <label className="orum-label" htmlFor="nombre">Nombre</label>
        <input id="nombre" name="nombre" className="orum-input" required defaultValue={plan?.nombre} />
      </div>

      <div className="orum-field">
        <label className="orum-label" htmlFor="descripcion">Descripción (opcional)</label>
        <input
          id="descripcion"
          name="descripcion"
          className="orum-input"
          defaultValue={plan?.descripcion ?? ''}
        />
      </div>

      <div style={{ display: 'flex', gap: '0.75rem' }}>
        <div className="orum-field" style={{ flex: 1 }}>
          <label className="orum-label" htmlFor="precio">Precio</label>
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
        </div>
        <div className="orum-field" style={{ flex: 1 }}>
          <label className="orum-label" htmlFor="duracion_meses">Duración (meses)</label>
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
        </div>
      </div>

      <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.5rem' }}>
        <button type="submit" className="orum-button" disabled={pending}>
          {pending ? 'Guardando…' : plan ? 'Guardar cambios' : 'Crear plan'}
        </button>
        <Link href="/admin/planes" className="orum-button orum-button--secondary">
          Cancelar
        </Link>
      </div>
    </form>
  )
}
