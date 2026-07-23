'use client'

import { useActionState, useState } from 'react'
import Link from 'next/link'
import { registrarMiembro, type RegistrarMiembroState } from './actions'

type Opcion = { id: number; nombre: string }
type PlanOpcion = { id: number; nombre: string; precio: number }

const estadoInicial: RegistrarMiembroState = {}

export function MiembroForm({ ciudades, planes }: { ciudades: Opcion[]; planes: PlanOpcion[] }) {
  const [state, formAction, pending] = useActionState(registrarMiembro, estadoInicial)
  const [precio, setPrecio] = useState<string>(planes[0] ? String(planes[0].precio) : '')
  const [copiado, setCopiado] = useState(false)

  if (state.ok && state.numero && state.password) {
    return (
      <div className="orum-card">
        <p className="orum-alert orum-alert--success">✓ Miembro {state.nombre} registrado.</p>
        <p style={{ marginBottom: '0.75rem' }}>
          Entrega estos datos al cliente. La contraseña <strong>no se volverá a mostrar</strong>.
        </p>
        <div className="orum-field">
          <span className="orum-label">Número de membresía</span>
          <input className="orum-input" readOnly value={state.numero}
            style={{ fontFamily: 'var(--font-geist-mono, monospace)' }} />
        </div>
        <div className="orum-field">
          <span className="orum-label">Contraseña temporal</span>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <input className="orum-input" readOnly value={state.password}
              style={{ fontFamily: 'var(--font-geist-mono, monospace)' }} />
            <button type="button" className="orum-button orum-button--secondary"
              onClick={() => {
                navigator.clipboard?.writeText(state.password ?? '')
                setCopiado(true)
                setTimeout(() => setCopiado(false), 2000)
              }}>
              {copiado ? '¡Copiado!' : 'Copiar'}
            </button>
          </div>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1rem' }}>
          <Link href="/admin/miembros" className="orum-button">Ir a la lista</Link>
          <a href="/admin/miembros/nuevo" className="orum-button orum-button--secondary">Registrar otro</a>
        </div>
      </div>
    )
  }

  return (
    <form action={formAction} className="orum-card">
      {state.error && <p className="orum-alert orum-alert--error" role="alert">{state.error}</p>}

      <div style={{ display: 'flex', gap: '0.75rem' }}>
        <div className="orum-field" style={{ flex: 1 }}>
          <label className="orum-label" htmlFor="nombres">Nombres</label>
          <input id="nombres" name="nombres" className="orum-input" required />
        </div>
        <div className="orum-field" style={{ flex: 1 }}>
          <label className="orum-label" htmlFor="apellidos">Apellidos</label>
          <input id="apellidos" name="apellidos" className="orum-input" required />
        </div>
      </div>

      <div className="orum-field">
        <label className="orum-label" htmlFor="cedula">Cédula</label>
        <input id="cedula" name="cedula" className="orum-input" required />
      </div>

      <div className="orum-field">
        <label className="orum-label" htmlFor="correo">Correo electrónico</label>
        <input id="correo" name="correo" type="email" className="orum-input" required />
      </div>

      <div style={{ display: 'flex', gap: '0.75rem' }}>
        <div className="orum-field" style={{ flex: 1 }}>
          <label className="orum-label" htmlFor="telefono">Teléfono (opcional)</label>
          <input id="telefono" name="telefono" className="orum-input" />
        </div>
        <div className="orum-field" style={{ flex: 1 }}>
          <label className="orum-label" htmlFor="ciudad_id">Ciudad (opcional)</label>
          <select id="ciudad_id" name="ciudad_id" className="orum-select" defaultValue="">
            <option value="">— Sin ciudad —</option>
            {ciudades.map((c) => (
              <option key={c.id} value={c.id}>{c.nombre}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="orum-field">
        <label className="orum-label" htmlFor="direccion">Dirección (opcional)</label>
        <input id="direccion" name="direccion" className="orum-input" />
      </div>

      <hr style={{ border: 0, borderTop: '1px solid var(--orum-border)', margin: '1rem 0' }} />

      <div style={{ display: 'flex', gap: '0.75rem' }}>
        <div className="orum-field" style={{ flex: 1 }}>
          <label className="orum-label" htmlFor="plan_id">Plan de membresía</label>
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

      <p className="orum-muted" style={{ fontSize: '0.85rem', margin: '0.5rem 0 1rem' }}>
        Se generará el número de membresía y una contraseña segura; se mostrarán al terminar.
      </p>

      <div style={{ display: 'flex', gap: '0.75rem' }}>
        <button type="submit" className="orum-button" disabled={pending || planes.length === 0}>
          {pending ? 'Registrando…' : 'Registrar miembro'}
        </button>
        <Link href="/admin/miembros" className="orum-button orum-button--secondary">Cancelar</Link>
      </div>
    </form>
  )
}
