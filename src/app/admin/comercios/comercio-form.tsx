'use client'

import { useActionState, useState } from 'react'
import Link from 'next/link'
import { crearComercio, type CrearComercioState } from './actions'

type Opcion = { id: number; nombre: string }

const estadoInicial: CrearComercioState = {}

export function ComercioForm({ marcas, categorias }: { marcas: Opcion[]; categorias: Opcion[] }) {
  const [state, formAction, pending] = useActionState(crearComercio, estadoInicial)
  const [copiado, setCopiado] = useState(false)

  if (state.ok && state.password) {
    return (
      <div className="orum-card">
        <p className="orum-alert orum-alert--success">✓ Comercio creado correctamente.</p>
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
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <input
              className="orum-input"
              readOnly
              value={state.password}
              style={{ fontFamily: 'var(--font-geist-mono, monospace)' }}
            />
            <button
              type="button"
              className="orum-button orum-button--secondary"
              onClick={() => {
                navigator.clipboard?.writeText(state.password ?? '')
                setCopiado(true)
                setTimeout(() => setCopiado(false), 2000)
              }}
            >
              {copiado ? '¡Copiado!' : 'Copiar'}
            </button>
          </div>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1rem' }}>
          <Link href="/admin/comercios" className="orum-button">Ir a la lista</Link>
          <Link href="/admin/comercios/nuevo" className="orum-button orum-button--secondary">Crear otro</Link>
        </div>
      </div>
    )
  }

  return (
    <form action={formAction} className="orum-card">
      {state.error && <p className="orum-alert orum-alert--error" role="alert">{state.error}</p>}

      <div className="orum-field">
        <label className="orum-label" htmlFor="correo">Correo electrónico (para iniciar sesión)</label>
        <input id="correo" name="correo" type="email" className="orum-input" required />
      </div>

      <div className="orum-field">
        <label className="orum-label" htmlFor="nombre">Nombre del comercio</label>
        <input id="nombre" name="nombre" className="orum-input" required />
      </div>

      <div className="orum-field">
        <label className="orum-label" htmlFor="descripcion">Descripción (opcional)</label>
        <input id="descripcion" name="descripcion" className="orum-input" />
      </div>

      <div style={{ display: 'flex', gap: '0.75rem' }}>
        <div className="orum-field" style={{ flex: 1 }}>
          <label className="orum-label" htmlFor="marca_id">Marca (opcional)</label>
          <select id="marca_id" name="marca_id" className="orum-select" defaultValue="">
            <option value="">— Sin marca —</option>
            {marcas.map((m) => <option key={m.id} value={m.id}>{m.nombre}</option>)}
          </select>
        </div>
        <div className="orum-field" style={{ flex: 1 }}>
          <label className="orum-label" htmlFor="categoria_id">Categoría (opcional)</label>
          <select id="categoria_id" name="categoria_id" className="orum-select" defaultValue="">
            <option value="">— Sin categoría —</option>
            {categorias.map((c) => <option key={c.id} value={c.id}>{c.nombre}</option>)}
          </select>
        </div>
      </div>

      <div className="orum-field">
        <label className="orum-label" htmlFor="logo_url">URL del logo (opcional)</label>
        <input id="logo_url" name="logo_url" className="orum-input" placeholder="https://…" />
      </div>

      <p className="orum-muted" style={{ fontSize: '0.85rem', marginBottom: '1rem' }}>
        El sistema generará una contraseña segura automáticamente y te la mostrará al terminar.
      </p>

      <div style={{ display: 'flex', gap: '0.75rem' }}>
        <button type="submit" className="orum-button" disabled={pending}>
          {pending ? 'Creando…' : 'Crear comercio'}
        </button>
        <Link href="/admin/comercios" className="orum-button orum-button--secondary">Cancelar</Link>
      </div>
    </form>
  )
}
