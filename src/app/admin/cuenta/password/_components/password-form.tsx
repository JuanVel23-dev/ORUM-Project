'use client'

import { useActionState } from 'react'
import { cambiarPassword, type PasswordState } from '../../actions'
import { Alert, Button, Field } from '@/components/ui'

const estadoInicial: PasswordState = {}

export function PasswordForm() {
  const [state, formAction, pending] = useActionState(cambiarPassword, estadoInicial)

  return (
    <form action={formAction} className="orum-card" style={{ maxWidth: 460 }}>
      {state.ok && <Alert tone="success">✓ Tu contraseña se actualizó correctamente.</Alert>}
      {state.error && <Alert tone="error">{state.error}</Alert>}

      <Field label="Nueva contraseña" htmlFor="password">
        <input
          id="password"
          name="password"
          type="password"
          className="orum-input"
          autoComplete="new-password"
          minLength={8}
          required
        />
      </Field>

      <Field label="Confirmar nueva contraseña" htmlFor="confirmar">
        <input
          id="confirmar"
          name="confirmar"
          type="password"
          className="orum-input"
          autoComplete="new-password"
          minLength={8}
          required
        />
      </Field>

      <Button type="submit" disabled={pending}>
        {pending ? 'Guardando…' : 'Cambiar contraseña'}
      </Button>
    </form>
  )
}
