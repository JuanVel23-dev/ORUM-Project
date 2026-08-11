'use client'

import { useActionState } from 'react'
import { CreditCard, Save } from 'lucide-react'
import { Alert } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Field } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { Stack } from '@/components/ui/layout'
import { crearPlan, editarPlan, type PlanState } from './actions'
import styles from '../miembros/formulario.module.css'

type PlanInicial = {
  id: number
  nombre: string
  descripcion: string | null
  precio: number
  duracion_meses: number
}

const estadoInicial: PlanState = {}

export function PlanForm({ plan }: { plan?: PlanInicial }) {
  const editando = Boolean(plan)
  const [state, formAction, pending] = useActionState(
    editando ? editarPlan : crearPlan,
    estadoInicial,
  )

  return (
    <>
      <form action={formAction} className={styles.formulario} noValidate>
        {state.error && <Alert tone="danger">{state.error}</Alert>}

        {plan && <input type="hidden" name="id" value={plan.id} />}

        <Stack gap={5}>
          <Field
            label="Nombre"
            help="Un plan llamado «Oro» o «Premium» se muestra con el distintivo dorado."
          >
            <Input name="nombre" defaultValue={plan?.nombre} required autoFocus />
          </Field>

          <Field label="Descripción" optional>
            <Input name="descripcion" defaultValue={plan?.descripcion ?? ''} />
          </Field>

          <div className={styles.pareja}>
            <Field label="Precio" help="En pesos, sin puntos ni símbolo.">
              <Input
                name="precio"
                type="number"
                min="0"
                step="0.01"
                inputMode="decimal"
                numeric
                required
                defaultValue={plan?.precio}
              />
            </Field>

            <Field label="Duración" help="En meses.">
              <Input
                name="duracion_meses"
                type="number"
                min="1"
                step="1"
                inputMode="numeric"
                numeric
                required
                defaultValue={plan?.duracion_meses ?? 12}
              />
            </Field>
          </div>
        </Stack>

        <div className={styles.acciones}>
          <Button
            type="submit"
            loading={pending}
            icon={editando ? <Save size={16} /> : <CreditCard size={16} />}
          >
            {editando ? 'Guardar cambios' : 'Crear plan'}
          </Button>
          <Button href="/admin/planes" variant="secondary">
            Cancelar
          </Button>
        </div>
      </form>
    </>
  )
}
