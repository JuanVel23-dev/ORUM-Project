'use client'

import { useActionState } from 'react'
import { editarMiembro, type EditarMiembroState } from '../../../actions'
import { Alert, Button, Field, LinkButton, Row } from '@/components/ui'

type Opcion = { id: number; nombre: string }
type MiembroInicial = {
  id: number
  perfil_id: string | null
  nombres: string
  apellidos: string
  cedula: string
  telefono: string | null
  direccion: string | null
  ciudad_id: number | null
  correo: string
}

const estadoInicial: EditarMiembroState = {}

export function EditarMiembroForm({ miembro, ciudades }: { miembro: MiembroInicial; ciudades: Opcion[] }) {
  const [state, formAction, pending] = useActionState(editarMiembro, estadoInicial)

  return (
    <form action={formAction} className="orum-card">
      {state.error && <Alert tone="error">{state.error}</Alert>}

      <input type="hidden" name="miembro_id" value={miembro.id} />
      <input type="hidden" name="perfil_id" value={miembro.perfil_id ?? ''} />
      <input type="hidden" name="correo_original" value={miembro.correo} />

      <Row>
        <Field label="Nombres" htmlFor="nombres" flex>
          <input id="nombres" name="nombres" className="orum-input" required defaultValue={miembro.nombres} />
        </Field>
        <Field label="Apellidos" htmlFor="apellidos" flex>
          <input id="apellidos" name="apellidos" className="orum-input" required defaultValue={miembro.apellidos} />
        </Field>
      </Row>

      <Field label="Cédula" htmlFor="cedula">
        <input id="cedula" name="cedula" className="orum-input" required defaultValue={miembro.cedula} />
      </Field>

      <Field label="Correo electrónico" htmlFor="correo">
        <input
          id="correo"
          name="correo"
          type="email"
          className="orum-input"
          defaultValue={miembro.correo === '—' ? '' : miembro.correo}
        />
      </Field>

      <Row>
        <Field label="Teléfono (opcional)" htmlFor="telefono" flex>
          <input id="telefono" name="telefono" className="orum-input" defaultValue={miembro.telefono ?? ''} />
        </Field>
        <Field label="Ciudad (opcional)" htmlFor="ciudad_id" flex>
          <select id="ciudad_id" name="ciudad_id" className="orum-select" defaultValue={miembro.ciudad_id ?? ''}>
            <option value="">— Sin ciudad —</option>
            {ciudades.map((c) => (
              <option key={c.id} value={c.id}>
                {c.nombre}
              </option>
            ))}
          </select>
        </Field>
      </Row>

      <Field label="Dirección (opcional)" htmlFor="direccion">
        <input id="direccion" name="direccion" className="orum-input" defaultValue={miembro.direccion ?? ''} />
      </Field>

      <Row>
        <Button type="submit" disabled={pending}>
          {pending ? 'Guardando…' : 'Guardar cambios'}
        </Button>
        <LinkButton href={`/admin/miembros/${miembro.id}`} variant="secondary">Cancelar</LinkButton>
      </Row>
    </form>
  )
}
