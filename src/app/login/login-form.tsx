'use client'

import { useActionState } from 'react'
import { iniciarSesion, type LoginState } from './actions'

const estadoInicial: LoginState = {}

export function LoginForm({ mensajeInicial }: { mensajeInicial?: string }) {
  const [state, formAction, pending] = useActionState(iniciarSesion, estadoInicial)

  const error = state.error ?? mensajeInicial

  return (
    <form action={formAction}>
      {error && (
        <p className="orum-alert orum-alert--error" role="alert">
          {error}
        </p>
      )}

      <div className="orum-field">
        <label className="orum-label" htmlFor="email">
          Correo electrónico
        </label>
        <input
          id="email"
          name="email"
          type="email"
          className="orum-input"
          autoComplete="email"
          required
          placeholder="tucorreo@ejemplo.com"
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
