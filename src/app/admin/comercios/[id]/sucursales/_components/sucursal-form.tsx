'use client'

import { useActionState } from 'react'
import Link from 'next/link'
import { crearSucursal, editarSucursal, type SucursalState } from '../../sucursales-actions'

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
      {state.error && <p className="orum-alert orum-alert--error" role="alert">{state.error}</p>}

      <input type="hidden" name="comercio_id" value={comercioId} />
      {sucursal && <input type="hidden" name="id" value={sucursal.id} />}

      <div className="orum-field">
        <label className="orum-label" htmlFor="nombre">Nombre</label>
        <input id="nombre" name="nombre" className="orum-input" required defaultValue={sucursal?.nombre} />
      </div>

      <div className="orum-field">
        <label className="orum-label" htmlFor="direccion">Dirección (opcional)</label>
        <input id="direccion" name="direccion" className="orum-input" defaultValue={sucursal?.direccion ?? ''} />
      </div>

      <div style={{ display: 'flex', gap: '0.75rem' }}>
        <div className="orum-field" style={{ flex: 1 }}>
          <label className="orum-label" htmlFor="telefono">Teléfono (opcional)</label>
          <input id="telefono" name="telefono" className="orum-input" defaultValue={sucursal?.telefono ?? ''} />
        </div>
        <div className="orum-field" style={{ flex: 1 }}>
          <label className="orum-label" htmlFor="ciudad_id">Ciudad</label>
          <select
            id="ciudad_id"
            name="ciudad_id"
            className="orum-select"
            required
            defaultValue={sucursal?.ciudad_id ?? ''}
          >
            <option value="">— Selecciona una ciudad —</option>
            {ciudades.map((c) => <option key={c.id} value={c.id}>{c.nombre}</option>)}
          </select>
        </div>
      </div>

      <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.5rem' }}>
        <button type="submit" className="orum-button" disabled={pending}>
          {pending ? 'Guardando…' : sucursal ? 'Guardar cambios' : 'Crear sucursal'}
        </button>
        <Link href={`/admin/comercios/${comercioId}`} className="orum-button orum-button--secondary">Cancelar</Link>
      </div>
    </form>
  )
}
