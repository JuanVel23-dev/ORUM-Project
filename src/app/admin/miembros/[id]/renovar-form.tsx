'use client'

import { useActionState, useState } from 'react'
import { renovarMembresia, type RenovarState } from '../actions'

type PlanOpcion = { id: number; nombre: string; precio: number }

const estadoInicial: RenovarState = {}

export function RenovarForm({ miembroId, planes }: { miembroId: number; planes: PlanOpcion[] }) {
  const [state, formAction, pending] = useActionState(renovarMembresia, estadoInicial)
  const [precio, setPrecio] = useState<string>(planes[0] ? String(planes[0].precio) : '')

  return (
    <form action={formAction} className="orum-card">
      <h2 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '0.75rem' }}>Renovar / nueva membresía</h2>
      {state.error && <p className="orum-alert orum-alert--error" role="alert">{state.error}</p>}

      <input type="hidden" name="miembro_id" value={miembroId} />

      <div style={{ display: 'flex', gap: '0.75rem' }}>
        <div className="orum-field" style={{ flex: 1 }}>
          <label className="orum-label" htmlFor="plan_id">Plan</label>
          <select id="plan_id" name="plan_id" className="orum-select" required defaultValue={planes[0]?.id ?? ''}
            onChange={(e) => {
              const p = planes.find((x) => x.id === Number(e.target.value))
              if (p) setPrecio(String(p.precio))
            }}>
            {planes.length === 0 && <option value="">— No hay planes activos —</option>}
            {planes.map((p) => (
              <option key={p.id} value={p.id}>{p.nombre} (${p.precio.toLocaleString('es-CO')})</option>
            ))}
          </select>
        </div>
        <div className="orum-field" style={{ flex: 1 }}>
          <label className="orum-label" htmlFor="precio_pagado">Precio pagado</label>
          <input id="precio_pagado" name="precio_pagado" type="number" min="0" step="0.01"
            className="orum-input" required value={precio} onChange={(e) => setPrecio(e.target.value)} />
        </div>
      </div>

      <button type="submit" className="orum-button" disabled={pending || planes.length === 0}>
        {pending ? 'Registrando…' : 'Registrar renovación'}
      </button>
    </form>
  )
}
