'use client'

import { useActionState, useState } from 'react'
import Link from 'next/link'
import { crearPromocion, editarPromocion, type PromocionState } from '../../promociones-actions'

type TipoOpcion = { id: number; codigo: string; nombre: string }
type PromocionInicial = {
  id: number
  titulo: string
  descripcion: string | null
  tipo_beneficio_id: number
  valor: number | null
  fecha_inicio: string | null
  fecha_fin: string | null
}

const estadoInicial: PromocionState = {}
const TIPOS_SIN_VALOR = new Set(['dos_por_uno', 'regalo'])

export function PromocionForm({
  comercioId,
  tipos,
  promocion,
}: {
  comercioId: number
  tipos: TipoOpcion[]
  promocion?: PromocionInicial
}) {
  const accion = promocion ? editarPromocion : crearPromocion
  const [state, formAction, pending] = useActionState(accion, estadoInicial)
  const [tipoId, setTipoId] = useState<string>(String(promocion?.tipo_beneficio_id ?? tipos[0]?.id ?? ''))
  const tipoSeleccionado = tipos.find((t) => String(t.id) === tipoId)
  const requiereValor = tipoSeleccionado ? !TIPOS_SIN_VALOR.has(tipoSeleccionado.codigo) : true

  return (
    <form action={formAction} className="orum-card">
      {state.error && <p className="orum-alert orum-alert--error" role="alert">{state.error}</p>}

      <input type="hidden" name="comercio_id" value={comercioId} />
      {promocion && <input type="hidden" name="id" value={promocion.id} />}

      <div className="orum-field">
        <label className="orum-label" htmlFor="titulo">Título</label>
        <input id="titulo" name="titulo" className="orum-input" required defaultValue={promocion?.titulo} />
      </div>

      <div className="orum-field">
        <label className="orum-label" htmlFor="descripcion">Descripción (opcional)</label>
        <input id="descripcion" name="descripcion" className="orum-input" defaultValue={promocion?.descripcion ?? ''} />
      </div>

      <div className="orum-field">
        <label className="orum-label" htmlFor="tipo_beneficio_id">Tipo de beneficio</label>
        <select
          id="tipo_beneficio_id"
          name="tipo_beneficio_id"
          className="orum-select"
          required
          value={tipoId}
          onChange={(e) => setTipoId(e.target.value)}
        >
          {tipos.length === 0 && <option value="">— No hay tipos de beneficio —</option>}
          {tipos.map((t) => <option key={t.id} value={t.id}>{t.nombre}</option>)}
        </select>
      </div>

      {requiereValor && (
        <div className="orum-field">
          <label className="orum-label" htmlFor="valor">
            Valor {tipoSeleccionado?.codigo === 'porcentaje' ? '(porcentaje, 1-100)' : '(monto)'}
          </label>
          <input
            id="valor"
            name="valor"
            type="number"
            min="0"
            step="0.01"
            className="orum-input"
            defaultValue={promocion?.valor ?? ''}
          />
        </div>
      )}

      <div style={{ display: 'flex', gap: '0.75rem' }}>
        <div className="orum-field" style={{ flex: 1 }}>
          <label className="orum-label" htmlFor="fecha_inicio">Fecha de inicio (opcional)</label>
          <input id="fecha_inicio" name="fecha_inicio" type="date" className="orum-input" defaultValue={promocion?.fecha_inicio ?? ''} />
        </div>
        <div className="orum-field" style={{ flex: 1 }}>
          <label className="orum-label" htmlFor="fecha_fin">Fecha de fin (opcional)</label>
          <input id="fecha_fin" name="fecha_fin" type="date" className="orum-input" defaultValue={promocion?.fecha_fin ?? ''} />
        </div>
      </div>

      <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.5rem' }}>
        <button type="submit" className="orum-button" disabled={pending || tipos.length === 0}>
          {pending ? 'Guardando…' : promocion ? 'Guardar cambios' : 'Crear promoción'}
        </button>
        <Link href={`/admin/comercios/${comercioId}`} className="orum-button orum-button--secondary">Cancelar</Link>
      </div>
    </form>
  )
}
