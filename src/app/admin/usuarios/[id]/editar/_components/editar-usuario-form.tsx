'use client'

import { useActionState } from 'react'
import { editarUsuario, type EditarUsuarioState } from '../../../actions'
import { Alert, Button, Field, LinkButton, Row } from '@/components/ui'

const estadoInicial: EditarUsuarioState = {}

type Props = {
  perfilId: string
  email: string
  empleado: { nombres: string; apellidos: string; cedula: string | null; telefono: string | null }
}

export function EditarUsuarioForm({ perfilId, email, empleado }: Props) {
  const [state, formAction, pending] = useActionState(editarUsuario, estadoInicial)

  return (
    <form action={formAction} className="orum-card">
      {state.error && <Alert tone="error">{state.error}</Alert>}

      <input type="hidden" name="perfil_id" value={perfilId} />
      <input type="hidden" name="email_original" value={email} />

      <Field label="Correo de acceso" htmlFor="email">
        <input id="email" name="email" type="email" className="orum-input" defaultValue={email} required />
      </Field>

      <Row>
        <Field label="Nombres" htmlFor="nombres" flex>
          <input id="nombres" name="nombres" className="orum-input" defaultValue={empleado.nombres} required />
        </Field>
        <Field label="Apellidos" htmlFor="apellidos" flex>
          <input id="apellidos" name="apellidos" className="orum-input" defaultValue={empleado.apellidos} required />
        </Field>
      </Row>
      <Field label="Cédula" htmlFor="cedula">
        <input id="cedula" name="cedula" className="orum-input" defaultValue={empleado.cedula ?? ''} required />
      </Field>
      <Field label="Teléfono (opcional)" htmlFor="telefono">
        <input id="telefono" name="telefono" className="orum-input" defaultValue={empleado.telefono ?? ''} />
      </Field>

      <Row style={{ marginTop: '0.5rem' }}>
        <Button type="submit" disabled={pending}>
          {pending ? 'Guardando…' : 'Guardar cambios'}
        </Button>
        <LinkButton href="/admin/usuarios" variant="secondary">Cancelar</LinkButton>
      </Row>
    </form>
  )
}
