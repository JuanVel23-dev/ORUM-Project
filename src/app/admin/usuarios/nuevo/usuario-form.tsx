'use client'

import { useActionState, useState } from 'react'
import Link from 'next/link'
import { crearUsuario, type CrearUsuarioState } from '../actions'

type Opcion = { id: number; nombre: string }

const estadoInicial: CrearUsuarioState = {}

export function UsuarioForm({
  marcas,
  categorias,
}: {
  marcas: Opcion[]
  categorias: Opcion[]
}) {
  const [state, formAction, pending] = useActionState(crearUsuario, estadoInicial)
  const [tipo, setTipo] = useState<'empleado' | 'super_admin' | 'comercio'>('empleado')
  const [copiado, setCopiado] = useState(false)

  // Pantalla de éxito: mostramos la contraseña generada UNA sola vez.
  if (state.ok && state.password) {
    return (
      <div className="orum-card">
        <p className="orum-alert orum-alert--success">✓ Usuario creado correctamente.</p>
        <p style={{ marginBottom: '0.75rem' }}>
          Comparte estos datos con la persona. La contraseña <strong>no se volverá a mostrar</strong>;
          el usuario podrá cambiarla después.
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
          <Link href="/admin/usuarios" className="orum-button">
            Ir a la lista
          </Link>
          <a href="/admin/usuarios/nuevo" className="orum-button orum-button--secondary">
            Crear otro
          </a>
        </div>
      </div>
    )
  }

  const esComercio = tipo === 'comercio'

  return (
    <form action={formAction} className="orum-card">
      {state.error && (
        <p className="orum-alert orum-alert--error" role="alert">
          {state.error}
        </p>
      )}

      <div className="orum-field">
        <label className="orum-label" htmlFor="tipo">
          Tipo de usuario
        </label>
        <select
          id="tipo"
          name="tipo"
          className="orum-select"
          value={tipo}
          onChange={(e) => setTipo(e.target.value as typeof tipo)}
        >
          <option value="empleado">Empleado</option>
          <option value="super_admin">Administrador</option>
          <option value="comercio">Comercio aliado</option>
        </select>
      </div>

      <div className="orum-field">
        <label className="orum-label" htmlFor="email">
          Correo electrónico (para iniciar sesión)
        </label>
        <input id="email" name="email" type="email" className="orum-input" required />
      </div>

      {esComercio ? (
        <>
          <div className="orum-field">
            <label className="orum-label" htmlFor="comercio_nombre">
              Nombre del comercio
            </label>
            <input id="comercio_nombre" name="comercio_nombre" className="orum-input" required />
          </div>
          <div className="orum-field">
            <label className="orum-label" htmlFor="descripcion">
              Descripción (opcional)
            </label>
            <input id="descripcion" name="descripcion" className="orum-input" />
          </div>
          <div className="orum-field">
            <label className="orum-label" htmlFor="marca_id">
              Marca (opcional)
            </label>
            <select id="marca_id" name="marca_id" className="orum-select" defaultValue="">
              <option value="">— Sin marca —</option>
              {marcas.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.nombre}
                </option>
              ))}
            </select>
          </div>
          <div className="orum-field">
            <label className="orum-label" htmlFor="categoria_id">
              Categoría (opcional)
            </label>
            <select id="categoria_id" name="categoria_id" className="orum-select" defaultValue="">
              <option value="">— Sin categoría —</option>
              {categorias.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.nombre}
                </option>
              ))}
            </select>
          </div>
        </>
      ) : (
        <>
          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <div className="orum-field" style={{ flex: 1 }}>
              <label className="orum-label" htmlFor="nombres">
                Nombres
              </label>
              <input id="nombres" name="nombres" className="orum-input" required />
            </div>
            <div className="orum-field" style={{ flex: 1 }}>
              <label className="orum-label" htmlFor="apellidos">
                Apellidos
              </label>
              <input id="apellidos" name="apellidos" className="orum-input" required />
            </div>
          </div>
          <div className="orum-field">
            <label className="orum-label" htmlFor="cedula">
              Cédula
            </label>
            <input id="cedula" name="cedula" className="orum-input" required />
          </div>
          <div className="orum-field">
            <label className="orum-label" htmlFor="telefono">
              Teléfono (opcional)
            </label>
            <input id="telefono" name="telefono" className="orum-input" />
          </div>
        </>
      )}

      <p className="orum-muted" style={{ fontSize: '0.85rem', marginBottom: '1rem' }}>
        El sistema generará una contraseña segura automáticamente y te la mostrará al terminar.
      </p>

      <div style={{ display: 'flex', gap: '0.75rem' }}>
        <button type="submit" className="orum-button" disabled={pending}>
          {pending ? 'Creando…' : 'Crear usuario'}
        </button>
        <Link href="/admin/usuarios" className="orum-button orum-button--secondary">
          Cancelar
        </Link>
      </div>
    </form>
  )
}
