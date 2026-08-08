'use client'

import { useActionState, useState } from 'react'
import { crearPromocion, editarPromocion, type PromocionState } from '../../../promociones-actions'
import { Alert, Button, Field, LinkButton, Row } from '@/components/ui'

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
      {state.error && <Alert tone="error">{state.error}</Alert>}

      <input type="hidden" name="comercio_id" value={comercioId} />
      {promocion && <input type="hidden" name="id" value={promocion.id} />}

      <Field label="Título" htmlFor="titulo">
        <input id="titulo" name="titulo" className="orum-input" required defaultValue={promocion?.titulo} />
      </Field>

      <Field label="Descripción (opcional)" htmlFor="descripcion">
        <input id="descripcion" name="descripcion" className="orum-input" defaultValue={promocion?.descripcion ?? ''} />
      </Field>

      <Field label="Tipo de beneficio" htmlFor="tipo_beneficio_id">
        <select
          id="tipo_beneficio_id"
          name="tipo_beneficio_id"
          className="orum-select"
          required
          value={tipoId}
          onChange={(e) => setTipoId(e.target.value)}
        >
          {tipos.length === 0 && <option value="">— No hay tipos de beneficio —</option>}
          {tipos.map((t) => (
            <option key={t.id} value={t.id}>
              {t.nombre}
            </option>
          ))}
        </select>
      </Field>

      {requiereValor && (
        <Field
          label={`Valor ${tipoSeleccionado?.codigo === 'porcentaje' ? '(porcentaje, 1-100)' : '(monto)'}`}
          htmlFor="valor"
        >
          <input
            id="valor"
            name="valor"
            type="number"
            min="0"
            step="0.01"
            className="orum-input"
            defaultValue={promocion?.valor ?? ''}
          />
        </Field>
      )}

      <Row>
        <Field label="Fecha de inicio (opcional)" htmlFor="fecha_inicio" flex>
          <input id="fecha_inicio" name="fecha_inicio" type="date" className="orum-input" defaultValue={promocion?.fecha_inicio ?? ''} />
        </Field>
        <Field label="Fecha de fin (opcional)" htmlFor="fecha_fin" flex>
          <input id="fecha_fin" name="fecha_fin" type="date" className="orum-input" defaultValue={promocion?.fecha_fin ?? ''} />
        </Field>
      </Row>

      <Row style={{ marginTop: '0.5rem' }}>
        <Button type="submit" disabled={pending || tipos.length === 0}>
          {pending ? 'Guardando…' : promocion ? 'Guardar cambios' : 'Crear promoción'}
        </Button>
        <LinkButton href={`/admin/comercios/${comercioId}`} variant="secondary">Cancelar</LinkButton>
      </Row>
    </form>
  )
}
