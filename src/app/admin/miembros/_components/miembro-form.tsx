'use client'

import { useActionState, useState } from 'react'
import { registrarMiembro, type RegistrarMiembroState } from '../actions'
import { Alert, Button, Field, LinkButton, Row } from '@/components/ui'

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
        <Alert tone="success">✓ Miembro {state.nombre} registrado.</Alert>
        <p style={{ marginBottom: '0.75rem' }}>
          Entrega estos datos al cliente. La contraseña <strong>no se volverá a mostrar</strong>.
        </p>
        <div className="orum-field">
          <span className="orum-label">Número de membresía</span>
          <input
            className="orum-input"
            readOnly
            value={state.numero}
            style={{ fontFamily: 'var(--font-geist-mono, monospace)' }}
          />
        </div>
        <div className="orum-field">
          <span className="orum-label">Contraseña temporal</span>
          <Row gap="0.5rem">
            <input
              className="orum-input"
              readOnly
              value={state.password}
              style={{ fontFamily: 'var(--font-geist-mono, monospace)' }}
            />
            <Button
              type="button"
              variant="secondary"
              onClick={() => {
                navigator.clipboard?.writeText(state.password ?? '')
                setCopiado(true)
                setTimeout(() => setCopiado(false), 2000)
              }}
            >
              {copiado ? '¡Copiado!' : 'Copiar'}
            </Button>
          </Row>
        </div>
        <Row style={{ marginTop: '1rem' }}>
          <LinkButton href="/admin/miembros">Ir a la lista</LinkButton>
          <LinkButton href="/admin/miembros/nuevo" variant="secondary">Registrar otro</LinkButton>
        </Row>
      </div>
    )
  }

  return (
    <form action={formAction} className="orum-card">
      {state.error && <Alert tone="error">{state.error}</Alert>}

      <Row>
        <Field label="Nombres" htmlFor="nombres" flex>
          <input id="nombres" name="nombres" className="orum-input" required />
        </Field>
        <Field label="Apellidos" htmlFor="apellidos" flex>
          <input id="apellidos" name="apellidos" className="orum-input" required />
        </Field>
      </Row>

      <Field label="Cédula" htmlFor="cedula">
        <input id="cedula" name="cedula" className="orum-input" required />
      </Field>

      <Field label="Correo electrónico" htmlFor="correo">
        <input id="correo" name="correo" type="email" className="orum-input" required />
      </Field>

      <Row>
        <Field label="Teléfono (opcional)" htmlFor="telefono" flex>
          <input id="telefono" name="telefono" className="orum-input" />
        </Field>
        <Field label="Ciudad (opcional)" htmlFor="ciudad_id" flex>
          <select id="ciudad_id" name="ciudad_id" className="orum-select" defaultValue="">
            <option value="">— Sin ciudad —</option>
            {ciudades.map((c) => (
              <option key={c.id} value={c.id}>
                {c.nombre}
              </option>
            ))}
          </select>
        </Field>
      </Row>

      <Field label="Dirección (opcional)" htmlFor="direccion">
        <input id="direccion" name="direccion" className="orum-input" />
      </Field>

      <hr style={{ border: 0, borderTop: '1px solid var(--orum-border)', margin: '1rem 0' }} />

      <Row>
        <Field label="Plan de membresía" htmlFor="plan_id" flex>
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

      <p className="orum-muted" style={{ fontSize: '0.85rem', margin: '0.5rem 0 1rem' }}>
        Se generará el número de membresía y una contraseña segura; se mostrarán al terminar.
      </p>

      <Row>
        <Button type="submit" disabled={pending || planes.length === 0}>
          {pending ? 'Registrando…' : 'Registrar miembro'}
        </Button>
        <LinkButton href="/admin/miembros" variant="secondary">Cancelar</LinkButton>
      </Row>
    </form>
  )
}
