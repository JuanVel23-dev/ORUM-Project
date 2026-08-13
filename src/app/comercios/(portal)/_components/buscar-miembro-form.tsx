// src/app/comercios/(portal)/_components/buscar-miembro-form.tsx
'use client'

import { useActionState, useState } from 'react'
import { Alert } from '@/components/ui'
import { buscarMiembro, type BuscarMiembroState } from '../actions'
import { EscanerQr } from './escaner-qr'
import { ResultadoMiembro } from './resultado-miembro'
import { ConfirmarVentaForm } from './confirmar-venta-form'
import type { TipoBeneficioCodigo } from '@/lib/supabase/database.types'

type Sucursal = { id: number; nombre: string | null }
type Promocion = { id: number; titulo: string; tipoCodigo: TipoBeneficioCodigo; valor: number | null }

const estadoInicial: BuscarMiembroState = {}

export function BuscarMiembroForm({
  sucursales,
  promociones,
  onNuevaVerificacion,
}: {
  sucursales: Sucursal[]
  promociones: Promocion[]
  onNuevaVerificacion: () => void
}) {
  const [state, formAction, pending] = useActionState(buscarMiembro, estadoInicial)
  const [mostrarCamara, setMostrarCamara] = useState(false)
  const [numero, setNumero] = useState('')
  const [metodo, setMetodo] = useState<'qr' | 'numero'>('numero')

  return (
    <div>
      <form action={formAction} className="orum-card">
        {state.error && <Alert tone="error">{state.error}</Alert>}

        <div className="orum-field">
          <label className="orum-label" htmlFor="numero_membresia">
            Número de membresía
          </label>
          <input
            id="numero_membresia"
            name="numero_membresia"
            type="text"
            inputMode="numeric"
            className="orum-input"
            placeholder="00012345"
            value={numero}
            onChange={(e) => {
              setNumero(e.target.value)
              setMetodo('numero')
            }}
            required
          />
        </div>
        <input type="hidden" name="metodo" value={metodo} />

        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button type="submit" className="orum-button" disabled={pending}>
            {pending ? 'Buscando…' : 'Buscar'}
          </button>
          <button
            type="button"
            className="orum-button orum-button--secondary"
            onClick={() => setMostrarCamara((v) => !v)}
          >
            {mostrarCamara ? 'Cerrar cámara' : 'Escanear QR'}
          </button>
        </div>
      </form>

      {mostrarCamara && (
        <EscanerQr
          onDetectado={(valor) => {
            setNumero(valor)
            setMetodo('qr')
            setMostrarCamara(false)
          }}
          onError={() => setMostrarCamara(false)}
        />
      )}

      {state.miembro && (
        <>
          <ResultadoMiembro miembro={state.miembro} />
          {state.miembro.vigente && (
            <ConfirmarVentaForm
              miembroId={state.miembro.id}
              membresiaId={state.miembro.membresiaId}
              numeroMembresia={state.miembro.numeroMembresia}
              metodo={state.metodo ?? 'numero'}
              sucursales={sucursales}
              promociones={promociones}
              onExito={onNuevaVerificacion}
            />
          )}
        </>
      )}
    </div>
  )
}
