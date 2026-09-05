'use client'

import { useActionState, useState } from 'react'
import { Hash, Plus } from 'lucide-react'
import { Alert } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Field } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { Stack } from '@/components/ui/layout'
import { useCerrarOverlay } from '@/components/shell/overlay-ruta'
import { cargarRangoNumeros, type CargarRangoState } from '../actions'
import styles from '@/styles/formulario.module.css'

const estadoInicial: CargarRangoState = {}

/**
 * Sin tarjeta propia: dentro del overlay la superficie ya la pone el overlay.
 *
 * Esta capa solo remonta el formulario (vía `key`) al pulsar «Cargar otro
 * rango», para volver a un formulario limpio sin navegar —el cierre siempre es
 * `router.back()` por contexto, nunca un enlace hacia adelante—.
 */
export function CargarRangoForm() {
  const [instancia, setInstancia] = useState(0)
  return <Formulario key={instancia} onOtro={() => setInstancia((n) => n + 1)} />
}

function Formulario({ onOtro }: { onOtro: () => void }) {
  const cerrar = useCerrarOverlay()
  const [state, formAction, pending] = useActionState(cargarRangoNumeros, estadoInicial)

  if (state.ok) {
    const creados = state.creados ?? 0
    const omitidos = state.omitidos ?? 0
    return (
      <div className={styles.credenciales}>
        <Alert
          tone={creados === 0 ? 'warning' : 'success'}
          title={
            creados === 0
              ? 'No entró ningún número nuevo'
              : `Se cargaron ${creados} ${creados === 1 ? 'número' : 'números'}`
          }
        >
          {omitidos > 0
            ? `${omitidos} ya estaban en el sistema y se omitieron.`
            : 'El rango completo entró al pozo.'}
        </Alert>

        <div className={styles.acciones}>
          <Button type="button" onClick={cerrar}>
            Ir a la lista
          </Button>
          <Button
            type="button"
            variant="secondary"
            onClick={onOtro}
            icon={<Plus size={16} />}
          >
            Cargar otro rango
          </Button>
        </div>
      </div>
    )
  }

  return (
    <form action={formAction} className={styles.formulario} noValidate>
      {state.error && <Alert tone="danger">{state.error}</Alert>}

      <Stack gap={5}>
        <p className={styles.nota}>
          Escribe el primer y el último número impresos en los carnés. Se crea
          toda la secuencia. Máximo 2000 por carga; los que ya existan se omiten.
        </p>

        <div className={styles.pareja}>
          <Field label="Desde" help="8 dígitos.">
            <Input
              name="desde"
              numeric
              inputMode="numeric"
              maxLength={8}
              placeholder="00000001"
              required
              autoFocus
            />
          </Field>
          <Field label="Hasta" help="8 dígitos.">
            <Input
              name="hasta"
              numeric
              inputMode="numeric"
              maxLength={8}
              placeholder="00000500"
              required
            />
          </Field>
        </div>
      </Stack>

      <div className={styles.acciones}>
        <Button type="submit" loading={pending} icon={<Hash size={16} />}>
          Cargar rango
        </Button>
        <Button type="button" variant="secondary" onClick={cerrar}>
          Cancelar
        </Button>
      </div>
    </form>
  )
}
