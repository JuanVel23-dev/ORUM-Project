'use client'

import { useActionState } from 'react'
import Link from 'next/link'
import { editarMiembro, type EditarMiembroState } from '../../actions'

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
      {state.error && <p className="orum-alert orum-alert--error" role="alert">{state.error}</p>}

      <input type="hidden" name="miembro_id" value={miembro.id} />
      <input type="hidden" name="perfil_id" value={miembro.perfil_id ?? ''} />
      <input type="hidden" name="correo_original" value={miembro.correo} />

      <div style={{ display: 'flex', gap: '0.75rem' }}>
        <div className="orum-field" style={{ flex: 1 }}>
          <label className="orum-label" htmlFor="nombres">Nombres</label>
          <input id="nombres" name="nombres" className="orum-input" required defaultValue={miembro.nombres} />
        </div>
        <div className="orum-field" style={{ flex: 1 }}>
          <label className="orum-label" htmlFor="apellidos">Apellidos</label>
          <input id="apellidos" name="apellidos" className="orum-input" required defaultValue={miembro.apellidos} />
        </div>
      </div>

      <div className="orum-field">
        <label className="orum-label" htmlFor="cedula">Cédula</label>
        <input id="cedula" name="cedula" className="orum-input" required defaultValue={miembro.cedula} />
      </div>

      <div className="orum-field">
        <label className="orum-label" htmlFor="correo">Correo electrónico</label>
        <input id="correo" name="correo" type="email" className="orum-input" defaultValue={miembro.correo === '—' ? '' : miembro.correo} />
      </div>

      <div style={{ display: 'flex', gap: '0.75rem' }}>
        <div className="orum-field" style={{ flex: 1 }}>
          <label className="orum-label" htmlFor="telefono">Teléfono (opcional)</label>
          <input id="telefono" name="telefono" className="orum-input" defaultValue={miembro.telefono ?? ''} />
        </div>
        <div className="orum-field" style={{ flex: 1 }}>
          <label className="orum-label" htmlFor="ciudad_id">Ciudad (opcional)</label>
          <select id="ciudad_id" name="ciudad_id" className="orum-select" defaultValue={miembro.ciudad_id ?? ''}>
            <option value="">— Sin ciudad —</option>
            {ciudades.map((c) => (
              <option key={c.id} value={c.id}>{c.nombre}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="orum-field">
        <label className="orum-label" htmlFor="direccion">Dirección (opcional)</label>
        <input id="direccion" name="direccion" className="orum-input" defaultValue={miembro.direccion ?? ''} />
      </div>

      <div style={{ display: 'flex', gap: '0.75rem' }}>
        <button type="submit" className="orum-button" disabled={pending}>
          {pending ? 'Guardando…' : 'Guardar cambios'}
        </button>
        <Link href={`/admin/miembros/${miembro.id}`} className="orum-button orum-button--secondary">Cancelar</Link>
      </div>
    </form>
  )
}
