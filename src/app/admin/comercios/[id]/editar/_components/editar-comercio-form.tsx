'use client'

import { useActionState } from 'react'
import Link from 'next/link'
import { editarComercio, type EditarComercioState } from '../../actions'

type Opcion = { id: number; nombre: string }
type ComercioInicial = {
  id: number
  perfil_id: string | null
  nombre: string
  descripcion: string | null
  marca_id: number | null
  categoria_id: number | null
  logo_url: string | null
  correo: string
}

const estadoInicial: EditarComercioState = {}

export function EditarComercioForm({
  comercio,
  marcas,
  categorias,
}: {
  comercio: ComercioInicial
  marcas: Opcion[]
  categorias: Opcion[]
}) {
  const [state, formAction, pending] = useActionState(editarComercio, estadoInicial)

  return (
    <form action={formAction} className="orum-card">
      {state.error && <p className="orum-alert orum-alert--error" role="alert">{state.error}</p>}

      <input type="hidden" name="id" value={comercio.id} />
      <input type="hidden" name="perfil_id" value={comercio.perfil_id ?? ''} />
      <input type="hidden" name="correo_original" value={comercio.correo} />

      <div className="orum-field">
        <label className="orum-label" htmlFor="correo">Correo electrónico</label>
        <input
          id="correo"
          name="correo"
          type="email"
          className="orum-input"
          defaultValue={comercio.correo === '—' ? '' : comercio.correo}
        />
      </div>

      <div className="orum-field">
        <label className="orum-label" htmlFor="nombre">Nombre</label>
        <input id="nombre" name="nombre" className="orum-input" required defaultValue={comercio.nombre} />
      </div>

      <div className="orum-field">
        <label className="orum-label" htmlFor="descripcion">Descripción (opcional)</label>
        <input id="descripcion" name="descripcion" className="orum-input" defaultValue={comercio.descripcion ?? ''} />
      </div>

      <div style={{ display: 'flex', gap: '0.75rem' }}>
        <div className="orum-field" style={{ flex: 1 }}>
          <label className="orum-label" htmlFor="marca_id">Marca (opcional)</label>
          <select id="marca_id" name="marca_id" className="orum-select" defaultValue={comercio.marca_id ?? ''}>
            <option value="">— Sin marca —</option>
            {marcas.map((m) => <option key={m.id} value={m.id}>{m.nombre}</option>)}
          </select>
        </div>
        <div className="orum-field" style={{ flex: 1 }}>
          <label className="orum-label" htmlFor="categoria_id">Categoría (opcional)</label>
          <select id="categoria_id" name="categoria_id" className="orum-select" defaultValue={comercio.categoria_id ?? ''}>
            <option value="">— Sin categoría —</option>
            {categorias.map((c) => <option key={c.id} value={c.id}>{c.nombre}</option>)}
          </select>
        </div>
      </div>

      <div className="orum-field">
        <label className="orum-label" htmlFor="logo_url">URL del logo (opcional)</label>
        <input id="logo_url" name="logo_url" className="orum-input" defaultValue={comercio.logo_url ?? ''} placeholder="https://…" />
      </div>

      <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.5rem' }}>
        <button type="submit" className="orum-button" disabled={pending}>
          {pending ? 'Guardando…' : 'Guardar cambios'}
        </button>
        <Link href={`/admin/comercios/${comercio.id}`} className="orum-button orum-button--secondary">Cancelar</Link>
      </div>
    </form>
  )
}
