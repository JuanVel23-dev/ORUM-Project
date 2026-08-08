'use client'

import { useActionState } from 'react'
import { cambiarPassword, type PasswordState } from '../actions'

const estadoInicial: PasswordState = {}

export function PasswordForm() {
  const [state, formAction, pending] = useActionState(cambiarPassword, estadoInicial)

  return (
    <form action={formAction} className="orum-card" style={{ maxWidth: 460 }}>
      {state.ok && (
        <p className="orum-alert orum-alert--success">✓ Tu contraseña se actualizó correctamente.</p>
      )}
      {state.error && (
        <p className="orum-alert orum-alert--error" role="alert">
          {state.error}
        </p>
      )}

      <div className="orum-field">
        <label className="orum-label" htmlFor="password">
          Nueva contraseña
        </label>
        <input
          id="password"
          name="password"
          type="password"
          className="orum-input"
          autoComplete="new-password"
          minLength={8}
          required
        />
      </div>

      <div className="orum-field">
        <label className="orum-label" htmlFor="confirmar">
          Confirmar nueva contraseña
        </label>
        <input
          id="confirmar"
          name="confirmar"
          type="password"
          className="orum-input"
          autoComplete="new-password"
          minLength={8}
          required
        />
      </div>

      <button type="submit" className="orum-button" disabled={pending}>
        {pending ? 'Guardando…' : 'Cambiar contraseña'}
      </button>
    </form>
  )
}
