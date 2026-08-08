'use client'

import { useActionState } from 'react'
import { crearSucursal, editarSucursal, type SucursalState } from '../../../sucursales-actions'
import { Alert, Button, Field, LinkButton, Row } from '@/components/ui'

type Opcion = { id: number; nombre: string }
type SucursalInicial = {
  id: number
  nombre: string
  direccion: string | null
  telefono: string | null
  ciudad_id: number | null
}

const estadoInicial: SucursalState = {}

export function SucursalForm({
  comercioId,
  ciudades,
  sucursal,
}: {
  comercioId: number
  ciudades: Opcion[]
  sucursal?: SucursalInicial
}) {
  const accion = sucursal ? editarSucursal : crearSucursal
  const [state, formAction, pending] = useActionState(accion, estadoInicial)

  return (
    <form action={formAction} className="orum-card">
      {state.error && <Alert tone="error">{state.error}</Alert>}

      <input type="hidden" name="comercio_id" value={comercioId} />
      {sucursal && <input type="hidden" name="id" value={sucursal.id} />}

      <Field label="Nombre" htmlFor="nombre">
        <input id="nombre" name="nombre" className="orum-input" required defaultValue={sucursal?.nombre} />
      </Field>

      <Field label="Dirección (opcional)" htmlFor="direccion">
        <input id="direccion" name="direccion" className="orum-input" defaultValue={sucursal?.direccion ?? ''} />
      </Field>

      <Row>
        <Field label="Teléfono (opcional)" htmlFor="telefono" flex>
          <input id="telefono" name="telefono" className="orum-input" defaultValue={sucursal?.telefono ?? ''} />
        </Field>
        <Field label="Ciudad" htmlFor="ciudad_id" flex>
          <select
            id="ciudad_id"
            name="ciudad_id"
            className="orum-select"
            required
            defaultValue={sucursal?.ciudad_id ?? ''}
          >
            <option value="">— Selecciona una ciudad —</option>
            {ciudades.map((c) => (
              <option key={c.id} value={c.id}>
                {c.nombre}
              </option>
            ))}
          </select>
        </Field>
      </Row>

      <Row style={{ marginTop: '0.5rem' }}>
        <Button type="submit" disabled={pending}>
          {pending ? 'Guardando…' : sucursal ? 'Guardar cambios' : 'Crear sucursal'}
        </Button>
        <LinkButton href={`/admin/comercios/${comercioId}`} variant="secondary">Cancelar</LinkButton>
      </Row>
    </form>
  )
}
