'use client'

import { useActionState } from 'react'
import { MapPin, Save } from 'lucide-react'
import { Alert } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Field } from '@/components/ui/field'
import { Input, Select } from '@/components/ui/input'
import { Stack } from '@/components/ui/layout'
import {
  crearSucursal,
  editarSucursal,
  type SucursalState,
} from '../../../sucursales-actions'
import styles from '../../../miembros/formulario.module.css'

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
  const editando = Boolean(sucursal)
  const [state, formAction, pending] = useActionState(
    editando ? editarSucursal : crearSucursal,
    estadoInicial,
  )

  return (
    <>
      <form action={formAction} className={styles.formulario} noValidate>
        {state.error && <Alert tone="danger">{state.error}</Alert>}

        <input type="hidden" name="comercio_id" value={comercioId} />
        {sucursal && <input type="hidden" name="id" value={sucursal.id} />}

        <Stack gap={5}>
          <Field label="Nombre" help="Cómo la reconoce el miembro: «Sede Centro», «Poblado»…">
            <Input name="nombre" defaultValue={sucursal?.nombre} required autoFocus />
          </Field>

          <Field label="Dirección" optional>
            <Input
              name="direccion"
              defaultValue={sucursal?.direccion ?? ''}
              autoComplete="street-address"
            />
          </Field>

          <div className={styles.pareja}>
            <Field label="Teléfono" optional>
              <Input
                name="telefono"
                defaultValue={sucursal?.telefono ?? ''}
                type="tel"
                numeric
                inputMode="tel"
              />
            </Field>

            <Field label="Ciudad">
              <Select name="ciudad_id" defaultValue={sucursal?.ciudad_id ?? ''} required>
                <option value="">Selecciona una ciudad</option>
                {ciudades.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.nombre}
                  </option>
                ))}
              </Select>
            </Field>
          </div>
        </Stack>

        <div className={styles.acciones}>
          <Button
            type="submit"
            loading={pending}
            icon={editando ? <Save size={16} /> : <MapPin size={16} />}
          >
            {editando ? 'Guardar cambios' : 'Crear sucursal'}
          </Button>
          <Button href={`/admin/comercios/${comercioId}`} variant="secondary">
            Cancelar
          </Button>
        </div>
      </form>
    </>
  )
}
