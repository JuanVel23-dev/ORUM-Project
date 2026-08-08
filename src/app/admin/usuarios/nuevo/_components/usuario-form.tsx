'use client'

import { useActionState, useState } from 'react'
import { crearUsuario, type CrearUsuarioState } from '../../actions'
import { Alert, Button, Field, LinkButton, Row } from '@/components/ui'

const estadoInicial: CrearUsuarioState = {}

export function UsuarioForm() {
  const [state, formAction, pending] = useActionState(crearUsuario, estadoInicial)
  const [tipo, setTipo] = useState<'empleado' | 'super_admin'>('empleado')
  const [copiado, setCopiado] = useState(false)

  // Pantalla de éxito: mostramos la contraseña generada UNA sola vez.
  if (state.ok && state.password) {
    return (
      <div className="orum-card">
        <Alert tone="success">✓ Usuario creado correctamente.</Alert>
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
          <LinkButton href="/admin/usuarios">Ir a la lista</LinkButton>
          <LinkButton href="/admin/usuarios/nuevo" variant="secondary">Crear otro</LinkButton>
        </Row>
      </div>
    )
  }

  return (
    <form action={formAction} className="orum-card">
      {state.error && <Alert tone="error">{state.error}</Alert>}

      <Field label="Tipo de usuario" htmlFor="tipo">
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
      </Field>

      <Field label="Correo electrónico (para iniciar sesión)" htmlFor="email">
        <input id="email" name="email" type="email" className="orum-input" required />
      </Field>

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
      <Field label="Teléfono (opcional)" htmlFor="telefono">
        <input id="telefono" name="telefono" className="orum-input" />
      </Field>

      <p className="orum-muted" style={{ fontSize: '0.85rem', marginBottom: '1rem' }}>
        El sistema generará una contraseña segura automáticamente y te la mostrará al terminar.
      </p>

      <Row>
        <Button type="submit" disabled={pending}>
          {pending ? 'Creando…' : 'Crear usuario'}
        </Button>
        <LinkButton href="/admin/usuarios" variant="secondary">Cancelar</LinkButton>
      </Row>
    </form>
  )
}
