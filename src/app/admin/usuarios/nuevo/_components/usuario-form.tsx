'use client'

import { useActionState, useState } from 'react'
import Link from 'next/link'
import { crearUsuario, type CrearUsuarioState } from '../actions'

const estadoInicial: CrearUsuarioState = {}

export function UsuarioForm() {
  const [state, formAction, pending] = useActionState(crearUsuario, estadoInicial)
  const [tipo, setTipo] = useState<'empleado' | 'super_admin'>('empleado')
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
          <Link href="/admin/usuarios/nuevo" className="orum-button orum-button--secondary">
            Crear otro
          </Link>
        </div>
      </div>
    )
  }

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
        </select>
      </div>

      <div className="orum-field">
        <label className="orum-label" htmlFor="email">
          Correo electrónico (para iniciar sesión)
        </label>
        <input id="email" name="email" type="email" className="orum-input" required />
      </div>

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
