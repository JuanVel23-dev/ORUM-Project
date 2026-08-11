'use client'

import { useActionState } from 'react'
import { iniciarSesionMiembro, type LoginMiembroState } from '../actions'

const estadoInicial: LoginMiembroState = {}

export function LoginMiembroForm({ mensajeInicial }: { mensajeInicial?: string }) {
  const [state, formAction, pending] = useActionState(iniciarSesionMiembro, estadoInicial)
  const error = state.error ?? mensajeInicial

  return (
    <form action={formAction}>
      {error && (
        <p className="orum-alert orum-alert--error" role="alert">
          {error}
        </p>
      )}

      <div className="orum-field">
        <label className="orum-label" htmlFor="numero_membresia">
          Número de membresía
        </label>
        <input
          id="numero_membresia"
          name="numero_membresia"
          type="text"
          inputMode="numeric"
          className="orum-input"
          autoComplete="username"
          required
          placeholder="00012345"
        />
      </div>

      <div className="orum-field">
        <label className="orum-label" htmlFor="password">
          Contraseña
        </label>
        <input
          id="password"
          name="password"
          type="password"
          className="orum-input"
          autoComplete="current-password"
          required
        />
      </div>

      <button type="submit" className="orum-button" disabled={pending} style={{ width: '100%' }}>
        {pending ? 'Ingresando…' : 'Iniciar sesión'}
      </button>
    </form>
  )
}
