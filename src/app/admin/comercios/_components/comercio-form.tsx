'use client'

import { useActionState, useState } from 'react'
import { crearComercio, type CrearComercioState } from '../actions'
import { Alert, Button, Field, LinkButton, Row } from '@/components/ui'

type Opcion = { id: number; nombre: string }

const estadoInicial: CrearComercioState = {}

export function ComercioForm({ marcas, categorias }: { marcas: Opcion[]; categorias: Opcion[] }) {
  const [state, formAction, pending] = useActionState(crearComercio, estadoInicial)
  const [copiado, setCopiado] = useState(false)

  if (state.ok && state.password) {
    return (
      <div className="orum-card">
        <Alert tone="success">✓ Comercio creado correctamente.</Alert>
        <p style={{ marginBottom: '0.75rem' }}>
          Comparte estos datos con el comercio. La contraseña <strong>no se volverá a mostrar</strong>;
          podrá cambiarla después.
        </p>
        <div className="orum-field">
          <span className="orum-label">Correo</span>
          <input className="orum-input" readOnly value={state.email} />
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
          <LinkButton href="/admin/comercios">Ir a la lista</LinkButton>
          <LinkButton href="/admin/comercios/nuevo" variant="secondary">Crear otro</LinkButton>
        </Row>
      </div>
    )
  }

  return (
    <form action={formAction} className="orum-card">
      {state.error && <Alert tone="error">{state.error}</Alert>}

      <Field label="Correo electrónico (para iniciar sesión)" htmlFor="correo">
        <input id="correo" name="correo" type="email" className="orum-input" required />
      </Field>

      <Field label="Nombre del comercio" htmlFor="nombre">
        <input id="nombre" name="nombre" className="orum-input" required />
      </Field>

      <Field label="Descripción (opcional)" htmlFor="descripcion">
        <input id="descripcion" name="descripcion" className="orum-input" />
      </Field>

      <Row>
        <Field label="Marca (opcional)" htmlFor="marca_id" flex>
          <select id="marca_id" name="marca_id" className="orum-select" defaultValue="">
            <option value="">— Sin marca —</option>
            {marcas.map((m) => (
              <option key={m.id} value={m.id}>
                {m.nombre}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Categoría (opcional)" htmlFor="categoria_id" flex>
          <select id="categoria_id" name="categoria_id" className="orum-select" defaultValue="">
            <option value="">— Sin categoría —</option>
            {categorias.map((c) => (
              <option key={c.id} value={c.id}>
                {c.nombre}
              </option>
            ))}
          </select>
        </Field>
      </Row>

      <Field label="URL del logo (opcional)" htmlFor="logo_url">
        <input id="logo_url" name="logo_url" className="orum-input" placeholder="https://…" />
      </Field>

      <p className="orum-muted" style={{ fontSize: '0.85rem', marginBottom: '1rem' }}>
        El sistema generará una contraseña segura automáticamente y te la mostrará al terminar.
      </p>

      <Row>
        <Button type="submit" disabled={pending}>
          {pending ? 'Creando…' : 'Crear comercio'}
        </Button>
        <LinkButton href="/admin/comercios" variant="secondary">Cancelar</LinkButton>
      </Row>
    </form>
  )
}
