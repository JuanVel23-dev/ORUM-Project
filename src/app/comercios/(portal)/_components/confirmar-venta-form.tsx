// src/app/comercios/(portal)/_components/confirmar-venta-form.tsx
'use client'

import { useActionState, useMemo, useState } from 'react'
import { Alert, Select } from '@/components/ui'
import { formatearBeneficio } from '@/lib/comercios/beneficios-formato'
import { calcularDescuento, calcularValorFinal } from '@/lib/comercios/ventas'
import { registrarVenta, type RegistrarVentaState } from '../actions'
import type { MetodoRegistroVenta, TipoBeneficioCodigo } from '@/lib/supabase/database.types'

type Sucursal = { id: number; nombre: string | null }
type Promocion = { id: number; titulo: string; tipoCodigo: TipoBeneficioCodigo; valor: number | null }

const estadoInicial: RegistrarVentaState = {}

export function ConfirmarVentaForm({
  miembroId,
  membresiaId,
  metodo,
  sucursales,
  promociones,
  onExito,
}: {
  miembroId: number
  membresiaId: number | null
  metodo: MetodoRegistroVenta
  sucursales: Sucursal[]
  promociones: Promocion[]
  onExito: () => void
}) {
  const [state, formAction, pending] = useActionState(registrarVenta, estadoInicial)
  const [promocionId, setPromocionId] = useState('')
  const [valorCompra, setValorCompra] = useState('0')
  const [descuentoManual, setDescuentoManual] = useState('0')

  const promocionSeleccionada = promociones.find((p) => String(p.id) === promocionId) ?? null
  const calculoAutomatico =
    promocionSeleccionada?.tipoCodigo === 'porcentaje' || promocionSeleccionada?.tipoCodigo === 'monto_fijo'
  const editable = promocionSeleccionada !== null && !calculoAutomatico

  const valorDescuento = useMemo(() => {
    if (!promocionSeleccionada) return 0
    if (calculoAutomatico) {
      return calcularDescuento(
        promocionSeleccionada.tipoCodigo as 'porcentaje' | 'monto_fijo',
        promocionSeleccionada.valor ?? 0,
        Number(valorCompra) || 0,
      )
    }
    return Number(descuentoManual) || 0
  }, [promocionSeleccionada, calculoAutomatico, valorCompra, descuentoManual])

  const valorFinal = calcularValorFinal(Number(valorCompra) || 0, valorDescuento)

  if (state.ok) {
    return (
      <div className="orum-card" style={{ marginTop: '1rem' }}>
        <Alert tone="success">Venta registrada correctamente.</Alert>
        <button
          type="button"
          className="orum-button"
          onClick={onExito}
          style={{ marginTop: '0.75rem' }}
        >
          Verificar otro miembro
        </button>
      </div>
    )
  }

  return (
    <form action={formAction} className="orum-card" style={{ marginTop: '1rem' }}>
      <input type="hidden" name="miembro_id" value={miembroId} />
      <input type="hidden" name="membresia_id" value={membresiaId ?? ''} />
      <input type="hidden" name="metodo_registro" value={metodo} />

      {state.error && <Alert tone="error">{state.error}</Alert>}

      <Select
        label="Promoción aplicada"
        htmlFor="promocion_id"
        name="promocion_id"
        value={promocionId}
        onChange={(e) => setPromocionId(e.target.value)}
      >
        <option value="">Sin promoción</option>
        {promociones.map((p) => (
          <option key={p.id} value={p.id}>
            {p.titulo} — {formatearBeneficio(p.tipoCodigo, p.valor)}
          </option>
        ))}
      </Select>

      {sucursales.length > 1 ? (
        <Select label="Sucursal" htmlFor="sucursal_id" name="sucursal_id" required defaultValue="">
          <option value="" disabled>
            Selecciona una sucursal
          </option>
          {sucursales.map((s) => (
            <option key={s.id} value={s.id}>
              {s.nombre ?? `Sucursal ${s.id}`}
            </option>
          ))}
        </Select>
      ) : (
        <input type="hidden" name="sucursal_id" value={sucursales[0]?.id ?? ''} />
      )}

      <div className="orum-field">
        <label className="orum-label" htmlFor="valor_compra">
          Valor de la compra
        </label>
        <input
          id="valor_compra"
          name="valor_compra"
          type="number"
          min={0}
          step="1"
          className="orum-input"
          value={valorCompra}
          onChange={(e) => setValorCompra(e.target.value)}
          required
        />
      </div>

      <div className="orum-field">
        <label className="orum-label" htmlFor="valor_descuento">
          Valor del descuento
        </label>
        <input
          id="valor_descuento"
          name="valor_descuento"
          type="number"
          min={0}
          step="1"
          className="orum-input"
          value={valorDescuento}
          onChange={(e) => setDescuentoManual(e.target.value)}
          readOnly={!editable}
        />
      </div>

      <p className="orum-muted">Valor final: ${valorFinal.toLocaleString('es-CO')}</p>

      <button type="submit" className="orum-button" disabled={pending} style={{ width: '100%' }}>
        {pending ? 'Registrando…' : 'Registrar venta'}
      </button>
    </form>
  )
}
