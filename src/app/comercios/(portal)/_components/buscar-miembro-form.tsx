'use client'

import { useActionState, useState } from 'react'
import dynamic from 'next/dynamic'
import { Camera, Search, X } from 'lucide-react'
import { Alert } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Field } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { Stack } from '@/components/ui/layout'
import { Spinner } from '@/components/ui/spinner'
import { buscarMiembro, type BuscarMiembroState } from '../actions'
import { ResultadoMiembro } from './resultado-miembro'
import { ConfirmarVentaForm } from './confirmar-venta-form'
import type { TipoBeneficioCodigo } from '@/lib/supabase/database.types'
import styles from './verificar.module.css'

type Sucursal = { id: number; nombre: string | null }
type Promocion = {
  id: number
  titulo: string
  tipoCodigo: TipoBeneficioCodigo
  valor: number | null
}

/*
  El escáner pesa medio mega: trae su propio detector de códigos de barras
  para los navegadores que no lo llevan de serie. Cargarlo con la página
  significaría descargarlo SIEMPRE, incluso cuando el cajero teclea el número
  —que es lo que hará cuando el carnet esté rayado o la cámara sucia—.

  Con `dynamic` viaja solo al pulsar "Escanear QR". `ssr: false` porque
  necesita `navigator.mediaDevices`, que no existe en el servidor.
*/
const EscanerQr = dynamic(() => import('./escaner-qr').then((m) => m.EscanerQr), {
  ssr: false,
  loading: () => (
    <p className={styles.cargandoEscaner}>
      <Spinner size="sm" /> Abriendo la cámara…
    </p>
  ),
})

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
    <Stack gap={5}>
      <Card padding="lg">
        <form action={formAction} className={styles.paso}>
          {state.error && <Alert tone="danger">{state.error}</Alert>}

          <Field label="Número de membresía" help="Está bajo el código del carnet.">
            <Input
              name="numero_membresia"
              /* `text`, no `number`: el número lleva ceros a la izquierda y
                 `type="number"` los descarta. `inputMode` da igual el teclado
                 numérico en el móvil, que es donde se usa esto. */
              type="text"
              inputMode="numeric"
              autoComplete="off"
              placeholder="00012345"
              value={numero}
              onChange={(e) => {
                setNumero(e.target.value)
                // Teclear a mano invalida un escaneo previo: el método que se
                // registra debe ser el que de verdad se usó.
                setMetodo('numero')
              }}
              required
              // Cifras tabulares: se coteja dígito a dígito contra el carnet.
              numeric
            />
          </Field>

          <input type="hidden" name="metodo" value={metodo} />

          <div className={styles.acciones}>
            <Button
              type="button"
              variant="secondary"
              size="lg"
              onClick={() => setMostrarCamara((v) => !v)}
              icon={mostrarCamara ? <X size={17} /> : <Camera size={17} />}
            >
              {mostrarCamara ? 'Cerrar cámara' : 'Escanear QR'}
            </Button>

            <Button
              type="submit"
              size="lg"
              loading={pending}
              fullWidth
              icon={<Search size={17} />}
            >
              Verificar
            </Button>
          </div>

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
        </form>
      </Card>

      {state.miembro && (
        <>
          <ResultadoMiembro miembro={state.miembro} />

          {/* La venta solo se ofrece si hay derecho a beneficio. */}
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
    </Stack>
  )
}
